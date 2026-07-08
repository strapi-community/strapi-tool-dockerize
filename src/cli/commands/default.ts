import { access } from "node:fs/promises"
import { join, resolve } from "node:path"
import { defineCommand } from "citty"
import pc from "picocolors"
import { ZodError } from "zod"
import { installDatabaseDriver } from "../../actions"
import type {
	DatabaseClient,
	DetectedConfig,
	Environment,
	PresetName,
	ResolvedConfig,
	ResourceLimitOverrides,
	SecretBackend,
	StrapiHealthCheckOverrides,
} from "../../config"
import { DEFAULT_PORTS, PRESET_NAMES, getPreset, resolvedConfigSchema } from "../../config"
import { detectAll } from "../../detection"
import {
	generateCompose,
	generateDatabaseConfig,
	generateDockerfiles,
	generateDockerignore,
	generateEnv,
} from "../../generators"
import { pluginRegistry } from "../../plugins"
import { runPrompts } from "../../prompts"
import { createSpinner, log, showBanner } from "../../ui"
import { backupDockerFiles, formatPreviewOutput, previewGeneration } from "../../utils"
import { sharedFlags } from "../flags"

type CommandArgs = Record<string, unknown>

export function formatZodErrors(error: ZodError): string[] {
	return error.issues.map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join(".") : "config"
		return `${path}: ${issue.message}`
	})
}

export function shouldWarnDatabaseDefault(detected: DetectedConfig): boolean {
	return !detected.databaseClient
}

export function buildHealthCheckOverrides(
	args: Record<string, unknown>,
): StrapiHealthCheckOverrides | undefined {
	const overrides: StrapiHealthCheckOverrides = {}
	if (args["health-interval"]) overrides.interval = String(args["health-interval"])
	if (args["health-timeout"]) overrides.timeout = String(args["health-timeout"])
	if (args["health-start-period"]) overrides.startPeriod = String(args["health-start-period"])
	if (args["health-retries"]) overrides.retries = Number(args["health-retries"])
	return Object.keys(overrides).length > 0 ? overrides : undefined
}

export function buildResourceLimitOverrides(
	args: Record<string, unknown>,
): ResourceLimitOverrides | undefined {
	const overrides: ResourceLimitOverrides = {}
	if (args.memory) overrides.memory = String(args.memory)
	if (args.cpus) overrides.cpus = String(args.cpus)
	return Object.keys(overrides).length > 0 ? overrides : undefined
}

export function applyPreset(detected: DetectedConfig, presetName: PresetName): DetectedConfig {
	const preset = getPreset(presetName)
	return { ...detected, ...preset }
}

export function buildDetectionSummary(detected: DetectedConfig): string {
	const parts: string[] = []
	parts.push(`strapi ${detected.strapiVersion ?? "unknown"}`)
	parts.push(detected.projectType ?? "unknown")
	parts.push(detected.databaseClient ?? "not detected")
	parts.push(detected.packageManager ?? "unknown")
	if (detected.detectedPlugins && detected.detectedPlugins.length > 0) {
		const pluginNames = detected.detectedPlugins.map((p) => p.name)
		parts.push(`plugins: ${pluginNames.join(", ")}`)
	}
	return parts.join(" | ")
}

async function detectProject(cwd: string): Promise<DetectedConfig> {
	const spinner = createSpinner("Detecting project configuration...")
	try {
		const detected = await detectAll(cwd)
		spinner.success("Project scanned")
		log.debug(`Detected: ${buildDetectionSummary(detected)}`)
		for (const plugin of detected.detectedPlugins ?? []) {
			const keys = Object.keys(plugin.envVars)
			log.debug(`  plugin ${plugin.name}: ${keys.length > 0 ? keys.join(", ") : "no env vars"}`)
		}
		return detected
	} catch (err) {
		spinner.error("Failed to detect project configuration")
		log.error(err instanceof Error ? err.message : String(err))
		process.exit(1)
	}
}

function applyPresetAndOverrides(detected: DetectedConfig, args: CommandArgs): DetectedConfig {
	let result = detected

	if (args.preset) {
		if (!PRESET_NAMES.includes(args.preset as PresetName)) {
			log.error(`Unknown preset "${args.preset}". Available: ${PRESET_NAMES.join(", ")}`)
			process.exit(1)
		}
		result = applyPreset(result, args.preset as PresetName)
		log.debug(`Applied preset "${args.preset}"`)
	}

	if (args.database) {
		result.databaseClient = args.database as DatabaseClient
		result.databasePort = DEFAULT_PORTS[result.databaseClient]
		log.debug(`Flag override database=${result.databaseClient}`)
	}
	if (args["package-manager"]) {
		result.packageManager = args["package-manager"] as DetectedConfig["packageManager"]
		log.debug(`Flag override package-manager=${result.packageManager}`)
	}
	if (args.env) {
		result.environment = args.env as Environment
		log.debug(`Flag override env=${result.environment}`)
	}
	if (args.compose !== undefined) {
		result.useCompose = args.compose as boolean
		log.debug(`Flag override compose=${result.useCompose}`)
	}
	if (args.secrets) {
		result.secretBackend = args.secrets as SecretBackend
		log.debug(`Flag override secrets=${result.secretBackend}`)
	}
	if (args.backups !== undefined) {
		result.useBackups = args.backups as boolean
		log.debug(`Flag override backups=${result.useBackups}`)
	}

	return result
}

const YES_MODE_DEFAULTS = {
	strapiVersion: "v5",
	projectType: "ts",
	packageManager: "npm",
	environment: "development",
	projectName: "strapi",
	databaseHost: "localhost",
	databaseName: "strapi",
	databaseUsername: "strapi",
	databasePassword: "strapi",
	useCompose: true,
	useAdminer: false,
	useBackups: false,
	secretBackend: "none",
	isESM: false,
	envVars: {},
	detectedPlugins: [],
} as const

function pickDefined<T extends object>(obj: T): Partial<T> {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

function parseConfigOrExit(candidate: unknown): ResolvedConfig {
	try {
		return resolvedConfigSchema.parse(candidate)
	} catch (err) {
		if (err instanceof ZodError) {
			log.error("Invalid configuration:")
			for (const msg of formatZodErrors(err)) {
				log.error(`  ${msg}`)
			}
			process.exit(1)
		}
		throw err
	}
}

function resolveYesConfig(detected: DetectedConfig): ResolvedConfig {
	if (shouldWarnDatabaseDefault(detected)) {
		log.warn("No database detected, defaulting to postgres")
	}

	const databaseClient = detected.databaseClient ?? "postgres"
	return parseConfigOrExit({
		...YES_MODE_DEFAULTS,
		...pickDefined(detected),
		databaseClient,
		databasePort: detected.databasePort ?? DEFAULT_PORTS[databaseClient],
	})
}

async function writeGeneratedFiles(
	config: ResolvedConfig,
	cwd: string,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
	resourceLimits?: ResourceLimitOverrides,
): Promise<string[]> {
	const spinner = createSpinner("Generating Docker configuration...")
	try {
		await generateDockerfiles(config, pluginRegistry, cwd, healthCheckOverrides)
		spinner.update("Generating .dockerignore...")
		await generateDockerignore(cwd)

		if (config.useCompose) {
			spinner.update("Generating docker-compose.yml...")
			await generateCompose(config, pluginRegistry, cwd, resourceLimits)
		}

		spinner.update("Updating .env...")
		await generateEnv(config, pluginRegistry, cwd)

		spinner.update("Generating database config...")
		await generateDatabaseConfig(config, cwd)

		const secretManager = pluginRegistry.getSecretManager(config.secretBackend)
		const secretFiles = await secretManager.generateFiles(config, cwd)

		spinner.success("Docker configuration ready!")
		return secretFiles
	} catch (err) {
		spinner.error("Generation failed")
		log.error(err instanceof Error ? err.message : String(err))
		process.exit(1)
	}
}

async function maybeInstallDriver(
	config: ResolvedConfig,
	cwd: string,
	skipDeps: boolean,
): Promise<void> {
	if (config.databaseClient === "sqlite" || skipDeps) return

	const spinner = createSpinner("Installing database driver...")
	try {
		await installDatabaseDriver(config, pluginRegistry, cwd)
		spinner.success("Database driver installed")
	} catch (err) {
		spinner.error("Failed to install database driver")
		log.warn(err instanceof Error ? err.message : String(err))
	}
}

function dockerfileNames(config: ResolvedConfig): string[] {
	const names: string[] = []
	if (config.environment !== "production") names.push("Dockerfile")
	if (config.environment !== "development") names.push("Dockerfile.prod")
	return names
}

function composeNames(config: ResolvedConfig): string[] {
	if (!config.useCompose) return []
	return config.environment === "both"
		? ["docker-compose.yml", "docker-compose.prod.yml"]
		: ["docker-compose.yml"]
}

function databaseConfigNames(config: ResolvedConfig): string[] {
	const ext = config.projectType === "ts" ? "ts" : "js"
	const envDirs =
		config.environment === "both" ? ["development", "production"] : [config.environment]
	return envDirs.map((envDir) => `config/env/${envDir}/database.${ext}`)
}

function listGeneratedFiles(config: ResolvedConfig, secretFiles: string[]): string[] {
	return [
		...dockerfileNames(config),
		".dockerignore",
		...composeNames(config),
		".env",
		...secretFiles,
		...databaseConfigNames(config),
	]
}

function printOutcome(config: ResolvedConfig, generated: string[]): void {
	const fileList = generated.map((f) => `  ${pc.dim(">")} ${f}`).join("\n")
	console.log()
	console.log(pc.bold("  Generated files:"))
	console.log(fileList)
	console.log()

	console.log(pc.bold("  Next steps:"))
	if (config.useCompose) {
		if (config.environment === "both") {
			console.log(
				`  ${pc.cyan("$")} ${pc.bold("docker compose up -d")}  ${pc.dim("(development)")}`,
			)
			console.log(
				`  ${pc.cyan("$")} ${pc.bold("docker compose -f docker-compose.prod.yml up -d")}  ${pc.dim("(production)")}`,
			)
		} else {
			console.log(`  ${pc.cyan("$")} ${pc.bold("docker compose up -d")}`)
		}
	} else {
		console.log(`  ${pc.cyan("$")} ${pc.bold(`docker build -t ${config.projectName} .`)}`)
	}
	console.log()
	console.log(
		`  ${pc.dim("Your Strapi app will be available at")} ${pc.cyan("http://localhost:1337")}`,
	)
	if (config.useAdminer) {
		console.log(`  ${pc.dim("Adminer database UI at")} ${pc.cyan("http://localhost:8080")}`)
	}
	console.log()
	console.log(
		`  ${pc.dim("Docs & issues:")} ${pc.dim("https://github.com/strapi-community/strapi-tool-dockerize")}`,
	)
	console.log()
}

async function preflight(cwd: string, yes: boolean): Promise<void> {
	try {
		await access(join(cwd, "package.json"))
	} catch {
		log.error(`No Strapi project found at ${cwd}`)
		process.exit(1)
	}

	if (!process.stdin.isTTY && !yes) {
		log.error("Non-interactive environment detected. Use --yes flag for non-interactive mode.")
		process.exit(1)
	}
}

async function runDryRun(
	config: ResolvedConfig,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
	resourceLimits?: ResourceLimitOverrides,
): Promise<void> {
	try {
		const files = await previewGeneration(
			config,
			pluginRegistry,
			healthCheckOverrides,
			resourceLimits,
		)
		log.debug(`Dry-run previewed ${files.length} file(s)`)
		console.log(formatPreviewOutput(files))
	} catch (err) {
		log.error(err instanceof Error ? err.message : String(err))
		process.exit(1)
	}
}

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		log.setVerbose(Boolean(args.verbose))
		const cwd = resolve(args.path)
		await preflight(cwd, Boolean(args.yes))

		showBanner()
		log.debug(`Project path: ${cwd}`)

		const detected = applyPresetAndOverrides(await detectProject(cwd), args)
		if (args.yes) {
			log.info(`Detected: ${buildDetectionSummary(detected)}`)
		}

		const config = args.yes ? resolveYesConfig(detected) : await runPrompts(detected)
		log.debug(
			`Resolved: strapi ${config.strapiVersion} | ${config.projectType} | ${config.databaseClient} | ${config.packageManager} | env=${config.environment} | secrets=${config.secretBackend} | compose=${config.useCompose} | backups=${config.useBackups}`,
		)

		const healthCheckOverrides = buildHealthCheckOverrides(args)
		const resourceLimits = buildResourceLimitOverrides(args)
		if (healthCheckOverrides) {
			log.debug(`Health check overrides: ${JSON.stringify(healthCheckOverrides)}`)
		}
		if (resourceLimits) {
			log.debug(`Resource limit overrides: ${JSON.stringify(resourceLimits)}`)
		}

		if (args["dry-run"]) {
			await runDryRun(config, healthCheckOverrides, resourceLimits)
			return
		}

		const backedUp = await backupDockerFiles(cwd)
		if (backedUp.length > 0) {
			log.warn(`Backed up existing files: ${backedUp.join(", ")}`)
		}

		const secretFiles = await writeGeneratedFiles(config, cwd, healthCheckOverrides, resourceLimits)
		if (secretFiles.length > 0) {
			log.debug(`Generated secret files: ${secretFiles.join(", ")}`)
		}

		await maybeInstallDriver(config, cwd, Boolean(args["skip-deps"]))

		printOutcome(config, listGeneratedFiles(config, secretFiles))
		log.success("Docker configuration generated successfully!")
	},
})

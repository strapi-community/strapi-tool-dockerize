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

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		log.setVerbose(Boolean(args.verbose))
		const cwd = resolve(args.path)

		try {
			await access(join(cwd, "package.json"))
		} catch {
			log.error(`No Strapi project found at ${cwd}`)
			process.exit(1)
		}

		if (!process.stdin.isTTY && !args.yes) {
			log.error("Non-interactive environment detected. Use --yes flag for non-interactive mode.")
			process.exit(1)
		}

		showBanner()
		log.debug(`Project path: ${cwd}`)

		const detectSpinner = createSpinner("Detecting project configuration...")
		let detected: DetectedConfig
		try {
			detected = await detectAll(cwd)
			detectSpinner.success("Project scanned")
			log.debug(`Detected: ${buildDetectionSummary(detected)}`)
			for (const plugin of detected.detectedPlugins ?? []) {
				const keys = Object.keys(plugin.envVars)
				log.debug(`  plugin ${plugin.name}: ${keys.length > 0 ? keys.join(", ") : "no env vars"}`)
			}
		} catch (err) {
			detectSpinner.error("Failed to detect project configuration")
			log.error(err instanceof Error ? err.message : String(err))
			process.exit(1)
		}

		if (args.preset) {
			if (!PRESET_NAMES.includes(args.preset as PresetName)) {
				log.error(`Unknown preset "${args.preset}". Available: ${PRESET_NAMES.join(", ")}`)
				process.exit(1)
			}
			detected = applyPreset(detected, args.preset as PresetName)
			log.debug(`Applied preset "${args.preset}"`)
		}

		if (args.database) {
			detected.databaseClient = args.database as DatabaseClient
			detected.databasePort = DEFAULT_PORTS[detected.databaseClient]
			log.debug(`Flag override database=${detected.databaseClient}`)
		}
		if (args["package-manager"]) {
			detected.packageManager = args["package-manager"] as DetectedConfig["packageManager"]
			log.debug(`Flag override package-manager=${detected.packageManager}`)
		}
		if (args.env) {
			detected.environment = args.env as Environment
			log.debug(`Flag override env=${detected.environment}`)
		}
		if (args.compose !== undefined) {
			detected.useCompose = args.compose
			log.debug(`Flag override compose=${detected.useCompose}`)
		}
		if (args.secrets) {
			detected.secretBackend = args.secrets as SecretBackend
			log.debug(`Flag override secrets=${detected.secretBackend}`)
		}
		if (args.backups !== undefined) {
			detected.useBackups = args.backups
			log.debug(`Flag override backups=${detected.useBackups}`)
		}

		if (args.yes) {
			log.info(`Detected: ${buildDetectionSummary(detected)}`)
		}

		let config: ResolvedConfig
		if (args.yes) {
			if (shouldWarnDatabaseDefault(detected)) {
				log.warn("No database detected, defaulting to postgres")
			}
			try {
				const resolvedClient = detected.databaseClient ?? "postgres"
				config = resolvedConfigSchema.parse({
					strapiVersion: detected.strapiVersion ?? "v5",
					projectType: detected.projectType ?? "ts",
					databaseClient: resolvedClient,
					packageManager: detected.packageManager ?? "npm",
					environment: detected.environment ?? "development",
					projectName: detected.projectName ?? "strapi",
					databaseHost: detected.databaseHost ?? "localhost",
					databasePort: detected.databasePort ?? DEFAULT_PORTS[resolvedClient],
					databaseName: detected.databaseName ?? "strapi",
					databaseUsername: detected.databaseUsername ?? "strapi",
					databasePassword: detected.databasePassword ?? "strapi",
					useCompose: detected.useCompose ?? true,
					useAdminer: detected.useAdminer ?? false,
					useBackups: detected.useBackups ?? false,
					secretBackend: detected.secretBackend ?? "none",
					isESM: detected.isESM ?? false,
					envVars: detected.envVars ?? {},
					detectedPlugins: detected.detectedPlugins ?? [],
				})
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
		} else {
			config = await runPrompts(detected)
		}

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
			return
		}

		const backedUp = await backupDockerFiles(cwd)
		if (backedUp.length > 0) {
			log.warn(`Backed up existing files: ${backedUp.join(", ")}`)
		}

		const genSpinner = createSpinner("Generating Docker configuration...")

		let secretFiles: string[] = []
		try {
			await generateDockerfiles(config, pluginRegistry, cwd, healthCheckOverrides)
			genSpinner.update("Generating .dockerignore...")
			await generateDockerignore(cwd)

			if (config.useCompose) {
				genSpinner.update("Generating docker-compose.yml...")
				await generateCompose(config, pluginRegistry, cwd, resourceLimits)
			}

			genSpinner.update("Updating .env...")
			await generateEnv(config, pluginRegistry, cwd)

			genSpinner.update("Generating database config...")
			await generateDatabaseConfig(config, cwd)

			const secretManager = pluginRegistry.getSecretManager(config.secretBackend)
			secretFiles = await secretManager.generateFiles(config, cwd)

			genSpinner.success("Docker configuration ready!")
		} catch (err) {
			genSpinner.error("Generation failed")
			log.error(err instanceof Error ? err.message : String(err))
			process.exit(1)
		}

		if (secretFiles.length > 0) {
			log.debug(`Generated secret files: ${secretFiles.join(", ")}`)
		}

		if (config.databaseClient !== "sqlite" && !args["skip-deps"]) {
			const depsSpinner = createSpinner("Installing database driver...")
			try {
				await installDatabaseDriver(config, pluginRegistry, cwd)
				depsSpinner.success("Database driver installed")
			} catch (err) {
				depsSpinner.error("Failed to install database driver")
				log.warn(err instanceof Error ? err.message : String(err))
			}
		}

		const generated: string[] = []
		if (config.environment === "development" || config.environment === "both") {
			generated.push("Dockerfile")
		}
		if (config.environment === "production" || config.environment === "both") {
			generated.push("Dockerfile.prod")
		}
		generated.push(".dockerignore")
		if (config.useCompose) {
			if (config.environment === "both") {
				generated.push("docker-compose.yml")
				generated.push("docker-compose.prod.yml")
			} else {
				generated.push("docker-compose.yml")
			}
		}
		generated.push(".env")
		for (const sf of secretFiles) {
			generated.push(sf)
		}
		const dbExt = config.projectType === "ts" ? "ts" : "js"
		const envDirs =
			config.environment === "both" ? ["development", "production"] : [config.environment]
		for (const envDir of envDirs) {
			generated.push(`config/env/${envDir}/database.${dbExt}`)
		}

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

		log.success("Docker configuration generated successfully!")
	},
})

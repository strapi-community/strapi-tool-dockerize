import { ZodError } from "zod"
import type {
	DatabaseClient,
	DetectedConfig,
	Environment,
	PresetName,
	ResolvedConfig,
	ResourceLimitOverrides,
	StrapiHealthCheckOverrides,
} from "../../config"
import { DEFAULT_PORTS, PRESET_NAMES, getPreset, resolvedConfigSchema } from "../../config"
import { detectAll } from "../../detection"
import { createSpinner, log } from "../../ui"

export type CommandArgs = Record<string, unknown>

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
	args: CommandArgs,
): StrapiHealthCheckOverrides | undefined {
	const overrides: StrapiHealthCheckOverrides = {}
	if (args["health-interval"]) overrides.interval = String(args["health-interval"])
	if (args["health-timeout"]) overrides.timeout = String(args["health-timeout"])
	if (args["health-start-period"]) overrides.startPeriod = String(args["health-start-period"])
	if (args["health-retries"]) overrides.retries = Number(args["health-retries"])
	return Object.keys(overrides).length > 0 ? overrides : undefined
}

export function buildResourceLimitOverrides(args: CommandArgs): ResourceLimitOverrides | undefined {
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

export async function detectProject(cwd: string): Promise<DetectedConfig> {
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

export function applyPresetAndOverrides(
	detected: DetectedConfig,
	args: CommandArgs,
): DetectedConfig {
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

export function resolveYesConfig(detected: DetectedConfig): ResolvedConfig {
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

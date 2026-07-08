import * as p from "@clack/prompts"
import type {
	DatabaseClient,
	DetectedConfig,
	Environment,
	PackageManager,
	ProjectType,
	ResolvedConfig,
	SecretBackend,
	StrapiVersion,
} from "../config"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
	DEFAULT_SECRET_BACKEND,
} from "../config"
import { resolvedConfigSchema } from "../config"
import {
	DB_LABELS,
	LANG_LABELS,
	PM_LABELS,
	SECRET_BACKEND_LABELS,
	logDetectedSummary,
} from "./confirm-detected"
import { promptDatabaseConnection, selectDatabase } from "./database"
import {
	promptEnvironment,
	promptProjectName,
	promptSecretBackend,
	promptUseAdminer,
	promptUseBackups,
	promptUseCompose,
} from "./options"

async function selectStrapiVersion(detected?: StrapiVersion): Promise<StrapiVersion> {
	const selected = await p.select({
		message: "Which Strapi version?",
		initialValue: detected ?? "v5",
		options: [
			{ value: "v5", label: "Strapi v5", hint: "latest" },
			{ value: "v4", label: "Strapi v4", hint: "legacy" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as StrapiVersion
}

async function selectProjectType(detected?: ProjectType): Promise<ProjectType> {
	const selected = await p.select({
		message: "JavaScript or TypeScript?",
		initialValue: detected ?? "ts",
		options: [
			{ value: "ts", label: "TypeScript", hint: "recommended" },
			{ value: "js", label: "JavaScript" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as ProjectType
}

async function selectPackageManager(detected?: PackageManager): Promise<PackageManager> {
	const selected = await p.select({
		message: "Which package manager?",
		initialValue: detected ?? "npm",
		options: [
			{ value: "npm", label: "npm" },
			{ value: "yarn", label: "Yarn" },
			{ value: "pnpm", label: "pnpm", hint: "fast, disk efficient" },
			{ value: "bun", label: "Bun", hint: "fast, all-in-one toolkit" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as PackageManager
}

interface DbConnection {
	databaseHost: string
	databasePort: number
	databaseName: string
	databaseUsername: string
	databasePassword: string
}

function fillDefaults(dbClient: DatabaseClient, detected: DetectedConfig): DbConnection {
	return {
		databaseHost: detected.databaseHost ?? DEFAULT_DATABASE_HOST,
		databasePort: detected.databasePort ?? DEFAULT_PORTS[dbClient],
		databaseName: detected.databaseName ?? DEFAULT_DATABASE_NAME,
		databaseUsername: detected.databaseUsername ?? DEFAULT_DATABASE_USERNAME,
		databasePassword: detected.databasePassword ?? DEFAULT_DATABASE_PASSWORD,
	}
}

async function collectDatabaseConnection(
	databaseClient: DatabaseClient,
	detected: DetectedConfig,
): Promise<DbConnection> {
	if (databaseClient === "sqlite") {
		return {
			databaseHost: DEFAULT_DATABASE_HOST,
			databasePort: 0,
			databaseName: DEFAULT_DATABASE_NAME,
			databaseUsername: DEFAULT_DATABASE_USERNAME,
			databasePassword: DEFAULT_DATABASE_PASSWORD,
		}
	}

	const defaults = fillDefaults(databaseClient, detected)
	const customize = await p.confirm({
		message: `Database: ${defaults.databaseHost}:${defaults.databasePort}/${defaults.databaseName} (user: ${defaults.databaseUsername}). Customize?`,
		initialValue: false,
	})
	if (p.isCancel(customize)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return customize ? promptDatabaseConnection(databaseClient, detected) : defaults
}

interface DeploymentOptions {
	environment: Environment
	secretBackend: SecretBackend
	useCompose: boolean
	useAdminer: boolean
	useBackups: boolean
}

async function collectDeploymentOptions(
	detected: DetectedConfig,
	databaseClient: DatabaseClient,
): Promise<DeploymentOptions> {
	const environment = await promptEnvironment(detected.environment)
	const isProduction = environment === "production" || environment === "both"
	const notSqlite = databaseClient !== "sqlite"

	const secretBackend =
		isProduction && notSqlite
			? await promptSecretBackend(detected.secretBackend)
			: DEFAULT_SECRET_BACKEND

	const useCompose = await promptUseCompose()
	const useAdminer = useCompose && notSqlite ? await promptUseAdminer() : false
	const useBackups =
		useCompose && notSqlite && isProduction ? await promptUseBackups(detected.useBackups) : false

	return { environment, secretBackend, useCompose, useAdminer, useBackups }
}

function buildSummaryLines(config: ResolvedConfig): string[] {
	const lines = [
		`Strapi ${config.strapiVersion} | ${LANG_LABELS[config.projectType]} | ${DB_LABELS[config.databaseClient]} | ${PM_LABELS[config.packageManager]}`,
		`Environment: ${config.environment}`,
		`Project: ${config.projectName}`,
	]

	if (config.databaseClient !== "sqlite") {
		lines.push(`Database: ${config.databaseHost}:${config.databasePort}/${config.databaseName}`)
		lines.push(`DB User: ${config.databaseUsername}`)
	}
	if (config.secretBackend !== "none") {
		lines.push(`Secrets: ${SECRET_BACKEND_LABELS[config.secretBackend]}`)
	}
	if (config.useCompose) {
		const extras: string[] = []
		if (config.useAdminer) extras.push("Adminer (port 8080)")
		if (config.useBackups) extras.push("database backups")
		lines.push(`Compose: yes${extras.length > 0 ? ` + ${extras.join(", ")}` : ""}`)
	}
	if (config.detectedPlugins.length > 0) {
		lines.push(`Plugins: ${config.detectedPlugins.map((plugin) => plugin.name).join(", ")}`)
	}

	return lines
}

async function confirmGeneration(): Promise<void> {
	const confirmed = await p.confirm({
		message: "Generate Docker files with this configuration?",
		initialValue: true,
	})
	if (p.isCancel(confirmed) || !confirmed) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}
}

export async function runPrompts(detected: DetectedConfig): Promise<ResolvedConfig> {
	p.intro("Configuring Docker for your Strapi project")

	const hasDetections =
		detected.strapiVersion ||
		detected.projectType ||
		detected.databaseClient ||
		detected.packageManager
	if (hasDetections) {
		logDetectedSummary(detected)
	}

	const projectName = await promptProjectName(detected.projectName)

	const strapiVersion = await selectStrapiVersion(detected.strapiVersion)

	const projectType = await selectProjectType(detected.projectType)

	const packageManager = await selectPackageManager(detected.packageManager)

	const databaseClient = await selectDatabase(detected.databaseClient)
	const dbConnection = await collectDatabaseConnection(databaseClient, detected)
	const options = await collectDeploymentOptions(detected, databaseClient)

	const config = resolvedConfigSchema.parse({
		strapiVersion,
		projectType,
		databaseClient,
		packageManager,
		projectName,
		...dbConnection,
		...options,
		isESM: detected.isESM ?? false,
		envVars: detected.envVars ?? {},
		detectedPlugins: detected.detectedPlugins ?? [],
	})

	p.note(buildSummaryLines(config).join("\n"), "Configuration")

	if (
		(config.environment === "production" || config.environment === "both") &&
		config.databasePassword === DEFAULT_DATABASE_PASSWORD
	) {
		p.log.warn("Default database credentials are not recommended for production")
	}

	await confirmGeneration()

	return config
}

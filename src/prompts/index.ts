import * as p from "@clack/prompts"
import type {
	DatabaseClient,
	DetectedConfig,
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

function fillDefaults(dbClient: DatabaseClient, detected: DetectedConfig) {
	return {
		databaseHost: detected.databaseHost ?? DEFAULT_DATABASE_HOST,
		databasePort: detected.databasePort ?? DEFAULT_PORTS[dbClient],
		databaseName: detected.databaseName ?? DEFAULT_DATABASE_NAME,
		databaseUsername: detected.databaseUsername ?? DEFAULT_DATABASE_USERNAME,
		databasePassword: detected.databasePassword ?? DEFAULT_DATABASE_PASSWORD,
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

	let dbConnection: {
		databaseHost: string
		databasePort: number
		databaseName: string
		databaseUsername: string
		databasePassword: string
	}

	if (databaseClient !== "sqlite") {
		const defaults = fillDefaults(databaseClient, detected)

		const customize = await p.confirm({
			message: `Database: ${defaults.databaseHost}:${defaults.databasePort}/${defaults.databaseName} (user: ${defaults.databaseUsername}). Customize?`,
			initialValue: false,
		})
		if (p.isCancel(customize)) {
			p.cancel("Setup cancelled.")
			process.exit(0)
		}

		if (customize) {
			dbConnection = await promptDatabaseConnection(databaseClient, detected)
		} else {
			dbConnection = {
				databaseHost: defaults.databaseHost,
				databasePort: defaults.databasePort,
				databaseName: defaults.databaseName,
				databaseUsername: defaults.databaseUsername,
				databasePassword: defaults.databasePassword,
			}
		}
	} else {
		dbConnection = {
			databaseHost: DEFAULT_DATABASE_HOST,
			databasePort: 0,
			databaseName: DEFAULT_DATABASE_NAME,
			databaseUsername: DEFAULT_DATABASE_USERNAME,
			databasePassword: DEFAULT_DATABASE_PASSWORD,
		}
	}

	const environment = await promptEnvironment(detected.environment)

	let secretBackend: SecretBackend = DEFAULT_SECRET_BACKEND
	const showSecretPrompt =
		(environment === "production" || environment === "both") && databaseClient !== "sqlite"
	if (showSecretPrompt) {
		secretBackend = await promptSecretBackend(detected.secretBackend)
	}

	const useCompose = await promptUseCompose()

	let useAdminer = false
	if (useCompose && databaseClient !== "sqlite") {
		useAdminer = await promptUseAdminer()
	}

	let useBackups = false
	const showBackupPrompt =
		useCompose &&
		databaseClient !== "sqlite" &&
		(environment === "production" || environment === "both")
	if (showBackupPrompt) {
		useBackups = await promptUseBackups(detected.useBackups)
	}

	const raw: ResolvedConfig = {
		strapiVersion,
		projectType,
		databaseClient,
		packageManager,
		environment,
		projectName,
		...dbConnection,
		useCompose,
		useAdminer,
		useBackups,
		secretBackend,
		isESM: detected.isESM ?? false,
		envVars: detected.envVars ?? {},
		detectedPlugins: detected.detectedPlugins ?? [],
	}

	const config = resolvedConfigSchema.parse(raw)

	const summaryLines = [
		`Strapi ${strapiVersion} | ${LANG_LABELS[projectType]} | ${DB_LABELS[databaseClient]} | ${PM_LABELS[packageManager]}`,
		`Environment: ${environment}`,
		`Project: ${projectName}`,
	]

	if (databaseClient !== "sqlite") {
		summaryLines.push(
			`Database: ${dbConnection.databaseHost}:${dbConnection.databasePort}/${dbConnection.databaseName}`,
		)
		summaryLines.push(`DB User: ${dbConnection.databaseUsername}`)
	}

	if (secretBackend !== "none") {
		summaryLines.push(`Secrets: ${SECRET_BACKEND_LABELS[secretBackend]}`)
	}

	if (useCompose) {
		const extras: string[] = []
		if (useAdminer) extras.push("Adminer (port 8080)")
		if (useBackups) extras.push("database backups")
		summaryLines.push(`Compose: yes${extras.length > 0 ? ` + ${extras.join(", ")}` : ""}`)
	}

	const plugins = detected.detectedPlugins ?? []
	if (plugins.length > 0) {
		summaryLines.push(`Plugins: ${plugins.map((p) => p.name).join(", ")}`)
	}

	p.note(summaryLines.join("\n"), "Configuration")

	if (
		(environment === "production" || environment === "both") &&
		dbConnection.databasePassword === DEFAULT_DATABASE_PASSWORD
	) {
		p.log.warn("Default database credentials are not recommended for production")
	}

	const confirmed = await p.confirm({
		message: "Generate Docker files with this configuration?",
		initialValue: true,
	})

	if (p.isCancel(confirmed) || !confirmed) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return config
}

export {
	buildDetectionSummary,
	logDetectedSummary,
	DB_LABELS,
	PM_LABELS,
	LANG_LABELS,
	SECRET_BACKEND_LABELS,
} from "./confirm-detected"
export { selectDatabase, promptDatabaseConnection } from "./database"
export {
	promptEnvironment,
	promptProjectName,
	promptSecretBackend,
	promptUseCompose,
	promptUseAdminer,
	promptUseBackups,
} from "./options"

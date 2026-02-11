import * as p from "@clack/prompts"
import type { DatabaseClient, DetectedConfig, PackageManager, ProjectType, ResolvedConfig, StrapiVersion } from "../config"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../config"
import { resolvedConfigSchema } from "../config"
import { confirmDetected } from "./confirm-detected"
import { promptDatabaseConnection, selectDatabase } from "./database"
import { promptEnvironment, promptProjectName, promptUseAdminer, promptUseCompose } from "./options"

async function selectStrapiVersion(): Promise<StrapiVersion> {
	const selected = await p.select({
		message: "Which Strapi version?",
		options: [
			{ value: "v5", label: "Strapi v5", hint: "latest" },
			{ value: "v4", label: "Strapi v4" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as StrapiVersion
}

async function selectProjectType(): Promise<ProjectType> {
	const selected = await p.select({
		message: "JavaScript or TypeScript?",
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

async function selectPackageManager(): Promise<PackageManager> {
	const selected = await p.select({
		message: "Which package manager?",
		options: [
			{ value: "npm", label: "npm" },
			{ value: "yarn", label: "Yarn" },
			{ value: "pnpm", label: "pnpm" },
			{ value: "bun", label: "Bun" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as PackageManager
}

function fillDefaults(detected: DetectedConfig, dbClient: DatabaseClient): Partial<ResolvedConfig> {
	return {
		databaseHost: detected.databaseHost ?? DEFAULT_DATABASE_HOST,
		databasePort: detected.databasePort ?? DEFAULT_PORTS[dbClient],
		databaseName: detected.databaseName ?? DEFAULT_DATABASE_NAME,
		databaseUsername: detected.databaseUsername ?? DEFAULT_DATABASE_USERNAME,
		databasePassword: detected.databasePassword ?? DEFAULT_DATABASE_PASSWORD,
		envVars: detected.envVars ?? {},
	}
}

export async function runPrompts(detected: DetectedConfig): Promise<ResolvedConfig> {
	p.intro("Let's configure your Docker setup")

	const hasDetections = detected.strapiVersion || detected.projectType || detected.databaseClient || detected.packageManager

	let useDetected = false
	if (hasDetections) {
		useDetected = await confirmDetected(detected)
	}

	const strapiVersion = useDetected && detected.strapiVersion ? detected.strapiVersion : await selectStrapiVersion()

	const projectType = useDetected && detected.projectType ? detected.projectType : await selectProjectType()

	const packageManager = useDetected && detected.packageManager ? detected.packageManager : await selectPackageManager()

	const databaseClient = useDetected && detected.databaseClient ? detected.databaseClient : await selectDatabase()

	const defaults = fillDefaults(detected, databaseClient)

	let dbConnection: {
		databaseHost: string
		databasePort: number
		databaseName: string
		databaseUsername: string
		databasePassword: string
	}

	if (useDetected && (detected.databaseHost || detected.databasePort)) {
		dbConnection = {
			databaseHost: detected.databaseHost ?? defaults.databaseHost!,
			databasePort: detected.databasePort ?? defaults.databasePort!,
			databaseName: detected.databaseName ?? defaults.databaseName!,
			databaseUsername: detected.databaseUsername ?? defaults.databaseUsername!,
			databasePassword: detected.databasePassword ?? defaults.databasePassword!,
		}
	} else {
		dbConnection = await promptDatabaseConnection(databaseClient)
	}

	const environment = useDetected && detected.environment ? detected.environment : await promptEnvironment()

	const useCompose = (useDetected && detected.useCompose !== undefined) ? detected.useCompose : await promptUseCompose()

	let useAdminer = false
	if (useCompose && databaseClient !== "sqlite") {
		useAdminer = (useDetected && detected.useAdminer !== undefined) ? detected.useAdminer : await promptUseAdminer()
	}

	const projectName = useDetected && detected.projectName
		? detected.projectName
		: await promptProjectName(detected.projectName)

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
		isESM: detected.isESM ?? false,
		envVars: detected.envVars ?? {},
	}

	const config = resolvedConfigSchema.parse(raw)

	p.outro("Configuration complete!")

	return config
}

export { confirmDetected } from "./confirm-detected"
export { selectDatabase, promptDatabaseConnection } from "./database"
export { promptEnvironment, promptProjectName, promptUseCompose, promptUseAdminer } from "./options"

import { readFile as nodeReadFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ResolvedConfig, ResourceLimitOverrides, StrapiHealthCheckOverrides } from "../config"
import {
	ADMINER_IMAGE,
	ADMINER_PORT,
	BACKUP_IMAGES,
	BACKUP_RETENTION_DAYS,
	BACKUP_SCHEDULE,
	NODE_VERSIONS,
	RESOURCE_LIMITS,
	STRAPI_DEFAULT_PORT,
	STRAPI_HEALTH_CHECK_INTERVAL,
	STRAPI_HEALTH_CHECK_RETRIES,
	STRAPI_HEALTH_CHECK_START_PERIOD,
	STRAPI_HEALTH_CHECK_TIMEOUT,
} from "../config"
import type { PluginRegistry } from "../plugins/types"
import { renderTemplate } from "../templates"

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface PreviewFile {
	filename: string
	content: string
}

function buildDockerfileContext(
	config: ResolvedConfig,
	registry: PluginRegistry,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
) {
	const pm = registry.getPackageManager(config.packageManager)
	const nodeVersion = NODE_VERSIONS[config.strapiVersion]
	const baseImage = pm.dockerBaseImage(nodeVersion)

	return {
		nodeVersion,
		baseImage,
		runtimeImage: baseImage,
		pmSetupSteps: pm.dockerSetupSteps(),
		pmCopyFiles: pm.dockerCopyFiles(),
		pmInstallStep: pm.dockerInstallStep(false),
		pmInstallStepProd: pm.dockerInstallStep(true),
		pmBuildStep: pm.dockerBuildStep(),
		pmStartStep: pm.dockerStartStep(false),
		pmDevStep: pm.dockerStartStep(true),
		projectName: config.projectName,
		strapiPort: STRAPI_DEFAULT_PORT,
		healthInterval: healthCheckOverrides?.interval ?? STRAPI_HEALTH_CHECK_INTERVAL,
		healthTimeout: healthCheckOverrides?.timeout ?? STRAPI_HEALTH_CHECK_TIMEOUT,
		healthStartPeriod: healthCheckOverrides?.startPeriod ?? STRAPI_HEALTH_CHECK_START_PERIOD,
		healthRetries: healthCheckOverrides?.retries ?? STRAPI_HEALTH_CHECK_RETRIES,
	}
}

async function renderDockerfiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
): Promise<PreviewFile[]> {
	const files: PreviewFile[] = []
	const context = buildDockerfileContext(config, registry, healthCheckOverrides)

	if (config.environment === "development" || config.environment === "both") {
		const content = await renderTemplate("Dockerfile", context)
		files.push({ filename: "Dockerfile", content })
	}

	if (config.environment === "production" || config.environment === "both") {
		const content = await renderTemplate("Dockerfile.prod", context)
		files.push({ filename: "Dockerfile.prod", content })
	}

	return files
}

async function renderDockerignore(): Promise<PreviewFile> {
	const templatePath = join(__dirname, "..", "templates", "files", "dockerignore")
	const content = await nodeReadFile(templatePath, "utf-8")
	return { filename: ".dockerignore", content }
}

function extractNamedVolumes(volumes: string[]): string[] {
	return volumes.map((v) => v.split(":")[0]).filter((v) => !v.startsWith(".") && !v.startsWith("/"))
}

function resolveResourceLimits(
	environment: "development" | "production",
	overrides?: ResourceLimitOverrides,
) {
	const defaults = RESOURCE_LIMITS[environment]
	return {
		memoryLimit: overrides?.memory ?? defaults.memory,
		cpuLimit: overrides?.cpus ?? defaults.cpus,
	}
}

function halveResourceValue(value: string): string {
	const match = value.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
	if (!match) return value
	const num = Number.parseFloat(match[1])
	const unit = match[2]
	return `${num / 2}${unit}`
}

async function renderComposeFiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	resourceLimits?: ResourceLimitOverrides,
): Promise<PreviewFile[]> {
	if (!config.useCompose) return []

	const pm = registry.getPackageManager(config.packageManager)
	const isSqlite = config.databaseClient === "sqlite"

	let dbImage = ""
	let dbEnvironment: { key: string; value: string }[] = []
	let dbPorts: string[] = []
	let dbVolumes: string[] = []
	let dbHealthTest: string[] = []
	let dbHealthInterval = ""
	let dbHealthTimeout = ""
	let dbHealthRetries = 0
	let dbHealthStartPeriod = ""
	let namedVolumes: string[] = []

	if (!isSqlite) {
		const db = registry.getDatabase(config.databaseClient)
		const service = db.composeService(config)

		dbImage = service.image
		dbEnvironment = Object.entries(service.environment).map(([key, value]) => ({ key, value }))
		dbPorts = service.ports
		dbVolumes = service.volumes
		namedVolumes = extractNamedVolumes(service.volumes)

		const hc = service.healthcheck
		dbHealthTest = [`test: ${JSON.stringify(hc.test)}`]
		dbHealthInterval = hc.interval
		dbHealthTimeout = hc.timeout
		dbHealthRetries = hc.retries
		dbHealthStartPeriod = hc.startPeriod || ""
	}

	const baseContext = {
		projectName: config.projectName,
		strapiPort: STRAPI_DEFAULT_PORT,
		databaseClient: config.databaseClient,
		lockFile: pm.lockFile,
		useAdminer: config.useAdminer,
		adminerImage: ADMINER_IMAGE,
		adminerPort: ADMINER_PORT,
		useBackups: config.useBackups,
		backupImage: BACKUP_IMAGES[config.databaseClient] ?? "",
		backupSchedule: BACKUP_SCHEDULE,
		backupRetentionDays: BACKUP_RETENTION_DAYS,
		dbImage,
		dbEnvironment,
		dbPorts,
		dbVolumes,
		dbHealthTest,
		dbHealthInterval,
		dbHealthTimeout,
		dbHealthRetries,
		dbHealthStartPeriod,
		namedVolumes,
	}

	const files: PreviewFile[] = []

	if (config.environment === "both") {
		const devLimits = resolveResourceLimits("development", resourceLimits)
		const devOutput = await renderTemplate("docker-compose", {
			...baseContext,
			environment: "development",
			...devLimits,
			dbMemoryLimit: halveResourceValue(devLimits.memoryLimit),
			dbCpuLimit: halveResourceValue(devLimits.cpuLimit),
		})
		files.push({ filename: "docker-compose.yml", content: devOutput })

		const prodLimits = resolveResourceLimits("production", resourceLimits)
		const prodOutput = await renderTemplate("docker-compose", {
			...baseContext,
			environment: "production",
			...prodLimits,
			dbMemoryLimit: halveResourceValue(prodLimits.memoryLimit),
			dbCpuLimit: halveResourceValue(prodLimits.cpuLimit),
		})
		files.push({ filename: "docker-compose.prod.yml", content: prodOutput })
	} else {
		const env = config.environment as "development" | "production"
		const limits = resolveResourceLimits(env, resourceLimits)
		const output = await renderTemplate("docker-compose", {
			...baseContext,
			environment: config.environment,
			...limits,
			dbMemoryLimit: halveResourceValue(limits.memoryLimit),
			dbCpuLimit: halveResourceValue(limits.cpuLimit),
		})
		files.push({ filename: "docker-compose.yml", content: output })
	}

	return files
}

function renderEnvVars(config: ResolvedConfig, registry: PluginRegistry): PreviewFile {
	const isSqlite = config.databaseClient === "sqlite"
	let vars: Record<string, string> = {}

	if (!isSqlite) {
		const db = registry.getDatabase(config.databaseClient)
		vars = { ...db.envVars(config) }

		if (config.useCompose) {
			vars.DATABASE_HOST = `${config.projectName}-db`
		}
	} else {
		vars.DATABASE_CLIENT = "sqlite"
		vars.DATABASE_FILENAME = ".tmp/data.db"
	}

	const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`)

	let pluginSection = ""
	const plugins = config.detectedPlugins ?? []
	for (const plugin of plugins) {
		pluginSection += `\n# ${plugin.name}`
		for (const [key, value] of Object.entries(plugin.envVars)) {
			pluginSection += `\n${key}=${value}`
		}
	}

	const content = `# --- Dockerize Start ---\n${lines.join("\n")}${pluginSection}\n# --- Dockerize End ---\n`

	return { filename: ".env", content }
}

function getDatabaseConfigContent(config: ResolvedConfig): string {
	const isSqlite = config.databaseClient === "sqlite"
	const isTs = config.projectType === "ts"
	const isESM = config.isESM

	const v4Ts = `export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
  },
})
`
	const v4Js = `module.exports = ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
  },
})
`
	const v4SqliteTs = `import path from "path"

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`
	const v4SqliteJs = `const path = require("path")

module.exports = ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`
	const v5Ts = `export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
})
`
	const v5Js = `module.exports = ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
})
`
	const v5SqliteTs = `import path from "path"

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`
	const v5SqliteJs = `const path = require("path")

module.exports = ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`
	const v5EsmJs = `export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
})
`
	const v5EsmSqliteJs = `import path from "path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`
	const v5EsmSqliteTs = `import path from "path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`

	if (config.strapiVersion === "v4") {
		if (isSqlite) return isTs ? v4SqliteTs : v4SqliteJs
		return isTs ? v4Ts : v4Js
	}

	if (isSqlite) {
		if (isESM) return isTs ? v5EsmSqliteTs : v5EsmSqliteJs
		return isTs ? v5SqliteTs : v5SqliteJs
	}
	if (isTs) return v5Ts
	return isESM ? v5EsmJs : v5Js
}

function renderDatabaseConfig(config: ResolvedConfig): PreviewFile[] {
	const ext = config.projectType === "ts" ? "ts" : "js"
	const content = getDatabaseConfigContent(config)
	const envDirs =
		config.environment === "both" ? ["development", "production"] : [config.environment]

	return envDirs.map((envDir) => ({
		filename: `config/env/${envDir}/database.${ext}`,
		content,
	}))
}

export async function previewGeneration(
	config: ResolvedConfig,
	registry: PluginRegistry,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
	resourceLimits?: ResourceLimitOverrides,
): Promise<PreviewFile[]> {
	const files: PreviewFile[] = []

	files.push(...(await renderDockerfiles(config, registry, healthCheckOverrides)))
	files.push(await renderDockerignore())
	files.push(...(await renderComposeFiles(config, registry, resourceLimits)))
	files.push(renderEnvVars(config, registry))
	files.push(...renderDatabaseConfig(config))

	return files
}

export function formatPreviewOutput(files: PreviewFile[]): string {
	return files.map((f) => `--- ${f.filename} ---\n${f.content}`).join("\n")
}

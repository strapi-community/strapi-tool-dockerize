import { join } from "node:path"
import type { ResolvedConfig, ResourceLimitOverrides } from "../config"
import {
	ADMINER_IMAGE,
	ADMINER_PORT,
	BACKUP_IMAGES,
	BACKUP_RETENTION_DAYS,
	BACKUP_SCHEDULE,
	RESOURCE_LIMITS,
	STRAPI_DEFAULT_PORT,
} from "../config"
import type { PluginRegistry } from "../plugins/types"
import { renderTemplate } from "../templates"
import { writeFile } from "../utils/fs"

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

export async function generateCompose(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string,
	resourceLimits?: ResourceLimitOverrides,
): Promise<void> {
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

	const secretManager = registry.getSecretManager(config.secretBackend)
	const composeSecrets = secretManager.composeSecrets(config)
	const serviceSecrets = secretManager.serviceSecrets(config)
	const hasSecrets = composeSecrets.length > 0

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
		secrets: composeSecrets,
		serviceSecrets,
		hasSecrets,
	}

	if (config.environment === "both") {
		const devLimits = resolveResourceLimits("development", resourceLimits)
		const devOutput = await renderTemplate("docker-compose", {
			...baseContext,
			environment: "development",
			...devLimits,
			dbMemoryLimit: halveResourceValue(devLimits.memoryLimit),
			dbCpuLimit: halveResourceValue(devLimits.cpuLimit),
		})
		await writeFile(join(cwd, "docker-compose.yml"), devOutput)

		const prodLimits = resolveResourceLimits("production", resourceLimits)
		const prodOutput = await renderTemplate("docker-compose", {
			...baseContext,
			environment: "production",
			...prodLimits,
			dbMemoryLimit: halveResourceValue(prodLimits.memoryLimit),
			dbCpuLimit: halveResourceValue(prodLimits.cpuLimit),
		})
		await writeFile(join(cwd, "docker-compose.prod.yml"), prodOutput)
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
		await writeFile(join(cwd, "docker-compose.yml"), output)
	}
}

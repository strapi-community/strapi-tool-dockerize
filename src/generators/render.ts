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
import { readTemplateFile, renderTemplate } from "../templates"

export interface GeneratedFile {
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

export async function renderDockerfiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
): Promise<GeneratedFile[]> {
	const files: GeneratedFile[] = []
	const context = buildDockerfileContext(config, registry, healthCheckOverrides)

	if (config.environment === "development" || config.environment === "both") {
		files.push({ filename: "Dockerfile", content: await renderTemplate("Dockerfile", context) })
	}

	if (config.environment === "production" || config.environment === "both") {
		files.push({
			filename: "Dockerfile.prod",
			content: await renderTemplate("Dockerfile.prod", context),
		})
	}

	return files
}

export async function renderDockerignore(): Promise<GeneratedFile> {
	return { filename: ".dockerignore", content: await readTemplateFile("dockerignore") }
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

function buildDatabaseComposeContext(config: ResolvedConfig, registry: PluginRegistry) {
	if (config.databaseClient === "sqlite") {
		return {
			dbImage: "",
			dbEnvironment: [] as { key: string; value: string }[],
			dbPorts: [] as string[],
			dbVolumes: [] as string[],
			dbHealthTest: [] as string[],
			dbHealthInterval: "",
			dbHealthTimeout: "",
			dbHealthRetries: 0,
			dbHealthStartPeriod: "",
			namedVolumes: [] as string[],
		}
	}

	const service = registry.getDatabase(config.databaseClient).composeService(config)
	const hc = service.healthcheck

	return {
		dbImage: service.image,
		dbEnvironment: Object.entries(service.environment).map(([key, value]) => ({ key, value })),
		dbPorts: service.ports,
		dbVolumes: service.volumes,
		dbHealthTest: [`test: ${JSON.stringify(hc.test)}`],
		dbHealthInterval: hc.interval,
		dbHealthTimeout: hc.timeout,
		dbHealthRetries: hc.retries,
		dbHealthStartPeriod: hc.startPeriod || "",
		namedVolumes: extractNamedVolumes(service.volumes),
	}
}

export async function renderComposeFiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	resourceLimits?: ResourceLimitOverrides,
): Promise<GeneratedFile[]> {
	if (!config.useCompose) return []

	const pm = registry.getPackageManager(config.packageManager)
	const secretManager = registry.getSecretManager(config.secretBackend)
	const composeSecrets = secretManager.composeSecrets(config)

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
		...buildDatabaseComposeContext(config, registry),
		secrets: composeSecrets,
		serviceSecrets: secretManager.serviceSecrets(config),
		hasSecrets: composeSecrets.length > 0,
	}

	async function renderFor(environment: "development" | "production"): Promise<string> {
		const limits = resolveResourceLimits(environment, resourceLimits)
		return renderTemplate("docker-compose", {
			...baseContext,
			environment,
			...limits,
			dbMemoryLimit: halveResourceValue(limits.memoryLimit),
			dbCpuLimit: halveResourceValue(limits.cpuLimit),
		})
	}

	if (config.environment === "both") {
		return [
			{ filename: "docker-compose.yml", content: await renderFor("development") },
			{ filename: "docker-compose.prod.yml", content: await renderFor("production") },
		]
	}

	const env = config.environment as "development" | "production"
	return [{ filename: "docker-compose.yml", content: await renderFor(env) }]
}

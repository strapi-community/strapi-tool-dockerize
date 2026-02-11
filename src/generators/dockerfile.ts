import { readFile as nodeReadFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ResolvedConfig, StrapiHealthCheckOverrides } from "../config"
import {
	NODE_VERSIONS,
	STRAPI_DEFAULT_PORT,
	STRAPI_HEALTH_CHECK_INTERVAL,
	STRAPI_HEALTH_CHECK_RETRIES,
	STRAPI_HEALTH_CHECK_START_PERIOD,
	STRAPI_HEALTH_CHECK_TIMEOUT,
} from "../config"
import type { PluginRegistry } from "../plugins/types"
import { renderTemplate } from "../templates"
import { writeFile } from "../utils/fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function generateDockerfiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
): Promise<void> {
	const pm = registry.getPackageManager(config.packageManager)

	const nodeVersion = NODE_VERSIONS[config.strapiVersion]
	const baseImage = pm.dockerBaseImage(nodeVersion)

	const context = {
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

	if (config.environment === "development" || config.environment === "both") {
		const dockerfile = await renderTemplate("Dockerfile", context)
		await writeFile(join(cwd, "Dockerfile"), dockerfile)
	}

	if (config.environment === "production" || config.environment === "both") {
		const dockerfileProd = await renderTemplate("Dockerfile.prod", context)
		await writeFile(join(cwd, "Dockerfile.prod"), dockerfileProd)
	}
}

export async function generateDockerignore(cwd: string): Promise<void> {
	const templatePath = join(__dirname, "..", "templates", "files", "dockerignore")
	const content = await nodeReadFile(templatePath, "utf-8")
	await writeFile(join(cwd, ".dockerignore"), content)
}

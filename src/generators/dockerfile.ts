import { readFile as nodeReadFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ResolvedConfig } from "../config"
import { NODE_VERSIONS, STRAPI_DEFAULT_PORT } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { renderTemplate } from "../templates"
import { writeFile } from "../utils/fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function generateDockerfiles(config: ResolvedConfig, registry: PluginRegistry, cwd: string): Promise<void> {
	const pm = registry.getPackageManager(config.packageManager)

	const context = {
		nodeVersion: NODE_VERSIONS[config.strapiVersion],
		pmCopyFiles: pm.dockerCopyFiles(),
		pmInstallStep: pm.dockerInstallStep(false),
		pmInstallStepProd: pm.dockerInstallStep(true),
		pmBuildStep: pm.dockerBuildStep(),
		pmStartStep: pm.dockerStartStep(false),
		pmDevStep: pm.dockerStartStep(true),
		projectName: config.projectName,
		strapiPort: STRAPI_DEFAULT_PORT,
	}

	const dockerfile = await renderTemplate("Dockerfile", context)
	await writeFile(join(cwd, "Dockerfile"), dockerfile)

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

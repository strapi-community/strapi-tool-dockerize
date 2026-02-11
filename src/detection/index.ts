import type { DetectedConfig } from "../config"
import { detectDatabase } from "./database"
import { detectEnvironment } from "./environment"
import { detectPackageManager } from "./package-manager"
import { detectStrapiPlugins } from "./plugins"
import { detectStrapi } from "./strapi"

export async function detectAll(cwd: string): Promise<DetectedConfig> {
	const [strapi, database, packageManager, environment, detectedPlugins] = await Promise.all([
		detectStrapi(cwd),
		detectDatabase(cwd),
		detectPackageManager(cwd),
		detectEnvironment(cwd),
		detectStrapiPlugins(cwd),
	])

	return {
		...strapi,
		...database,
		...packageManager,
		...environment,
		detectedPlugins,
	} as DetectedConfig
}

export { detectStrapi } from "./strapi"
export { detectDatabase } from "./database"
export { detectPackageManager } from "./package-manager"
export { detectEnvironment } from "./environment"
export { detectStrapiPlugins } from "./plugins"

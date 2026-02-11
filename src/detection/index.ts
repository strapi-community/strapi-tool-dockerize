import type { DetectedConfig } from "../config"
import { detectDatabase } from "./database"
import { detectEnvironment } from "./environment"
import { detectPackageManager } from "./package-manager"
import { detectStrapi } from "./strapi"

export async function detectAll(cwd: string): Promise<DetectedConfig> {
	const [strapi, database, packageManager, environment] = await Promise.all([
		detectStrapi(cwd),
		detectDatabase(cwd),
		detectPackageManager(cwd),
		detectEnvironment(cwd),
	])

	return {
		...strapi,
		...database,
		...packageManager,
		...environment,
	} as DetectedConfig
}

export { detectStrapi } from "./strapi"
export { detectDatabase } from "./database"
export { detectPackageManager } from "./package-manager"
export { detectEnvironment } from "./environment"

import { join } from "node:path"
import type { ResolvedConfig } from "../config"
import { ADMINER_IMAGE, ADMINER_PORT, STRAPI_DEFAULT_PORT } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { renderTemplate } from "../templates"
import { writeFile } from "../utils/fs"

function extractNamedVolumes(volumes: string[]): string[] {
	return volumes
		.map((v) => v.split(":")[0])
		.filter((v) => !v.startsWith(".") && !v.startsWith("/"))
}

export async function generateCompose(config: ResolvedConfig, registry: PluginRegistry, cwd: string): Promise<void> {
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
		dbHealthTest = [
			`test: ${JSON.stringify(hc.test)}`,
		]
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

	if (config.environment === "both") {
		const devOutput = await renderTemplate("docker-compose", { ...baseContext, environment: "development" })
		await writeFile(join(cwd, "docker-compose.yml"), devOutput)

		const prodOutput = await renderTemplate("docker-compose", { ...baseContext, environment: "production" })
		await writeFile(join(cwd, "docker-compose.prod.yml"), prodOutput)
	} else {
		const output = await renderTemplate("docker-compose", { ...baseContext, environment: config.environment })
		await writeFile(join(cwd, "docker-compose.yml"), output)
	}
}

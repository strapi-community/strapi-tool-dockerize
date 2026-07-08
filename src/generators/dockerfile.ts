import { join } from "node:path"
import type { ResolvedConfig, StrapiHealthCheckOverrides } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { writeFile } from "../utils/fs"
import { renderDockerfiles, renderDockerignore } from "./render"

export async function generateDockerfiles(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
): Promise<void> {
	const files = await renderDockerfiles(config, registry, healthCheckOverrides)
	for (const file of files) {
		await writeFile(join(cwd, file.filename), file.content)
	}
}

export async function generateDockerignore(cwd: string): Promise<void> {
	const file = await renderDockerignore()
	await writeFile(join(cwd, file.filename), file.content)
}

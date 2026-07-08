import { join } from "node:path"
import type { ResolvedConfig, ResourceLimitOverrides } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { writeFile } from "../utils/fs"
import { renderComposeFiles } from "./render"

export async function generateCompose(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string,
	resourceLimits?: ResourceLimitOverrides,
): Promise<void> {
	const files = await renderComposeFiles(config, registry, resourceLimits)
	for (const file of files) {
		await writeFile(join(cwd, file.filename), file.content)
	}
}

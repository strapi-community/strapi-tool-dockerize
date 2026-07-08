import type { ResolvedConfig, ResourceLimitOverrides, StrapiHealthCheckOverrides } from "../config"
import { buildEnvVars, buildManagedSection, placeholderAppSecrets } from "../generators/env"
import {
	type GeneratedFile,
	renderComposeFiles,
	renderDatabaseConfigFiles,
	renderDockerfiles,
	renderDockerignore,
} from "../generators/render"
import type { PluginRegistry } from "../plugins/types"

export type PreviewFile = GeneratedFile

function renderEnvPreview(config: ResolvedConfig, registry: PluginRegistry): PreviewFile {
	const vars = { ...buildEnvVars(config, registry), ...placeholderAppSecrets() }
	const plugins = config.detectedPlugins ?? []
	return { filename: ".env", content: `${buildManagedSection(vars, plugins)}\n` }
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
	files.push(renderEnvPreview(config, registry))
	files.push(...renderDatabaseConfigFiles(config))

	return files
}

export function formatPreviewOutput(files: PreviewFile[]): string {
	return files.map((f) => `--- ${f.filename} ---\n${f.content}`).join("\n")
}

import { randomBytes } from "node:crypto"
import { join } from "node:path"
import type { DetectedPlugin, ResolvedConfig } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { parseEnvContent } from "../utils/env-parser"
import { fileExists, readFile, writeFile } from "../utils/fs"

const MARKER_START = "# --- Dockerize Start ---"
const MARKER_END = "# --- Dockerize End ---"

export const APP_SECRET_KEYS = [
	"APP_KEYS",
	"API_TOKEN_SALT",
	"ADMIN_JWT_SECRET",
	"TRANSFER_TOKEN_SALT",
	"JWT_SECRET",
] as const

const APP_SECRET_PLACEHOLDER = "<generated on write>"

function randomSecret(): string {
	return randomBytes(16).toString("base64")
}

function generateSecretValue(key: string): string {
	// Strapi expects APP_KEYS to be a comma-separated list of keys
	return key === "APP_KEYS" ? `${randomSecret()},${randomSecret()}` : randomSecret()
}

function splitManagedBlock(content: string): { managed: string; outside: string } {
	const startIdx = content.indexOf(MARKER_START)
	const endIdx = content.indexOf(MARKER_END)
	if (startIdx === -1 || endIdx === -1) return { managed: "", outside: content }
	const end = endIdx + MARKER_END.length
	return {
		managed: content.slice(startIdx, end),
		outside: content.slice(0, startIdx) + content.slice(end),
	}
}

// Fills in Strapi's required app secrets. Values already present outside the managed
// block (e.g. from create-strapi) are left untouched; values previously written inside
// the managed block are carried forward so re-runs stay idempotent; anything missing is
// generated fresh.
function resolveAppSecrets(existingContent: string): Record<string, string> {
	const { managed, outside } = splitManagedBlock(existingContent)
	const outsideVars = parseEnvContent(outside)
	const managedVars = parseEnvContent(managed)

	const secrets: Record<string, string> = {}
	for (const key of APP_SECRET_KEYS) {
		if (key in outsideVars) continue
		secrets[key] = managedVars[key] ?? generateSecretValue(key)
	}
	return secrets
}

export function placeholderAppSecrets(): Record<string, string> {
	return Object.fromEntries(APP_SECRET_KEYS.map((key) => [key, APP_SECRET_PLACEHOLDER]))
}

function buildPluginSection(plugins: DetectedPlugin[]): string {
	if (plugins.length === 0) return ""

	const sections: string[] = []
	for (const plugin of plugins) {
		const header = `\n# ${plugin.name}`
		const lines = Object.entries(plugin.envVars).map(([key, value]) => `${key}=${value}`)
		sections.push(`${header}\n${lines.join("\n")}`)
	}
	return sections.join("")
}

export function buildManagedSection(
	vars: Record<string, string>,
	plugins: DetectedPlugin[],
): string {
	const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`)
	const pluginSection = buildPluginSection(plugins)
	return `${MARKER_START}\n${lines.join("\n")}${pluginSection}\n${MARKER_END}`
}

export function buildEnvVars(
	config: ResolvedConfig,
	registry: PluginRegistry,
): Record<string, string> {
	const isSqlite = config.databaseClient === "sqlite"
	let vars: Record<string, string> = {}

	if (isSqlite) {
		vars.DATABASE_CLIENT = "sqlite"
		vars.DATABASE_FILENAME = ".tmp/data.db"
	} else {
		const db = registry.getDatabase(config.databaseClient)
		vars = { ...db.envVars(config) }

		if (config.useCompose) {
			vars.DATABASE_HOST = `${config.projectName}-db`
		}
	}

	const secretManager = registry.getSecretManager(config.secretBackend)
	Object.assign(vars, secretManager.envOverrides(config))
	for (const key of secretManager.envRemovals(config)) {
		delete vars[key]
	}

	return vars
}

function commentOutDuplicateKeys(content: string, managedKeys: Set<string>): string {
	const startIdx = content.indexOf(MARKER_START)
	const endIdx = content.indexOf(MARKER_END)

	const lines = content.split("\n")
	let charOffset = 0
	const managedRange =
		startIdx !== -1 && endIdx !== -1 ? { start: startIdx, end: endIdx + MARKER_END.length } : null

	return lines
		.map((line) => {
			const lineStart = charOffset
			charOffset += line.length + 1

			if (managedRange && lineStart >= managedRange.start && lineStart < managedRange.end) {
				return line
			}

			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith("#")) {
				return line
			}

			const eqIndex = trimmed.indexOf("=")
			if (eqIndex === -1) {
				return line
			}

			const key = trimmed.slice(0, eqIndex).trim()
			if (managedKeys.has(key)) {
				return `# ${line}`
			}

			return line
		})
		.join("\n")
}

export async function generateEnv(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string,
): Promise<void> {
	const envPath = join(cwd, ".env")
	const exists = await fileExists(envPath)
	const existingContent = exists ? await readFile(envPath) : ""

	const vars = { ...buildEnvVars(config, registry), ...resolveAppSecrets(existingContent) }

	const plugins = config.detectedPlugins ?? []
	const managedSection = buildManagedSection(vars, plugins)
	const pluginKeys = plugins.flatMap((p) => Object.keys(p.envVars))
	const managedKeys = new Set([...Object.keys(vars), ...pluginKeys])

	if (exists) {
		let content = existingContent
		const startIdx = content.indexOf(MARKER_START)
		const endIdx = content.indexOf(MARKER_END)

		if (startIdx !== -1 && endIdx !== -1) {
			content =
				content.slice(0, startIdx) + managedSection + content.slice(endIdx + MARKER_END.length)
		} else {
			const trimmed = content.trimEnd()
			content = trimmed ? `${trimmed}\n\n${managedSection}\n` : `${managedSection}\n`
		}

		content = commentOutDuplicateKeys(content, managedKeys)

		await writeFile(envPath, content)
	} else {
		await writeFile(envPath, `${managedSection}\n`)
	}
}

import { join } from "node:path"
import type { ResolvedConfig } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { fileExists, readFile, writeFile } from "../utils/fs"

const MARKER_START = "# --- Dockerize Start ---"
const MARKER_END = "# --- Dockerize End ---"

function buildManagedSection(vars: Record<string, string>): string {
	const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`)
	return `${MARKER_START}\n${lines.join("\n")}\n${MARKER_END}`
}

function commentOutDuplicateKeys(content: string, managedKeys: Set<string>): string {
	const startIdx = content.indexOf(MARKER_START)
	const endIdx = content.indexOf(MARKER_END)

	const lines = content.split("\n")
	let charOffset = 0
	const managedRange = startIdx !== -1 && endIdx !== -1
		? { start: startIdx, end: endIdx + MARKER_END.length }
		: null

	return lines.map((line) => {
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
	}).join("\n")
}

export async function generateEnv(config: ResolvedConfig, registry: PluginRegistry, cwd: string): Promise<void> {
	const envPath = join(cwd, ".env")
	const isSqlite = config.databaseClient === "sqlite"

	let vars: Record<string, string> = {}

	if (!isSqlite) {
		const db = registry.getDatabase(config.databaseClient)
		vars = { ...db.envVars(config) }

		if (config.useCompose) {
			vars.DATABASE_HOST = `${config.projectName}-db`
		}
	} else {
		vars.DATABASE_CLIENT = "sqlite"
		vars.DATABASE_FILENAME = ".tmp/data.db"
	}

	const managedSection = buildManagedSection(vars)
	const managedKeys = new Set(Object.keys(vars))

	if (await fileExists(envPath)) {
		let content = await readFile(envPath)
		const startIdx = content.indexOf(MARKER_START)
		const endIdx = content.indexOf(MARKER_END)

		if (startIdx !== -1 && endIdx !== -1) {
			content = content.slice(0, startIdx) + managedSection + content.slice(endIdx + MARKER_END.length)
		} else {
			content = content.trimEnd() + "\n\n" + managedSection + "\n"
		}

		content = commentOutDuplicateKeys(content, managedKeys)

		await writeFile(envPath, content)
	} else {
		await writeFile(envPath, managedSection + "\n")
	}
}

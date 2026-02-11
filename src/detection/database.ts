import { readFile } from "node:fs/promises"
import type { DatabaseClient, DetectedConfig } from "../config"
import { DEFAULT_PORTS } from "../config"
import { parseEnvFile } from "../utils"

const DEP_TO_CLIENT: Record<string, DatabaseClient> = {
	pg: "postgres",
	mysql2: "mysql",
	"better-sqlite3": "sqlite",
}

const CLIENT_REGEX = /client:\s*["']?(postgres|mysql|mariadb|sqlite)["']?/

async function detectFromEnv(cwd: string): Promise<DatabaseClient | undefined> {
	const envPaths = [".env", ".env.development", ".env.local"]
	for (const envPath of envPaths) {
		const vars = await parseEnvFile(`${cwd}/${envPath}`)
		const client = vars.DATABASE_CLIENT
		if (client) {
			const normalized = client.toLowerCase()
			if (["postgres", "mysql", "mariadb", "sqlite"].includes(normalized)) {
				return normalized as DatabaseClient
			}
		}
	}
	return undefined
}

async function detectFromConfigFiles(cwd: string): Promise<DatabaseClient | undefined> {
	const configPaths = [
		"config/database.ts",
		"config/database.js",
		"config/env/production/database.ts",
		"config/env/production/database.js",
		"config/env/development/database.ts",
		"config/env/development/database.js",
	]

	for (const configPath of configPaths) {
		try {
			const content = await readFile(`${cwd}/${configPath}`, "utf-8")
			const match = content.match(CLIENT_REGEX)
			if (match) return match[1] as DatabaseClient
		} catch {}
	}
	return undefined
}

async function detectFromDeps(cwd: string): Promise<DatabaseClient | undefined> {
	try {
		const raw = await readFile(`${cwd}/package.json`, "utf-8")
		const pkg = JSON.parse(raw)
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

		for (const [dep, client] of Object.entries(DEP_TO_CLIENT)) {
			if (allDeps[dep]) return client
		}
	} catch {
		return undefined
	}
	return undefined
}

export async function detectDatabase(cwd: string): Promise<Partial<DetectedConfig>> {
	const fromEnv = await detectFromEnv(cwd)
	if (fromEnv) return { databaseClient: fromEnv, databasePort: DEFAULT_PORTS[fromEnv] }

	const fromConfig = await detectFromConfigFiles(cwd)
	if (fromConfig) return { databaseClient: fromConfig, databasePort: DEFAULT_PORTS[fromConfig] }

	const fromDeps = await detectFromDeps(cwd)
	if (fromDeps) return { databaseClient: fromDeps, databasePort: DEFAULT_PORTS[fromDeps] }

	return {}
}

import type { DetectedConfig } from "../config"
import { parseEnvFile } from "../utils"

const DATABASE_VAR_MAP: Record<string, keyof DetectedConfig> = {
	DATABASE_HOST: "databaseHost",
	DATABASE_PORT: "databasePort",
	DATABASE_NAME: "databaseName",
	DATABASE_USERNAME: "databaseUsername",
	DATABASE_PASSWORD: "databasePassword",
}

export async function detectEnvironment(cwd: string): Promise<Partial<DetectedConfig>> {
	const envPaths = [".env", ".env.development", ".env.local"]
	const allVars: Record<string, string> = {}

	for (const envPath of envPaths) {
		const vars = await parseEnvFile(`${cwd}/${envPath}`)
		Object.assign(allVars, vars)
	}

	if (Object.keys(allVars).length === 0) return {}

	const result: Partial<DetectedConfig> = { envVars: allVars }

	for (const [envKey, configKey] of Object.entries(DATABASE_VAR_MAP)) {
		const value = allVars[envKey]
		if (!value) continue

		if (configKey === "databasePort") {
			const port = Number.parseInt(value, 10)
			if (!Number.isNaN(port)) result.databasePort = port
		} else {
			;(result as Record<string, unknown>)[configKey] = value
		}
	}

	const nodeEnv = allVars.NODE_ENV
	if (nodeEnv === "production") {
		result.environment = "production"
	} else if (nodeEnv === "development") {
		result.environment = "development"
	}

	return result
}

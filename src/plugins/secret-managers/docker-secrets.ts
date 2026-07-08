import { join } from "node:path"
import type { ResolvedConfig } from "../../config"
import { ensureDir, writeFile } from "../../utils/fs"
import type { ComposeSecret, SecretManagerPlugin } from "../types"

export const dockerSecretsManager: SecretManagerPlugin = {
	id: "docker-secrets",
	displayName: "Docker Secrets (file-based)",

	composeSecrets(config: ResolvedConfig): ComposeSecret[] {
		if (config.databaseClient === "sqlite") return []
		return [{ name: "db_password", file: "./secrets/db_password.txt" }]
	},

	serviceSecrets(config: ResolvedConfig): string[] {
		if (config.databaseClient === "sqlite") return []
		return ["db_password"]
	},

	envOverrides(config: ResolvedConfig): Record<string, string> {
		if (config.databaseClient === "sqlite") return {}
		return { DATABASE_PASSWORD_FILE: "/run/secrets/db_password" }
	},

	envRemovals(config: ResolvedConfig): string[] {
		if (config.databaseClient === "sqlite") return []
		return ["DATABASE_PASSWORD"]
	},

	async generateFiles(config: ResolvedConfig, cwd: string): Promise<string[]> {
		if (config.databaseClient === "sqlite") return []

		const secretsDir = join(cwd, "secrets")
		await ensureDir(secretsDir)

		const passwordFile = join(secretsDir, "db_password.txt")
		await writeFile(passwordFile, config.databasePassword)

		return ["secrets/db_password.txt"]
	},
}

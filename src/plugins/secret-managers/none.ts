import type { ResolvedConfig } from "../../config"
import type { ComposeSecret, SecretManagerPlugin } from "../types"

export const noneSecretManager: SecretManagerPlugin = {
	id: "none",
	displayName: "None",

	composeSecrets(_config: ResolvedConfig): ComposeSecret[] {
		return []
	},

	serviceSecrets(_config: ResolvedConfig): string[] {
		return []
	},

	envOverrides(_config: ResolvedConfig): Record<string, string> {
		return {}
	},

	envRemovals(_config: ResolvedConfig): string[] {
		return []
	},

	async generateFiles(_config: ResolvedConfig, _cwd: string): Promise<string[]> {
		return []
	},
}

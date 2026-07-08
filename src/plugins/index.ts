import type { DatabaseClient, PackageManager, SecretBackend } from "../config"
import { databasePlugins } from "./databases"
import { packageManagerPlugins } from "./package-managers"
import { secretManagerPlugins } from "./secret-managers"
import type {
	DatabasePlugin,
	PackageManagerPlugin,
	PluginRegistry,
	SecretManagerPlugin,
} from "./types"

export const pluginRegistry: PluginRegistry = {
	databases: databasePlugins,
	packageManagers: packageManagerPlugins,
	secretManagers: secretManagerPlugins,

	getDatabase(id: DatabaseClient): DatabasePlugin {
		const plugin = this.databases.get(id)
		if (!plugin) {
			throw new Error(`Unknown database client: ${id}`)
		}
		return plugin
	},

	getPackageManager(id: PackageManager): PackageManagerPlugin {
		const plugin = this.packageManagers.get(id)
		if (!plugin) {
			throw new Error(`Unknown package manager: ${id}`)
		}
		return plugin
	},

	getSecretManager(id: SecretBackend): SecretManagerPlugin {
		const plugin = this.secretManagers.get(id)
		if (!plugin) {
			throw new Error(`Unknown secret backend: ${id}`)
		}
		return plugin
	},
}

export type {
	DatabasePlugin,
	PackageManagerPlugin,
	PluginRegistry,
	SecretManagerPlugin,
} from "./types"
export type { ComposeSecret, ComposeService, HealthCheck } from "./types"

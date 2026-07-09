import type { DatabaseClient, PackageManager } from "../config"
import { databasePlugins } from "./databases"
import { packageManagerPlugins } from "./package-managers"
import type { DatabasePlugin, PackageManagerPlugin, PluginRegistry } from "./types"

export const pluginRegistry: PluginRegistry = {
	databases: databasePlugins,
	packageManagers: packageManagerPlugins,

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
}

export type { PluginRegistry } from "./types"

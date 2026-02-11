import { join } from "node:path"
import type { ResolvedConfig } from "../config"
import type { PluginRegistry } from "../plugins/types"
import { readFile } from "../utils/fs"
import { exec } from "../utils/process"

const KNOWN_DRIVER_PACKAGES = ["pg", "mysql2", "better-sqlite3"]

function parsePackageName(spec: string): string {
	const atIndex = spec.indexOf("@", 1)
	return atIndex > 0 ? spec.slice(0, atIndex) : spec
}

function getDriverForVersion(registry: PluginRegistry, config: ResolvedConfig): string {
	const dbPlugin = registry.getDatabase(config.databaseClient)
	return config.strapiVersion === "v4" ? dbPlugin.v4DriverPackage : dbPlugin.v5DriverPackage
}

function getInstalledDrivers(dependencies: Record<string, string>): Set<string> {
	const installed = new Set<string>()
	for (const pkg of KNOWN_DRIVER_PACKAGES) {
		if (pkg in dependencies) {
			installed.add(pkg)
		}
	}
	return installed
}

async function readProjectDependencies(cwd: string): Promise<Record<string, string>> {
	const raw = await readFile(join(cwd, "package.json"))
	const pkg = JSON.parse(raw) as {
		dependencies?: Record<string, string>
		devDependencies?: Record<string, string>
	}
	return { ...pkg.dependencies, ...pkg.devDependencies }
}

export async function installDatabaseDriver(
	config: ResolvedConfig,
	registry: PluginRegistry,
	cwd: string = process.cwd(),
): Promise<void> {
	const pmPlugin = registry.getPackageManager(config.packageManager)
	const targetDriver = getDriverForVersion(registry, config)
	const targetName = parsePackageName(targetDriver)
	const allDeps = await readProjectDependencies(cwd)
	const installedDrivers = getInstalledDrivers(allDeps)

	const conflicting = [...installedDrivers].filter((d) => d !== targetName)
	for (const pkg of conflicting) {
		const removeCmd = pmPlugin.removePackageCommand(pkg)
		const [cmd, ...args] = removeCmd.split(" ")
		await exec(cmd, args, { cwd })
	}

	if (!installedDrivers.has(targetName)) {
		const addCmd = pmPlugin.addPackageCommand(targetDriver)
		const [cmd, ...args] = addCmd.split(" ")
		await exec(cmd, args, { cwd })
	}
}

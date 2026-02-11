import { access } from "node:fs/promises"
import { execFile } from "node:child_process"
import type { DetectedConfig, PackageManager } from "../config"

const LOCK_FILE_ORDER: [string, PackageManager][] = [
	["bun.lockb", "bun"],
	["bun.lock", "bun"],
	["pnpm-lock.yaml", "pnpm"],
	["yarn.lock", "yarn"],
	["package-lock.json", "npm"],
]

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

function isAvailableOnPath(command: string): Promise<boolean> {
	return new Promise((resolve) => {
		execFile("which", [command], (error) => {
			resolve(!error)
		})
	})
}

async function detectFromLockFiles(cwd: string): Promise<PackageManager | undefined> {
	for (const [lockFile, pm] of LOCK_FILE_ORDER) {
		if (await fileExists(`${cwd}/${lockFile}`)) return pm
	}
	return undefined
}

async function detectFromPath(): Promise<PackageManager | undefined> {
	const managers: PackageManager[] = ["bun", "pnpm", "yarn", "npm"]
	for (const pm of managers) {
		if (await isAvailableOnPath(pm)) return pm
	}
	return undefined
}

export async function detectPackageManager(cwd: string): Promise<Partial<DetectedConfig>> {
	const fromLockFile = await detectFromLockFiles(cwd)
	if (fromLockFile) return { packageManager: fromLockFile }

	const fromPath = await detectFromPath()
	if (fromPath) return { packageManager: fromPath }

	return { packageManager: "npm" }
}

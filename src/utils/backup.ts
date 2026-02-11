import { rename } from "node:fs/promises"
import { join } from "node:path"
import { fileExists } from "./fs"

const DOCKER_FILES = ["Dockerfile", "Dockerfile.prod", "docker-compose.yml", ".dockerignore"]

export async function backupFile(filePath: string): Promise<boolean> {
	if (await fileExists(filePath)) {
		await rename(filePath, `${filePath}.bak`)
		return true
	}
	return false
}

export async function backupDockerFiles(cwd: string): Promise<string[]> {
	const backed: string[] = []
	for (const file of DOCKER_FILES) {
		const fullPath = join(cwd, file)
		if (await backupFile(fullPath)) {
			backed.push(file)
		}
	}
	return backed
}

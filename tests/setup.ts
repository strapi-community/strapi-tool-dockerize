import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

export async function createTempDir(): Promise<string> {
	return mkdtemp(join(tmpdir(), "dockerize-test-"))
}

export async function cleanupTempDir(dir: string): Promise<void> {
	await rm(dir, { recursive: true, force: true })
}

export async function createFixtureFiles(
	dir: string,
	files: Record<string, string>,
): Promise<void> {
	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(dir, filePath)
		const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"))
		await mkdir(parentDir, { recursive: true })
		await writeFile(fullPath, content, "utf-8")
	}
}

export const FIXTURES_DIR = join(import.meta.dir, "fixtures")

export function fixturePath(name: string): string {
	return join(FIXTURES_DIR, name)
}

import {
	access,
	mkdir,
	readFile as nodeReadFile,
	writeFile as nodeWriteFile,
} from "node:fs/promises"

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

export async function readFile(filePath: string): Promise<string> {
	return nodeReadFile(filePath, "utf-8")
}

export async function writeFile(filePath: string, content: string): Promise<void> {
	await nodeWriteFile(filePath, content, "utf-8")
}

export async function ensureDir(dirPath: string): Promise<void> {
	await mkdir(dirPath, { recursive: true })
}

import { readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { defineCommand } from "citty"
import pc from "picocolors"

const DOCKER_FILES = [
	"Dockerfile",
	"Dockerfile.prod",
	"docker-compose.yml",
	"docker-compose.yaml",
	"docker-compose.dev.yml",
	"docker-compose.prod.yml",
	".dockerignore",
]

const BAK_FILES = DOCKER_FILES.map((f) => `${f}.bak`)

const CONFIG_ENV_DATABASE_FILES = [
	join("config", "env", "development", "database.ts"),
	join("config", "env", "development", "database.js"),
	join("config", "env", "production", "database.ts"),
	join("config", "env", "production", "database.js"),
]

const MARKER_START = "# --- Dockerize Start ---"
const MARKER_END = "# --- Dockerize End ---"

function uncommentDatabaseKeys(content: string): string {
	return content.replace(/^# (DATABASE_\w+=.*)$/gm, "$1")
}

async function cleanEnvMarkers(cwd: string): Promise<boolean> {
	const envPath = join(cwd, ".env")
	try {
		const content = await readFile(envPath, "utf-8")
		const startIdx = content.indexOf(MARKER_START)
		const endIdx = content.indexOf(MARKER_END)
		if (startIdx === -1 || endIdx === -1) return false

		const before = content.slice(0, startIdx).trimEnd()
		const after = content.slice(endIdx + MARKER_END.length).trimStart()
		const joined = [before, after].filter(Boolean).join("\n\n")
		const cleaned = uncommentDatabaseKeys(joined)
		await writeFile(envPath, cleaned ? `${cleaned}\n` : "")
		return true
	} catch {
		return false
	}
}

async function isDirEmpty(dirPath: string): Promise<boolean> {
	try {
		const entries = await readdir(dirPath)
		return entries.length === 0
	} catch {
		return false
	}
}

async function removeEmptyDirChain(dirPath: string, stopAt: string): Promise<void> {
	let current = dirPath
	while (current !== stopAt && current.startsWith(stopAt)) {
		if (await isDirEmpty(current)) {
			try {
				await rmdir(current)
			} catch {
				break
			}
			current = join(current, "..")
			current = resolve(current)
		} else {
			break
		}
	}
}

async function removeConfigEnvDatabaseFiles(cwd: string): Promise<number> {
	let removed = 0
	for (const file of CONFIG_ENV_DATABASE_FILES) {
		try {
			await unlink(join(cwd, file))
			console.log(pc.red(`  Removed ${file}`))
			removed++
		} catch {}
	}

	if (removed > 0) {
		const devDir = join(cwd, "config", "env", "development")
		const prodDir = join(cwd, "config", "env", "production")
		const envDir = join(cwd, "config", "env")

		await removeEmptyDirChain(devDir, join(cwd, "config"))
		await removeEmptyDirChain(prodDir, join(cwd, "config"))
		await removeEmptyDirChain(envDir, join(cwd, "config"))
	}

	return removed
}

export const resetCommand = defineCommand({
	meta: {
		name: "reset",
		description: "Remove generated Docker files from the project",
	},
	args: {
		path: {
			type: "string",
			description: "Path to Strapi project",
			default: ".",
			alias: "p",
		},
		force: {
			type: "boolean",
			description: "Skip confirmation",
			default: false,
			alias: "f",
		},
	},
	async run({ args }) {
		const cwd = resolve(args.path)
		let removed = 0

		console.log(pc.bold(pc.blue("\nStrapi Dockerize - Reset\n")))

		for (const file of DOCKER_FILES) {
			try {
				await unlink(join(cwd, file))
				console.log(pc.red(`  Removed ${file}`))
				removed++
			} catch {}
		}

		for (const file of BAK_FILES) {
			try {
				await unlink(join(cwd, file))
				console.log(pc.red(`  Removed ${file}`))
				removed++
			} catch {}
		}

		if (await cleanEnvMarkers(cwd)) {
			console.log(pc.red("  Cleaned dockerize markers from .env"))
			removed++
		}

		removed += await removeConfigEnvDatabaseFiles(cwd)

		if (removed === 0) {
			console.log(pc.dim("  No Docker files found to remove."))
		} else {
			console.log(pc.green(`\n  Removed ${removed} file(s).`))
		}
		console.log()
	},
})

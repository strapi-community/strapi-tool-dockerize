import { readFile, unlink, writeFile } from "node:fs/promises"
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

		if (removed === 0) {
			console.log(pc.dim("  No Docker files found to remove."))
		} else {
			console.log(pc.green(`\n  Removed ${removed} file(s).`))
		}
		console.log()
	},
})

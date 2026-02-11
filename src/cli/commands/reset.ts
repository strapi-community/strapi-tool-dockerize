import { defineCommand } from "citty"
import { resolve, join } from "node:path"
import { unlink, readFile, writeFile, rm } from "node:fs/promises"
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

const MARKER_START = "# --- Dockerize Start ---"
const MARKER_END = "# --- Dockerize End ---"

async function cleanEnvMarkers(cwd: string): Promise<boolean> {
	const envPath = join(cwd, ".env")
	try {
		const content = await readFile(envPath, "utf-8")
		const startIdx = content.indexOf(MARKER_START)
		const endIdx = content.indexOf(MARKER_END)
		if (startIdx === -1 || endIdx === -1) return false

		const before = content.slice(0, startIdx).trimEnd()
		const after = content.slice(endIdx + MARKER_END.length).trimStart()
		const cleaned = [before, after].filter(Boolean).join("\n\n")
		await writeFile(envPath, cleaned ? `${cleaned}\n` : "")
		return true
	} catch {
		return false
	}
}

async function removeConfigEnvDir(cwd: string): Promise<boolean> {
	const configEnvDir = join(cwd, "config", "env")
	try {
		await rm(configEnvDir, { recursive: true, force: true })
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
				await unlink(`${cwd}/${file}`)
				console.log(pc.red(`  Removed ${file}`))
				removed++
			} catch {
				continue
			}
		}

		if (await cleanEnvMarkers(cwd)) {
			console.log(pc.red("  Cleaned dockerize markers from .env"))
			removed++
		}

		if (await removeConfigEnvDir(cwd)) {
			console.log(pc.red("  Removed config/env/"))
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

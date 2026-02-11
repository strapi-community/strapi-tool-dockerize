import { defineCommand } from "citty"
import { resolve } from "node:path"
import { unlink } from "node:fs/promises"
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

		if (removed === 0) {
			console.log(pc.dim("  No Docker files found to remove."))
		} else {
			console.log(pc.green(`\n  Removed ${removed} file(s).`))
		}
		console.log()
	},
})

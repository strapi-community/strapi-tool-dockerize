import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"

const target = resolve(process.argv[2] || "tmp/test-strapi")

const FILES = [
	"Dockerfile",
	"Dockerfile.prod",
	"docker-compose.yml",
	".dockerignore",
	".env",
	"config/env/development/database.ts",
	"config/env/development/database.js",
]

console.log(`\n--- Inspecting: ${target} ---\n`)

let found = 0

for (const file of FILES) {
	try {
		const content = await readFile(join(target, file), "utf-8")
		console.log(`\n${"=".repeat(60)}`)
		console.log(`  ${file}`)
		console.log(`${"=".repeat(60)}\n`)
		console.log(content)
		found++
	} catch {
		continue
	}
}

if (found === 0) {
	console.log("No generated files found.\n")
} else {
	console.log(`\n--- ${found} file(s) found ---\n`)
}

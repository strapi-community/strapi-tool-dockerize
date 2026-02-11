import { describe, expect, it } from "bun:test"
import { existsSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const srcTemplatesDir = join(
	dirname(fileURLToPath(import.meta.url)),
	"../../../src/templates/files",
)

const distTemplatesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../dist/files")

const EXPECTED_TEMPLATES = ["Dockerfile.liquid", "Dockerfile.prod.liquid", "docker-compose.liquid"]

describe("template directory resolution", () => {
	it("source templates directory exists", () => {
		expect(existsSync(srcTemplatesDir)).toBe(true)
	})

	it("source templates directory contains all expected liquid files", () => {
		const files = readdirSync(srcTemplatesDir)
		for (const template of EXPECTED_TEMPLATES) {
			expect(files).toContain(template)
		}
	})

	it("dist templates directory exists after build", () => {
		expect(existsSync(distTemplatesDir)).toBe(true)
	})

	it("dist templates directory contains all expected liquid files", () => {
		const files = readdirSync(distTemplatesDir)
		for (const template of EXPECTED_TEMPLATES) {
			expect(files).toContain(template)
		}
	})

	it("dist templates match source templates", () => {
		const srcFiles = readdirSync(srcTemplatesDir).sort()
		const distFiles = readdirSync(distTemplatesDir).sort()
		expect(distFiles).toEqual(srcFiles)
	})
})

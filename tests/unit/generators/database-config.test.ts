import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"
import { generateDatabaseConfig } from "../../../src/generators/database-config"
import { readFile } from "../../../src/utils/fs"
import { cleanupTempDir, createTempDir } from "../../setup"

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
	return {
		strapiVersion: "v5",
		projectType: "ts",
		databaseClient: "sqlite",
		packageManager: "npm",
		environment: "development",
		projectName: "test-project",
		databaseHost: "localhost",
		databasePort: 5432,
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "strapi",
		useCompose: false,
		useAdminer: false,
		isESM: false,
		envVars: {},
		...overrides,
	}
}

describe("generateDatabaseConfig", () => {
	let tmpDir: string

	beforeEach(async () => {
		tmpDir = await createTempDir()
	})

	afterEach(async () => {
		await cleanupTempDir(tmpDir)
	})

	describe("v5 ESM TS sqlite", () => {
		it("uses fileURLToPath for ESM-safe __dirname derivation", async () => {
			const config = makeConfig({ isESM: true, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			expect(content).toContain('import { fileURLToPath } from "node:url"')
			expect(content).toContain("fileURLToPath(import.meta.url)")
			expect(content).toContain("path.dirname(__filename)")
		})

		it("does not use bare __dirname without polyfill", async () => {
			const config = makeConfig({ isESM: true, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			const lines = content.split("\n")
			const dirnameLine = lines.find(
				(l) =>
					l.includes("__dirname") && !l.includes("path.dirname") && !l.includes("const __dirname"),
			)
			expect(dirnameLine).toContain("path.join(__dirname")
		})

		it("uses export default syntax", async () => {
			const config = makeConfig({ isESM: true, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			expect(content).toContain("export default")
			expect(content).not.toContain("module.exports")
		})
	})

	describe("v5 CJS TS sqlite", () => {
		it("uses bare __dirname without polyfill", async () => {
			const config = makeConfig({ isESM: false, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			expect(content).toContain("__dirname")
			expect(content).not.toContain("fileURLToPath")
			expect(content).not.toContain("import.meta.url")
		})

		it("uses import path syntax for TS", async () => {
			const config = makeConfig({ isESM: false, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			expect(content).toContain('import path from "path"')
			expect(content).not.toContain("require")
		})
	})

	describe("v5 ESM JS sqlite", () => {
		it("uses fileURLToPath for ESM-safe __dirname derivation", async () => {
			const config = makeConfig({ isESM: true, projectType: "js", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.js"))
			expect(content).toContain('import { fileURLToPath } from "node:url"')
			expect(content).toContain("fileURLToPath(import.meta.url)")
			expect(content).toContain("path.dirname(__filename)")
		})

		it("uses export default syntax", async () => {
			const config = makeConfig({ isESM: true, projectType: "js", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.js"))
			expect(content).toContain("export default")
			expect(content).not.toContain("module.exports")
		})
	})

	describe("v5 CJS JS sqlite", () => {
		it("uses require and module.exports", async () => {
			const config = makeConfig({ isESM: false, projectType: "js", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.js"))
			expect(content).toContain('const path = require("path")')
			expect(content).toContain("module.exports")
			expect(content).not.toContain("fileURLToPath")
		})
	})

	describe("v5 non-sqlite configs", () => {
		it("v5 ESM TS postgres uses export default", async () => {
			const config = makeConfig({ isESM: true, projectType: "ts", databaseClient: "postgres" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.ts"))
			expect(content).toContain("export default")
			expect(content).toContain("DATABASE_CLIENT")
			expect(content).not.toContain("__dirname")
		})

		it("v5 ESM JS postgres uses export default", async () => {
			const config = makeConfig({ isESM: true, projectType: "js", databaseClient: "postgres" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.js"))
			expect(content).toContain("export default")
			expect(content).not.toContain("module.exports")
		})

		it("v5 CJS JS postgres uses module.exports", async () => {
			const config = makeConfig({ isESM: false, projectType: "js", databaseClient: "postgres" })
			await generateDatabaseConfig(config, tmpDir)

			const content = await readFile(join(tmpDir, "config", "env", "development", "database.js"))
			expect(content).toContain("module.exports")
			expect(content).not.toContain("export default")
		})
	})
})

import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"
import { detectDatabase } from "../../../src/detection/database"
import { detectStrapi } from "../../../src/detection/strapi"
import { generateDatabaseConfig } from "../../../src/generators/database-config"
import { readFile } from "../../../src/utils/fs"
import { cleanupTempDir, createFixtureFiles, createTempDir } from "../../setup"

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

describe("ESM and MariaDB integration", () => {
	let tempDir: string

	beforeEach(async () => {
		tempDir = await createTempDir()
	})

	afterEach(async () => {
		await cleanupTempDir(tempDir)
	})

	describe("ESM detection integration", () => {
		it("detects ESM project and database together", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test-esm-postgres",
					type: "module",
					dependencies: {
						"@strapi/strapi": "^5.0.0",
						pg: "^8.0.0",
					},
				}),
				".env":
					"DATABASE_CLIENT=postgres\nDATABASE_HOST=localhost\nDATABASE_PORT=5432\nDATABASE_NAME=strapi\nDATABASE_USERNAME=strapi\nDATABASE_PASSWORD=strapi",
			})

			const strapiResult = await detectStrapi(tempDir)
			const dbResult = await detectDatabase(tempDir)

			expect(strapiResult.isESM).toBe(true)
			expect(strapiResult.strapiVersion).toBe("v5")
			expect(dbResult.databaseClient).toBe("postgres")
			expect(dbResult.databasePort).toBe(5432)
		})
	})

	describe("MariaDB detection integration", () => {
		it("detects mariadb from .env with correct port", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test-mariadb",
					dependencies: { "@strapi/strapi": "^5.0.0" },
				}),
				".env":
					"DATABASE_CLIENT=mariadb\nDATABASE_HOST=localhost\nDATABASE_PORT=3306\nDATABASE_NAME=strapi\nDATABASE_USERNAME=strapi\nDATABASE_PASSWORD=strapi",
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("mariadb")
			expect(result.databasePort).toBe(3306)
		})
	})

	describe("ESM database config generation", () => {
		it("generates fileURLToPath pattern for ESM TS sqlite", async () => {
			const config = makeConfig({ isESM: true, projectType: "ts", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tempDir)

			const content = await readFile(join(tempDir, "config", "env", "development", "database.ts"))
			expect(content).toContain("fileURLToPath")
			expect(content).toContain("import.meta.url")
		})

		it("generates fileURLToPath pattern for ESM JS sqlite", async () => {
			const config = makeConfig({ isESM: true, projectType: "js", databaseClient: "sqlite" })
			await generateDatabaseConfig(config, tempDir)

			const content = await readFile(join(tempDir, "config", "env", "development", "database.js"))
			expect(content).toContain("fileURLToPath")
			expect(content).toContain("import.meta.url")
		})
	})
})

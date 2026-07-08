import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { detectDatabase } from "../../../src/detection/database"
import { detectStrapi } from "../../../src/detection/strapi"
import { cleanupTempDir, createFixtureFiles, createTempDir } from "../../setup"

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
})

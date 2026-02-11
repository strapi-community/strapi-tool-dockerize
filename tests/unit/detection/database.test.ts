import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { detectDatabase } from "../../../src/detection/database"
import { fixturePath, createTempDir, cleanupTempDir, createFixtureFiles } from "../../setup"

describe("detectDatabase", () => {
	it("detects postgres from .env DATABASE_CLIENT", async () => {
		const result = await detectDatabase(fixturePath("strapi-v5-ts-postgres"))
		expect(result.databaseClient).toBe("postgres")
	})

	it("detects mysql from .env DATABASE_CLIENT", async () => {
		const result = await detectDatabase(fixturePath("strapi-v5-ts-mysql"))
		expect(result.databaseClient).toBe("mysql")
	})

	it("detects sqlite from package.json deps when no .env", async () => {
		const result = await detectDatabase(fixturePath("strapi-v5-js-sqlite"))
		expect(result.databaseClient).toBe("sqlite")
	})

	it("detects postgres from package.json deps when no .env", async () => {
		const result = await detectDatabase(fixturePath("strapi-v4-js-postgres"))
		expect(result.databaseClient).toBe("postgres")
	})

	it("returns empty for project without database deps", async () => {
		const result = await detectDatabase(fixturePath("empty-project"))
		expect(result.databaseClient).toBeUndefined()
	})

	describe("priority order", () => {
		let tempDir: string

		beforeEach(async () => {
			tempDir = await createTempDir()
		})

		afterEach(async () => {
			await cleanupTempDir(tempDir)
		})

		it("prefers .env over package.json deps", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test",
					dependencies: { mysql2: "^3.0.0" },
				}),
				".env": "DATABASE_CLIENT=postgres",
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("postgres")
		})

		it("falls back to config file detection", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"config/database.ts": 'client: "mysql"',
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("mysql")
		})
	})
})

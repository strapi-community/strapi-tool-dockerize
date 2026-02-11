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
		expect(result.databasePort).toBeUndefined()
	})

	describe("sets databasePort from detected client", () => {
		let tempDir: string

		beforeEach(async () => {
			tempDir = await createTempDir()
		})

		afterEach(async () => {
			await cleanupTempDir(tempDir)
		})

		it("sets port 3306 for mysql detected from deps", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test",
					dependencies: { mysql2: "^3.0.0" },
				}),
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("mysql")
			expect(result.databasePort).toBe(3306)
		})

		it("sets port 5432 for postgres detected from deps", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test",
					dependencies: { pg: "^8.0.0" },
				}),
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("postgres")
			expect(result.databasePort).toBe(5432)
		})

		it("sets port 0 for sqlite detected from deps", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({
					name: "test",
					dependencies: { "better-sqlite3": "^9.0.0" },
				}),
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("sqlite")
			expect(result.databasePort).toBe(0)
		})

		it("sets port 3306 for mysql detected from env", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				".env": "DATABASE_CLIENT=mysql",
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("mysql")
			expect(result.databasePort).toBe(3306)
		})

		it("sets port 3306 for mariadb detected from config file", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"config/database.ts": 'client: "mariadb"',
			})

			const result = await detectDatabase(tempDir)
			expect(result.databaseClient).toBe("mariadb")
			expect(result.databasePort).toBe(3306)
		})
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

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { join } from "node:path"
import { readdir, readFile } from "node:fs/promises"
import { createTempDir, cleanupTempDir, createFixtureFiles } from "../../../setup"
import { resetCommand } from "../../../../src/cli/commands/reset"

let tempDir: string

beforeEach(async () => {
	tempDir = await createTempDir()
})

afterEach(async () => {
	await cleanupTempDir(tempDir)
})

async function runReset(path: string) {
	await resetCommand.run!({ args: { path, force: true } } as any)
}

async function exists(path: string): Promise<boolean> {
	try {
		await readFile(path)
		return true
	} catch {
		return false
	}
}

async function dirExists(path: string): Promise<boolean> {
	try {
		await readdir(path)
		return true
	} catch {
		return false
	}
}

describe("reset command", () => {
	describe("config/env database file removal", () => {
		it("removes only database config files it created", async () => {
			await createFixtureFiles(tempDir, {
				"config/env/development/database.ts": "export default {}",
				"config/env/development/server.ts": "export default {}",
				"config/env/production/database.ts": "export default {}",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "config/env/development/database.ts"))).toBe(false)
			expect(await exists(join(tempDir, "config/env/production/database.ts"))).toBe(false)
			expect(await exists(join(tempDir, "config/env/development/server.ts"))).toBe(true)
		})

		it("preserves config/env directory when other files exist", async () => {
			await createFixtureFiles(tempDir, {
				"config/env/development/database.ts": "export default {}",
				"config/env/development/server.ts": "export default {}",
			})

			await runReset(tempDir)

			expect(await dirExists(join(tempDir, "config/env/development"))).toBe(true)
			expect(await dirExists(join(tempDir, "config/env"))).toBe(true)
		})

		it("removes empty directories after database file cleanup", async () => {
			await createFixtureFiles(tempDir, {
				"config/env/development/database.ts": "export default {}",
				"config/env/production/database.ts": "export default {}",
			})

			await runReset(tempDir)

			expect(await dirExists(join(tempDir, "config/env/development"))).toBe(false)
			expect(await dirExists(join(tempDir, "config/env/production"))).toBe(false)
			expect(await dirExists(join(tempDir, "config/env"))).toBe(false)
		})

		it("removes js database config files", async () => {
			await createFixtureFiles(tempDir, {
				"config/env/development/database.js": "module.exports = {}",
				"config/env/production/database.js": "module.exports = {}",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "config/env/development/database.js"))).toBe(false)
			expect(await exists(join(tempDir, "config/env/production/database.js"))).toBe(false)
		})

		it("does not touch config/env when no database files exist", async () => {
			await createFixtureFiles(tempDir, {
				"config/env/development/server.ts": "export default {}",
				"config/env/production/plugins.ts": "export default {}",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "config/env/development/server.ts"))).toBe(true)
			expect(await exists(join(tempDir, "config/env/production/plugins.ts"))).toBe(true)
			expect(await dirExists(join(tempDir, "config/env"))).toBe(true)
		})
	})

	describe("bak file cleanup", () => {
		it("removes .bak files for docker files", async () => {
			await createFixtureFiles(tempDir, {
				"Dockerfile.bak": "FROM node:18",
				"docker-compose.yml.bak": "version: '3'",
				".dockerignore.bak": "node_modules",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "Dockerfile.bak"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.yml.bak"))).toBe(false)
			expect(await exists(join(tempDir, ".dockerignore.bak"))).toBe(false)
		})

		it("removes both original and .bak files", async () => {
			await createFixtureFiles(tempDir, {
				"Dockerfile": "FROM node:18",
				"Dockerfile.bak": "FROM node:16",
				"docker-compose.yml": "version: '3'",
				"docker-compose.yml.bak": "version: '2'",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "Dockerfile"))).toBe(false)
			expect(await exists(join(tempDir, "Dockerfile.bak"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.yml"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.yml.bak"))).toBe(false)
		})

		it("removes Dockerfile.prod.bak", async () => {
			await createFixtureFiles(tempDir, {
				"Dockerfile.prod.bak": "FROM node:18",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "Dockerfile.prod.bak"))).toBe(false)
		})
	})

	describe("docker file removal", () => {
		it("removes all standard docker files", async () => {
			await createFixtureFiles(tempDir, {
				"Dockerfile": "FROM node:18",
				"Dockerfile.prod": "FROM node:18",
				"docker-compose.yml": "version: '3'",
				"docker-compose.dev.yml": "version: '3'",
				"docker-compose.prod.yml": "version: '3'",
				".dockerignore": "node_modules",
			})

			await runReset(tempDir)

			expect(await exists(join(tempDir, "Dockerfile"))).toBe(false)
			expect(await exists(join(tempDir, "Dockerfile.prod"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.yml"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.dev.yml"))).toBe(false)
			expect(await exists(join(tempDir, "docker-compose.prod.yml"))).toBe(false)
			expect(await exists(join(tempDir, ".dockerignore"))).toBe(false)
		})
	})

	describe("env marker cleanup", () => {
		it("removes dockerize markers from .env", async () => {
			const envContent = [
				"HOST=0.0.0.0",
				"PORT=1337",
				"",
				"# --- Dockerize Start ---",
				"DATABASE_CLIENT=postgres",
				"DATABASE_HOST=localhost",
				"# --- Dockerize End ---",
			].join("\n")

			await createFixtureFiles(tempDir, {
				".env": envContent,
			})

			await runReset(tempDir)

			const result = await readFile(join(tempDir, ".env"), "utf-8")
			expect(result).not.toContain("Dockerize Start")
			expect(result).not.toContain("DATABASE_CLIENT")
			expect(result).toContain("HOST=0.0.0.0")
		})

		it("uncomments commented-out DATABASE_ keys after removing markers", async () => {
			const envContent = [
				"HOST=0.0.0.0",
				"PORT=1337",
				"# DATABASE_CLIENT=sqlite",
				"# DATABASE_HOST=127.0.0.1",
				"# DATABASE_PORT=5432",
				"# DATABASE_NAME=strapi",
				"# DATABASE_USERNAME=strapi",
				"# DATABASE_PASSWORD=secret",
				"",
				"# --- Dockerize Start ---",
				"DATABASE_CLIENT=postgres",
				"DATABASE_HOST=my-db",
				"DATABASE_PORT=5432",
				"DATABASE_NAME=strapi",
				"DATABASE_USERNAME=strapi",
				"DATABASE_PASSWORD=secret",
				"# --- Dockerize End ---",
			].join("\n")

			await createFixtureFiles(tempDir, {
				".env": envContent,
			})

			await runReset(tempDir)

			const result = await readFile(join(tempDir, ".env"), "utf-8")
			expect(result).not.toContain("Dockerize Start")
			expect(result).toContain("DATABASE_CLIENT=sqlite")
			expect(result).toContain("DATABASE_HOST=127.0.0.1")
			expect(result).toContain("DATABASE_PORT=5432")
			expect(result).toContain("DATABASE_NAME=strapi")
			expect(result).toContain("DATABASE_USERNAME=strapi")
			expect(result).toContain("DATABASE_PASSWORD=secret")
			expect(result).not.toMatch(/^# DATABASE_/m)
		})

		it("preserves non-DATABASE comments when uncommenting", async () => {
			const envContent = [
				"HOST=0.0.0.0",
				"# This is a regular comment",
				"# DATABASE_CLIENT=sqlite",
				"",
				"# --- Dockerize Start ---",
				"DATABASE_CLIENT=postgres",
				"# --- Dockerize End ---",
			].join("\n")

			await createFixtureFiles(tempDir, {
				".env": envContent,
			})

			await runReset(tempDir)

			const result = await readFile(join(tempDir, ".env"), "utf-8")
			expect(result).toContain("# This is a regular comment")
			expect(result).toContain("DATABASE_CLIENT=sqlite")
			expect(result).not.toContain("# DATABASE_CLIENT")
		})

		it("handles .env with only markers and commented keys", async () => {
			const envContent = [
				"# DATABASE_CLIENT=sqlite",
				"# DATABASE_FILENAME=.tmp/data.db",
				"",
				"# --- Dockerize Start ---",
				"DATABASE_CLIENT=postgres",
				"DATABASE_FILENAME=.tmp/data.db",
				"# --- Dockerize End ---",
			].join("\n")

			await createFixtureFiles(tempDir, {
				".env": envContent,
			})

			await runReset(tempDir)

			const result = await readFile(join(tempDir, ".env"), "utf-8")
			expect(result).toContain("DATABASE_CLIENT=sqlite")
			expect(result).toContain("DATABASE_FILENAME=.tmp/data.db")
			expect(result).not.toMatch(/^# DATABASE_/m)
		})
	})
})

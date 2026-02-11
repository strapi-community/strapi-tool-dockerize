import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { detectPackageManager } from "../../../src/detection/package-manager"
import { fixturePath, createTempDir, cleanupTempDir, createFixtureFiles } from "../../setup"

describe("detectPackageManager", () => {
	it("detects pnpm from pnpm-lock.yaml", async () => {
		const result = await detectPackageManager(fixturePath("strapi-v5-pnpm"))
		expect(result.packageManager).toBe("pnpm")
	})

	it("detects bun from bun.lockb", async () => {
		const result = await detectPackageManager(fixturePath("strapi-v5-bun"))
		expect(result.packageManager).toBe("bun")
	})

	describe("lock file priority", () => {
		let tempDir: string

		beforeEach(async () => {
			tempDir = await createTempDir()
		})

		afterEach(async () => {
			await cleanupTempDir(tempDir)
		})

		it("detects npm from package-lock.json", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"package-lock.json": "{}",
			})

			const result = await detectPackageManager(tempDir)
			expect(result.packageManager).toBe("npm")
		})

		it("detects yarn from yarn.lock", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"yarn.lock": "",
			})

			const result = await detectPackageManager(tempDir)
			expect(result.packageManager).toBe("yarn")
		})

		it("prefers bun.lockb over other lock files", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"bun.lockb": "",
				"package-lock.json": "{}",
			})

			const result = await detectPackageManager(tempDir)
			expect(result.packageManager).toBe("bun")
		})

		it("prefers bun.lock over pnpm", async () => {
			await createFixtureFiles(tempDir, {
				"package.json": JSON.stringify({ name: "test" }),
				"bun.lock": "",
				"pnpm-lock.yaml": "",
			})

			const result = await detectPackageManager(tempDir)
			expect(result.packageManager).toBe("bun")
		})
	})
})

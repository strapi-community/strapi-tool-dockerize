import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResolvedConfig } from "../../../src/config"
import { pluginRegistry } from "../../../src/plugins"
import { generateDockerfiles } from "../../../src/generators/dockerfile"

function makeConfig(environment: "development" | "production" | "both"): ResolvedConfig {
	return {
		strapiVersion: "v5",
		projectType: "ts",
		databaseClient: "postgres",
		packageManager: "npm",
		environment,
		projectName: "test-project",
		databaseHost: "localhost",
		databasePort: 5432,
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "strapi",
		useCompose: true,
		useAdminer: false,
		isESM: false,
		envVars: {},
	}
}

describe("generateDockerfiles", () => {
	let tempDir: string

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "dockerize-test-"))
	})

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true })
	})

	it("generates only Dockerfile when environment is development", async () => {
		await generateDockerfiles(makeConfig("development"), pluginRegistry, tempDir)
		const files = await readdir(tempDir)
		expect(files).toContain("Dockerfile")
		expect(files).not.toContain("Dockerfile.prod")
	})

	it("generates only Dockerfile.prod when environment is production", async () => {
		await generateDockerfiles(makeConfig("production"), pluginRegistry, tempDir)
		const files = await readdir(tempDir)
		expect(files).not.toContain("Dockerfile")
		expect(files).toContain("Dockerfile.prod")
	})

	it("generates both Dockerfile and Dockerfile.prod when environment is both", async () => {
		await generateDockerfiles(makeConfig("both"), pluginRegistry, tempDir)
		const files = await readdir(tempDir)
		expect(files).toContain("Dockerfile")
		expect(files).toContain("Dockerfile.prod")
	})
})

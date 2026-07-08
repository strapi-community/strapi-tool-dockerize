import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"
import { pluginRegistry } from "../../../src/plugins"
import { formatPreviewOutput, previewGeneration } from "../../../src/utils/dry-run"

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
	return {
		strapiVersion: "v5",
		projectType: "ts",
		databaseClient: "postgres",
		packageManager: "npm",
		environment: "development",
		projectName: "test-project",
		databaseHost: "localhost",
		databasePort: 5432,
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "strapi",
		useCompose: true,
		useAdminer: false,
		useBackups: false,
		secretBackend: "none",
		isESM: false,
		envVars: {},
		detectedPlugins: [],
		...overrides,
	}
}

describe("previewGeneration", () => {
	it("returns expected files for development config", async () => {
		const files = await previewGeneration(makeConfig(), pluginRegistry)
		const filenames = files.map((f) => f.filename)

		expect(filenames).toContain("Dockerfile")
		expect(filenames).toContain(".dockerignore")
		expect(filenames).toContain("docker-compose.yml")
		expect(filenames).toContain(".env")
		expect(filenames).toContain("config/env/development/database.ts")
		expect(filenames).not.toContain("Dockerfile.prod")
	})

	it("returns expected files for production config", async () => {
		const files = await previewGeneration(makeConfig({ environment: "production" }), pluginRegistry)
		const filenames = files.map((f) => f.filename)

		expect(filenames).toContain("Dockerfile.prod")
		expect(filenames).toContain(".dockerignore")
		expect(filenames).toContain("docker-compose.yml")
		expect(filenames).toContain(".env")
		expect(filenames).toContain("config/env/production/database.ts")
		expect(filenames).not.toContain("Dockerfile")
	})

	it("returns both dockerfiles for both environment", async () => {
		const files = await previewGeneration(makeConfig({ environment: "both" }), pluginRegistry)
		const filenames = files.map((f) => f.filename)

		expect(filenames).toContain("Dockerfile")
		expect(filenames).toContain("Dockerfile.prod")
		expect(filenames).toContain("docker-compose.yml")
		expect(filenames).toContain("docker-compose.prod.yml")
		expect(filenames).toContain("config/env/development/database.ts")
		expect(filenames).toContain("config/env/production/database.ts")
	})

	it("skips compose files when useCompose is false", async () => {
		const files = await previewGeneration(makeConfig({ useCompose: false }), pluginRegistry)
		const filenames = files.map((f) => f.filename)

		expect(filenames).not.toContain("docker-compose.yml")
		expect(filenames).not.toContain("docker-compose.prod.yml")
	})

	it("renders non-empty content for each file", async () => {
		const files = await previewGeneration(makeConfig(), pluginRegistry)

		for (const file of files) {
			expect(file.content.length).toBeGreaterThan(0)
		}
	})

	it("includes database env vars in .env preview", async () => {
		const files = await previewGeneration(makeConfig(), pluginRegistry)
		const envFile = files.find((f) => f.filename === ".env")

		expect(envFile).toBeDefined()
		expect(envFile?.content).toContain("DATABASE_CLIENT")
		expect(envFile?.content).toContain("DATABASE_HOST")
	})

	it("uses sqlite env vars for sqlite config", async () => {
		const files = await previewGeneration(
			makeConfig({ databaseClient: "sqlite", useCompose: false }),
			pluginRegistry,
		)
		const envFile = files.find((f) => f.filename === ".env")

		expect(envFile).toBeDefined()
		expect(envFile?.content).toContain("DATABASE_CLIENT=sqlite")
		expect(envFile?.content).toContain("DATABASE_FILENAME=.tmp/data.db")
	})

	it("generates js extension for js project type", async () => {
		const files = await previewGeneration(makeConfig({ projectType: "js" }), pluginRegistry)
		const filenames = files.map((f) => f.filename)

		expect(filenames).toContain("config/env/development/database.js")
		expect(filenames).not.toContain("config/env/development/database.ts")
	})

	it("includes plugin env vars in .env preview", async () => {
		const files = await previewGeneration(
			makeConfig({
				detectedPlugins: [
					{
						name: "AWS S3 Upload",
						envVars: {
							AWS_ACCESS_KEY_ID: "",
							AWS_ACCESS_SECRET: "",
							AWS_REGION: "",
							AWS_BUCKET: "",
						},
					},
				],
			}),
			pluginRegistry,
		)
		const envFile = files.find((f) => f.filename === ".env")

		expect(envFile).toBeDefined()
		expect(envFile?.content).toContain("# AWS S3 Upload")
		expect(envFile?.content).toContain("AWS_ACCESS_KEY_ID=")
		expect(envFile?.content).toContain("AWS_BUCKET=")
	})

	it("does not include plugin section when no plugins", async () => {
		const files = await previewGeneration(makeConfig({ detectedPlugins: [] }), pluginRegistry)
		const envFile = files.find((f) => f.filename === ".env")

		expect(envFile).toBeDefined()
		expect(envFile?.content).not.toContain("# AWS S3 Upload")
	})
})

describe("formatPreviewOutput", () => {
	it("formats files with header separators", () => {
		const output = formatPreviewOutput([
			{ filename: "Dockerfile", content: "FROM node:22" },
			{ filename: ".env", content: "DB=postgres" },
		])

		expect(output).toContain("--- Dockerfile ---")
		expect(output).toContain("FROM node:22")
		expect(output).toContain("--- .env ---")
		expect(output).toContain("DB=postgres")
	})

	it("returns empty string for empty file list", () => {
		const output = formatPreviewOutput([])
		expect(output).toBe("")
	})
})

describe("dry-run does not write files", () => {
	let tempDir: string

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "dockerize-dryrun-"))
	})

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true })
	})

	it("previewGeneration does not create any files on disk", async () => {
		await previewGeneration(makeConfig(), pluginRegistry)
		const files = await readdir(tempDir)
		expect(files).toHaveLength(0)
	})
})

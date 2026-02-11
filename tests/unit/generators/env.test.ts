import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { join } from "node:path"
import { generateEnv } from "../../../src/generators/env"
import { pluginRegistry } from "../../../src/plugins"
import type { ResolvedConfig } from "../../../src/config"
import { createTempDir, cleanupTempDir } from "../../setup"
import { readFile, writeFile } from "../../../src/utils/fs"

const MARKER_START = "# --- Dockerize Start ---"
const MARKER_END = "# --- Dockerize End ---"

const baseConfig: ResolvedConfig = {
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
}

describe("generateEnv", () => {
	let tmpDir: string

	beforeEach(async () => {
		tmpDir = await createTempDir()
	})

	afterEach(async () => {
		await cleanupTempDir(tmpDir)
	})

	it("creates .env without leading blank lines when no .env exists", async () => {
		await generateEnv(baseConfig, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content.startsWith(MARKER_START)).toBe(true)
	})

	it("creates .env without leading blank lines when empty .env exists", async () => {
		await writeFile(join(tmpDir, ".env"), "")
		await generateEnv(baseConfig, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content.startsWith(MARKER_START)).toBe(true)
	})

	it("creates .env without leading blank lines when whitespace-only .env exists", async () => {
		await writeFile(join(tmpDir, ".env"), "  \n\n  \n")
		await generateEnv(baseConfig, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content.startsWith(MARKER_START)).toBe(true)
	})

	it("preserves existing content with proper separation", async () => {
		await writeFile(join(tmpDir, ".env"), "EXISTING_VAR=hello\n")
		await generateEnv(baseConfig, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content).toContain("EXISTING_VAR=hello")
		expect(content).toContain(MARKER_START)
		expect(content.startsWith("EXISTING_VAR=hello")).toBe(true)
	})

	it("ends with a trailing newline", async () => {
		await generateEnv(baseConfig, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content.endsWith("\n")).toBe(true)
	})
})

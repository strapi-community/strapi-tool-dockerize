import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"
import { generateEnv } from "../../../src/generators/env"
import { pluginRegistry } from "../../../src/plugins"
import { readFile, writeFile } from "../../../src/utils/fs"
import { cleanupTempDir, createTempDir } from "../../setup"

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
	secretBackend: "none",
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

	it("includes plugin env vars in managed section", async () => {
		const configWithPlugins: ResolvedConfig = {
			...baseConfig,
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
		}
		await generateEnv(configWithPlugins, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content).toContain("# AWS S3 Upload")
		expect(content).toContain("AWS_ACCESS_KEY_ID=")
		expect(content).toContain("AWS_ACCESS_SECRET=")
		expect(content).toContain("AWS_REGION=")
		expect(content).toContain("AWS_BUCKET=")
		expect(content).toContain(MARKER_START)
		expect(content).toContain(MARKER_END)
	})

	it("includes multiple plugin sections", async () => {
		const configWithPlugins: ResolvedConfig = {
			...baseConfig,
			detectedPlugins: [
				{
					name: "AWS S3 Upload",
					envVars: { AWS_ACCESS_KEY_ID: "", AWS_BUCKET: "" },
				},
				{
					name: "SendGrid Email",
					envVars: { SENDGRID_API_KEY: "" },
				},
			],
		}
		await generateEnv(configWithPlugins, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content).toContain("# AWS S3 Upload")
		expect(content).toContain("# SendGrid Email")
		expect(content).toContain("SENDGRID_API_KEY=")
	})

	it("does not include plugin section when no plugins detected", async () => {
		const configNoPlugins: ResolvedConfig = {
			...baseConfig,
			detectedPlugins: [],
		}
		await generateEnv(configNoPlugins, pluginRegistry, tmpDir)
		const content = await readFile(join(tmpDir, ".env"))
		expect(content).not.toContain("# AWS S3 Upload")
		expect(content).not.toContain("# SendGrid Email")
	})
})

import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"
import { generateEnv } from "../../../src/generators/env"
import { pluginRegistry } from "../../../src/plugins"
import { parseEnvContent } from "../../../src/utils/env-parser"
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

	describe("strapi app secrets", () => {
		it("generates all required app secrets when none exist", async () => {
			await generateEnv(baseConfig, pluginRegistry, tmpDir)
			const parsed = parseEnvContent(await readFile(join(tmpDir, ".env")))
			expect(parsed.APP_KEYS).toBeDefined()
			expect(parsed.API_TOKEN_SALT).toBeDefined()
			expect(parsed.ADMIN_JWT_SECRET).toBeDefined()
			expect(parsed.TRANSFER_TOKEN_SALT).toBeDefined()
			expect(parsed.JWT_SECRET).toBeDefined()
			expect(parsed.JWT_SECRET.length).toBeGreaterThan(0)
		})

		it("generates APP_KEYS as a comma-separated pair", async () => {
			await generateEnv(baseConfig, pluginRegistry, tmpDir)
			const parsed = parseEnvContent(await readFile(join(tmpDir, ".env")))
			expect(parsed.APP_KEYS.split(",").length).toBeGreaterThanOrEqual(2)
		})

		it("keeps the same secret values across re-runs", async () => {
			await generateEnv(baseConfig, pluginRegistry, tmpDir)
			const first = parseEnvContent(await readFile(join(tmpDir, ".env")))
			await generateEnv(baseConfig, pluginRegistry, tmpDir)
			const second = parseEnvContent(await readFile(join(tmpDir, ".env")))
			expect(second.APP_KEYS).toBe(first.APP_KEYS)
			expect(second.JWT_SECRET).toBe(first.JWT_SECRET)
			expect(second.ADMIN_JWT_SECRET).toBe(first.ADMIN_JWT_SECRET)
		})

		it("does not regenerate, relocate, or comment out secrets already in .env", async () => {
			await writeFile(join(tmpDir, ".env"), "APP_KEYS=userkey1,userkey2\nJWT_SECRET=usersecret\n")
			await generateEnv(baseConfig, pluginRegistry, tmpDir)
			const content = await readFile(join(tmpDir, ".env"))

			expect(content).toContain("APP_KEYS=userkey1,userkey2")
			expect(content).toContain("JWT_SECRET=usersecret")
			expect(content).not.toContain("# APP_KEYS=userkey1")
			expect(content).not.toContain("# JWT_SECRET=usersecret")

			const managedVars = parseEnvContent(content.slice(content.indexOf(MARKER_START)))
			expect(managedVars.APP_KEYS).toBeUndefined()
			expect(managedVars.JWT_SECRET).toBeUndefined()
			expect(managedVars.API_TOKEN_SALT).toBeDefined()
		})
	})
})

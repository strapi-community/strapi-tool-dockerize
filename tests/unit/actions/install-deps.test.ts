import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../src/config"

const realProcess = await import("../../../src/utils/process")

interface ExecCall {
	cmd: string
	args: string[]
}

const execCalls: ExecCall[] = []
const mockExec = mock((cmd: string, args: string[]) => {
	execCalls.push({ cmd, args })
	return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })
})

mock.module("../../../src/utils/process", () => ({ ...realProcess, exec: mockExec }))

const { installDatabaseDriver } = await import("../../../src/actions/install-deps")
const { pluginRegistry } = await import("../../../src/plugins")

afterAll(() => {
	mock.module("../../../src/utils/process", () => realProcess)
})

function makeConfig(): ResolvedConfig {
	return {
		strapiVersion: "v5",
		projectType: "ts",
		databaseClient: "postgres",
		packageManager: "npm",
		environment: "production",
		projectName: "my-project",
		databaseHost: "db",
		databasePort: 5432,
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "secret",
		useCompose: true,
		useAdminer: false,
		envVars: {},
	} as ResolvedConfig
}

function execStrings(): string[] {
	return execCalls.map((c) => [c.cmd, ...c.args].join(" "))
}

describe("installDatabaseDriver", () => {
	let tempDir: string

	async function writePackageJson(dependencies: Record<string, string>): Promise<void> {
		await writeFile(join(tempDir, "package.json"), JSON.stringify({ dependencies }))
	}

	beforeEach(async () => {
		execCalls.length = 0
		tempDir = await mkdtemp(join(tmpdir(), "dockerize-deps-"))
	})

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true })
	})

	it("installs the target driver when none is present", async () => {
		await writePackageJson({})
		await installDatabaseDriver(makeConfig(), pluginRegistry, tempDir)
		expect(execStrings()).toContain("npm install pg@^8.8.0")
	})

	it("selects the v4 driver version for a v4 project", async () => {
		await writePackageJson({})
		const config = makeConfig()
		config.strapiVersion = "v4"
		config.databaseClient = "mysql"
		await installDatabaseDriver(config, pluginRegistry, tempDir)
		expect(execStrings()).toContain("npm install mysql2@^3.10.0")
	})

	it("skips installation when the target driver is already present", async () => {
		await writePackageJson({ pg: "^8.8.0" })
		await installDatabaseDriver(makeConfig(), pluginRegistry, tempDir)
		expect(execCalls).toHaveLength(0)
	})

	it("removes a conflicting driver before installing the target", async () => {
		await writePackageJson({ mysql2: "^3.9.8" })
		await installDatabaseDriver(makeConfig(), pluginRegistry, tempDir)
		const strings = execStrings()
		expect(strings).toContain("npm uninstall mysql2")
		expect(strings).toContain("npm install pg@^8.8.0")
	})

	it("does not remove or reinstall when the installed driver is the target", async () => {
		await writePackageJson({ mysql2: "^3.9.8" })
		const config = makeConfig()
		config.databaseClient = "mysql"
		await installDatabaseDriver(config, pluginRegistry, tempDir)
		expect(execCalls).toHaveLength(0)
	})

	it("uses the configured package manager for install commands", async () => {
		await writePackageJson({})
		const config = makeConfig()
		config.packageManager = "pnpm"
		await installDatabaseDriver(config, pluginRegistry, tempDir)
		expect(execStrings()).toContain("pnpm add pg@^8.8.0")
	})
})

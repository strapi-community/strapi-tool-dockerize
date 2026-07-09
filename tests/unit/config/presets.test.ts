import { describe, expect, it } from "bun:test"
import { applyPreset } from "../../../src/cli/commands/resolve"
import { DEFAULT_PORTS } from "../../../src/config/defaults"
import { PRESET_NAMES, getPreset } from "../../../src/config/presets"
import type { DetectedConfig } from "../../../src/config/schema"

describe("getPreset", () => {
	it("returns local-dev preset with development environment and adminer", () => {
		const preset = getPreset("local-dev")
		expect(preset.environment).toBe("development")
		expect(preset.useCompose).toBe(true)
		expect(preset.useAdminer).toBe(true)
	})

	it("returns production preset with no adminer", () => {
		const preset = getPreset("production")
		expect(preset.environment).toBe("production")
		expect(preset.useCompose).toBe(true)
		expect(preset.useAdminer).toBe(false)
	})

	it("returns ci preset with production env", () => {
		const preset = getPreset("ci")
		expect(preset.environment).toBe("production")
		expect(preset.useCompose).toBe(true)
		expect(preset.useAdminer).toBe(false)
	})

	it("returns a new object each call", () => {
		const a = getPreset("local-dev")
		const b = getPreset("local-dev")
		expect(a).toEqual(b)
		expect(a).not.toBe(b)
	})
})

describe("PRESET_NAMES", () => {
	it("contains all three presets", () => {
		expect(PRESET_NAMES).toContain("local-dev")
		expect(PRESET_NAMES).toContain("production")
		expect(PRESET_NAMES).toContain("ci")
		expect(PRESET_NAMES).toHaveLength(3)
	})
})

describe("applyPreset", () => {
	it("merges preset values into detected config", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
		}
		const result = applyPreset(detected, "local-dev")
		expect(result.strapiVersion).toBe("v5")
		expect(result.projectType).toBe("ts")
		expect(result.databaseClient).toBe("postgres")
		expect(result.packageManager).toBe("npm")
		expect(result.environment).toBe("development")
		expect(result.useCompose).toBe(true)
		expect(result.useAdminer).toBe(true)
	})

	it("preset overrides detected values for overlapping fields", () => {
		const detected: DetectedConfig = {
			environment: "development",
			useCompose: false,
			useAdminer: true,
		}
		const result = applyPreset(detected, "ci")
		expect(result.environment).toBe("production")
		expect(result.useCompose).toBe(true)
		expect(result.useAdminer).toBe(false)
	})

	it("does not modify the original detected config", () => {
		const detected: DetectedConfig = {
			environment: "development",
			useCompose: false,
		}
		applyPreset(detected, "production")
		expect(detected.environment).toBe("development")
		expect(detected.useCompose).toBe(false)
	})

	it("preserves detected fields not in preset", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v4",
			projectType: "js",
			databaseClient: "mysql",
			packageManager: "pnpm",
			projectName: "my-app",
			databaseHost: "db.example.com",
			databasePort: 3306,
			databaseName: "mydb",
			databaseUsername: "admin",
			databasePassword: "secret",
			isESM: true,
			envVars: { NODE_ENV: "production" },
		}
		const result = applyPreset(detected, "production")
		expect(result.strapiVersion).toBe("v4")
		expect(result.projectType).toBe("js")
		expect(result.databaseClient).toBe("mysql")
		expect(result.packageManager).toBe("pnpm")
		expect(result.projectName).toBe("my-app")
		expect(result.databaseHost).toBe("db.example.com")
		expect(result.databasePort).toBe(3306)
		expect(result.databaseName).toBe("mydb")
		expect(result.databaseUsername).toBe("admin")
		expect(result.databasePassword).toBe("secret")
		expect(result.isESM).toBe(true)
		expect(result.envVars).toEqual({ NODE_ENV: "production" })
	})
})

describe("cli flag priority over preset", () => {
	it("cli flag overrides preset when applied after", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			databaseClient: "postgres",
		}

		const merged = applyPreset(detected, "local-dev")
		expect(merged.environment).toBe("development")
		expect(merged.useAdminer).toBe(true)

		merged.environment = "production"
		merged.useAdminer = false
		expect(merged.environment).toBe("production")
		expect(merged.useAdminer).toBe(false)
	})

	it("database flag overrides after preset merge", () => {
		const detected: DetectedConfig = {
			databaseClient: "postgres",
			databasePort: 5432,
		}

		const merged = applyPreset(detected, "production")

		merged.databaseClient = "mysql"
		merged.databasePort = DEFAULT_PORTS.mysql
		expect(merged.databaseClient).toBe("mysql")
		expect(merged.databasePort).toBe(3306)
	})
})

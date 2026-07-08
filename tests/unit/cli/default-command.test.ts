import { describe, expect, it } from "bun:test"
import { ZodError } from "zod"
import {
	buildDetectionSummary,
	buildHealthCheckOverrides,
	buildResourceLimitOverrides,
	formatZodErrors,
	resolveYesConfig,
	shouldWarnDatabaseDefault,
} from "../../../src/cli/commands/default"
import { DEFAULT_PORTS } from "../../../src/config/defaults"
import { resolvedConfigSchema } from "../../../src/config/schema"
import type { DatabaseClient, DetectedConfig } from "../../../src/config/schema"

describe("formatZodErrors", () => {
	it("formats a single field error with path", () => {
		let error: ZodError | undefined
		try {
			resolvedConfigSchema.parse({ strapiVersion: "v3" })
		} catch (err) {
			if (err instanceof ZodError) error = err
		}
		expect(error).toBeDefined()
		const messages = formatZodErrors(error!)
		expect(messages.length).toBeGreaterThan(0)
		const versionMsg = messages.find((m) => m.startsWith("strapiVersion:"))
		expect(versionMsg).toBeDefined()
	})

	it("formats multiple field errors", () => {
		let error: ZodError | undefined
		try {
			resolvedConfigSchema.parse({})
		} catch (err) {
			if (err instanceof ZodError) error = err
		}
		expect(error).toBeDefined()
		const messages = formatZodErrors(error!)
		expect(messages.length).toBeGreaterThan(1)
	})

	it("includes field path and message for each issue", () => {
		let error: ZodError | undefined
		try {
			resolvedConfigSchema.parse({
				strapiVersion: "v5",
				projectType: "ts",
				databaseClient: "postgres",
				packageManager: "npm",
				environment: "development",
				projectName: "",
				databaseHost: "localhost",
				databasePort: 5432,
				databaseName: "strapi",
				databaseUsername: "strapi",
				databasePassword: "strapi",
				useCompose: true,
				useAdminer: false,
				isESM: false,
				envVars: {},
			})
		} catch (err) {
			if (err instanceof ZodError) error = err
		}
		expect(error).toBeDefined()
		const messages = formatZodErrors(error!)
		expect(messages.length).toBe(1)
		expect(messages[0]).toContain("projectName")
	})

	it("returns array of strings, one per issue", () => {
		let error: ZodError | undefined
		try {
			resolvedConfigSchema.parse({
				strapiVersion: "bad",
				projectType: "bad",
			})
		} catch (err) {
			if (err instanceof ZodError) error = err
		}
		expect(error).toBeDefined()
		const messages = formatZodErrors(error!)
		expect(Array.isArray(messages)).toBe(true)
		for (const msg of messages) {
			expect(typeof msg).toBe("string")
		}
	})
})

describe("shouldWarnDatabaseDefault", () => {
	it("returns true when databaseClient is undefined", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
		}
		expect(shouldWarnDatabaseDefault(detected)).toBe(true)
	})

	it("returns false when databaseClient is set", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
		}
		expect(shouldWarnDatabaseDefault(detected)).toBe(false)
	})

	it("returns false for sqlite", () => {
		const detected: DetectedConfig = {
			databaseClient: "sqlite",
		}
		expect(shouldWarnDatabaseDefault(detected)).toBe(false)
	})

	it("returns true for empty detected config", () => {
		const detected: DetectedConfig = {}
		expect(shouldWarnDatabaseDefault(detected)).toBe(true)
	})
})

describe("buildDetectionSummary", () => {
	it("builds summary with all values detected", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "pnpm",
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | postgres | pnpm")
	})

	it("shows unknown for missing strapi version", () => {
		const detected: DetectedConfig = {
			projectType: "js",
			databaseClient: "mysql",
			packageManager: "npm",
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi unknown | js | mysql | npm")
	})

	it("shows not detected for missing database", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "yarn",
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | not detected | yarn")
	})

	it("shows unknown for all missing values", () => {
		const detected: DetectedConfig = {}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi unknown | unknown | not detected | unknown")
	})

	it("shows unknown for missing project type", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v4",
			databaseClient: "sqlite",
			packageManager: "bun",
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v4 | unknown | sqlite | bun")
	})

	it("shows unknown for missing package manager", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "mariadb",
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | mariadb | unknown")
	})

	it("includes detected plugins in summary", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
			detectedPlugins: [
				{ name: "AWS S3 Upload", envVars: { AWS_ACCESS_KEY_ID: "" } },
				{ name: "SendGrid Email", envVars: { SENDGRID_API_KEY: "" } },
			],
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | postgres | npm | plugins: AWS S3 Upload, SendGrid Email")
	})

	it("does not include plugins section when no plugins detected", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
			detectedPlugins: [],
		}
		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | postgres | npm")
	})
})

describe("yes mode port resolution", () => {
	it("uses port 3306 when mysql is auto-detected", () => {
		const detected: DetectedConfig = {
			databaseClient: "mysql",
			databasePort: 3306,
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("mysql")
		expect(config.databasePort).toBe(3306)
	})

	it("uses port 3306 when mariadb is auto-detected", () => {
		const detected: DetectedConfig = {
			databaseClient: "mariadb",
			databasePort: 3306,
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("mariadb")
		expect(config.databasePort).toBe(3306)
	})

	it("uses port 5432 when postgres is auto-detected", () => {
		const detected: DetectedConfig = {
			databaseClient: "postgres",
			databasePort: 5432,
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("postgres")
		expect(config.databasePort).toBe(5432)
	})

	it("falls back to port 3306 for mysql when detection provides no port", () => {
		const detected: DetectedConfig = {
			databaseClient: "mysql",
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("mysql")
		expect(config.databasePort).toBe(3306)
	})

	it("falls back to port 3306 for mariadb when detection provides no port", () => {
		const detected: DetectedConfig = {
			databaseClient: "mariadb",
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("mariadb")
		expect(config.databasePort).toBe(3306)
	})

	it("falls back to port 5432 for postgres when detection provides no port", () => {
		const detected: DetectedConfig = {
			databaseClient: "postgres",
		}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("postgres")
		expect(config.databasePort).toBe(5432)
	})

	it("defaults to postgres port 5432 when nothing is detected", () => {
		const detected: DetectedConfig = {}
		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("postgres")
		expect(config.databasePort).toBe(5432)
	})

	it("uses explicit database override with correct port", () => {
		const detected: DetectedConfig = {
			databaseClient: "mysql" as DatabaseClient,
		}
		detected.databasePort = DEFAULT_PORTS[detected.databaseClient!]

		const config = resolveYesConfig(detected)
		expect(config.databaseClient).toBe("mysql")
		expect(config.databasePort).toBe(3306)
	})
})

describe("detection summary reflects flag overrides", () => {
	it("shows overridden database in summary", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "sqlite",
			packageManager: "npm",
		}
		detected.databaseClient = "mysql" as DatabaseClient
		detected.databasePort = DEFAULT_PORTS[detected.databaseClient]

		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | mysql | npm")
	})

	it("shows overridden package manager in summary", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
		}
		detected.packageManager = "yarn" as DetectedConfig["packageManager"]

		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | postgres | yarn")
	})

	it("shows overridden database when originally undetected", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
		}
		detected.databaseClient = "postgres" as DatabaseClient
		detected.databasePort = DEFAULT_PORTS[detected.databaseClient]

		const summary = buildDetectionSummary(detected)
		expect(summary).toBe("strapi v5 | ts | postgres | npm")
	})
})

describe("buildResourceLimitOverrides", () => {
	it("returns undefined when no resource args provided", () => {
		const result = buildResourceLimitOverrides({})
		expect(result).toBeUndefined()
	})

	it("returns overrides with memory when --memory provided", () => {
		const result = buildResourceLimitOverrides({ memory: "4g" })
		expect(result).toEqual({ memory: "4g" })
	})

	it("returns overrides with cpus when --cpus provided", () => {
		const result = buildResourceLimitOverrides({ cpus: "0.5" })
		expect(result).toEqual({ cpus: "0.5" })
	})

	it("returns overrides with both when both provided", () => {
		const result = buildResourceLimitOverrides({ memory: "512m", cpus: "1" })
		expect(result).toEqual({ memory: "512m", cpus: "1" })
	})
})

describe("buildHealthCheckOverrides", () => {
	it("returns undefined when no health args provided", () => {
		expect(buildHealthCheckOverrides({})).toBeUndefined()
	})

	it("returns interval when --health-interval provided", () => {
		expect(buildHealthCheckOverrides({ "health-interval": "30s" })).toEqual({ interval: "30s" })
	})

	it("returns timeout when --health-timeout provided", () => {
		expect(buildHealthCheckOverrides({ "health-timeout": "10s" })).toEqual({ timeout: "10s" })
	})

	it("returns startPeriod when --health-start-period provided", () => {
		expect(buildHealthCheckOverrides({ "health-start-period": "2m" })).toEqual({
			startPeriod: "2m",
		})
	})

	it("coerces retries to a number", () => {
		const result = buildHealthCheckOverrides({ "health-retries": "10" })
		expect(result).toEqual({ retries: 10 })
		expect(typeof result?.retries).toBe("number")
	})

	it("returns all overrides when every flag is provided", () => {
		const result = buildHealthCheckOverrides({
			"health-interval": "15s",
			"health-timeout": "5s",
			"health-start-period": "40s",
			"health-retries": "3",
		})
		expect(result).toEqual({
			interval: "15s",
			timeout: "5s",
			startPeriod: "40s",
			retries: 3,
		})
	})
})

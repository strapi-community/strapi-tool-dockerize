import { describe, it, expect } from "bun:test"
import { ZodError } from "zod"
import { formatZodErrors, buildDetectionSummary } from "../../../src/cli/commands/default"
import { resolvedConfigSchema } from "../../../src/config/schema"
import type { DetectedConfig } from "../../../src/config/schema"

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
})

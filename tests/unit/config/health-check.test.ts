import { describe, expect, it } from "bun:test"
import { buildHealthCheckOverrides } from "../../../src/cli/commands/resolve"
import {
	STRAPI_HEALTH_CHECK_INTERVAL,
	STRAPI_HEALTH_CHECK_RETRIES,
	STRAPI_HEALTH_CHECK_START_PERIOD,
	STRAPI_HEALTH_CHECK_TIMEOUT,
} from "../../../src/config"
import { renderTemplate } from "../../../src/templates"

describe("health check defaults", () => {
	it("has default interval of 30s", () => {
		expect(STRAPI_HEALTH_CHECK_INTERVAL).toBe("30s")
	})

	it("has default timeout of 10s", () => {
		expect(STRAPI_HEALTH_CHECK_TIMEOUT).toBe("10s")
	})

	it("has default start period of 40s", () => {
		expect(STRAPI_HEALTH_CHECK_START_PERIOD).toBe("40s")
	})

	it("has default retries of 3", () => {
		expect(STRAPI_HEALTH_CHECK_RETRIES).toBe(3)
	})
})

describe("buildHealthCheckOverrides", () => {
	it("returns undefined when no health check args are provided", () => {
		const result = buildHealthCheckOverrides({})
		expect(result).toBeUndefined()
	})

	it("returns overrides with interval when provided", () => {
		const result = buildHealthCheckOverrides({ "health-interval": "15s" })
		expect(result).toEqual({ interval: "15s" })
	})

	it("returns overrides with timeout when provided", () => {
		const result = buildHealthCheckOverrides({ "health-timeout": "20s" })
		expect(result).toEqual({ timeout: "20s" })
	})

	it("returns overrides with start period when provided", () => {
		const result = buildHealthCheckOverrides({ "health-start-period": "60s" })
		expect(result).toEqual({ startPeriod: "60s" })
	})

	it("returns overrides with retries when provided", () => {
		const result = buildHealthCheckOverrides({ "health-retries": "5" })
		expect(result).toEqual({ retries: 5 })
	})

	it("returns all overrides when all args are provided", () => {
		const result = buildHealthCheckOverrides({
			"health-interval": "15s",
			"health-timeout": "20s",
			"health-start-period": "60s",
			"health-retries": "5",
		})
		expect(result).toEqual({
			interval: "15s",
			timeout: "20s",
			startPeriod: "60s",
			retries: 5,
		})
	})

	it("ignores unrelated args", () => {
		const result = buildHealthCheckOverrides({
			database: "postgres",
			yes: true,
			"health-interval": "10s",
		})
		expect(result).toEqual({ interval: "10s" })
	})
})

describe("dockerfile health check template rendering", () => {
	const baseContext = {
		baseImage: "node:20-alpine",
		runtimeImage: "node:20-alpine",
		pmSetupSteps: [],
		pmCopyFiles: ["package.json", "package-lock.json"],
		pmInstallStep: "npm ci",
		pmInstallStepProd: "npm ci --omit=dev",
		pmBuildStep: "npm run build",
		pmStartStep: '["npm", "start"]',
		pmDevStep: '["npm", "run", "develop"]',
		projectName: "test-project",
		strapiPort: 1337,
		healthInterval: "30s",
		healthTimeout: "10s",
		healthStartPeriod: "40s",
		healthRetries: 3,
	}

	it("renders default health check values in dev Dockerfile", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		expect(result).toContain("--interval=30s")
		expect(result).toContain("--timeout=10s")
		expect(result).toContain("--start-period=40s")
		expect(result).toContain("--retries=3")
	})

	it("renders default health check values in prod Dockerfile", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		expect(result).toContain("--interval=30s")
		expect(result).toContain("--timeout=10s")
		expect(result).toContain("--start-period=40s")
		expect(result).toContain("--retries=3")
	})

	it("renders custom health check values in dev Dockerfile", async () => {
		const customContext = {
			...baseContext,
			healthInterval: "15s",
			healthTimeout: "20s",
			healthStartPeriod: "60s",
			healthRetries: 5,
		}
		const result = await renderTemplate("Dockerfile", customContext)
		expect(result).toContain("--interval=15s")
		expect(result).toContain("--timeout=20s")
		expect(result).toContain("--start-period=60s")
		expect(result).toContain("--retries=5")
	})

	it("renders custom health check values in prod Dockerfile", async () => {
		const customContext = {
			...baseContext,
			healthInterval: "15s",
			healthTimeout: "20s",
			healthStartPeriod: "60s",
			healthRetries: 5,
		}
		const result = await renderTemplate("Dockerfile.prod", customContext)
		expect(result).toContain("--interval=15s")
		expect(result).toContain("--timeout=20s")
		expect(result).toContain("--start-period=60s")
		expect(result).toContain("--retries=5")
	})

	it("renders minute-based duration values", async () => {
		const customContext = {
			...baseContext,
			healthInterval: "1m",
			healthTimeout: "30s",
			healthStartPeriod: "2m",
			healthRetries: 10,
		}
		const result = await renderTemplate("Dockerfile", customContext)
		expect(result).toContain("--interval=1m")
		expect(result).toContain("--timeout=30s")
		expect(result).toContain("--start-period=2m")
		expect(result).toContain("--retries=10")
	})
})

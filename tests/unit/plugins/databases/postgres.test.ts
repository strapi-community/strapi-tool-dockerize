import { describe, it, expect } from "bun:test"
import { postgresPlugin } from "../../../../src/plugins/databases/postgres"
import type { ResolvedConfig } from "../../../../src/config"

const baseConfig: ResolvedConfig = {
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
}

describe("postgresPlugin", () => {
	it("has correct id and metadata", () => {
		expect(postgresPlugin.id).toBe("postgres")
		expect(postgresPlugin.displayName).toBe("PostgreSQL")
		expect(postgresPlugin.defaultPort).toBe(5432)
		expect(postgresPlugin.driverPackage).toBe("pg")
	})

	describe("composeService", () => {
		it("returns service with correct image", () => {
			const service = postgresPlugin.composeService(baseConfig)
			expect(service.image).toBe("postgres:16-alpine")
		})

		it("maps config to postgres environment vars using env substitution", () => {
			const service = postgresPlugin.composeService(baseConfig)
			expect(service.environment.POSTGRES_USER).toBe("${DATABASE_USERNAME}")
			expect(service.environment.POSTGRES_PASSWORD).toBe("${DATABASE_PASSWORD}")
			expect(service.environment.POSTGRES_DB).toBe("${DATABASE_NAME}")
		})

		it("maps port correctly", () => {
			const service = postgresPlugin.composeService(baseConfig)
			expect(service.ports).toEqual(["5432:5432"])
		})

		it("creates named volume", () => {
			const service = postgresPlugin.composeService(baseConfig)
			expect(service.volumes).toEqual(["my-project-data:/var/lib/postgresql/data"])
		})

		it("sets restart policy", () => {
			const service = postgresPlugin.composeService(baseConfig)
			expect(service.restart).toBe("unless-stopped")
		})
	})

	describe("envVars", () => {
		it("returns all database env vars", () => {
			const vars = postgresPlugin.envVars(baseConfig)
			expect(vars.DATABASE_CLIENT).toBe("postgres")
			expect(vars.DATABASE_HOST).toBe("db")
			expect(vars.DATABASE_PORT).toBe("5432")
			expect(vars.DATABASE_NAME).toBe("strapi")
			expect(vars.DATABASE_USERNAME).toBe("strapi")
			expect(vars.DATABASE_PASSWORD).toBe("secret")
		})
	})

	describe("healthcheck", () => {
		it("uses pg_isready", () => {
			const hc = postgresPlugin.healthcheck()
			expect(hc.test[0]).toBe("CMD-SHELL")
			expect(hc.test[1]).toContain("pg_isready")
		})

		it("has retry config", () => {
			const hc = postgresPlugin.healthcheck()
			expect(hc.interval).toBe("10s")
			expect(hc.timeout).toBe("5s")
			expect(hc.retries).toBe(5)
			expect(hc.startPeriod).toBe("30s")
		})
	})
})

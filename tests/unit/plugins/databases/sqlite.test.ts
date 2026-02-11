import { describe, it, expect } from "bun:test"
import { sqlitePlugin } from "../../../../src/plugins/databases/sqlite"
import type { ResolvedConfig } from "../../../../src/config"

const baseConfig: ResolvedConfig = {
	strapiVersion: "v5",
	projectType: "js",
	databaseClient: "sqlite",
	packageManager: "npm",
	environment: "production",
	projectName: "my-project",
	databaseHost: "localhost",
	databasePort: 0,
	databaseName: "strapi",
	databaseUsername: "strapi",
	databasePassword: "strapi",
	useCompose: true,
	useAdminer: false,
	envVars: {},
}

describe("sqlitePlugin", () => {
	it("has correct id and metadata", () => {
		expect(sqlitePlugin.id).toBe("sqlite")
		expect(sqlitePlugin.displayName).toBe("SQLite")
		expect(sqlitePlugin.defaultPort).toBe(0)
		expect(sqlitePlugin.driverPackage).toBe("better-sqlite3")
	})

	describe("composeService", () => {
		it("returns empty service since sqlite needs no container", () => {
			const service = sqlitePlugin.composeService(baseConfig)
			expect(service.image).toBe("")
			expect(service.ports).toEqual([])
			expect(service.volumes).toEqual([])
		})
	})

	describe("envVars", () => {
		it("returns client and filename", () => {
			const vars = sqlitePlugin.envVars(baseConfig)
			expect(vars.DATABASE_CLIENT).toBe("sqlite")
			expect(vars.DATABASE_FILENAME).toBe(".tmp/data.db")
		})

		it("does not include host/port/user/password", () => {
			const vars = sqlitePlugin.envVars(baseConfig)
			expect(vars.DATABASE_HOST).toBeUndefined()
			expect(vars.DATABASE_PORT).toBeUndefined()
			expect(vars.DATABASE_USERNAME).toBeUndefined()
			expect(vars.DATABASE_PASSWORD).toBeUndefined()
		})
	})

	describe("healthcheck", () => {
		it("returns empty healthcheck", () => {
			const hc = sqlitePlugin.healthcheck()
			expect(hc.test).toEqual([])
			expect(hc.retries).toBe(0)
		})
	})
})

import { describe, it, expect } from "bun:test"
import { mysqlPlugin } from "../../../../src/plugins/databases/mysql"
import type { ResolvedConfig } from "../../../../src/config"

const baseConfig: ResolvedConfig = {
	strapiVersion: "v5",
	projectType: "ts",
	databaseClient: "mysql",
	packageManager: "npm",
	environment: "production",
	projectName: "my-project",
	databaseHost: "db",
	databasePort: 3306,
	databaseName: "strapi",
	databaseUsername: "strapi",
	databasePassword: "secret",
	useCompose: true,
	useAdminer: false,
	envVars: {},
}

describe("mysqlPlugin", () => {
	it("has correct id and metadata", () => {
		expect(mysqlPlugin.id).toBe("mysql")
		expect(mysqlPlugin.displayName).toBe("MySQL")
		expect(mysqlPlugin.defaultPort).toBe(3306)
		expect(mysqlPlugin.driverPackage).toBe("mysql2")
	})

	describe("composeService", () => {
		it("returns service with correct image", () => {
			const service = mysqlPlugin.composeService(baseConfig)
			expect(service.image).toBe("mysql:8.4")
		})

		it("maps config to mysql environment vars", () => {
			const service = mysqlPlugin.composeService(baseConfig)
			expect(service.environment.MYSQL_ROOT_PASSWORD).toBe("secret")
			expect(service.environment.MYSQL_DATABASE).toBe("strapi")
			expect(service.environment.MYSQL_USER).toBe("strapi")
			expect(service.environment.MYSQL_PASSWORD).toBe("secret")
		})

		it("maps port correctly", () => {
			const service = mysqlPlugin.composeService(baseConfig)
			expect(service.ports).toEqual(["3306:3306"])
		})

		it("creates named volume", () => {
			const service = mysqlPlugin.composeService(baseConfig)
			expect(service.volumes).toEqual(["my-project-data:/var/lib/mysql"])
		})
	})

	describe("envVars", () => {
		it("returns all database env vars", () => {
			const vars = mysqlPlugin.envVars(baseConfig)
			expect(vars.DATABASE_CLIENT).toBe("mysql")
			expect(vars.DATABASE_HOST).toBe("db")
			expect(vars.DATABASE_PORT).toBe("3306")
			expect(vars.DATABASE_NAME).toBe("strapi")
			expect(vars.DATABASE_USERNAME).toBe("strapi")
			expect(vars.DATABASE_PASSWORD).toBe("secret")
		})
	})

	describe("healthcheck", () => {
		it("uses mysqladmin ping", () => {
			const hc = mysqlPlugin.healthcheck()
			expect(hc.test[0]).toBe("CMD-SHELL")
			expect(hc.test[1]).toContain("mysqladmin ping")
		})

		it("has retry config", () => {
			const hc = mysqlPlugin.healthcheck()
			expect(hc.interval).toBe("10s")
			expect(hc.timeout).toBe("5s")
			expect(hc.retries).toBe(5)
		})
	})
})

import { describe, expect, it } from "bun:test"
import type { ResolvedConfig } from "../../../../src/config"
import { mariadbPlugin } from "../../../../src/plugins/databases/mariadb"

const baseConfig: ResolvedConfig = {
	strapiVersion: "v5",
	projectType: "ts",
	databaseClient: "mariadb",
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

describe("mariadbPlugin", () => {
	it("has correct id and metadata", () => {
		expect(mariadbPlugin.id).toBe("mariadb")
		expect(mariadbPlugin.displayName).toBe("MariaDB")
		expect(mariadbPlugin.defaultPort).toBe(3306)
		expect(mariadbPlugin.driverPackage).toBe("mysql2")
	})

	it("uses the mysql strapi client", () => {
		expect(mariadbPlugin.strapiClient).toBe("mysql")
	})

	it("pins driver versions for each strapi version", () => {
		expect(mariadbPlugin.v4DriverPackage).toBe("mysql2@^3.10.0")
		expect(mariadbPlugin.v5DriverPackage).toBe("mysql2@^3.9.8")
	})

	describe("composeService", () => {
		it("returns service with correct image", () => {
			const service = mariadbPlugin.composeService(baseConfig)
			expect(service.image).toBe("mariadb:11")
		})

		it("maps config to mariadb environment vars using env substitution", () => {
			const service = mariadbPlugin.composeService(baseConfig)
			expect(service.environment.MARIADB_ROOT_PASSWORD).toBe("${DATABASE_PASSWORD}")
			expect(service.environment.MARIADB_DATABASE).toBe("${DATABASE_NAME}")
			expect(service.environment.MARIADB_USER).toBe("${DATABASE_USERNAME}")
			expect(service.environment.MARIADB_PASSWORD).toBe("${DATABASE_PASSWORD}")
		})

		it("maps port correctly", () => {
			const service = mariadbPlugin.composeService(baseConfig)
			expect(service.ports).toEqual(["3306:3306"])
		})

		it("creates named volume", () => {
			const service = mariadbPlugin.composeService(baseConfig)
			expect(service.volumes).toEqual(["my-project-data:/var/lib/mysql"])
		})

		it("sets restart policy", () => {
			const service = mariadbPlugin.composeService(baseConfig)
			expect(service.restart).toBe("unless-stopped")
		})
	})

	describe("envVars", () => {
		it("returns all database env vars with the mysql client", () => {
			const vars = mariadbPlugin.envVars(baseConfig)
			expect(vars.DATABASE_CLIENT).toBe("mysql")
			expect(vars.DATABASE_HOST).toBe("db")
			expect(vars.DATABASE_PORT).toBe("3306")
			expect(vars.DATABASE_NAME).toBe("strapi")
			expect(vars.DATABASE_USERNAME).toBe("strapi")
			expect(vars.DATABASE_PASSWORD).toBe("secret")
		})
	})

	describe("healthcheck", () => {
		it("uses the mariadb healthcheck script", () => {
			const hc = mariadbPlugin.healthcheck()
			expect(hc.test[0]).toBe("CMD-SHELL")
			expect(hc.test[1]).toContain("healthcheck.sh")
		})

		it("has retry config", () => {
			const hc = mariadbPlugin.healthcheck()
			expect(hc.interval).toBe("10s")
			expect(hc.timeout).toBe("5s")
			expect(hc.retries).toBe(5)
			expect(hc.startPeriod).toBe("30s")
		})
	})
})

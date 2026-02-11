import { describe, expect, it } from "bun:test"
import { renderTemplate } from "../../../src/templates"

const baseContext = {
	projectName: "my-project",
	strapiPort: 1337,
	environment: "development",
	lockFile: "package-lock.json",
	useAdminer: false,
	adminerImage: "adminer:latest",
	adminerPort: 8888,
	dbImage: "",
	dbEnvironment: [],
	dbPorts: [],
	dbVolumes: [],
	dbHealthTest: [],
	dbHealthInterval: "",
	dbHealthTimeout: "",
	dbHealthRetries: 0,
	dbHealthStartPeriod: "",
	namedVolumes: [],
}

function sqliteContext(overrides = {}) {
	return {
		...baseContext,
		databaseClient: "sqlite",
		...overrides,
	}
}

function postgresContext(overrides = {}) {
	return {
		...baseContext,
		databaseClient: "postgres",
		dbImage: "postgres:16-alpine",
		dbEnvironment: [
			{ key: "POSTGRES_USER", value: "${DATABASE_USERNAME}" },
			{ key: "POSTGRES_PASSWORD", value: "${DATABASE_PASSWORD}" },
			{ key: "POSTGRES_DB", value: "${DATABASE_NAME}" },
		],
		dbPorts: ["5432:5432"],
		dbVolumes: ["my-project-data:/var/lib/postgresql/data"],
		dbHealthTest: ['test: ["CMD-SHELL","pg_isready -U strapi"]'],
		dbHealthInterval: "10s",
		dbHealthTimeout: "5s",
		dbHealthRetries: 5,
		dbHealthStartPeriod: "30s",
		namedVolumes: ["my-project-data"],
		...overrides,
	}
}

function mysqlContext(overrides = {}) {
	return {
		...baseContext,
		databaseClient: "mysql",
		dbImage: "mysql:8.4",
		dbEnvironment: [
			{ key: "MYSQL_ROOT_PASSWORD", value: "${DATABASE_PASSWORD}" },
			{ key: "MYSQL_DATABASE", value: "${DATABASE_NAME}" },
			{ key: "MYSQL_USER", value: "${DATABASE_USERNAME}" },
			{ key: "MYSQL_PASSWORD", value: "${DATABASE_PASSWORD}" },
		],
		dbPorts: ["3306:3306"],
		dbVolumes: ["my-project-data:/var/lib/mysql"],
		dbHealthTest: ['test: ["CMD-SHELL","mysqladmin ping -h localhost"]'],
		dbHealthInterval: "10s",
		dbHealthTimeout: "5s",
		dbHealthRetries: 5,
		dbHealthStartPeriod: "",
		namedVolumes: ["my-project-data"],
		...overrides,
	}
}

describe("docker-compose template", () => {
	describe("sqlite", () => {
		it("does not include networks section", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).not.toContain("networks:")
			expect(output).not.toContain("driver: bridge")
		})

		it("does not include network references on strapi service", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).not.toContain("my-project-network")
		})

		it("includes strapi-data volume for sqlite", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).toContain("strapi-data:/opt/app/.tmp")
			expect(output).toContain("strapi-data:")
		})

		it("does not include database service", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).not.toContain("my-project-db:")
		})
	})

	describe("postgres", () => {
		it("includes networks section with bridge driver", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			expect(output).toContain("networks:")
			expect(output).toContain("my-project-network:")
			expect(output).toContain("driver: bridge")
		})

		it("includes network references on strapi service", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			const lines = output.split("\n")
			const dbServiceLine = lines.findIndex(
				(l: string) => /^\s{2}\S/.test(l) && l.includes("my-project-db:"),
			)
			const strapiSection = lines.slice(0, dbServiceLine).join("\n")
			expect(strapiSection).toContain("- my-project-network")
		})

		it("includes network references on database service", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			const lines = output.split("\n")
			const dbServiceLine = lines.findIndex(
				(l: string) => /^\s{2}\S/.test(l) && l.includes("my-project-db:"),
			)
			const dbSection = lines.slice(dbServiceLine).join("\n")
			expect(dbSection).toContain("- my-project-network")
		})

		it("includes database service", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			expect(output).toContain("my-project-db:")
			expect(output).toContain("postgres:16-alpine")
		})
	})

	describe("mysql", () => {
		it("includes networks section with bridge driver", async () => {
			const output = await renderTemplate("docker-compose", mysqlContext())
			expect(output).toContain("networks:")
			expect(output).toContain("my-project-network:")
			expect(output).toContain("driver: bridge")
		})

		it("includes network references on services", async () => {
			const output = await renderTemplate("docker-compose", mysqlContext())
			expect(output).toContain("- my-project-network")
		})

		it("includes database service", async () => {
			const output = await renderTemplate("docker-compose", mysqlContext())
			expect(output).toContain("my-project-db:")
			expect(output).toContain("mysql:8.4")
		})
	})

	describe("environment-specific compose files", () => {
		it("generates docker-compose.yml for development environment", async () => {
			const output = await renderTemplate(
				"docker-compose",
				sqliteContext({ environment: "development" }),
			)
			expect(output).toContain("dockerfile: Dockerfile")
			expect(output).not.toContain("Dockerfile.prod")
		})

		it("generates docker-compose.prod.yml for production environment", async () => {
			const output = await renderTemplate(
				"docker-compose",
				sqliteContext({ environment: "production" }),
			)
			expect(output).toContain("dockerfile: Dockerfile.prod")
		})

		it("generates both docker-compose.yml and docker-compose.prod.yml for both environment", async () => {
			const devOutput = await renderTemplate(
				"docker-compose",
				sqliteContext({ environment: "development" }),
			)
			const prodOutput = await renderTemplate(
				"docker-compose",
				sqliteContext({ environment: "production" }),
			)
			expect(devOutput).toContain("dockerfile: Dockerfile")
			expect(devOutput).not.toContain("Dockerfile.prod")
			expect(prodOutput).toContain("dockerfile: Dockerfile.prod")
		})

		it("docker-compose.yml references Dockerfile for development", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({ environment: "development" }),
			)
			expect(output).toContain("dockerfile: Dockerfile")
			expect(output).not.toContain("Dockerfile.prod")
		})

		it("docker-compose.prod.yml references Dockerfile.prod for production", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({ environment: "production" }),
			)
			expect(output).toContain("dockerfile: Dockerfile.prod")
		})

		it("both compose files have correct volume mounts", async () => {
			const devOutput = await renderTemplate(
				"docker-compose",
				postgresContext({ environment: "development" }),
			)
			expect(devOutput).toContain("./config:/opt/app/config")
			expect(devOutput).toContain("./src:/opt/app/src")
			expect(devOutput).toContain("./package.json:/opt/app/package.json")
			expect(devOutput).toContain("./package-lock.json:/opt/app/package-lock.json")

			const prodOutput = await renderTemplate(
				"docker-compose",
				postgresContext({ environment: "production" }),
			)
			expect(prodOutput).not.toContain("./config:/opt/app/config")
			expect(prodOutput).not.toContain("./src:/opt/app/src")
			expect(prodOutput).not.toContain("./package.json:/opt/app/package.json")
		})
	})
})

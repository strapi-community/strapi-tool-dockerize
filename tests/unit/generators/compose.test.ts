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
	secrets: [],
	serviceSecrets: [],
	hasSecrets: false,
	useBackups: false,
	backupImage: "",
	backupSchedule: "0 2 * * *",
	backupRetentionDays: 7,
	memoryLimit: "2g",
	cpuLimit: "2",
	dbMemoryLimit: "1g",
	dbCpuLimit: "1",
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

	describe("secrets", () => {
		it("includes secrets section when hasSecrets is true", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					hasSecrets: true,
					secrets: [{ name: "db_password", file: "./secrets/db_password.txt" }],
					serviceSecrets: ["db_password"],
				}),
			)
			expect(output).toContain("secrets:")
			expect(output).toContain("db_password:")
			expect(output).toContain("file: ./secrets/db_password.txt")
			expect(output).toContain("- db_password")
		})

		it("does not include secrets section when hasSecrets is false", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					hasSecrets: false,
					secrets: [],
					serviceSecrets: [],
				}),
			)
			expect(output).not.toContain("secrets:")
			expect(output).not.toContain("db_password")
		})

		it("does not include secrets for development even with hasSecrets", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "development",
					hasSecrets: false,
					secrets: [],
					serviceSecrets: [],
				}),
			)
			expect(output).not.toContain("secrets:")
		})
	})

	describe("resource limits", () => {
		it("includes deploy.resources on strapi service for sqlite", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).toContain("deploy:")
			expect(output).toContain("resources:")
			expect(output).toContain("memory: 2g")
			expect(output).toContain('cpus: "2"')
		})

		it("includes deploy.resources on strapi service for postgres", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			const lines = output.split("\n")
			const dbServiceLine = lines.findIndex(
				(l: string) => /^\s{2}\S/.test(l) && l.includes("my-project-db:"),
			)
			const strapiSection = lines.slice(0, dbServiceLine).join("\n")
			expect(strapiSection).toContain("memory: 2g")
			expect(strapiSection).toContain('cpus: "2"')
		})

		it("includes deploy.resources on database service", async () => {
			const output = await renderTemplate("docker-compose", postgresContext())
			const lines = output.split("\n")
			const dbServiceLine = lines.findIndex(
				(l: string) => /^\s{2}\S/.test(l) && l.includes("my-project-db:"),
			)
			const dbSection = lines.slice(dbServiceLine).join("\n")
			expect(dbSection).toContain("memory: 1g")
			expect(dbSection).toContain('cpus: "1"')
		})

		it("uses custom resource limits when provided", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					memoryLimit: "4g",
					cpuLimit: "4",
					dbMemoryLimit: "2g",
					dbCpuLimit: "2",
				}),
			)
			const lines = output.split("\n")
			const dbServiceLine = lines.findIndex(
				(l: string) => /^\s{2}\S/.test(l) && l.includes("my-project-db:"),
			)
			const strapiSection = lines.slice(0, dbServiceLine).join("\n")
			const dbSection = lines.slice(dbServiceLine).join("\n")
			expect(strapiSection).toContain("memory: 4g")
			expect(strapiSection).toContain('cpus: "4"')
			expect(dbSection).toContain("memory: 2g")
			expect(dbSection).toContain('cpus: "2"')
		})

		it("does not include db resource limits for sqlite", async () => {
			const output = await renderTemplate("docker-compose", sqliteContext())
			expect(output).not.toContain("memory: 1g")
		})
	})

	describe("backup sidecar", () => {
		it("includes backup service for postgres production with backups enabled", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					useBackups: true,
					backupImage: "prodrigestivill/postgres-backup-local:16",
				}),
			)
			expect(output).toContain("my-project-backup:")
			expect(output).toContain("prodrigestivill/postgres-backup-local:16")
			expect(output).toContain("POSTGRES_HOST: my-project-db")
			expect(output).toContain("POSTGRES_DB: ${DATABASE_NAME}")
			expect(output).toContain("POSTGRES_USER: ${DATABASE_USERNAME}")
			expect(output).toContain("POSTGRES_PASSWORD: ${DATABASE_PASSWORD}")
			expect(output).toContain("SCHEDULE: 0 2 * * *")
			expect(output).toContain("BACKUP_KEEP_DAYS: 7")
			expect(output).toContain("my-project-backups:/backups")
		})

		it("includes backup service for mysql production with backups enabled", async () => {
			const output = await renderTemplate(
				"docker-compose",
				mysqlContext({
					environment: "production",
					useBackups: true,
					backupImage: "databack/mysql-backup:latest",
				}),
			)
			expect(output).toContain("my-project-backup:")
			expect(output).toContain("databack/mysql-backup:latest")
			expect(output).toContain("DB_SERVER: my-project-db")
			expect(output).toContain("DB_USER: ${DATABASE_USERNAME}")
			expect(output).toContain("DB_PASS: ${DATABASE_PASSWORD}")
			expect(output).toContain("DB_NAMES: ${DATABASE_NAME}")
			expect(output).toContain("DB_DUMP_CRON: 0 2 * * *")
			expect(output).toContain("RETENTION: 7d")
			expect(output).toContain("my-project-backups:/backups")
		})

		it("does not include backup service when useBackups is false", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					useBackups: false,
				}),
			)
			expect(output).not.toContain("my-project-backup:")
			expect(output).not.toContain("my-project-backups:")
		})

		it("does not include backup service for development environment", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "development",
					useBackups: true,
					backupImage: "prodrigestivill/postgres-backup-local:16",
				}),
			)
			expect(output).not.toContain("my-project-backup:")
			expect(output).not.toContain("my-project-backups:")
		})

		it("does not include backup service for sqlite", async () => {
			const output = await renderTemplate(
				"docker-compose",
				sqliteContext({
					environment: "production",
					useBackups: true,
				}),
			)
			expect(output).not.toContain("my-project-backup:")
			expect(output).not.toContain("my-project-backups:")
		})

		it("includes backup volume in named volumes section", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					useBackups: true,
					backupImage: "prodrigestivill/postgres-backup-local:16",
				}),
			)
			const topLevelVolumes = output.split(/^volumes:/m)[1]
			expect(topLevelVolumes).toContain("my-project-backups:")
		})

		it("does not include backup volume when backups disabled", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					useBackups: false,
				}),
			)
			expect(output).not.toContain("my-project-backups:")
		})

		it("backup service depends on healthy db", async () => {
			const output = await renderTemplate(
				"docker-compose",
				postgresContext({
					environment: "production",
					useBackups: true,
					backupImage: "prodrigestivill/postgres-backup-local:16",
				}),
			)
			const backupSection = output.split("my-project-backup:")[1]
			expect(backupSection).toContain("depends_on:")
			expect(backupSection).toContain("my-project-db:")
			expect(backupSection).toContain("condition: service_healthy")
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

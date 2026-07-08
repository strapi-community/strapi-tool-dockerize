import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { join } from "node:path"
import type { ResolvedConfig } from "../../../../src/config"
import { dockerSecretsManager } from "../../../../src/plugins/secret-managers/docker-secrets"
import { fileExists, readFile } from "../../../../src/utils/fs"
import { cleanupTempDir, createTempDir } from "../../../setup"

const postgresConfig: ResolvedConfig = {
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
	databasePassword: "supersecret",
	useCompose: true,
	useAdminer: false,
	secretBackend: "docker-secrets",
	isESM: false,
	envVars: {},
}

const sqliteConfig: ResolvedConfig = {
	...postgresConfig,
	databaseClient: "sqlite",
	databasePort: 0,
	secretBackend: "docker-secrets",
}

describe("dockerSecretsManager", () => {
	it("has correct id and display name", () => {
		expect(dockerSecretsManager.id).toBe("docker-secrets")
		expect(dockerSecretsManager.displayName).toBe("Docker Secrets (file-based)")
	})

	describe("composeSecrets", () => {
		it("returns db_password secret for postgres", () => {
			const secrets = dockerSecretsManager.composeSecrets(postgresConfig)
			expect(secrets).toEqual([{ name: "db_password", file: "./secrets/db_password.txt" }])
		})

		it("returns empty for sqlite", () => {
			expect(dockerSecretsManager.composeSecrets(sqliteConfig)).toEqual([])
		})
	})

	describe("serviceSecrets", () => {
		it("returns db_password for postgres", () => {
			expect(dockerSecretsManager.serviceSecrets(postgresConfig)).toEqual(["db_password"])
		})

		it("returns empty for sqlite", () => {
			expect(dockerSecretsManager.serviceSecrets(sqliteConfig)).toEqual([])
		})
	})

	describe("envOverrides", () => {
		it("returns DATABASE_PASSWORD_FILE for postgres", () => {
			const overrides = dockerSecretsManager.envOverrides(postgresConfig)
			expect(overrides).toEqual({ DATABASE_PASSWORD_FILE: "/run/secrets/db_password" })
		})

		it("returns empty for sqlite", () => {
			expect(dockerSecretsManager.envOverrides(sqliteConfig)).toEqual({})
		})
	})

	describe("envRemovals", () => {
		it("removes the plaintext DATABASE_PASSWORD for postgres", () => {
			expect(dockerSecretsManager.envRemovals(postgresConfig)).toEqual(["DATABASE_PASSWORD"])
		})

		it("returns empty for sqlite", () => {
			expect(dockerSecretsManager.envRemovals(sqliteConfig)).toEqual([])
		})
	})

	describe("generateFiles", () => {
		let tmpDir: string

		beforeEach(async () => {
			tmpDir = await createTempDir()
		})

		afterEach(async () => {
			await cleanupTempDir(tmpDir)
		})

		it("creates secrets directory and password file for postgres", async () => {
			const files = await dockerSecretsManager.generateFiles(postgresConfig, tmpDir)
			expect(files).toEqual(["secrets/db_password.txt"])

			const passwordFile = join(tmpDir, "secrets", "db_password.txt")
			expect(await fileExists(passwordFile)).toBe(true)

			const content = await readFile(passwordFile)
			expect(content).toBe("supersecret")
		})

		it("generates no files for sqlite", async () => {
			const files = await dockerSecretsManager.generateFiles(sqliteConfig, tmpDir)
			expect(files).toEqual([])
		})
	})
})

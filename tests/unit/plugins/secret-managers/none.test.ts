import { describe, expect, it } from "bun:test"
import type { ResolvedConfig } from "../../../../src/config"
import { noneSecretManager } from "../../../../src/plugins/secret-managers/none"

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
	secretBackend: "none",
	isESM: false,
	envVars: {},
}

describe("noneSecretManager", () => {
	it("has correct id and display name", () => {
		expect(noneSecretManager.id).toBe("none")
		expect(noneSecretManager.displayName).toBe("None")
	})

	it("returns empty compose secrets", () => {
		expect(noneSecretManager.composeSecrets(baseConfig)).toEqual([])
	})

	it("returns empty service secrets", () => {
		expect(noneSecretManager.serviceSecrets(baseConfig)).toEqual([])
	})

	it("returns empty env overrides", () => {
		expect(noneSecretManager.envOverrides(baseConfig)).toEqual({})
	})

	it("generates no files", async () => {
		const files = await noneSecretManager.generateFiles(baseConfig, "/tmp/test")
		expect(files).toEqual([])
	})
})

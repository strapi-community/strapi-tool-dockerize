import { describe, it, expect } from "bun:test"
import { detectAll } from "../../src/detection"
import { fixturePath } from "../setup"

describe("detectAll", () => {
	it("detects full config for strapi v5 typescript postgres project", async () => {
		const config = await detectAll(fixturePath("strapi-v5-ts-postgres"))

		expect(config.strapiVersion).toBe("v5")
		expect(config.projectType).toBe("ts")
		expect(config.databaseClient).toBe("postgres")
		expect(config.projectName).toBe("my-strapi-v5-ts-postgres")
		expect(config.databaseHost).toBe("localhost")
		expect(config.databasePort).toBe(5432)
		expect(config.databaseName).toBe("strapi")
		expect(config.databaseUsername).toBe("strapi")
		expect(config.databasePassword).toBe("strapi")
		expect(config.envVars).toBeDefined()
		expect(config.envVars?.DATABASE_CLIENT).toBe("postgres")
	})

	it("detects full config for strapi v5 typescript mysql project", async () => {
		const config = await detectAll(fixturePath("strapi-v5-ts-mysql"))

		expect(config.strapiVersion).toBe("v5")
		expect(config.projectType).toBe("ts")
		expect(config.databaseClient).toBe("mysql")
		expect(config.databaseHost).toBe("localhost")
		expect(config.databasePort).toBe(3306)
	})

	it("detects strapi v5 javascript sqlite project", async () => {
		const config = await detectAll(fixturePath("strapi-v5-js-sqlite"))

		expect(config.strapiVersion).toBe("v5")
		expect(config.projectType).toBe("js")
		expect(config.databaseClient).toBe("sqlite")
	})

	it("detects strapi v4 javascript postgres project", async () => {
		const config = await detectAll(fixturePath("strapi-v4-js-postgres"))

		expect(config.strapiVersion).toBe("v4")
		expect(config.projectType).toBe("js")
		expect(config.databaseClient).toBe("postgres")
	})

	it("detects pnpm package manager", async () => {
		const config = await detectAll(fixturePath("strapi-v5-pnpm"))
		expect(config.packageManager).toBe("pnpm")
	})

	it("detects bun package manager", async () => {
		const config = await detectAll(fixturePath("strapi-v5-bun"))
		expect(config.packageManager).toBe("bun")
	})

	it("returns minimal config for empty project", async () => {
		const config = await detectAll(fixturePath("empty-project"))

		expect(config.strapiVersion).toBeUndefined()
		expect(config.databaseClient).toBeUndefined()
		expect(config.projectName).toBe("empty-project")
	})
})

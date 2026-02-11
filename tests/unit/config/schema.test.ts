import { describe, expect, it } from "bun:test"
import {
	databaseClientSchema,
	detectedConfigSchema,
	environmentSchema,
	packageManagerSchema,
	projectTypeSchema,
	resolvedConfigSchema,
	strapiVersionSchema,
} from "../../../src/config/schema"

describe("databaseClientSchema", () => {
	it("accepts valid database clients", () => {
		expect(databaseClientSchema.parse("postgres")).toBe("postgres")
		expect(databaseClientSchema.parse("mysql")).toBe("mysql")
		expect(databaseClientSchema.parse("mariadb")).toBe("mariadb")
		expect(databaseClientSchema.parse("sqlite")).toBe("sqlite")
	})

	it("rejects invalid database client", () => {
		expect(() => databaseClientSchema.parse("mongodb")).toThrow()
		expect(() => databaseClientSchema.parse("")).toThrow()
	})
})

describe("packageManagerSchema", () => {
	it("accepts valid package managers", () => {
		expect(packageManagerSchema.parse("npm")).toBe("npm")
		expect(packageManagerSchema.parse("yarn")).toBe("yarn")
		expect(packageManagerSchema.parse("pnpm")).toBe("pnpm")
		expect(packageManagerSchema.parse("bun")).toBe("bun")
	})

	it("rejects invalid package manager", () => {
		expect(() => packageManagerSchema.parse("deno")).toThrow()
	})
})

describe("environmentSchema", () => {
	it("accepts valid environments", () => {
		expect(environmentSchema.parse("development")).toBe("development")
		expect(environmentSchema.parse("production")).toBe("production")
		expect(environmentSchema.parse("both")).toBe("both")
	})

	it("rejects invalid environment", () => {
		expect(() => environmentSchema.parse("staging")).toThrow()
	})
})

describe("projectTypeSchema", () => {
	it("accepts js and ts", () => {
		expect(projectTypeSchema.parse("js")).toBe("js")
		expect(projectTypeSchema.parse("ts")).toBe("ts")
	})

	it("rejects invalid project type", () => {
		expect(() => projectTypeSchema.parse("coffee")).toThrow()
	})
})

describe("strapiVersionSchema", () => {
	it("accepts v4 and v5", () => {
		expect(strapiVersionSchema.parse("v4")).toBe("v4")
		expect(strapiVersionSchema.parse("v5")).toBe("v5")
	})

	it("rejects invalid version", () => {
		expect(() => strapiVersionSchema.parse("v3")).toThrow()
	})
})

describe("detectedConfigSchema", () => {
	it("accepts empty object", () => {
		const result = detectedConfigSchema.parse({})
		expect(result).toEqual({})
	})

	it("accepts partial config with valid values", () => {
		const result = detectedConfigSchema.parse({
			strapiVersion: "v5",
			databaseClient: "postgres",
			packageManager: "npm",
		})
		expect(result.strapiVersion).toBe("v5")
		expect(result.databaseClient).toBe("postgres")
		expect(result.packageManager).toBe("npm")
	})

	it("accepts full config", () => {
		const result = detectedConfigSchema.parse({
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "pnpm",
			environment: "production",
			projectName: "my-project",
			databaseHost: "localhost",
			databasePort: 5432,
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
			useCompose: true,
			useAdminer: false,
			envVars: { FOO: "bar" },
		})
		expect(result.projectName).toBe("my-project")
		expect(result.envVars).toEqual({ FOO: "bar" })
	})

	it("rejects invalid enum value in optional field", () => {
		expect(() => detectedConfigSchema.parse({ strapiVersion: "v3" })).toThrow()
	})
})

describe("resolvedConfigSchema", () => {
	const validConfig = {
		strapiVersion: "v5",
		projectType: "ts",
		databaseClient: "postgres",
		packageManager: "npm",
		environment: "production",
		projectName: "my-project",
		databaseHost: "localhost",
		databasePort: 5432,
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "strapi",
		useCompose: true,
		useAdminer: false,
		isESM: false,
		envVars: {},
	}

	it("accepts fully resolved config", () => {
		const result = resolvedConfigSchema.parse(validConfig)
		expect(result.strapiVersion).toBe("v5")
	})

	it("rejects missing required fields", () => {
		expect(() => resolvedConfigSchema.parse({})).toThrow()
	})

	it("rejects empty project name", () => {
		expect(() => resolvedConfigSchema.parse({ ...validConfig, projectName: "" })).toThrow()
	})

	it("rejects negative port", () => {
		expect(() => resolvedConfigSchema.parse({ ...validConfig, databasePort: -1 })).toThrow()
	})

	it("accepts port 0 for sqlite", () => {
		const sqliteConfig = {
			...validConfig,
			databaseClient: "sqlite",
			databasePort: 0,
		}
		const result = resolvedConfigSchema.parse(sqliteConfig)
		expect(result.databasePort).toBe(0)
	})
})

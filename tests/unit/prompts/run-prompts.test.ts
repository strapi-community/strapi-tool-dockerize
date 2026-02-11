import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test"
import type { DetectedConfig, ResolvedConfig } from "../../../src/config/schema"
import { resolvedConfigSchema } from "../../../src/config/schema"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../../../src/config/defaults"

const mockIntro = mock(() => {})
const mockOutro = mock(() => {})
const mockCancel = mock(() => {})
const mockNote = mock(() => {})
const mockIsCancel = mock(() => false)

const mockSelect = mock(() => Promise.resolve("v5"))
const mockConfirm = mock(() => Promise.resolve(true))
const mockText = mock(() => Promise.resolve("default"))
const mockPassword = mock(() => Promise.resolve("strapi"))
const mockGroup = mock(() =>
	Promise.resolve({
		databaseHost: "localhost",
		databasePort: "5432",
		databaseName: "strapi",
		databaseUsername: "strapi",
		databasePassword: "strapi",
	}),
)

mock.module("@clack/prompts", () => ({
	intro: mockIntro,
	outro: mockOutro,
	cancel: mockCancel,
	note: mockNote,
	isCancel: mockIsCancel,
	select: mockSelect,
	confirm: mockConfirm,
	text: mockText,
	password: mockPassword,
	group: mockGroup,
}))

const { runPrompts } = await import("../../../src/prompts/index")

function resetMocks() {
	mockIntro.mockClear()
	mockOutro.mockClear()
	mockCancel.mockClear()
	mockNote.mockClear()
	mockIsCancel.mockReturnValue(false)
	mockSelect.mockClear()
	mockConfirm.mockClear()
	mockText.mockClear()
	mockPassword.mockClear()
	mockGroup.mockClear()
}

function setupSelectResponses(responses: string[]) {
	let callIndex = 0
	mockSelect.mockImplementation(() => {
		const value = responses[callIndex] ?? responses[responses.length - 1]
		callIndex++
		return Promise.resolve(value)
	})
}

function setupConfirmResponses(responses: boolean[]) {
	let callIndex = 0
	mockConfirm.mockImplementation(() => {
		const value = responses[callIndex] ?? responses[responses.length - 1]
		callIndex++
		return Promise.resolve(value)
	})
}

describe("runPrompts", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("is exported as a function", () => {
		expect(typeof runPrompts).toBe("function")
	})

	it("returns a config that passes resolvedConfigSchema", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})

	it("includes all required fields in output", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config).toHaveProperty("strapiVersion")
		expect(config).toHaveProperty("projectType")
		expect(config).toHaveProperty("databaseClient")
		expect(config).toHaveProperty("packageManager")
		expect(config).toHaveProperty("environment")
		expect(config).toHaveProperty("projectName")
		expect(config).toHaveProperty("databaseHost")
		expect(config).toHaveProperty("databasePort")
		expect(config).toHaveProperty("databaseName")
		expect(config).toHaveProperty("databaseUsername")
		expect(config).toHaveProperty("databasePassword")
		expect(config).toHaveProperty("useCompose")
		expect(config).toHaveProperty("useAdminer")
		expect(config).toHaveProperty("isESM")
		expect(config).toHaveProperty("envVars")
	})

	it("calls intro and outro", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		await runPrompts({})

		expect(mockIntro).toHaveBeenCalledTimes(1)
		expect(mockOutro).toHaveBeenCalledTimes(1)
	})

	it("uses detected values when user confirms detected config", async () => {
		setupConfirmResponses([true, true])
		setupSelectResponses(["development"])

		const detected: DetectedConfig = {
			strapiVersion: "v4",
			projectType: "js",
			databaseClient: "mysql",
			packageManager: "yarn",
			databaseHost: "dbhost",
			databasePort: 3307,
			databaseName: "mydb",
			databaseUsername: "myuser",
			databasePassword: "mypass",
			environment: "production",
		}

		const config = await runPrompts(detected)

		expect(config.strapiVersion).toBe("v4")
		expect(config.projectType).toBe("js")
		expect(config.databaseClient).toBe("mysql")
		expect(config.packageManager).toBe("yarn")
		expect(config.databaseHost).toBe("dbhost")
		expect(config.databasePort).toBe(3307)
		expect(config.environment).toBe("production")
	})

	it("prompts for all values when user rejects detected config", async () => {
		setupConfirmResponses([false, true])
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {
			strapiVersion: "v4",
			projectType: "js",
			databaseClient: "mysql",
			packageManager: "yarn",
		}

		const config = await runPrompts(detected)

		expect(config.strapiVersion).toBe("v5")
		expect(config.projectType).toBe("ts")
		expect(config.packageManager).toBe("npm")
		expect(config.databaseClient).toBe("postgres")
	})

	it("skips confirmation when nothing is detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		await runPrompts(detected)

		expect(mockNote).not.toHaveBeenCalled()
	})

	it("passes isESM through from detected config", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = { isESM: true }
		const config = await runPrompts(detected)

		expect(config.isESM).toBe(true)
	})

	it("defaults isESM to false when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.isESM).toBe(false)
	})

	it("passes envVars through from detected config", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = { envVars: { APP_KEYS: "key1,key2" } }
		const config = await runPrompts(detected)

		expect(config.envVars).toEqual({ APP_KEYS: "key1,key2" })
	})

	it("defaults envVars to empty object when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.envVars).toEqual({})
	})

	it("defaults projectName to strapi when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.projectName).toBe("strapi")
	})

	it("uses detected projectName when available", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = { projectName: "my-cool-app" }
		const config = await runPrompts(detected)

		expect(config.projectName).toBe("my-cool-app")
	})

	it("handles environment=both correctly", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "both"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.environment).toBe("both")
		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})

	it("does not prompt for adminer when useCompose is false", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(false)
		expect(config.useAdminer).toBe(false)
	})

	it("does not prompt for adminer when database is sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.databaseClient).toBe("sqlite")
		expect(config.useAdminer).toBe(false)
	})
})

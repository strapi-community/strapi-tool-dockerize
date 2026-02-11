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
const mockText = mock(() => Promise.resolve("strapi"))
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

	it("skips detected confirmation when nothing is detected", async () => {
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

		const detectedNoteCall = mockNote.mock.calls.find(
			(call: unknown[]) => call[1] === "Detected Configuration",
		)
		expect(detectedNoteCall).toBeUndefined()
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

	it("prompts for projectName when useDetected is false", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockText.mockResolvedValue("custom-name")
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.projectName).toBe("custom-name")
	})

	it("uses detected projectName when useDetected is true", async () => {
		setupConfirmResponses([true])
		setupSelectResponses(["development"])

		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
			databaseClient: "postgres",
			databaseHost: "localhost",
			databasePort: 5432,
			projectName: "my-cool-app",
		}

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
		setupConfirmResponses([false, true])
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

	it("shows configuration summary before generating", async () => {
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

		const summaryCall = mockNote.mock.calls.find(
			(call: unknown[]) => call[1] === "Configuration",
		)
		expect(summaryCall).toBeDefined()
		expect(summaryCall![0]).toContain("Strapi v5")
		expect(summaryCall![0]).toContain("postgres")
	})

	it("includes database details in summary for non-sqlite", async () => {
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

		const summaryCall = mockNote.mock.calls.find(
			(call: unknown[]) => call[1] === "Configuration",
		)
		expect(summaryCall![0]).toContain("localhost:5432/strapi")
		expect(summaryCall![0]).toContain("User: strapi")
	})

	it("excludes database details in summary for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find(
			(call: unknown[]) => call[1] === "Configuration",
		)
		expect(summaryCall![0]).not.toContain("Database:")
		expect(summaryCall![0]).not.toContain("User:")
	})

	it("includes compose info in summary when enabled", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true, true, true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find(
			(call: unknown[]) => call[1] === "Configuration",
		)
		expect(summaryCall![0]).toContain("Compose: yes")
	})

	it("exits when user rejects final confirmation", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		let confirmCallIndex = 0
		mockConfirm.mockImplementation(() => {
			confirmCallIndex++
			if (confirmCallIndex === 1) return Promise.resolve(true)
			return Promise.resolve(false)
		})

		const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never)

		await runPrompts({})

		expect(exitSpy).toHaveBeenCalledWith(0)
		expect(mockCancel).toHaveBeenCalledWith("Generation cancelled")
		exitSpy.mockRestore()
	})

	it("exits when user cancels final confirmation", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		let confirmCallIndex = 0
		mockConfirm.mockImplementation(() => {
			confirmCallIndex++
			if (confirmCallIndex === 1) return Promise.resolve(true)
			return Promise.resolve(Symbol("cancel"))
		})
		mockIsCancel.mockReturnValue(true)

		const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never)

		await runPrompts({})

		expect(exitSpy).toHaveBeenCalledWith(0)
		expect(mockCancel).toHaveBeenCalledWith("Generation cancelled")
		exitSpy.mockRestore()
	})
})

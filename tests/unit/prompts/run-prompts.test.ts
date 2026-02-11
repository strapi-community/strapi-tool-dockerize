import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../../../src/config/defaults"
import type { DetectedConfig, ResolvedConfig } from "../../../src/config/schema"
import { resolvedConfigSchema } from "../../../src/config/schema"

const mockIntro = mock(() => {})
const mockCancel = mock(() => {})
const mockNote = mock(() => {})
const mockIsCancel = mock(() => false)
const mockLogInfo = mock(() => {})
const mockLogWarn = mock(() => {})

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
	cancel: mockCancel,
	note: mockNote,
	isCancel: mockIsCancel,
	select: mockSelect,
	confirm: mockConfirm,
	text: mockText,
	password: mockPassword,
	group: mockGroup,
	log: { info: mockLogInfo, warn: mockLogWarn },
}))

const { runPrompts } = await import("../../../src/prompts/index")

function resetMocks() {
	mockIntro.mockClear()
	mockCancel.mockClear()
	mockNote.mockClear()
	mockIsCancel.mockReturnValue(false)
	mockLogInfo.mockClear()
	mockLogWarn.mockClear()
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

function setupConfirmResponses(responses: (boolean | symbol)[]) {
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
		setupConfirmResponses([false, true, true])
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
		setupConfirmResponses([false, true, true])
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

	it("calls intro", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		await runPrompts({})

		expect(mockIntro).toHaveBeenCalledTimes(1)
	})

	it("logs detected summary when detections exist", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
		}

		await runPrompts(detected)

		expect(mockLogInfo).toHaveBeenCalled()
		const msg = mockLogInfo.mock.calls[0][0] as string
		expect(msg).toContain("Auto-detected")
	})

	it("skips detected summary when nothing is detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const autoDetectCall = mockLogInfo.mock.calls.find(
			(call: unknown[]) =>
				typeof call[0] === "string" && (call[0] as string).includes("Auto-detected"),
		)
		expect(autoDetectCall).toBeUndefined()
	})

	it("passes isESM through from detected config", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = { isESM: true }
		const config = await runPrompts(detected)

		expect(config.isESM).toBe(true)
	})

	it("defaults isESM to false when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.isESM).toBe(false)
	})

	it("passes envVars through from detected config", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = { envVars: { APP_KEYS: "key1,key2" } }
		const config = await runPrompts(detected)

		expect(config.envVars).toEqual({ APP_KEYS: "key1,key2" })
	})

	it("defaults envVars to empty object when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.envVars).toEqual({})
	})

	it("defaults projectName to strapi when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.projectName).toBe("strapi")
	})

	it("prompts for projectName", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])
		mockText.mockResolvedValue("custom-name")

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.projectName).toBe("custom-name")
	})

	it("handles environment=both correctly", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "both", "none"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.environment).toBe("both")
		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})

	it("does not prompt for adminer when useCompose is false", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, false, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(false)
		expect(config.useAdminer).toBe(false)
	})

	it("does not prompt for adminer when database is sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.databaseClient).toBe("sqlite")
		expect(config.useAdminer).toBe(false)
	})

	it("shows configuration summary before generating", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find((call: unknown[]) => call[1] === "Configuration")
		expect(summaryCall).toBeDefined()
		expect(summaryCall![0]).toContain("Strapi v5")
	})

	it("includes database details in summary for non-sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find((call: unknown[]) => call[1] === "Configuration")
		expect(summaryCall![0]).toContain("localhost:5432/strapi")
		expect(summaryCall![0]).toContain("DB User: strapi")
	})

	it("excludes database details in summary for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find((call: unknown[]) => call[1] === "Configuration")
		expect(summaryCall![0]).not.toContain("Database:")
		expect(summaryCall![0]).not.toContain("DB User:")
	})

	it("includes compose info in summary when enabled", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true, true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find((call: unknown[]) => call[1] === "Configuration")
		expect(summaryCall![0]).toContain("Compose: yes")
	})

	it("exits when user rejects final confirmation", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, false])

		const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never)

		await runPrompts({})

		expect(exitSpy).toHaveBeenCalledWith(0)
		expect(mockCancel).toHaveBeenCalledWith("Setup cancelled.")
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
		expect(mockCancel).toHaveBeenCalledWith("Setup cancelled.")
		exitSpy.mockRestore()
	})

	it("summary uses human-readable labels", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const summaryCall = mockNote.mock.calls.find((call: unknown[]) => call[1] === "Configuration")
		expect(summaryCall![0]).toContain("TypeScript")
		expect(summaryCall![0]).toContain("PostgreSQL")
		expect(summaryCall![0]).toContain("npm")
		expect(summaryCall![0]).not.toContain("| ts |")
		expect(summaryCall![0]).not.toContain("| postgres |")
	})

	it("project name is the first prompt after intro", async () => {
		const callOrder: string[] = []
		mockText.mockImplementation(() => {
			callOrder.push("text")
			return Promise.resolve("strapi")
		})
		const selectValues = ["v5", "ts", "npm", "postgres", "development"]
		let selectIndex = 0
		mockSelect.mockImplementation(() => {
			callOrder.push("select")
			const val = selectValues[selectIndex] ?? selectValues[selectValues.length - 1]
			selectIndex++
			return Promise.resolve(val)
		})
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		expect(callOrder[0]).toBe("text")
	})

	it("warns about default credentials for production environment", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "production", "none"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const warnCalls = mockLogWarn.mock.calls.filter(
			(call: unknown[]) =>
				typeof call[0] === "string" && (call[0] as string).includes("credentials"),
		)
		expect(warnCalls.length).toBeGreaterThan(0)
	})

	it("warns about default credentials for both environment", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "both", "none"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const warnCalls = mockLogWarn.mock.calls.filter(
			(call: unknown[]) =>
				typeof call[0] === "string" && (call[0] as string).includes("credentials"),
		)
		expect(warnCalls.length).toBeGreaterThan(0)
	})

	it("does not warn about credentials for development environment", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const warnCalls = mockLogWarn.mock.calls.filter(
			(call: unknown[]) =>
				typeof call[0] === "string" && (call[0] as string).includes("credentials"),
		)
		expect(warnCalls).toHaveLength(0)
	})

	it("database Customize defaults to No and uses defaults", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const config = await runPrompts({})

		expect(config.databaseHost).toBe(DEFAULT_DATABASE_HOST)
		expect(config.databasePort).toBe(DEFAULT_PORTS.postgres)
		expect(config.databaseName).toBe(DEFAULT_DATABASE_NAME)
		expect(config.databaseUsername).toBe(DEFAULT_DATABASE_USERNAME)
		expect(config.databasePassword).toBe(DEFAULT_DATABASE_PASSWORD)
		expect(mockGroup).not.toHaveBeenCalled()
	})

	it("database Customize Yes expands to full prompts", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true, true, true])
		mockGroup.mockResolvedValue({
			databaseHost: "custom-host",
			databasePort: "9999",
			databaseName: "custom-db",
			databaseUsername: "custom-user",
			databasePassword: "custom-pass",
		})

		const config = await runPrompts({})

		expect(mockGroup).toHaveBeenCalledTimes(1)
		expect(config.databaseHost).toBe("custom-host")
		expect(config.databasePort).toBe(9999)
		expect(config.databaseName).toBe("custom-db")
		expect(config.databaseUsername).toBe("custom-user")
		expect(config.databasePassword).toBe("custom-pass")
	})
})

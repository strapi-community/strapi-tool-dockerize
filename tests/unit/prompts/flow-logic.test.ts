import { describe, it, expect, mock, beforeEach } from "bun:test"
import type { DetectedConfig } from "../../../src/config/schema"
import { resolvedConfigSchema } from "../../../src/config/schema"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../../../src/config/defaults"

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

function setupConfirmResponses(responses: boolean[]) {
	let callIndex = 0
	mockConfirm.mockImplementation(() => {
		const value = responses[callIndex] ?? responses[responses.length - 1]
		callIndex++
		return Promise.resolve(value)
	})
}

describe("prompt flow: useCompose", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("prompts for useCompose and respects false answer", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, false, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(false)
	})

	it("prompts for useCompose and respects true answer", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(true)
	})
})

describe("prompt flow: useAdminer", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("prompts for useAdminer when compose is true and db is not sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useAdminer).toBe(true)
	})

	it("does not prompt for useAdminer when db is sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useAdminer).toBe(false)
	})

	it("does not prompt for useAdminer when compose is false", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, false, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.useAdminer).toBe(false)
	})
})

describe("prompt flow: sqlite skips db connection prompts", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("does not call group prompt for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(mockGroup).not.toHaveBeenCalled()
		expect(config.databaseClient).toBe("sqlite")
		expect(config.databasePort).toBe(0)
		expect(config.databaseHost).toBe(DEFAULT_DATABASE_HOST)
	})

	it("produces valid config for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})
})

describe("prompt flow: database defaults", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("uses default values when user does not customize", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.databaseHost).toBe(DEFAULT_DATABASE_HOST)
		expect(config.databasePort).toBe(DEFAULT_PORTS.postgres)
		expect(config.databaseName).toBe(DEFAULT_DATABASE_NAME)
		expect(config.databaseUsername).toBe(DEFAULT_DATABASE_USERNAME)
		expect(config.databasePassword).toBe(DEFAULT_DATABASE_PASSWORD)
	})

	it("uses group prompt when user chooses to customize", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true, true, true])
		mockGroup.mockResolvedValue({
			databaseHost: "custom-host",
			databasePort: "5433",
			databaseName: "custom-db",
			databaseUsername: "custom-user",
			databasePassword: "custom-pass",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(mockGroup).toHaveBeenCalled()
		expect(config.databaseHost).toBe("custom-host")
		expect(config.databasePort).toBe(5433)
	})

	it("fills defaults from detected values", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const detected: DetectedConfig = {
			databaseHost: "detected-host",
			databasePort: 5433,
			databaseName: "detected-db",
			databaseUsername: "detected-user",
			databasePassword: "detected-pass",
		}

		const config = await runPrompts(detected)

		expect(config.databaseHost).toBe("detected-host")
		expect(config.databasePort).toBe(5433)
		expect(config.databaseName).toBe("detected-db")
		expect(config.databaseUsername).toBe("detected-user")
		expect(config.databasePassword).toBe("detected-pass")
	})
})

describe("prompt flow: v4 and v5 versions", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("accepts v4 strapi version", async () => {
		setupSelectResponses(["v4", "js", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const config = await runPrompts({})

		expect(config.strapiVersion).toBe("v4")
		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})

	it("accepts v5 strapi version", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		const config = await runPrompts({})

		expect(config.strapiVersion).toBe("v5")
	})
})

describe("prompt flow: all database types produce valid config", () => {
	beforeEach(() => {
		resetMocks()
	})

	for (const dbClient of ["postgres", "mysql", "mariadb", "sqlite"] as const) {
		it(`produces valid config for ${dbClient}`, async () => {
			setupSelectResponses(["v5", "ts", "npm", dbClient, "development"])

			if (dbClient === "sqlite") {
				setupConfirmResponses([true, true])
			} else {
				setupConfirmResponses([false, true, true])
			}

			const config = await runPrompts({})

			expect(config.databaseClient).toBe(dbClient)
			expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
		})
	}
})

describe("prompt flow: projectName", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("always prompts for projectName", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])
		mockText.mockResolvedValue("prompted-name")

		const detected: DetectedConfig = {
			projectName: "detected-name",
		}

		const config = await runPrompts(detected)

		expect(config.projectName).toBe("prompted-name")
		expect(mockText).toHaveBeenCalled()
	})

	it("uses detected projectName as defaultValue in text prompt", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])
		mockText.mockResolvedValue("detected-name")

		await runPrompts({ projectName: "detected-name" })

		const textArgs = mockText.mock.calls[0][0] as { defaultValue?: string }
		expect(textArgs.defaultValue).toBe("detected-name")
	})
})

describe("prompt flow: customize database confirm message", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("shows detected values in the Customize? message", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({
			databaseHost: "my-host",
			databasePort: 5433,
		})

		const confirmCalls = mockConfirm.mock.calls
		const customizeCall = confirmCalls[0][0] as { message: string }
		expect(customizeCall.message).toContain("my-host:5433")
	})

	it("defaults Customize? to false", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const confirmCalls = mockConfirm.mock.calls
		const customizeCall = confirmCalls[0][0] as { initialValue?: boolean }
		expect(customizeCall.initialValue).toBe(false)
	})
})

describe("prompt flow: production credentials warning", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("shows warning when production env uses default password", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "production"])
		setupConfirmResponses([false, true, true])

		await runPrompts({})

		const warnCalls = mockLogWarn.mock.calls.filter(
			(call: unknown[]) => typeof call[0] === "string" && (call[0] as string).includes("credentials"),
		)
		expect(warnCalls.length).toBeGreaterThan(0)
	})

	it("does not warn when password is not default", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "production"])
		setupConfirmResponses([false, true, true])

		await runPrompts({
			databasePassword: "secure-password-123",
		})

		const warnCalls = mockLogWarn.mock.calls.filter(
			(call: unknown[]) => typeof call[0] === "string" && (call[0] as string).includes("credentials"),
		)
		expect(warnCalls).toHaveLength(0)
	})
})

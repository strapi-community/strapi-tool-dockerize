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

describe("prompt flow: useCompose bypass", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("uses detected useCompose=true without prompting even when useDetected is false", async () => {
		setupConfirmResponses([false])
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
			useCompose: true,
		}

		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(true)
	})

	it("uses detected useCompose=false without prompting even when useDetected is false", async () => {
		setupConfirmResponses([false])
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
			useCompose: false,
		}

		const config = await runPrompts(detected)

		expect(config.useCompose).toBe(false)
	})
})

describe("prompt flow: useAdminer bypass", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("uses detected useAdminer=true without prompting even when useDetected is false", async () => {
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
			useAdminer: true,
		}

		const config = await runPrompts(detected)

		expect(config.useAdminer).toBe(true)
	})
})

describe("prompt flow: sqlite skips db connection prompts", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("does not call group prompt for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(mockGroup).not.toHaveBeenCalled()
		expect(config.databaseClient).toBe("sqlite")
		expect(config.databasePort).toBe(0)
		expect(config.databaseHost).toBe(DEFAULT_DATABASE_HOST)
	})

	it("produces valid config for sqlite", async () => {
		setupSelectResponses(["v5", "ts", "npm", "sqlite", "development"])
		setupConfirmResponses([true])

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})
})

describe("prompt flow: database defaults", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("uses default port for postgres when not detected", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: String(DEFAULT_PORTS.postgres),
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {}
		const config = await runPrompts(detected)

		expect(config.databasePort).toBe(5432)
	})

	it("uses detected db connection when useDetected is true and host/port exist", async () => {
		setupConfirmResponses([true, true])
		setupSelectResponses(["development"])

		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
			databaseClient: "postgres",
			databaseHost: "custom-host",
			databasePort: 5433,
			databaseName: "custom-db",
			databaseUsername: "custom-user",
			databasePassword: "custom-pass",
		}

		const config = await runPrompts(detected)

		expect(mockGroup).not.toHaveBeenCalled()
		expect(config.databaseHost).toBe("custom-host")
		expect(config.databasePort).toBe(5433)
		expect(config.databaseName).toBe("custom-db")
		expect(config.databaseUsername).toBe("custom-user")
		expect(config.databasePassword).toBe("custom-pass")
	})

	it("prompts for db connection when useDetected is true but host is missing", async () => {
		setupConfirmResponses([true, true])
		setupSelectResponses(["development"])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
			databaseClient: "postgres",
			databasePort: 5432,
		}

		await runPrompts(detected)

		expect(mockGroup).toHaveBeenCalledTimes(1)
	})

	it("prompts for db connection when useDetected is true but port is missing", async () => {
		setupConfirmResponses([true, true])
		setupSelectResponses(["development"])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			packageManager: "npm",
			databaseClient: "postgres",
			databaseHost: "localhost",
		}

		await runPrompts(detected)

		expect(mockGroup).toHaveBeenCalledTimes(1)
	})
})

describe("prompt flow: v4 and v5 versions", () => {
	beforeEach(() => {
		resetMocks()
	})

	it("accepts v4 strapi version", async () => {
		setupSelectResponses(["v4", "js", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const config = await runPrompts({})

		expect(config.strapiVersion).toBe("v4")
		expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
	})

	it("accepts v5 strapi version", async () => {
		setupSelectResponses(["v5", "ts", "npm", "postgres", "development"])
		setupConfirmResponses([true])
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

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
			const port = DEFAULT_PORTS[dbClient]
			setupSelectResponses(["v5", "ts", "npm", dbClient, "development"])
			setupConfirmResponses([true])

			if (dbClient !== "sqlite") {
				mockGroup.mockResolvedValue({
					databaseHost: "localhost",
					databasePort: String(port),
					databaseName: "strapi",
					databaseUsername: "strapi",
					databasePassword: "strapi",
				})
			}

			const config = await runPrompts({})

			expect(config.databaseClient).toBe(dbClient)
			expect(() => resolvedConfigSchema.parse(config)).not.toThrow()
		})
	}
})

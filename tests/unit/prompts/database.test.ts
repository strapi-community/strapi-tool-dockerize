import { describe, it, expect, mock, beforeEach } from "bun:test"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../../../src/config/defaults"

const mockSelect = mock(() => Promise.resolve("postgres"))
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
const mockCancel = mock(() => {})
const mockIsCancel = mock(() => false)

mock.module("@clack/prompts", () => ({
	select: mockSelect,
	text: mockText,
	password: mockPassword,
	group: mockGroup,
	cancel: mockCancel,
	isCancel: mockIsCancel,
}))

const { selectDatabase, promptDatabaseConnection } = await import("../../../src/prompts/database")

describe("selectDatabase", () => {
	beforeEach(() => {
		mockSelect.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns selected database client", async () => {
		mockSelect.mockResolvedValue("mysql")
		const result = await selectDatabase()
		expect(result).toBe("mysql")
	})

	it("provides all four database options", async () => {
		mockSelect.mockResolvedValue("postgres")
		await selectDatabase()

		const callArgs = mockSelect.mock.calls[0][0] as { options: { value: string }[] }
		const values = callArgs.options.map((o) => o.value)
		expect(values).toContain("postgres")
		expect(values).toContain("mysql")
		expect(values).toContain("mariadb")
		expect(values).toContain("sqlite")
		expect(values).toHaveLength(4)
	})

	it("marks postgres as recommended", async () => {
		mockSelect.mockResolvedValue("postgres")
		await selectDatabase()

		const callArgs = mockSelect.mock.calls[0][0] as { options: { value: string; hint?: string }[] }
		const pgOption = callArgs.options.find((o) => o.value === "postgres")
		expect(pgOption?.hint).toBe("recommended")
	})
})

describe("promptDatabaseConnection", () => {
	beforeEach(() => {
		mockGroup.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns defaults immediately for sqlite without prompting", async () => {
		const result = await promptDatabaseConnection("sqlite")

		expect(result.databaseHost).toBe(DEFAULT_DATABASE_HOST)
		expect(result.databasePort).toBe(0)
		expect(result.databaseName).toBe(DEFAULT_DATABASE_NAME)
		expect(result.databaseUsername).toBe(DEFAULT_DATABASE_USERNAME)
		expect(result.databasePassword).toBe(DEFAULT_DATABASE_PASSWORD)
		expect(mockGroup).not.toHaveBeenCalled()
	})

	it("prompts for connection details for postgres", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "pghost",
			databasePort: "5432",
			databaseName: "pgdb",
			databaseUsername: "pguser",
			databasePassword: "pgpass",
		})

		const result = await promptDatabaseConnection("postgres")

		expect(mockGroup).toHaveBeenCalledTimes(1)
		expect(result.databaseHost).toBe("pghost")
		expect(result.databasePort).toBe(5432)
		expect(result.databaseName).toBe("pgdb")
		expect(result.databaseUsername).toBe("pguser")
		expect(result.databasePassword).toBe("pgpass")
	})

	it("prompts for connection details for mysql", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "mysqlhost",
			databasePort: "3306",
			databaseName: "mysqldb",
			databaseUsername: "mysqluser",
			databasePassword: "mysqlpass",
		})

		const result = await promptDatabaseConnection("mysql")

		expect(mockGroup).toHaveBeenCalledTimes(1)
		expect(result.databasePort).toBe(3306)
	})

	it("prompts for connection details for mariadb", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "mariahost",
			databasePort: "3306",
			databaseName: "mariadb",
			databaseUsername: "mariauser",
			databasePassword: "mariapass",
		})

		const result = await promptDatabaseConnection("mariadb")

		expect(mockGroup).toHaveBeenCalledTimes(1)
		expect(result.databasePort).toBe(3306)
	})

	it("falls back to default password when empty string returned", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "",
		})

		const result = await promptDatabaseConnection("postgres")

		expect(result.databasePassword).toBe(DEFAULT_DATABASE_PASSWORD)
	})

	it("parses port string to number", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "9999",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		const result = await promptDatabaseConnection("postgres")

		expect(result.databasePort).toBe(9999)
		expect(typeof result.databasePort).toBe("number")
	})

	it("group prompt includes password with mask", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "secret",
		})

		await promptDatabaseConnection("postgres")

		expect(mockGroup).toHaveBeenCalledTimes(1)
		const groupCall = mockGroup.mock.calls[0]
		const promptDefs = groupCall[0] as Record<string, () => unknown>
		expect(promptDefs).toHaveProperty("databasePassword")
	})

	it("password prompt message indicates press Enter for default", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "",
		})

		await promptDatabaseConnection("postgres")

		const groupCall = mockGroup.mock.calls[0]
		const promptDefs = groupCall[0] as Record<string, () => unknown>
		promptDefs.databasePassword()

		expect(mockPassword).toHaveBeenCalledTimes(1)
		const passwordArgs = mockPassword.mock.calls[0][0] as { message: string; mask: string }
		expect(passwordArgs.message).toContain("press Enter for")
		expect(passwordArgs.mask).toBe("*")
	})

	it("group prompt includes onCancel handler", async () => {
		mockGroup.mockResolvedValue({
			databaseHost: "localhost",
			databasePort: "5432",
			databaseName: "strapi",
			databaseUsername: "strapi",
			databasePassword: "strapi",
		})

		await promptDatabaseConnection("postgres")

		const groupOptions = mockGroup.mock.calls[0][1] as { onCancel?: () => void }
		expect(groupOptions).toHaveProperty("onCancel")
		expect(typeof groupOptions.onCancel).toBe("function")
	})
})

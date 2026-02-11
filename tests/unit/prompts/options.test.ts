import { beforeEach, describe, expect, it, mock } from "bun:test"

const mockSelect = mock(() => Promise.resolve("development"))
const mockConfirm = mock(() => Promise.resolve(true))
const mockText = mock(() => Promise.resolve("strapi"))
const mockCancel = mock(() => {})
const mockIsCancel = mock(() => false)

mock.module("@clack/prompts", () => ({
	select: mockSelect,
	confirm: mockConfirm,
	text: mockText,
	cancel: mockCancel,
	isCancel: mockIsCancel,
}))

const { promptEnvironment, promptProjectName, promptUseCompose, promptUseAdminer } = await import(
	"../../../src/prompts/options"
)

describe("promptEnvironment", () => {
	beforeEach(() => {
		mockSelect.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns selected environment", async () => {
		mockSelect.mockResolvedValue("production")
		const result = await promptEnvironment()
		expect(result).toBe("production")
	})

	it("offers development, production, and both options", async () => {
		mockSelect.mockResolvedValue("development")
		await promptEnvironment()

		const callArgs = mockSelect.mock.calls[0][0] as { options: { value: string }[] }
		const values = callArgs.options.map((o) => o.value)
		expect(values).toContain("development")
		expect(values).toContain("production")
		expect(values).toContain("both")
		expect(values).toHaveLength(3)
	})

	it("accepts both as a valid environment", async () => {
		mockSelect.mockResolvedValue("both")
		const result = await promptEnvironment()
		expect(result).toBe("both")
	})

	it("uses detected value as initialValue", async () => {
		mockSelect.mockResolvedValue("production")
		await promptEnvironment("production")

		const callArgs = mockSelect.mock.calls[0][0] as { initialValue?: string }
		expect(callArgs.initialValue).toBe("production")
	})

	it("does not set initialValue when no detected value", async () => {
		mockSelect.mockResolvedValue("development")
		await promptEnvironment()

		const callArgs = mockSelect.mock.calls[0][0] as { initialValue?: string }
		expect(callArgs.initialValue).toBeUndefined()
	})
})

describe("promptUseCompose", () => {
	beforeEach(() => {
		mockConfirm.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns true when confirmed", async () => {
		mockConfirm.mockResolvedValue(true)
		const result = await promptUseCompose()
		expect(result).toBe(true)
	})

	it("returns false when rejected", async () => {
		mockConfirm.mockResolvedValue(false)
		const result = await promptUseCompose()
		expect(result).toBe(false)
	})

	it("defaults to true", async () => {
		mockConfirm.mockResolvedValue(true)
		await promptUseCompose()

		const callArgs = mockConfirm.mock.calls[0][0] as { initialValue?: boolean }
		expect(callArgs.initialValue).toBe(true)
	})
})

describe("promptUseAdminer", () => {
	beforeEach(() => {
		mockConfirm.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns true when confirmed", async () => {
		mockConfirm.mockResolvedValue(true)
		const result = await promptUseAdminer()
		expect(result).toBe(true)
	})

	it("returns false when rejected", async () => {
		mockConfirm.mockResolvedValue(false)
		const result = await promptUseAdminer()
		expect(result).toBe(false)
	})

	it("defaults to false", async () => {
		mockConfirm.mockResolvedValue(false)
		await promptUseAdminer()

		const callArgs = mockConfirm.mock.calls[0][0] as { initialValue?: boolean }
		expect(callArgs.initialValue).toBe(false)
	})
})

describe("promptProjectName", () => {
	beforeEach(() => {
		mockText.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns text input value", async () => {
		mockText.mockResolvedValue("my-project")
		const result = await promptProjectName()
		expect(result).toBe("my-project")
	})

	it("uses detected value as default", async () => {
		mockText.mockResolvedValue("detected-app")
		await promptProjectName("detected-app")

		const callArgs = mockText.mock.calls[0][0] as { defaultValue?: string; placeholder?: string }
		expect(callArgs.defaultValue).toBe("detected-app")
		expect(callArgs.placeholder).toBe("detected-app")
	})

	it("defaults to strapi when no detected value", async () => {
		mockText.mockResolvedValue("strapi")
		await promptProjectName()

		const callArgs = mockText.mock.calls[0][0] as { defaultValue?: string; placeholder?: string }
		expect(callArgs.defaultValue).toBe("strapi")
		expect(callArgs.placeholder).toBe("strapi")
	})

	it("passes detected value as placeholder", async () => {
		mockText.mockResolvedValue("my-app")
		await promptProjectName("my-app")

		const callArgs = mockText.mock.calls[0][0] as { placeholder?: string }
		expect(callArgs.placeholder).toBe("my-app")
	})
})

import { describe, it, expect, mock, beforeEach } from "bun:test"

const mockSelect = mock(() => Promise.resolve("development"))
const mockConfirm = mock(() => Promise.resolve(true))
const mockCancel = mock(() => {})
const mockIsCancel = mock(() => false)

mock.module("@clack/prompts", () => ({
	select: mockSelect,
	confirm: mockConfirm,
	cancel: mockCancel,
	isCancel: mockIsCancel,
}))

const { promptEnvironment, promptUseCompose, promptUseAdminer } = await import("../../../src/prompts/options")

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

import { describe, it, expect, mock, beforeEach } from "bun:test"
import type { DetectedConfig } from "../../../src/config/schema"

const mockConfirm = mock(() => Promise.resolve(true))
const mockCancel = mock(() => {})
const mockNote = mock(() => {})
const mockIsCancel = mock(() => false)

mock.module("@clack/prompts", () => ({
	confirm: mockConfirm,
	cancel: mockCancel,
	note: mockNote,
	isCancel: mockIsCancel,
}))

const { confirmDetected } = await import("../../../src/prompts/confirm-detected")

describe("confirmDetected", () => {
	beforeEach(() => {
		mockConfirm.mockClear()
		mockCancel.mockClear()
		mockNote.mockClear()
		mockIsCancel.mockReturnValue(false)
	})

	it("returns true when user confirms", async () => {
		mockConfirm.mockResolvedValue(true)
		const result = await confirmDetected({ strapiVersion: "v5" })
		expect(result).toBe(true)
	})

	it("returns false when user rejects", async () => {
		mockConfirm.mockResolvedValue(false)
		const result = await confirmDetected({ strapiVersion: "v5" })
		expect(result).toBe(false)
	})

	it("shows note with detected configuration summary", async () => {
		mockConfirm.mockResolvedValue(true)
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
		}

		await confirmDetected(detected)

		expect(mockNote).toHaveBeenCalledTimes(1)
		const noteArgs = mockNote.mock.calls[0]
		const summary = noteArgs[0] as string
		expect(summary).toContain("Strapi v5")
		expect(summary).toContain("npm")
		expect(summary).toContain("PostgreSQL")
	})

	it("shows project name in summary", async () => {
		mockConfirm.mockResolvedValue(true)
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectName: "my-project",
		}

		await confirmDetected(detected)

		const summary = mockNote.mock.calls[0][0] as string
		expect(summary).toContain("my-project")
	})

	it("shows environment in summary", async () => {
		mockConfirm.mockResolvedValue(true)
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			environment: "production",
		}

		await confirmDetected(detected)

		const summary = mockNote.mock.calls[0][0] as string
		expect(summary).toContain("production")
	})

	it("shows sqlite without host:port in summary", async () => {
		mockConfirm.mockResolvedValue(true)
		const detected: DetectedConfig = {
			databaseClient: "sqlite",
		}

		await confirmDetected(detected)

		const summary = mockNote.mock.calls[0][0] as string
		expect(summary).toContain("SQLite")
		expect(summary).not.toContain("localhost:")
	})

	it("shows database host and port for non-sqlite", async () => {
		mockConfirm.mockResolvedValue(true)
		const detected: DetectedConfig = {
			databaseClient: "postgres",
			databaseHost: "myhost",
			databasePort: 5433,
		}

		await confirmDetected(detected)

		const summary = mockNote.mock.calls[0][0] as string
		expect(summary).toContain("PostgreSQL")
		expect(summary).toContain("myhost:5433")
	})

	it("defaults to true for initial confirm value", async () => {
		mockConfirm.mockResolvedValue(true)
		await confirmDetected({ strapiVersion: "v5" })

		const callArgs = mockConfirm.mock.calls[0][0] as { initialValue?: boolean }
		expect(callArgs.initialValue).toBe(true)
	})
})

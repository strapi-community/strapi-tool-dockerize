import { beforeEach, describe, expect, it, mock } from "bun:test"
import type { DetectedConfig } from "../../../src/config/schema"

const mockLogInfo = mock(() => {})

mock.module("@clack/prompts", () => ({
	log: { info: mockLogInfo },
}))

const { buildDetectionSummary, logDetectedSummary, DB_LABELS, PM_LABELS, LANG_LABELS } =
	await import("../../../src/prompts/confirm-detected")

describe("buildDetectionSummary", () => {
	it("returns pipe-separated summary of detected values", () => {
		const detected: DetectedConfig = {
			strapiVersion: "v5",
			projectType: "ts",
			databaseClient: "postgres",
			packageManager: "npm",
		}

		const result = buildDetectionSummary(detected)
		expect(result).toBe("Strapi v5 | TypeScript | PostgreSQL | npm")
	})

	it("includes only provided fields", () => {
		const result = buildDetectionSummary({ strapiVersion: "v5" })
		expect(result).toBe("Strapi v5")
	})

	it("returns empty string when nothing detected", () => {
		const result = buildDetectionSummary({})
		expect(result).toBe("")
	})

	it("shows SQLite label", () => {
		const result = buildDetectionSummary({ databaseClient: "sqlite" })
		expect(result).toContain("SQLite")
	})

	it("shows MariaDB label", () => {
		const result = buildDetectionSummary({ databaseClient: "mariadb" })
		expect(result).toContain("MariaDB")
	})

	it("shows MySQL label", () => {
		const result = buildDetectionSummary({ databaseClient: "mysql" })
		expect(result).toContain("MySQL")
	})

	it("shows JavaScript label", () => {
		const result = buildDetectionSummary({ projectType: "js" })
		expect(result).toContain("JavaScript")
	})

	it("shows Yarn label", () => {
		const result = buildDetectionSummary({ packageManager: "yarn" })
		expect(result).toContain("Yarn")
	})

	it("handles partial detections", () => {
		const result = buildDetectionSummary({
			strapiVersion: "v4",
			packageManager: "pnpm",
		})
		expect(result).toBe("Strapi v4 | pnpm")
	})
})

describe("logDetectedSummary", () => {
	beforeEach(() => {
		mockLogInfo.mockClear()
	})

	it("logs auto-detected summary", () => {
		logDetectedSummary({ strapiVersion: "v5", packageManager: "npm" })
		expect(mockLogInfo).toHaveBeenCalledTimes(1)
		const msg = mockLogInfo.mock.calls[0][0] as string
		expect(msg).toContain("Auto-detected")
		expect(msg).toContain("Strapi v5")
	})

	it("does not log when nothing detected", () => {
		logDetectedSummary({})
		expect(mockLogInfo).not.toHaveBeenCalled()
	})
})

describe("label maps", () => {
	it("DB_LABELS contains all database types", () => {
		expect(DB_LABELS.postgres).toBe("PostgreSQL")
		expect(DB_LABELS.mysql).toBe("MySQL")
		expect(DB_LABELS.mariadb).toBe("MariaDB")
		expect(DB_LABELS.sqlite).toBe("SQLite")
	})

	it("PM_LABELS contains all package managers", () => {
		expect(PM_LABELS.npm).toBe("npm")
		expect(PM_LABELS.yarn).toBe("Yarn")
		expect(PM_LABELS.pnpm).toBe("pnpm")
		expect(PM_LABELS.bun).toBe("Bun")
	})

	it("LANG_LABELS contains both project types", () => {
		expect(LANG_LABELS.ts).toBe("TypeScript")
		expect(LANG_LABELS.js).toBe("JavaScript")
	})
})

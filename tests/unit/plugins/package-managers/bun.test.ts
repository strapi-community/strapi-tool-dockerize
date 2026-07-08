import { describe, expect, it } from "bun:test"
import { bunPlugin } from "../../../../src/plugins/package-managers/bun"

describe("bunPlugin", () => {
	it("has correct id and metadata", () => {
		expect(bunPlugin.id).toBe("bun")
		expect(bunPlugin.displayName).toBe("Bun")
		expect(bunPlugin.lockFile).toBe("bun.lockb")
	})

	it("returns correct commands", () => {
		expect(bunPlugin.installCommand).toBe("bun install --frozen-lockfile")
		expect(bunPlugin.buildCommand).toBe("bun run build")
		expect(bunPlugin.startCommand).toBe("bun start")
		expect(bunPlugin.devCommand).toBe("bun run develop")
	})

	it("generates add/remove commands", () => {
		expect(bunPlugin.addPackageCommand("pg")).toBe("bun add pg")
		expect(bunPlugin.removePackageCommand("pg")).toBe("bun remove pg")
	})

	describe("docker steps", () => {
		it("returns the oven/bun base image regardless of node version", () => {
			expect(bunPlugin.dockerBaseImage("22")).toBe("oven/bun:1-alpine")
			expect(bunPlugin.dockerBaseImage("20")).toBe("oven/bun:1-alpine")
		})

		it("requires no extra setup steps", () => {
			expect(bunPlugin.dockerSetupSteps()).toEqual([])
		})

		it("copies package.json and lock file", () => {
			expect(bunPlugin.dockerCopyFiles()).toEqual(["package.json", "bun.lockb"])
		})

		it("uses frozen lockfile for install", () => {
			expect(bunPlugin.dockerInstallStep(false)).toBe("bun install --frozen-lockfile")
		})

		it("uses production flag for production install", () => {
			expect(bunPlugin.dockerInstallStep(true)).toBe("bun install --frozen-lockfile --production")
		})

		it("uses bun run build", () => {
			expect(bunPlugin.dockerBuildStep()).toBe("bun run build")
		})

		it("returns correct start commands", () => {
			expect(bunPlugin.dockerStartStep(false)).toBe('["bun", "start"]')
			expect(bunPlugin.dockerStartStep(true)).toBe('["bun", "run", "develop"]')
		})
	})
})

import { describe, expect, it } from "bun:test"
import { pnpmPlugin } from "../../../../src/plugins/package-managers/pnpm"

describe("pnpmPlugin", () => {
	it("has correct id and metadata", () => {
		expect(pnpmPlugin.id).toBe("pnpm")
		expect(pnpmPlugin.displayName).toBe("pnpm")
		expect(pnpmPlugin.lockFile).toBe("pnpm-lock.yaml")
	})

	it("returns correct commands", () => {
		expect(pnpmPlugin.installCommand).toBe("pnpm install --frozen-lockfile")
		expect(pnpmPlugin.buildCommand).toBe("pnpm build")
		expect(pnpmPlugin.startCommand).toBe("pnpm start")
		expect(pnpmPlugin.devCommand).toBe("pnpm develop")
	})

	it("generates add/remove commands", () => {
		expect(pnpmPlugin.addPackageCommand("pg")).toBe("pnpm add pg")
		expect(pnpmPlugin.removePackageCommand("pg")).toBe("pnpm remove pg")
	})

	describe("docker steps", () => {
		it("returns node alpine base image", () => {
			expect(pnpmPlugin.dockerBaseImage("20")).toBe("node:20-alpine")
		})

		it("returns corepack enable setup step", () => {
			expect(pnpmPlugin.dockerSetupSteps()).toEqual(["RUN corepack enable"])
		})

		it("copies package.json and lock file", () => {
			expect(pnpmPlugin.dockerCopyFiles()).toEqual(["package.json", "pnpm-lock.yaml"])
		})

		it("uses frozen lockfile for install", () => {
			expect(pnpmPlugin.dockerInstallStep(false)).toBe("pnpm install --frozen-lockfile")
		})

		it("uses prod flag for production install", () => {
			expect(pnpmPlugin.dockerInstallStep(true)).toBe("pnpm install --frozen-lockfile --prod")
		})

		it("uses pnpm build", () => {
			expect(pnpmPlugin.dockerBuildStep()).toBe("pnpm build")
		})

		it("returns correct start commands", () => {
			expect(pnpmPlugin.dockerStartStep(false)).toBe('["pnpm", "start"]')
			expect(pnpmPlugin.dockerStartStep(true)).toBe('["pnpm", "develop"]')
		})
	})
})

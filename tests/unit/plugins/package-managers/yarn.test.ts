import { describe, expect, it } from "bun:test"
import { yarnPlugin } from "../../../../src/plugins/package-managers/yarn"

describe("yarnPlugin", () => {
	it("has correct id and metadata", () => {
		expect(yarnPlugin.id).toBe("yarn")
		expect(yarnPlugin.displayName).toBe("Yarn")
		expect(yarnPlugin.lockFile).toBe("yarn.lock")
	})

	it("returns correct commands", () => {
		expect(yarnPlugin.installCommand).toBe("yarn install --frozen-lockfile")
		expect(yarnPlugin.buildCommand).toBe("yarn build")
		expect(yarnPlugin.startCommand).toBe("yarn start")
		expect(yarnPlugin.devCommand).toBe("yarn develop")
	})

	it("generates add/remove commands", () => {
		expect(yarnPlugin.addPackageCommand("pg")).toBe("yarn add pg")
		expect(yarnPlugin.removePackageCommand("pg")).toBe("yarn remove pg")
	})

	describe("docker steps", () => {
		it("returns node alpine base image", () => {
			expect(yarnPlugin.dockerBaseImage("20")).toBe("node:20-alpine")
		})

		it("requires no extra setup steps", () => {
			expect(yarnPlugin.dockerSetupSteps()).toEqual([])
		})

		it("copies package.json and lock file", () => {
			expect(yarnPlugin.dockerCopyFiles()).toEqual(["package.json", "yarn.lock"])
		})

		it("uses frozen lockfile for install", () => {
			expect(yarnPlugin.dockerInstallStep(false)).toBe("yarn install --frozen-lockfile")
		})

		it("uses production flag for production install", () => {
			expect(yarnPlugin.dockerInstallStep(true)).toBe("yarn install --frozen-lockfile --production")
		})

		it("uses yarn build", () => {
			expect(yarnPlugin.dockerBuildStep()).toBe("yarn build")
		})

		it("returns correct start commands", () => {
			expect(yarnPlugin.dockerStartStep(false)).toBe('["yarn", "start"]')
			expect(yarnPlugin.dockerStartStep(true)).toBe('["yarn", "develop"]')
		})
	})
})

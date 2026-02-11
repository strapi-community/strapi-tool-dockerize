import { describe, it, expect } from "bun:test"
import { npmPlugin } from "../../../../src/plugins/package-managers/npm"

describe("npmPlugin", () => {
	it("has correct id and metadata", () => {
		expect(npmPlugin.id).toBe("npm")
		expect(npmPlugin.displayName).toBe("npm")
		expect(npmPlugin.lockFile).toBe("package-lock.json")
	})

	it("returns correct commands", () => {
		expect(npmPlugin.installCommand).toBe("npm ci")
		expect(npmPlugin.buildCommand).toBe("npm run build")
		expect(npmPlugin.startCommand).toBe("npm start")
		expect(npmPlugin.devCommand).toBe("npm run develop")
	})

	it("generates add/remove commands", () => {
		expect(npmPlugin.addPackageCommand("pg")).toBe("npm install pg")
		expect(npmPlugin.removePackageCommand("pg")).toBe("npm uninstall pg")
	})

	describe("docker steps", () => {
		it("returns node alpine base image", () => {
			expect(npmPlugin.dockerBaseImage("20")).toBe("node:20-alpine")
			expect(npmPlugin.dockerBaseImage("18")).toBe("node:18-alpine")
		})

		it("returns no setup steps", () => {
			expect(npmPlugin.dockerSetupSteps()).toEqual([])
		})

		it("copies package.json and lock file", () => {
			expect(npmPlugin.dockerCopyFiles()).toEqual(["package.json", "package-lock.json"])
		})

		it("uses npm ci for install", () => {
			expect(npmPlugin.dockerInstallStep(false)).toBe("npm ci")
		})

		it("uses production flag for prod install", () => {
			expect(npmPlugin.dockerInstallStep(true)).toBe("npm ci --omit=dev")
		})

		it("uses npm run build", () => {
			expect(npmPlugin.dockerBuildStep()).toBe("npm run build")
		})

		it("returns correct start commands", () => {
			expect(npmPlugin.dockerStartStep(false)).toBe('["npm", "start"]')
			expect(npmPlugin.dockerStartStep(true)).toBe('["npm", "run", "develop"]')
		})
	})
})

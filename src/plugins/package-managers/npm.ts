import type { PackageManagerPlugin } from "../types"

export const npmPlugin: PackageManagerPlugin = {
	id: "npm",
	displayName: "npm",
	lockFile: "package-lock.json",
	installCommand: "npm ci",
	buildCommand: "npm run build",
	startCommand: "npm start",
	devCommand: "npm run develop",

	addPackageCommand(pkg: string): string {
		return `npm install ${pkg}`
	},

	removePackageCommand(pkg: string): string {
		return `npm uninstall ${pkg}`
	},

	dockerBaseImage(nodeVersion: string): string {
		return `node:${nodeVersion}-alpine`
	},

	dockerSetupSteps(): string[] {
		return []
	},

	dockerCopyFiles(): string[] {
		return ["package.json", "package-lock.json"]
	},

	dockerInstallStep(production: boolean): string {
		return production ? "npm ci --only=production" : "npm ci"
	},

	dockerBuildStep(): string {
		return "npm run build"
	},

	dockerStartStep(dev: boolean): string {
		return dev ? '["npm", "run", "develop"]' : '["npm", "start"]'
	},
}

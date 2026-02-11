import type { PackageManagerPlugin } from "../types"

export const yarnPlugin: PackageManagerPlugin = {
	id: "yarn",
	displayName: "Yarn",
	lockFile: "yarn.lock",
	installCommand: "yarn install --frozen-lockfile",
	buildCommand: "yarn build",
	startCommand: "yarn start",
	devCommand: "yarn develop",

	addPackageCommand(pkg: string): string {
		return `yarn add ${pkg}`
	},

	removePackageCommand(pkg: string): string {
		return `yarn remove ${pkg}`
	},

	dockerCopyFiles(): string[] {
		return ["package.json", "yarn.lock"]
	},

	dockerInstallStep(production: boolean): string {
		return production
			? "yarn install --frozen-lockfile --production"
			: "yarn install --frozen-lockfile"
	},

	dockerBuildStep(): string {
		return "yarn build"
	},

	dockerStartStep(dev: boolean): string {
		return dev ? '["yarn", "develop"]' : '["yarn", "start"]'
	},
}

import type { PackageManagerPlugin } from "../types"

export const bunPlugin: PackageManagerPlugin = {
	id: "bun",
	displayName: "Bun",
	lockFile: "bun.lockb",
	installCommand: "bun install --frozen-lockfile",
	buildCommand: "bun run build",
	startCommand: "bun start",
	devCommand: "bun run develop",

	addPackageCommand(pkg: string): string {
		return `bun add ${pkg}`
	},

	removePackageCommand(pkg: string): string {
		return `bun remove ${pkg}`
	},

	dockerCopyFiles(): string[] {
		return ["package.json", "bun.lockb"]
	},

	dockerInstallStep(production: boolean): string {
		return production
			? "bun install --frozen-lockfile --production"
			: "bun install --frozen-lockfile"
	},

	dockerBuildStep(): string {
		return "bun run build"
	},

	dockerStartStep(dev: boolean): string {
		return dev ? '["bun", "run", "develop"]' : '["bun", "start"]'
	},
}

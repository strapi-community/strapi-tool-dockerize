import type { PackageManagerPlugin } from "../types"

export const pnpmPlugin: PackageManagerPlugin = {
	id: "pnpm",
	displayName: "pnpm",
	lockFile: "pnpm-lock.yaml",
	installCommand: "pnpm install --frozen-lockfile",
	buildCommand: "pnpm build",
	startCommand: "pnpm start",
	devCommand: "pnpm develop",

	addPackageCommand(pkg: string): string {
		return `pnpm add ${pkg}`
	},

	removePackageCommand(pkg: string): string {
		return `pnpm remove ${pkg}`
	},

	dockerBaseImage(nodeVersion: string): string {
		return `node:${nodeVersion}-alpine`
	},

	dockerSetupSteps(): string[] {
		return ["RUN corepack enable"]
	},

	dockerCopyFiles(): string[] {
		return ["package.json", "pnpm-lock.yaml"]
	},

	dockerInstallStep(production: boolean): string {
		return production ? "pnpm install --frozen-lockfile --prod" : "pnpm install --frozen-lockfile"
	},

	dockerBuildStep(): string {
		return "pnpm build"
	},

	dockerStartStep(dev: boolean): string {
		return dev ? '["pnpm", "develop"]' : '["pnpm", "start"]'
	},
}

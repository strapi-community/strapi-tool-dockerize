import type { PackageManager } from "../../config"
import type { PackageManagerPlugin } from "../types"

export function nodeAlpineImage(nodeVersion: string): string {
	return `node:${nodeVersion}-alpine`
}

export interface PackageManagerSpec {
	id: PackageManager
	displayName: string
	lockFile: string
	installCommand: string
	buildCommand: string
	startCommand: string
	devCommand: string
	addCommand: string
	removeCommand: string
	baseImage(nodeVersion: string): string
	setupSteps?: string[]
	installStep: string
	prodInstallStep: string
	buildStep: string
	startStep: string
	devStep: string
}

export function createPackageManagerPlugin(spec: PackageManagerSpec): PackageManagerPlugin {
	return {
		id: spec.id,
		displayName: spec.displayName,
		lockFile: spec.lockFile,
		installCommand: spec.installCommand,
		buildCommand: spec.buildCommand,
		startCommand: spec.startCommand,
		devCommand: spec.devCommand,
		addPackageCommand: (pkg) => `${spec.addCommand} ${pkg}`,
		removePackageCommand: (pkg) => `${spec.removeCommand} ${pkg}`,
		dockerBaseImage: spec.baseImage,
		dockerSetupSteps: () => spec.setupSteps ?? [],
		dockerCopyFiles: () => ["package.json", spec.lockFile],
		dockerInstallStep: (production) => (production ? spec.prodInstallStep : spec.installStep),
		dockerBuildStep: () => spec.buildStep,
		dockerStartStep: (dev) => (dev ? spec.devStep : spec.startStep),
	}
}

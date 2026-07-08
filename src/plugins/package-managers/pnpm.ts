import { createPackageManagerPlugin, nodeAlpineImage } from "./shared"

export const pnpmPlugin = createPackageManagerPlugin({
	id: "pnpm",
	displayName: "pnpm",
	lockFile: "pnpm-lock.yaml",
	installCommand: "pnpm install --frozen-lockfile",
	buildCommand: "pnpm build",
	startCommand: "pnpm start",
	devCommand: "pnpm develop",
	addCommand: "pnpm add",
	removeCommand: "pnpm remove",
	baseImage: nodeAlpineImage,
	setupSteps: ["RUN corepack enable"],
	installStep: "pnpm install --frozen-lockfile",
	prodInstallStep: "pnpm install --frozen-lockfile --prod",
	buildStep: "pnpm build",
	startStep: '["pnpm", "start"]',
	devStep: '["pnpm", "develop"]',
})

import { createPackageManagerPlugin } from "./shared"

export const bunPlugin = createPackageManagerPlugin({
	id: "bun",
	displayName: "Bun",
	lockFile: "bun.lockb",
	installCommand: "bun install --frozen-lockfile",
	buildCommand: "bun run build",
	startCommand: "bun start",
	devCommand: "bun run develop",
	addCommand: "bun add",
	removeCommand: "bun remove",
	baseImage: () => "oven/bun:1-alpine",
	installStep: "bun install --frozen-lockfile",
	prodInstallStep: "bun install --frozen-lockfile --production",
	buildStep: "bun run build",
	startStep: '["bun", "start"]',
	devStep: '["bun", "run", "develop"]',
})

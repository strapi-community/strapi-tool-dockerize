import { createPackageManagerPlugin, nodeAlpineImage } from "./shared"

export const yarnPlugin = createPackageManagerPlugin({
	id: "yarn",
	displayName: "Yarn",
	lockFile: "yarn.lock",
	installCommand: "yarn install --frozen-lockfile",
	buildCommand: "yarn build",
	startCommand: "yarn start",
	devCommand: "yarn develop",
	addCommand: "yarn add",
	removeCommand: "yarn remove",
	baseImage: nodeAlpineImage,
	installStep: "yarn install --frozen-lockfile",
	prodInstallStep: "yarn install --frozen-lockfile --production",
	buildStep: "yarn build",
	startStep: '["yarn", "start"]',
	devStep: '["yarn", "develop"]',
})

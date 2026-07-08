import { createPackageManagerPlugin, nodeAlpineImage } from "./shared"

export const npmPlugin = createPackageManagerPlugin({
	id: "npm",
	displayName: "npm",
	lockFile: "package-lock.json",
	installCommand: "npm ci",
	buildCommand: "npm run build",
	startCommand: "npm start",
	devCommand: "npm run develop",
	addCommand: "npm install",
	removeCommand: "npm uninstall",
	baseImage: nodeAlpineImage,
	installStep: "npm ci",
	prodInstallStep: "npm ci --omit=dev",
	buildStep: "npm run build",
	startStep: '["npm", "start"]',
	devStep: '["npm", "run", "develop"]',
})

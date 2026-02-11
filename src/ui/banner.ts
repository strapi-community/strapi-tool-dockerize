import pc from "picocolors"
import type { StrapiVersion } from "../config"
import { bold, dim, highlight } from "./colors"

interface BannerOptions {
	strapiVersion?: StrapiVersion
}

export function showBanner(options: BannerOptions = {}) {
	const pkg = {
		name: "@strapi-community/dockerize",
		version: "0.0.0-development",
	}

	try {
		const loaded = require("../../package.json")
		pkg.name = loaded.name ?? pkg.name
		pkg.version = loaded.version ?? pkg.version
	} catch {}

	const title = `🐳 ${bold(pc.blue("strapi-dockerize"))}`
	const version = dim(`v${pkg.version}`)
	const tagline = dim("Easy Docker setup for Strapi projects")

	console.log()
	console.log(`  ${title} ${version}`)
	console.log(`  ${tagline}`)

	if (options.strapiVersion) {
		console.log(`  ${highlight(`Strapi ${options.strapiVersion}`)} detected`)
	}

	console.log()
}

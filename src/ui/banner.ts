import pc from "picocolors"
import pkg from "../../package.json"
import type { StrapiVersion } from "../config"
import { bold, dim, highlight } from "./colors"

interface BannerOptions {
	strapiVersion?: StrapiVersion
}

export function showBanner(options: BannerOptions = {}) {
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

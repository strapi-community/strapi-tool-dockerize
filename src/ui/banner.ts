import pc from "picocolors"
import pkg from "../../package.json"
import type { StrapiVersion } from "../config"
import { bold, dim, highlight } from "./colors"

interface BannerOptions {
	strapiVersion?: StrapiVersion
}

export function showBanner(options: BannerOptions = {}) {
	const version = pkg.version === "0.0.0-development" ? "dev" : `v${pkg.version}`
	const title = `🐳 ${bold(pc.blue("strapi-dockerize"))}`

	console.log()
	console.log(`  ${title} ${dim(version)}`)
	console.log(`  ${dim("Containerize your Strapi project in seconds")}`)

	if (options.strapiVersion) {
		console.log(`  ${highlight(`Strapi ${options.strapiVersion}`)} detected`)
	}

	console.log()
}

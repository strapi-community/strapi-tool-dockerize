import { readFile } from "node:fs/promises"

export interface DetectedPlugin {
	name: string
	envVars: Record<string, string>
}

interface PluginDefinition {
	packages: string[]
	name: string
	envVars: Record<string, string>
}

const STRAPI_PLUGINS: PluginDefinition[] = [
	{
		packages: ["@strapi/provider-upload-aws-s3"],
		name: "AWS S3 Upload",
		envVars: {
			AWS_ACCESS_KEY_ID: "",
			AWS_ACCESS_SECRET: "",
			AWS_REGION: "",
			AWS_BUCKET: "",
		},
	},
	{
		packages: ["@strapi/provider-upload-cloudinary"],
		name: "Cloudinary Upload",
		envVars: {
			CLOUDINARY_NAME: "",
			CLOUDINARY_KEY: "",
			CLOUDINARY_SECRET: "",
		},
	},
	{
		packages: ["@strapi/provider-email-sendgrid"],
		name: "SendGrid Email",
		envVars: {
			SENDGRID_API_KEY: "",
		},
	},
	{
		packages: ["@strapi/provider-email-mailgun"],
		name: "Mailgun Email",
		envVars: {
			MAILGUN_API_KEY: "",
			MAILGUN_DOMAIN: "",
		},
	},
	{
		packages: ["@strapi/provider-email-amazon-ses"],
		name: "AWS SES Email",
		envVars: {
			AWS_SES_ACCESS_KEY_ID: "",
			AWS_SES_SECRET_ACCESS_KEY: "",
			AWS_SES_REGION: "",
		},
	},
]

export async function detectStrapiPlugins(cwd: string): Promise<DetectedPlugin[]> {
	try {
		const raw = await readFile(`${cwd}/package.json`, "utf-8")
		const pkg = JSON.parse(raw)
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

		const detected: DetectedPlugin[] = []

		for (const plugin of STRAPI_PLUGINS) {
			const found = plugin.packages.some((pkg) => allDeps[pkg])
			if (found) {
				detected.push({
					name: plugin.name,
					envVars: { ...plugin.envVars },
				})
			}
		}

		return detected
	} catch {
		return []
	}
}

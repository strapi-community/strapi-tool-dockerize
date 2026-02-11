import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { detectStrapiPlugins } from "../../../src/detection/plugins"
import { cleanupTempDir, createFixtureFiles, createTempDir } from "../../setup"

describe("detectStrapiPlugins", () => {
	let tempDir: string

	beforeEach(async () => {
		tempDir = await createTempDir()
	})

	afterEach(async () => {
		await cleanupTempDir(tempDir)
	})

	it("detects AWS S3 upload provider", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/provider-upload-aws-s3": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("AWS S3 Upload")
		expect(plugins[0].envVars).toEqual({
			AWS_ACCESS_KEY_ID: "",
			AWS_ACCESS_SECRET: "",
			AWS_REGION: "",
			AWS_BUCKET: "",
		})
	})

	it("detects Cloudinary upload provider", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/provider-upload-cloudinary": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("Cloudinary Upload")
		expect(plugins[0].envVars).toEqual({
			CLOUDINARY_NAME: "",
			CLOUDINARY_KEY: "",
			CLOUDINARY_SECRET: "",
		})
	})

	it("detects SendGrid email provider", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/provider-email-sendgrid": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("SendGrid Email")
		expect(plugins[0].envVars).toEqual({
			SENDGRID_API_KEY: "",
		})
	})

	it("detects Mailgun email provider", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/provider-email-mailgun": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("Mailgun Email")
		expect(plugins[0].envVars).toEqual({
			MAILGUN_API_KEY: "",
			MAILGUN_DOMAIN: "",
		})
	})

	it("detects AWS SES email provider", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/provider-email-amazon-ses": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("AWS SES Email")
		expect(plugins[0].envVars).toEqual({
			AWS_SES_ACCESS_KEY_ID: "",
			AWS_SES_SECRET_ACCESS_KEY: "",
			AWS_SES_REGION: "",
		})
	})

	it("detects multiple plugins at once", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: {
					"@strapi/provider-upload-aws-s3": "^1.0.0",
					"@strapi/provider-email-sendgrid": "^1.0.0",
				},
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(2)
		const names = plugins.map((p) => p.name)
		expect(names).toContain("AWS S3 Upload")
		expect(names).toContain("SendGrid Email")
	})

	it("detects plugins from devDependencies", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				devDependencies: { "@strapi/provider-upload-cloudinary": "^1.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(1)
		expect(plugins[0].name).toBe("Cloudinary Upload")
	})

	it("returns empty array when no plugins detected", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({
				name: "test",
				dependencies: { "@strapi/strapi": "^5.0.0" },
			}),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(0)
	})

	it("returns empty array when package.json has no dependencies", async () => {
		await createFixtureFiles(tempDir, {
			"package.json": JSON.stringify({ name: "test" }),
		})

		const plugins = await detectStrapiPlugins(tempDir)
		expect(plugins).toHaveLength(0)
	})

	it("returns empty array for nonexistent directory", async () => {
		const plugins = await detectStrapiPlugins("/nonexistent/path")
		expect(plugins).toHaveLength(0)
	})
})

import { describe, it, expect } from "bun:test"
import { detectStrapi } from "../../../src/detection/strapi"
import { fixturePath } from "../../setup"

describe("detectStrapi", () => {
	it("detects strapi v5 with typescript", async () => {
		const result = await detectStrapi(fixturePath("strapi-v5-ts-postgres"))
		expect(result.strapiVersion).toBe("v5")
		expect(result.projectType).toBe("ts")
		expect(result.projectName).toBe("my-strapi-v5-ts-postgres")
	})

	it("detects strapi v4 with javascript", async () => {
		const result = await detectStrapi(fixturePath("strapi-v4-js-postgres"))
		expect(result.strapiVersion).toBe("v4")
		expect(result.projectType).toBe("js")
		expect(result.projectName).toBe("my-strapi-v4-js-postgres")
	})

	it("detects strapi v5 javascript project", async () => {
		const result = await detectStrapi(fixturePath("strapi-v5-js-sqlite"))
		expect(result.strapiVersion).toBe("v5")
		expect(result.projectType).toBe("js")
	})

	it("returns empty for project without strapi", async () => {
		const result = await detectStrapi(fixturePath("empty-project"))
		expect(result.strapiVersion).toBeUndefined()
	})

	it("returns empty for nonexistent directory", async () => {
		const result = await detectStrapi("/nonexistent/path")
		expect(result).toEqual({})
	})
})

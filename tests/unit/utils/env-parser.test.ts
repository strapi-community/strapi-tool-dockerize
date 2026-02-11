import { describe, it, expect } from "bun:test"
import { parseEnvContent } from "../../../src/utils/env-parser"

describe("parseEnvContent", () => {
	it("parses simple key=value pairs", () => {
		const result = parseEnvContent("FOO=bar\nBAZ=qux")
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" })
	})

	it("handles empty content", () => {
		const result = parseEnvContent("")
		expect(result).toEqual({})
	})

	it("ignores comment lines", () => {
		const result = parseEnvContent("# this is a comment\nFOO=bar")
		expect(result).toEqual({ FOO: "bar" })
	})

	it("ignores empty lines", () => {
		const result = parseEnvContent("FOO=bar\n\n\nBAZ=qux")
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" })
	})

	it("handles double-quoted values", () => {
		const result = parseEnvContent('FOO="hello world"')
		expect(result).toEqual({ FOO: "hello world" })
	})

	it("handles single-quoted values", () => {
		const result = parseEnvContent("FOO='hello world'")
		expect(result).toEqual({ FOO: "hello world" })
	})

	it("strips inline comments for unquoted values", () => {
		const result = parseEnvContent("FOO=bar # this is a comment")
		expect(result).toEqual({ FOO: "bar" })
	})

	it("handles escape sequences in double quotes", () => {
		const result = parseEnvContent('FOO="line1\\nline2"')
		expect(result).toEqual({ FOO: "line1\nline2" })
	})

	it("does not process escape sequences in single quotes", () => {
		const result = parseEnvContent("FOO='line1\\nline2'")
		expect(result).toEqual({ FOO: "line1\\nline2" })
	})

	it("handles multiline double-quoted values", () => {
		const result = parseEnvContent('FOO="line1\nline2"')
		expect(result).toEqual({ FOO: "line1\nline2" })
	})

	it("handles values with equals signs", () => {
		const result = parseEnvContent("FOO=bar=baz")
		expect(result).toEqual({ FOO: "bar=baz" })
	})

	it("trims whitespace around keys and values", () => {
		const result = parseEnvContent("  FOO  =  bar  ")
		expect(result).toEqual({ FOO: "bar" })
	})

	it("skips lines without equals sign", () => {
		const result = parseEnvContent("INVALID\nFOO=bar")
		expect(result).toEqual({ FOO: "bar" })
	})

	it("handles empty values", () => {
		const result = parseEnvContent("FOO=")
		expect(result).toEqual({ FOO: "" })
	})

	it("parses database connection vars", () => {
		const content = [
			"DATABASE_CLIENT=postgres",
			"DATABASE_HOST=localhost",
			"DATABASE_PORT=5432",
			"DATABASE_NAME=strapi",
			"DATABASE_USERNAME=strapi",
			'DATABASE_PASSWORD="str@pi!pass"',
		].join("\n")

		const result = parseEnvContent(content)
		expect(result.DATABASE_CLIENT).toBe("postgres")
		expect(result.DATABASE_HOST).toBe("localhost")
		expect(result.DATABASE_PORT).toBe("5432")
		expect(result.DATABASE_PASSWORD).toBe("str@pi!pass")
	})
})

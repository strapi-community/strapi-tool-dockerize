import { describe, expect, it } from "bun:test"
import { exec } from "../../../src/utils/process"

describe("exec", () => {
	it("runs a binary directly and captures stdout", async () => {
		const result = await exec("node", ["-e", "process.stdout.write('hello')"])
		expect(result.stdout).toBe("hello")
		expect(result.exitCode).toBe(0)
	})

	it("passes arguments as a literal list without shell interpretation", async () => {
		const result = await exec("node", ["-e", "process.stdout.write(process.argv[1])", "a;b&&c"])
		expect(result.stdout).toBe("a;b&&c")
	})

	it("reports a non-zero exit code", async () => {
		const result = await exec("node", ["-e", "process.exit(3)"])
		expect(result.exitCode).toBe(3)
	})

	it("rejects when the command cannot be spawned", async () => {
		await expect(exec("definitely-not-a-real-binary-xyz")).rejects.toThrow()
	})
})

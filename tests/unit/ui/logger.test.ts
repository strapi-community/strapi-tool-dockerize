import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { log } from "../../../src/ui/logger"

describe("log verbose mode", () => {
	afterEach(() => {
		log.setVerbose(false)
	})

	it("does not print debug output when verbose is off", () => {
		const spy = spyOn(console, "log").mockImplementation(() => {})
		log.setVerbose(false)
		log.debug("hidden message")
		expect(spy).not.toHaveBeenCalled()
		spy.mockRestore()
	})

	it("prints debug output when verbose is on", () => {
		const spy = spyOn(console, "log").mockImplementation(() => {})
		log.setVerbose(true)
		log.debug("shown message")
		expect(spy).toHaveBeenCalledTimes(1)
		expect(String(spy.mock.calls[0][0])).toContain("shown message")
		spy.mockRestore()
	})

	it("isVerbose reflects setVerbose", () => {
		log.setVerbose(true)
		expect(log.isVerbose()).toBe(true)
		log.setVerbose(false)
		expect(log.isVerbose()).toBe(false)
	})

	it("info, success, warn, and error print regardless of verbose", () => {
		const spy = spyOn(console, "log").mockImplementation(() => {})
		log.setVerbose(false)
		log.info("i")
		log.success("s")
		log.warn("w")
		log.error("e")
		expect(spy).toHaveBeenCalledTimes(4)
		spy.mockRestore()
	})
})

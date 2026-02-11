import { spawn } from "node:child_process"

export interface ExecOptions {
	cwd?: string
	env?: Record<string, string>
	stdio?: "pipe" | "inherit"
}

export interface ExecResult {
	stdout: string
	stderr: string
	exitCode: number
}

export function exec(
	command: string,
	args: string[] = [],
	options: ExecOptions = {},
): Promise<ExecResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd,
			env: options.env ? { ...process.env, ...options.env } : process.env,
			stdio: options.stdio === "inherit" ? "inherit" : "pipe",
			shell: true,
		})

		let stdout = ""
		let stderr = ""

		if (child.stdout) {
			child.stdout.on("data", (data: Buffer) => {
				stdout += data.toString()
			})
		}

		if (child.stderr) {
			child.stderr.on("data", (data: Buffer) => {
				stderr += data.toString()
			})
		}

		child.on("error", (error: Error) => {
			reject(new Error(`Failed to execute "${command}": ${error.message}`))
		})

		child.on("close", (code: number | null) => {
			resolve({
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				exitCode: code ?? 1,
			})
		})
	})
}

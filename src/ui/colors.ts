import pc from "picocolors"

export const success = (text: string) => pc.green(text)
export const error = (text: string) => pc.red(text)
export const warn = (text: string) => pc.yellow(text)
export const info = (text: string) => pc.cyan(text)
export const dim = (text: string) => pc.dim(text)
export const bold = (text: string) => pc.bold(text)
export const highlight = (text: string) => pc.magenta(text)

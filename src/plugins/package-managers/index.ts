import type { PackageManager } from "../../config"
import type { PackageManagerPlugin } from "../types"
import { bunPlugin } from "./bun"
import { npmPlugin } from "./npm"
import { pnpmPlugin } from "./pnpm"
import { yarnPlugin } from "./yarn"

export const packageManagerPlugins = new Map<PackageManager, PackageManagerPlugin>([
	["npm", npmPlugin],
	["yarn", yarnPlugin],
	["pnpm", pnpmPlugin],
	["bun", bunPlugin],
])

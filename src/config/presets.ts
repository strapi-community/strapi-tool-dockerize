import type { DetectedConfig } from "./schema"

const presets = {
	"local-dev": {
		environment: "development" as const,
		useCompose: true,
		useAdminer: true,
	},
	production: {
		environment: "production" as const,
		useCompose: true,
		useAdminer: false,
	},
	ci: {
		environment: "production" as const,
		useCompose: true,
		useAdminer: false,
	},
} as const satisfies Record<string, Partial<DetectedConfig>>

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export function getPreset(name: PresetName): Partial<DetectedConfig> {
	return { ...presets[name] }
}

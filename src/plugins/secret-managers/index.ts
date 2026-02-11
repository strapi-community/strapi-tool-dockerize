import type { SecretBackend } from "../../config"
import type { SecretManagerPlugin } from "../types"
import { dockerSecretsManager } from "./docker-secrets"
import { noneSecretManager } from "./none"

export const secretManagerPlugins = new Map<SecretBackend, SecretManagerPlugin>([
	["none", noneSecretManager],
	["docker-secrets", dockerSecretsManager],
])

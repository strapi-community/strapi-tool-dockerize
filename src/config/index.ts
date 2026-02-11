export {
	databaseClientSchema,
	packageManagerSchema,
	environmentSchema,
	projectTypeSchema,
	strapiVersionSchema,
	secretBackendSchema,
	detectedConfigSchema,
	resolvedConfigSchema,
} from "./schema"

export type {
	DatabaseClient,
	PackageManager,
	Environment,
	ProjectType,
	StrapiVersion,
	SecretBackend,
	DetectedConfig,
	ResolvedConfig,
} from "./schema"

export {
	DEFAULT_PORTS,
	DEFAULT_DATABASE_IMAGES,
	NODE_VERSIONS,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_HOST,
	STRAPI_HEALTH_CHECK_START_PERIOD,
	STRAPI_HEALTH_CHECK_INTERVAL,
	STRAPI_HEALTH_CHECK_TIMEOUT,
	STRAPI_HEALTH_CHECK_RETRIES,
	STRAPI_DEFAULT_PORT,
	ADMINER_IMAGE,
	ADMINER_PORT,
	DEFAULT_SECRET_BACKEND,
} from "./defaults"

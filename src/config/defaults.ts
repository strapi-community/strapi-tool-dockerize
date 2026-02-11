import type { DatabaseClient, StrapiVersion } from "./schema"

export const DEFAULT_PORTS: Record<DatabaseClient, number> = {
	postgres: 5432,
	mysql: 3306,
	mariadb: 3306,
	sqlite: 0,
}

export const DEFAULT_DATABASE_IMAGES: Record<DatabaseClient, string> = {
	postgres: "postgres:16-alpine",
	mysql: "mysql:8.4",
	mariadb: "mariadb:11",
	sqlite: "",
}

export const NODE_VERSIONS: Record<StrapiVersion, string> = {
	v4: "20",
	v5: "22",
}

export const DEFAULT_DATABASE_NAME = "strapi"
export const DEFAULT_DATABASE_USERNAME = "strapi"
export const DEFAULT_DATABASE_PASSWORD = "strapi"
export const DEFAULT_DATABASE_HOST = "localhost"

export const STRAPI_HEALTH_CHECK_START_PERIOD = "40s"
export const STRAPI_DEFAULT_PORT = 1337

export const ADMINER_IMAGE = "adminer:latest"
export const ADMINER_PORT = 8080

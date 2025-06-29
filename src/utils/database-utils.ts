/**
 * Database utility functions and constants
 * Consolidates database-related logic from across the codebase
 */

// Database type constants
export const DATABASE_TYPES = {
  POSTGRESQL: "postgresql",
  MYSQL: "mysql",
  MARIADB: "mariadb",
  SQLITE: "sqlite",
} as const;

export type DatabaseType = (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];

// Valid database types array
export const VALID_DATABASE_TYPES: DatabaseType[] =
  Object.values(DATABASE_TYPES);

// Database client mapping for Strapi
export const DATABASE_CLIENT_MAP: Record<DatabaseType, string> = {
  [DATABASE_TYPES.POSTGRESQL]: "postgres",
  [DATABASE_TYPES.MYSQL]: "mysql",
  [DATABASE_TYPES.MARIADB]: "mysql", // MariaDB uses mysql client in Strapi
  [DATABASE_TYPES.SQLITE]: "sqlite",
};

// Default database ports
export const DATABASE_PORTS: Record<DatabaseType, number> = {
  [DATABASE_TYPES.POSTGRESQL]: 5432,
  [DATABASE_TYPES.MYSQL]: 3306,
  [DATABASE_TYPES.MARIADB]: 3306,
  [DATABASE_TYPES.SQLITE]: 0, // SQLite doesn't use ports
};

// Docker image mappings
export const DATABASE_IMAGES: Record<
  DatabaseType,
  { image: string; tag: string }
> = {
  [DATABASE_TYPES.POSTGRESQL]: { image: "postgres", tag: "16.0-alpine" },
  [DATABASE_TYPES.MYSQL]: { image: "mysql", tag: "8.0" },
  [DATABASE_TYPES.MARIADB]: { image: "mariadb", tag: "10.11" },
  [DATABASE_TYPES.SQLITE]: { image: "", tag: "" }, // SQLite doesn't need Docker image
};

// Docker service name mappings
export const DATABASE_SERVICE_NAMES: Record<DatabaseType, string> = {
  [DATABASE_TYPES.POSTGRESQL]: "strapiDB",
  [DATABASE_TYPES.MYSQL]: "mysql",
  [DATABASE_TYPES.MARIADB]: "mariadb",
  [DATABASE_TYPES.SQLITE]: "", // SQLite doesn't need service
};

/**
 * Get the default port for a database type
 */
export function getDefaultPort(databaseType: string): number {
  const normalizedType = normalizeDatabaseType(databaseType);
  return DATABASE_PORTS[normalizedType] || DATABASE_PORTS[DATABASE_TYPES.MYSQL];
}

/**
 * Get the Strapi client name for a database type
 */
export function getDatabaseClient(databaseType: string): string {
  const normalizedType = normalizeDatabaseType(databaseType);
  return (
    DATABASE_CLIENT_MAP[normalizedType] ||
    DATABASE_CLIENT_MAP[DATABASE_TYPES.MYSQL]
  );
}

/**
 * Get Docker image configuration for a database type
 */
export function getDatabaseImage(databaseType: string): {
  image: string;
  tag: string;
} {
  const normalizedType = normalizeDatabaseType(databaseType);
  return (
    DATABASE_IMAGES[normalizedType] || DATABASE_IMAGES[DATABASE_TYPES.MYSQL]
  );
}

/**
 * Get Docker service name for a database type
 */
export function getDatabaseServiceName(databaseType: string): string {
  const normalizedType = normalizeDatabaseType(databaseType);
  return DATABASE_SERVICE_NAMES[normalizedType] || databaseType.toLowerCase();
}

/**
 * Normalize database type string to standard format
 */
export function normalizeDatabaseType(dbType: string): DatabaseType {
  const normalized = dbType.toLowerCase();
  switch (normalized) {
    case "postgres":
    case "postgresql":
    case "pg":
      return DATABASE_TYPES.POSTGRESQL;
    case "mysql":
      return DATABASE_TYPES.MYSQL;
    case "mariadb":
      return DATABASE_TYPES.MARIADB;
    case "sqlite":
    case "sqlite3":
      return DATABASE_TYPES.SQLITE;
    default:
      return DATABASE_TYPES.MYSQL; // Default fallback
  }
}

/**
 * Validate if a database type is supported
 */
export function isValidDatabaseType(databaseType: string): boolean {
  return VALID_DATABASE_TYPES.includes(normalizeDatabaseType(databaseType));
}

/**
 * Get all valid database types as a formatted string for CLI help
 */
export function getValidDatabaseTypesString(): string {
  return VALID_DATABASE_TYPES.join("|");
}

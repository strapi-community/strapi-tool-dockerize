/**
 * Consolidated utilities index
 * Provides easy access to all utility functions
 */

// Database utilities
export {
  DATABASE_TYPES,
  VALID_DATABASE_TYPES,
  DATABASE_CLIENT_MAP,
  DATABASE_PORTS,
  DATABASE_IMAGES,
  DATABASE_SERVICE_NAMES,
  getDefaultPort,
  getDatabaseClient,
  getDatabaseImage,
  getDatabaseServiceName,
  normalizeDatabaseType,
  isValidDatabaseType,
  getValidDatabaseTypesString,
  type DatabaseType,
} from "./database-utils";

// Security utilities
export {
  generateRandomString,
  generateSecurePassword,
  generateSecureDefaults,
  generateSecrets,
  generateModernSecrets,
} from "./security-utils";

// Re-export existing utilities for convenience
export { detectStrapiProject } from "./detection";
export { writeFiles, writeFilesWithEnv } from "./file-writer";
export { mergeEnvVariables, createDockerEnvSections } from "./env-manager";

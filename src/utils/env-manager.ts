import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export interface EnvConfig {
  [key: string]: string | undefined;
}

export async function updateEnvFile(
  projectPath: string,
  newConfig: EnvConfig,
  options: {
    backup?: boolean;
    environment?: 'development' | 'production';
  } = {}
): Promise<void> {
  const { backup = true, environment = 'development' } = options;
  const envFileName = environment === 'production' ? '.env.production' : '.env';
  const envPath = path.join(projectPath, envFileName);

  // Create backup if requested and file exists
  if (backup && fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup-${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
  }

  // Read existing env file if it exists
  let existingConfig: EnvConfig = {};
  if (fs.existsSync(envPath)) {
    existingConfig = dotenv.parse(fs.readFileSync(envPath));
  }

  // Merge configs, new values take precedence
  const mergedConfig = { ...existingConfig, ...newConfig };

  // Write the new env file
  const envContent = Object.entries(mergedConfig)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent);
}

export function generateDatabaseEnvConfig(
  databaseType: string,
  config: Record<string, any>
): EnvConfig {
  const envConfig: EnvConfig = {
    DATABASE_CLIENT: databaseType,
    DATABASE_VERSION: getDatabaseVersion(databaseType, config)
  };

  switch (databaseType) {
    case 'postgres':
      envConfig.DATABASE_HOST = config.POSTGRES_HOST || 'postgres';
      envConfig.DATABASE_PORT = config.POSTGRES_PORT?.toString() || '5432';
      envConfig.DATABASE_NAME = config.POSTGRES_DB;
      envConfig.DATABASE_USERNAME = config.POSTGRES_USER;
      envConfig.DATABASE_PASSWORD = config.POSTGRES_PASSWORD;
      break;

    case 'mysql':
      envConfig.DATABASE_HOST = config.MYSQL_HOST || 'mysql';
      envConfig.DATABASE_PORT = config.MYSQL_PORT?.toString() || '3306';
      envConfig.DATABASE_NAME = config.MYSQL_DATABASE;
      envConfig.DATABASE_USERNAME = config.MYSQL_USER;
      envConfig.DATABASE_PASSWORD = config.MYSQL_PASSWORD;
      break;

    case 'mariadb':
      envConfig.DATABASE_HOST = config.MARIADB_HOST || 'mariadb';
      envConfig.DATABASE_PORT = config.MARIADB_PORT?.toString() || '3306';
      envConfig.DATABASE_NAME = config.MARIADB_DATABASE;
      envConfig.DATABASE_USERNAME = config.MARIADB_USER;
      envConfig.DATABASE_PASSWORD = config.MARIADB_PASSWORD;
      break;

    case 'sqlite':
      envConfig.DATABASE_FILENAME = config.DATABASE_FILENAME;
      break;
  }

  return envConfig;
}

function getDatabaseVersion(type: string, config: Record<string, any>): string {
  switch (type) {
    case 'postgres':
      return config.POSTGRES_VERSION || '16-alpine';
    case 'mysql':
      return config.MYSQL_VERSION || '8.0';
    case 'mariadb':
      return config.MARIADB_VERSION || '10.11-lts';
    default:
      return '';
  }
}

export function readEnvFile(projectPath: string, environment?: string): EnvConfig {
  const envFileName = environment === 'production' ? '.env.production' : '.env';
  const envPath = path.join(projectPath, envFileName);

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return dotenv.parse(fs.readFileSync(envPath));
} 
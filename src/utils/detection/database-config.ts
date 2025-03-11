import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export interface DetectedDatabaseConfig {
  type?: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
}

export async function detectDatabaseConfig(projectPath: string): Promise<DetectedDatabaseConfig> {
  const config: DetectedDatabaseConfig = {};
  
  // Check .env file
  const envConfig = await detectFromEnvFile(projectPath);
  if (envConfig) {
    Object.assign(config, envConfig);
  }

  // Check Strapi config
  const strapiConfig = await detectFromStrapiConfig(projectPath);
  if (strapiConfig) {
    Object.assign(config, strapiConfig);
  }

  return config;
}

async function detectFromEnvFile(projectPath: string): Promise<DetectedDatabaseConfig | null> {
  const envPath = path.join(projectPath, '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  // Check for different database configurations
  if (envConfig.DATABASE_CLIENT) {
    return {
      type: mapDatabaseType(envConfig.DATABASE_CLIENT),
      host: envConfig.DATABASE_HOST,
      port: parseInt(envConfig.DATABASE_PORT),
      database: envConfig.DATABASE_NAME,
      username: envConfig.DATABASE_USERNAME,
      password: envConfig.DATABASE_PASSWORD,
      filename: envConfig.DATABASE_FILENAME // For SQLite
    };
  }

  // Check for specific database environment variables
  if (envConfig.POSTGRES_DB) {
    return {
      type: 'postgres',
      database: envConfig.POSTGRES_DB,
      username: envConfig.POSTGRES_USER,
      password: envConfig.POSTGRES_PASSWORD,
      port: parseInt(envConfig.POSTGRES_PORT)
    };
  }

  if (envConfig.MYSQL_DATABASE) {
    return {
      type: 'mysql',
      database: envConfig.MYSQL_DATABASE,
      username: envConfig.MYSQL_USER,
      password: envConfig.MYSQL_PASSWORD,
      port: parseInt(envConfig.MYSQL_PORT)
    };
  }

  if (envConfig.MARIADB_DATABASE) {
    return {
      type: 'mariadb',
      database: envConfig.MARIADB_DATABASE,
      username: envConfig.MARIADB_USER,
      password: envConfig.MARIADB_PASSWORD,
      port: parseInt(envConfig.MARIADB_PORT)
    };
  }

  return null;
}

async function detectFromStrapiConfig(projectPath: string): Promise<DetectedDatabaseConfig | null> {
  const configPaths = [
    path.join(projectPath, 'config', 'database.js'),
    path.join(projectPath, 'config', 'database.ts'),
    path.join(projectPath, 'config', 'database.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        if (configPath.endsWith('.json')) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          return mapStrapiConfig(config);
        } else {
          // For .js and .ts files, we'll need to parse them differently
          // This is a placeholder for now
          return null;
        }
      } catch (error) {
        console.error(`Error reading Strapi config from ${configPath}:`, error);
      }
    }
  }

  return null;
}

function mapDatabaseType(client: string): DetectedDatabaseConfig['type'] {
  const mapping: Record<string, DetectedDatabaseConfig['type']> = {
    'postgres': 'postgres',
    'postgresql': 'postgres',
    'mysql': 'mysql',
    'mysql2': 'mysql',
    'mariadb': 'mariadb',
    'sqlite': 'sqlite',
    'sqlite3': 'sqlite'
  };
  return mapping[client.toLowerCase()];
}

function mapStrapiConfig(config: any): DetectedDatabaseConfig {
  return {
    type: mapDatabaseType(config.connection?.client || config.client),
    host: config.connection?.host || config.host,
    port: config.connection?.port || config.port,
    database: config.connection?.database || config.database,
    username: config.connection?.user || config.user,
    password: config.connection?.password || config.password,
    filename: config.connection?.filename || config.filename
  };
} 
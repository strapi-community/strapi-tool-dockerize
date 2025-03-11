import { readFile } from 'fs/promises';
import { join } from 'path';
import { pathExists } from 'fs-extra';
import { z } from 'zod';

export interface ProjectInfo {
  name: string;
  type: 'typescript' | 'javascript';
  strapiVersion: string;
  environment?: 'development' | 'production';
  projectPath: string;
  databaseType?: string;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  envFile: {
    exists: boolean;
    databaseConfig?: {
      client: string;
      connection: {
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
        filename?: string;
      };
    };
  };
}

export interface DatabaseConfig {
  client: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

const packageJsonSchema = z.object({
  name: z.string(),
  dependencies: z.object({
    '@strapi/strapi': z.string().optional(),
    'strapi': z.string().optional(),
    'better-sqlite3': z.string().optional()
  }).optional()
});

export async function detectProject(projectPath: string): Promise<ProjectInfo> {
  try {
    console.log('Detecting project at:', projectPath);
    
    const info: ProjectInfo = {
      name: '',
      type: 'javascript',
      strapiVersion: '',
      environment: undefined,
      projectPath: projectPath,
      hasDockerfile: false,
      hasDockerCompose: false,
      envFile: {
        exists: false,
        databaseConfig: undefined
      }
    };

    // Check if it's a Strapi project
    const packageJsonPath = join(projectPath, 'package.json');
    console.log('Looking for package.json at:', packageJsonPath);
    
    let parsedPackageJson: z.infer<typeof packageJsonSchema> | null = null;
    
    if (await pathExists(packageJsonPath)) {
      console.log('Found package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      console.log('Dependencies:', packageJson.dependencies);
      
      const parsed = packageJsonSchema.safeParse(packageJson);
      console.log('Parsed package.json:', parsed.success ? 'success' : 'failed');
      
      if (parsed.success) {
        parsedPackageJson = parsed.data;
        const deps = parsed.data.dependencies;
        const strapiVersion = deps?.['@strapi/strapi'] || deps?.['strapi'];
        
        if (!strapiVersion) {
          throw new Error('Not a Strapi project. Please run this command in a Strapi project directory.');
        }
        
        info.name = parsed.data.name;
        info.strapiVersion = strapiVersion;
        console.log('Project name:', info.name);
        console.log('Strapi version:', info.strapiVersion);
      } else {
        throw new Error('Invalid package.json format');
      }
    } else {
      throw new Error('package.json not found. Please run this command in a Strapi project directory.');
    }

    // Check project type
    info.type = await pathExists(join(projectPath, 'tsconfig.json')) 
      ? 'typescript' 
      : 'javascript';

    // Check for Docker files
    info.hasDockerfile = await pathExists(join(projectPath, 'Dockerfile'));
    info.hasDockerCompose = await pathExists(join(projectPath, 'docker-compose.yml'));

    // Check for env file and database config
    const envExists = await pathExists(join(projectPath, '.env'));
    info.envFile.exists = envExists;

    if (envExists) {
      const envContent = await readFile(join(projectPath, '.env'), 'utf-8');
      info.envFile.databaseConfig = parseDatabaseConfig(envContent);
    }

    // Detect database type from config
    if (await pathExists(join(projectPath, 'config'))) {
      const dbConfig = await detectDatabaseConfig(projectPath, info.type);
      if (dbConfig) {
        info.databaseType = dbConfig.client;
      }
    }

    // If we still don't have a database type but have better-sqlite3 in dependencies
    if (!info.databaseType && parsedPackageJson?.dependencies?.['better-sqlite3']) {
      info.databaseType = 'sqlite';
    }

    console.log('Final project info:', info);
    return info;
  } catch (error) {
    console.error('Error detecting project:', error);
    throw error;
  }
}

function parseDatabaseConfig(envContent: string): { client: string; connection: { host?: string; port?: number; database?: string; username?: string; password?: string; filename?: string; } } | undefined {
  const config: { client: string; connection: { host?: string; port?: number; database?: string; username?: string; password?: string; filename?: string; } } = { client: '', connection: {} };
  
  const matches = {
    client: envContent.match(/DATABASE_CLIENT=(.+)/),
    host: envContent.match(/DATABASE_HOST=(.+)/),
    port: envContent.match(/DATABASE_PORT=(.+)/),
    name: envContent.match(/DATABASE_NAME=(.+)/),
    username: envContent.match(/DATABASE_USERNAME=(.+)/),
    password: envContent.match(/DATABASE_PASSWORD=(.+)/)
  };

  if (matches.client) {
    config.client = matches.client[1];
    config.connection.host = matches.host?.[1];
    config.connection.port = matches.port?.[1] ? parseInt(matches.port[1], 10) : undefined;
    config.connection.database = matches.name?.[1];
    config.connection.username = matches.username?.[1];
    config.connection.password = matches.password?.[1];
    return config;
  }

  return undefined;
}

async function detectDatabaseConfig(projectPath: string, projectType: 'typescript' | 'javascript'): Promise<DatabaseConfig | undefined> {
  const extension = projectType === 'typescript' ? 'ts' : 'js';
  const configPath = join(projectPath, 'config', 'database.' + extension);
  
  if (await pathExists(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      // Basic parsing - in real implementation we'd need a more robust solution
      const clientMatch = content.match(/client:\s*['"](.+)['"]/);
      return clientMatch ? { client: clientMatch[1] } : undefined;
    } catch {
      return undefined;
    }
  }
  
  return undefined;
} 
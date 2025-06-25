import { DatabasePluginConfig } from '../../core/types';

export function getTemplateVariables(config: any) {
  return {
    database: config.database || '.tmp/data.db',
    // SQLite doesn't need username/password/port
    SQLITE_FILENAME: config.database || '.tmp/data.db'
  };
}

export const sqliteConfig: DatabasePluginConfig = {
  name: 'SQLite',
  defaultPort: 0, // SQLite doesn't use a port
  containerName: 'strapi', // SQLite runs in the Strapi container
  volumePath: './.tmp', // Store SQLite file in .tmp directory
  getTemplateVariables,
  validateConnectionString: (connectionString: string) => {
    // SQLite connection string is just a file path
    return typeof connectionString === 'string' && connectionString.length > 0;
  }
}; 
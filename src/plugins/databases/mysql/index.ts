import { createDatabasePlugin } from '../core/base-plugin';
import { config } from './config';
import { getTemplateVariables } from './template-variables';

const plugin = createDatabasePlugin(config);

plugin.getTemplateVariables = getTemplateVariables;

export default plugin;

export const MySQLPlugin = {
  getConnectionString(config: DatabaseConfig): string {
    return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  },

  getDefaultPort(): number {
    return 3306;
  },

  getDefaultConfig(): Partial<DatabaseConfig> {
    return {
      host: 'localhost',
      port: this.getDefaultPort(),
      database: 'strapi',
      username: 'strapi'
    };
  },

  getDockerServiceName(): string {
    return 'strapi-mysql';
  },

  getDockerImage(): string {
    return 'mysql';
  },

  getDockerImageTag(): string {
    return '8.0';
  },

  validateConnectionString(url: string): boolean {
    try {
      const pattern = /^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
      return pattern.test(url);
    } catch {
      return false;
    }
  },

  validateConfig(config: DatabaseConfig): boolean {
    return !!(
      config.host &&
      config.port &&
      config.port > 0 &&
      config.port < 65536 &&
      config.database &&
      config.username &&
      config.password
    );
  },

  getEnvironmentVariables(answers: Record<string, any>): Record<string, string> {
    return {
      MYSQL_DATABASE: answers.database,
      MYSQL_USER: answers.username,
      MYSQL_PASSWORD: answers.password,
      MYSQL_ROOT_PASSWORD: answers.password, // For initial setup
      MYSQL_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
      MYSQL_COLLATION_SERVER: answers.collation || 'utf8mb4_unicode_ci'
    };
  }
}; 
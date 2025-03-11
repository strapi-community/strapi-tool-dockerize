import { BaseDatabasePlugin } from '../base';
import { DatabaseConfig } from '../types';

export class PostgreSQLPlugin extends BaseDatabasePlugin {
  name = 'postgresql';
  version = '1.0.0';
  description = 'PostgreSQL database plugin for Strapi';

  getConnectionString(config: DatabaseConfig): string {
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  getDefaultPort(): number {
    return 5432;
  }

  getDefaultConfig(): Partial<DatabaseConfig> {
    return {
      host: 'localhost',
      port: this.getDefaultPort(),
      database: 'strapi',
      username: 'strapi'
    };
  }

  getDockerServiceName(): string {
    return 'strapi-postgres';
  }

  getDockerImage(): string {
    return 'postgres';
  }

  getDockerImageTag(): string {
    return '16-alpine';
  }

  validateConnectionString(url: string): boolean {
    try {
      const pattern = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
      return pattern.test(url);
    } catch {
      return false;
    }
  }

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
  }

  getEnvironmentVariables(answers: Record<string, any>): Record<string, string> {
    return {
      POSTGRES_DB: answers.database,
      POSTGRES_USER: answers.username,
      POSTGRES_PASSWORD: answers.password,
      POSTGRES_HOST: answers.host,
      POSTGRES_PORT: answers.port.toString()
    };
  }
} 
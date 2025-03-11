import { BaseDatabasePlugin } from '../base';
import { DatabaseConfig } from '../types';
import { Question } from '../../core/types';

export class MariaDBPlugin extends BaseDatabasePlugin {
  name = 'mariadb';
  version = '1.0.0';
  description = 'MariaDB database plugin for Strapi';

  // Override getQuestions to add MariaDB-specific options
  getQuestions(): Question[] {
    return [
      ...super.getQuestions(),
      {
        type: 'select',
        name: 'version',
        message: 'Select MariaDB version:',
        default: '10.11',
        choices: [
          { label: '10.11 (Latest LTS)', value: '10.11', hint: 'Recommended for production' },
          { label: '10.6 (Previous LTS)', value: '10.6', hint: 'Older stable version' },
          { label: '11.2 (Latest)', value: '11.2', hint: 'Latest features, not LTS' }
        ]
      },
      {
        type: 'select',
        name: 'charset',
        message: 'Select character set:',
        default: 'utf8mb4',
        choices: [
          { label: 'UTF8MB4 (Recommended)', value: 'utf8mb4', hint: 'Full Unicode support' },
          { label: 'UTF8', value: 'utf8', hint: 'Basic Unicode support' },
          { label: 'Latin1', value: 'latin1', hint: 'Legacy encoding' }
        ]
      }
    ];
  }

  getConnectionString(config: DatabaseConfig): string {
    return `mariadb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  getDefaultPort(): number {
    return 3306;
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
    return 'strapi-mariadb';
  }

  getDockerImage(): string {
    return 'mariadb';
  }

  getDockerImageTag(): string {
    return '10.11'; // Default to latest LTS
  }

  validateConnectionString(url: string): boolean {
    try {
      const pattern = /^mariadb:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
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
      MARIADB_DATABASE: answers.database,
      MARIADB_USER: answers.username,
      MARIADB_PASSWORD: answers.password,
      MARIADB_ROOT_PASSWORD: answers.password, // For initial setup
      MARIADB_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
      MARIADB_COLLATION_SERVER: `${answers.charset || 'utf8mb4'}_unicode_ci`
    };
  }
} 
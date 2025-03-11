import { DatabasePluginConfig, DatabaseAnswers, Question } from './types';
import { generateSecurePassword } from '../../../utils/passwords';
import { getDockerImageVersions } from '../../../utils/docker-versions';

export interface DatabasePlugin {
  name: string;
  defaultPort: number;
  containerName: string;
  volumePath: string;
  getDefaultPort(): number;
  validateConfig(answers: any): boolean;
  validateConnectionString(connectionString: string): boolean;
  getTemplateVariables(config: any): Record<string, any>;
}

export function createDatabasePlugin(config: DatabasePluginConfig): DatabasePlugin {
  let cachedVersions: string[] = [];

  async function getVersions(): Promise<string[]> {
    if (cachedVersions.length === 0) {
      try {
        cachedVersions = await getDockerImageVersions(config.image.name);
      } catch (error) {
        // If we can't fetch versions, return a default list
        cachedVersions = [config.defaultVersion];
      }
    }
    return cachedVersions;
  }

  async function getQuestions(): Promise<Question[]> {
    const versions = await getVersions();
    const prefix = config.envPrefix;

    const baseQuestions: Question[] = [
      {
        type: 'text',
        name: `${prefix}_DATABASE`,
        message: 'What is your database name?',
        default: 'strapi',
        validate: (value) => {
          if (!value) return 'Database name is required';
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Database name can only contain letters, numbers, underscores and hyphens';
          }
          return true;
        }
      },
      {
        type: 'text',
        name: `${prefix}_USER`,
        message: 'What is your database user?',
        default: 'strapi',
        validate: (value) => {
          if (!value) return 'Database user is required';
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Username can only contain letters, numbers, underscores and hyphens';
          }
          return true;
        }
      },
      {
        type: 'select',
        name: 'PASSWORD_TYPE',
        message: 'How would you like to set the database password?',
        choices: [
          { label: 'Generate', value: 'generate', hint: 'Generate a secure password' },
          { label: 'Custom', value: 'custom', hint: 'Use a custom password' },
          { label: 'Existing', value: 'existing', hint: 'Use existing password from .env' }
        ],
        default: 'generate'
      },
      {
        type: 'text',
        name: `${prefix}_PASSWORD`,
        message: 'Enter your database password:',
        when: (answers) => answers.PASSWORD_TYPE === 'custom',
        validate: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters long';
          return true;
        }
      },
      {
        type: 'text',
        name: `${prefix}_PORT`,
        message: `Which port should ${config.name} use? (Press enter for default ${config.defaultPort})`,
        default: config.defaultPort.toString(),
        validate: (value) => {
          const port = parseInt(value);
          if (isNaN(port)) return 'Port must be a number';
          if (port < 1024 || port > 65535) return 'Port must be between 1024 and 65535';
          return true;
        }
      },
      {
        type: 'select',
        name: `${prefix}_VERSION`,
        message: `Which ${config.name} version would you like to use?`,
        choices: versions.map(version => ({
          value: version,
          label: `${config.name} ${version}`,
          hint: version.includes('alpine') ? 'Recommended for production' : undefined
        })),
        default: versions.find(v => v === config.defaultVersion) || versions[0]
      }
    ];

    return [...baseQuestions, ...(config.additionalQuestions || [])];
  }

  function processAnswers(answers: Record<string, any>): DatabaseAnswers {
    const prefix = config.envPrefix;
    const processed: DatabaseAnswers = {
      database: answers[`${prefix}_DATABASE`],
      username: answers[`${prefix}_USER`],
      password: answers.PASSWORD_TYPE === 'generate' 
        ? generateSecurePassword()
        : answers[`${prefix}_PASSWORD`],
      port: answers[`${prefix}_PORT`] || config.defaultPort.toString(),
      version: answers[`${prefix}_VERSION`] || config.defaultVersion
    };

    // Remove helper fields
    delete answers.PASSWORD_TYPE;

    return processed;
  }

  function getTemplateVariables(answers: DatabaseAnswers): Record<string, any> {
    return {
      database: {
        type: config.name.toLowerCase(),
        name: answers.database,
        user: answers.username,
        password: answers.password,
        port: answers.port,
        host: config.containerName
      },
      volumes: {
        data: config.volumePath
      },
      image: {
        name: config.image.name,
        tag: answers.version
      },
      healthcheck: config.healthcheck
    };
  }

  function validate(answers: DatabaseAnswers): boolean {
    if (!config.validations) return true;
    return config.validations.config(answers);
  }

  function validateField(field: string, value: any): boolean {
    if (!config.validations || !config.validations[field]) return true;
    return config.validations[field]!(value);
  }

  return {
    name: config.name,
    defaultPort: config.defaultPort,
    containerName: config.containerName,
    volumePath: config.volumePath,

    getDefaultPort() {
      return this.defaultPort;
    },

    validateConfig(answers: any) {
      const requiredFields = ['database', 'username', 'password', 'port'];
      return requiredFields.every(field => answers[field]);
    },

    validateConnectionString(connectionString: string) {
      // Basic connection string validation
      // Should match format: protocol://username:password@hostname:port/database
      const connectionStringPattern = /^[a-zA-Z]+:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+$/;
      return connectionStringPattern.test(connectionString);
    },

    getTemplateVariables(config: any) {
      return {
        port: config.port || this.defaultPort,
        database: config.database,
        username: config.username,
        password: config.password
      };
    }
  };
} 
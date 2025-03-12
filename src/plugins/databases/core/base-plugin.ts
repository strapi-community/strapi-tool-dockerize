import { Question } from "@/types/cli";
import { DatabasePlugin, DatabasePluginConfig } from "@/types/database";
import { getDockerImageVersions } from '@utils/docker-versions';
import { generateSecurePassword } from '@utils/passwords';

export function createDatabasePlugin(config: DatabasePluginConfig): DatabasePlugin {
  let cachedVersions: string[] = [];

  async function getVersions(): Promise<string[]> {
    if (cachedVersions.length === 0) {
      try {
        cachedVersions = await getDockerImageVersions(config.image.name);
      } catch (error) {
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
          { title: 'Generate', value: 'generate', description: 'Generate a secure password' },
          { title: 'Custom', value: 'custom', description: 'Use a custom password' }
        ],
        default: 'generate'
      },
      {
        type: 'text',
        name: `${prefix}_PASSWORD`,
        message: 'Enter your database password:',
        when: (answers: Record<string, any>) => answers.PASSWORD_TYPE === 'custom',
        validate: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters long';
          return true;
        }
      },
      {
        type: 'text',
        name: `${prefix}_PORT`,
        message: `Which port should ${config.name} use?`,
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
          title: `${config.name} ${version}`,
          value: version,
          description: version.includes('alpine') ? 'Recommended for production' : undefined
        })),
        default: versions.find(v => v === config.defaultVersion) || versions[0]
      }
    ];

    return [...baseQuestions, ...(config.additionalQuestions || [])];
  }

  function validateConfig(answers: DatabaseAnswers): ValidationResult {
    const errors: string[] = [];
    const requiredFields = ['database', 'username', 'password', 'port'] as const;
    
    for (const field of requiredFields) {
      if (!answers[field]) {
        errors.push(`${field} is required`);
      }
    }

    if (config.validations) {
      Object.entries(config.validations).forEach(([field, rules]) => {
        const value = answers[field as keyof DatabaseAnswers];
        if (rules.required && !value) {
          errors.push(`${field} is required`);
        }
        if (rules.minLength && value?.toString().length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value?.toString().length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value?.toString() || '')) {
          errors.push(`${field} has invalid format`);
        }
        if (rules.custom && !rules.custom(value)) {
          errors.push(`${field} validation failed`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  function validateConnectionString(connectionString: string): boolean {
    const pattern = new RegExp(`^${config.name.toLowerCase()}:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+$`);
    return pattern.test(connectionString);
  }

  function getTemplateVariables(answers: DatabaseAnswers): DatabaseTemplateVariables {
    const prefix = config.envPrefix;
    return {
      database: {
        type: config.name.toLowerCase(),
        name: answers.database,
        user: answers.username,
        password: answers.password,
        port: answers.port.toString(),
        host: 'localhost'
      },
      environment: {
        [`${prefix}_DATABASE`]: answers.database,
        [`${prefix}_USER`]: answers.username,
        [`${prefix}_PASSWORD`]: answers.password,
        [`${prefix}_ROOT_PASSWORD`]: answers.rootPassword || answers.password,
        [`${prefix}_CHARACTER_SET_SERVER`]: answers.charset || 'utf8mb4',
        [`${prefix}_COLLATION_SERVER`]: answers.collation || 'utf8mb4_unicode_ci'
      },
      volumes: {
        data: config.volumePath
      },
      image: {
        name: config.image.name,
        tag: answers.version || config.defaultVersion
      }
    };
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

    delete answers.PASSWORD_TYPE;
    return processed;
  }

  return {
    ...config,
    validateConfig,
    validateConnectionString,
    getTemplateVariables,
    getQuestions,
    processAnswers
  };
} 
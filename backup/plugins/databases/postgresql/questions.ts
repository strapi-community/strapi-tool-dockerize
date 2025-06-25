import { Question } from '../core/types';
import { generateSecurePassword } from '../../../utils/passwords';

export const questions: Question[] = [
  {
    type: 'text',
    name: 'POSTGRES_DB',
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
    name: 'POSTGRES_USER',
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
      'generate',    // Generate a secure password
      'custom',      // Use a custom password
      'existing'     // Use existing password from .env
    ],
    default: 'generate'
  },
  {
    type: 'text',
    name: 'POSTGRES_PASSWORD',
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
    name: 'POSTGRES_PORT',
    message: 'Which port should PostgreSQL use?',
    default: '5432',
    validate: (value) => {
      const port = parseInt(value);
      if (isNaN(port)) return 'Port must be a number';
      if (port < 1024 || port > 65535) return 'Port must be between 1024 and 65535';
      return true;
    }
  },
  {
    type: 'text',
    name: 'POSTGRES_SCHEMA',
    message: 'What schema would you like to use?',
    default: 'public',
    validate: (value) => {
      if (!value) return 'Schema name is required';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Schema name can only contain letters, numbers, underscores and hyphens';
      }
      return true;
    }
  },
  {
    type: 'select',
    name: 'POSTGRES_SSL_MODE',
    message: 'Which SSL mode would you like to use?',
    choices: [
      { label: 'Disable', value: 'disable', hint: 'No SSL (default)' },
      { label: 'Require', value: 'require', hint: 'Always use SSL' },
      { label: 'Verify CA', value: 'verify-ca', hint: 'Verify server certificate' },
      { label: 'Verify Full', value: 'verify-full', hint: 'Verify server certificate and hostname' }
    ],
    default: 'disable'
  }
];

export function processAnswers(answers: Record<string, any>): Record<string, any> {
  const processed = { ...answers };

  // Generate password if requested
  if (answers.PASSWORD_TYPE === 'generate') {
    processed.POSTGRES_PASSWORD = generateSecurePassword();
  }

  // Remove PASSWORD_TYPE as it's not needed in final config
  delete processed.PASSWORD_TYPE;

  return processed;
} 
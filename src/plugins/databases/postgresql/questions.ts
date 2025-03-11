import { Question } from '../../core/types';

export function getQuestions(): Question[] {
  return [
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
      type: 'text',
      name: 'POSTGRES_PASSWORD',
      message: 'What is your database password?',
      validate: (value) => {
        if (!value) return 'Database password is required';
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
    }
  ];
} 
import { Question } from '../../core/types';

export function getQuestions(): Question[] {
  return [
    {
      type: 'text',
      name: 'DATABASE_FILENAME',
      message: 'What should be the SQLite database filename?',
      default: '.tmp/data.db',
      validate: (value) => {
        if (!value) return 'Database filename is required';
        if (!value.endsWith('.db')) return 'Filename should end with .db';
        return true;
      }
    },
    {
      type: 'select',
      name: 'STORAGE_TYPE',
      message: 'How would you like to store the SQLite database?',
      choices: [
        'volume',     // Docker volume (recommended)
        'bind-mount'  // Bind mount to host filesystem
      ],
      default: 'volume'
    },
    {
      type: 'text',
      name: 'MOUNT_PATH',
      message: 'Where should the SQLite data be stored?',
      default: '/strapi/data',
      validate: (value) => {
        if (!value) return 'Mount path is required';
        if (!value.startsWith('/')) return 'Mount path should be absolute';
        return true;
      }
    }
  ];
} 
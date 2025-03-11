import { DatabaseAnswers, TemplateVariables } from '@types';
import { generateSecurePassword } from '../../../utils/passwords';

export function getTemplateVariables(answers: DatabaseAnswers): TemplateVariables {
  const rootPassword = answers.MARIADB_ROOT_PASSWORD_TYPE === 'custom' 
    ? answers.MARIADB_ROOT_PASSWORD
    : answers.MARIADB_ROOT_PASSWORD_TYPE === 'random'
      ? generateSecurePassword()
      : answers.MARIADB_ROOT_PASSWORD_TYPE === 'empty'
        ? ''
        : answers.password;

  return {
    database: {
      type: 'mariadb',
      name: answers.database,
      user: answers.username,
      password: answers.password,
      port: answers.port,
      host: 'localhost'
    },
    environment: {
      MARIADB_DATABASE: answers.database,
      MARIADB_USER: answers.username,
      MARIADB_PASSWORD: answers.password,
      MARIADB_ROOT_PASSWORD: rootPassword,
      MARIADB_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
      MARIADB_COLLATION_SERVER: answers.collation || 'utf8mb4_unicode_ci'
    },
    volumes: {
      data: '/var/lib/mysql'
    },
    image: {
      name: 'mariadb',
      tag: answers.version || '11.2'
    }
  };
} 
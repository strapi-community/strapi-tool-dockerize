import { DatabaseAnswers, TemplateVariables } from '@types';
import { generateSecurePassword } from '../../../utils/passwords';

export function getTemplateVariables(answers: DatabaseAnswers): TemplateVariables {
  const rootPassword = answers.MYSQL_ROOT_PASSWORD_TYPE === 'custom' 
    ? answers.MYSQL_ROOT_PASSWORD
    : answers.MYSQL_ROOT_PASSWORD_TYPE === 'random'
      ? generateSecurePassword()
      : answers.MYSQL_ROOT_PASSWORD_TYPE === 'empty'
        ? ''
        : answers.password;

  return {
    database: {
      type: 'mysql',
      name: answers.database,
      user: answers.username,
      password: answers.password,
      port: answers.port.toString(),
      host: 'localhost'
    },
    environment: {
      MYSQL_DATABASE: answers.database,
      MYSQL_USER: answers.username,
      MYSQL_PASSWORD: answers.password,
      MYSQL_ROOT_PASSWORD: rootPassword || answers.password,
      MYSQL_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
      MYSQL_COLLATION_SERVER: answers.collation || 'utf8mb4_unicode_ci'
    },
    volumes: {
      data: '/var/lib/mysql'
    },
    image: {
      name: 'mysql',
      tag: answers.version || '8.0'
    }
  };
} 
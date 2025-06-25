import { DatabaseAnswers } from '../core/types';

export function getTemplateVariables(answers: DatabaseAnswers) {
  return {
    postgres: {
      schema: answers.POSTGRES_SCHEMA || 'public',
      sslMode: answers.POSTGRES_SSL_MODE || 'disable'
    }
  };
} 
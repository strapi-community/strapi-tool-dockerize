import { DatabaseAnswers } from '../core/types';

export function getTemplateVariables(baseVars: Record<string, any>, answers: DatabaseAnswers) {
  return {
    ...baseVars,
    sqlite: {
      storageType: answers.SQLITE_STORAGE_TYPE || 'volume',
      mountPath: answers.SQLITE_MOUNT_PATH || './.tmp/data',
      filename: 'strapi.db'
    }
  };
} 
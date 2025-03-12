import { DatabasePlugin, DatabaseAnswers } from '@types';
import { 
  createDatabasePlugin, 
  createBaseTemplateVariables, 
  mergeTemplateVariables 
} from '../../core';
import { mysqlConfig } from './config';
import { validateConfig } from './validation';

// Create the plugin instance using the base plugin creator
const MySQLPlugin: DatabasePlugin = {
  ...createDatabasePlugin(mysqlConfig),
  validateConfig,
  getTemplateVariables: (answers: DatabaseAnswers) => {
    const baseVariables = createBaseTemplateVariables(mysqlConfig, answers);
    return mergeTemplateVariables(baseVariables, {
      environment: {
        MYSQL_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
        MYSQL_COLLATION_SERVER: answers.collation || 'utf8mb4_unicode_ci'
      }
    });
  }
};

export default MySQLPlugin; 
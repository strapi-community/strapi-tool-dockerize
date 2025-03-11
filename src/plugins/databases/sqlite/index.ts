import { createDatabasePlugin } from '../core/base-plugin';
import { config } from './config';
import { getTemplateVariables } from './template-variables';

const plugin = createDatabasePlugin(config);

// Override template variables
const baseGetTemplateVariables = plugin.getTemplateVariables;
plugin.getTemplateVariables = (answers) => 
  getTemplateVariables(baseGetTemplateVariables(answers), answers);

export const SQLitePlugin = plugin; 
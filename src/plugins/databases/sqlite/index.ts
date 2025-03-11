import { createDatabasePlugin } from '../core/base-plugin';
import { config } from './config';
import { getTemplateVariables } from './template-variables';

const plugin = createDatabasePlugin(config);

plugin.getTemplateVariables = getTemplateVariables;

export default plugin; 
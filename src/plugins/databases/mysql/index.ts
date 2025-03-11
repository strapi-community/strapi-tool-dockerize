import { DatabasePlugin } from '@types';
import { createDatabasePlugin } from '../core/base-plugin';
import { mysqlConfig } from './config';

// Create the plugin instance using the base plugin creator
const MySQLPlugin: DatabasePlugin = createDatabasePlugin(mysqlConfig);

export default MySQLPlugin; 
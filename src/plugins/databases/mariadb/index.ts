import { DatabasePlugin } from '@types';
import { createDatabasePlugin } from '../core/base-plugin';
import { mariadbConfig } from './config';

// Create the plugin instance using the base plugin creator
const MariaDBPlugin: DatabasePlugin = createDatabasePlugin(mariadbConfig);

export default MariaDBPlugin; 
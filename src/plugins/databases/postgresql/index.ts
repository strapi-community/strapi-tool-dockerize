import { createDatabasePlugin } from '@plugins/databases/core/base-plugin';
import { postgresConfig } from './config';

// Creates a full PostgreSQL plugin with all common functionality
export default createDatabasePlugin(postgresConfig); 
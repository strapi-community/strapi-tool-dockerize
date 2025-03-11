import { DatabasePluginConfig } from '../core/types';
import { questions } from './questions';
import { validateConfig, validateSchema, validateSSLMode, validateConnectionString } from './validations';

export const config: DatabasePluginConfig = {
  name: 'PostgreSQL',
  defaultPort: 5432,
  containerName: 'strapi-postgres',
  volumePath: '/var/lib/postgresql/data',
  envPrefix: 'POSTGRES',
  defaultVersion: '16-alpine',
  image: {
    name: 'postgres'
  },
  healthcheck: {
    test: (answers) => `pg_isready -U ${answers.username}`,
    interval: '10s',
    timeout: '5s',
    retries: 5
  },
  additionalQuestions: questions,
  validations: {
    config: validateConfig,
    schema: validateSchema,
    sslMode: validateSSLMode,
    connectionString: validateConnectionString
  }
}; 
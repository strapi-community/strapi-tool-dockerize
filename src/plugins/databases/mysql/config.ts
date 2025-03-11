import { DatabasePluginConfig } from '../core/types';
import { questions } from './questions';
import { validateConfig, validateCharset, validateCollation, validateRootPassword, validateConnectionString } from './validations';

export const config: DatabasePluginConfig = {
  name: 'MySQL',
  defaultPort: 3306,
  containerName: 'strapi-mysql',
  volumePath: '/var/lib/mysql',
  envPrefix: 'MYSQL',
  defaultVersion: '8.0',
  image: {
    name: 'mysql'
  },
  healthcheck: {
    test: (answers) => `mysqladmin ping -h localhost -u ${answers.username} --password=${answers.password}`,
    interval: '10s',
    timeout: '5s',
    retries: 5
  },
  additionalEnvVars: [
    'MYSQL_ROOT_PASSWORD',
    'MYSQL_ALLOW_EMPTY_PASSWORD',
    'MYSQL_RANDOM_ROOT_PASSWORD'
  ],
  additionalQuestions: questions,
  validations: {
    config: validateConfig,
    charset: validateCharset,
    collation: validateCollation,
    rootPassword: validateRootPassword,
    connectionString: validateConnectionString
  }
}; 
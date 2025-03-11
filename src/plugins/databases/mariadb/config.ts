import { DatabasePluginConfig } from '../core/types';
import { questions } from './questions';
import { validateConfig, validateCharset, validateRootPassword, validateConnectionString } from './validations';

export const config: DatabasePluginConfig = {
  name: 'MariaDB',
  defaultPort: 3306,
  containerName: 'strapi-mariadb',
  volumePath: '/var/lib/mysql',
  envPrefix: 'MARIADB',
  defaultVersion: '10.11',  // LTS version
  image: {
    name: 'mariadb'
  },
  healthcheck: {
    test: (answers) => `mysqladmin ping -h localhost -u ${answers.username} --password=${answers.password}`,
    interval: '10s',
    timeout: '5s',
    retries: 5
  },
  additionalEnvVars: [
    'MARIADB_ROOT_PASSWORD',
    'MARIADB_ALLOW_EMPTY_PASSWORD',
    'MARIADB_RANDOM_ROOT_PASSWORD'
  ],
  additionalQuestions: questions,
  validations: {
    config: validateConfig,
    charset: validateCharset,
    rootPassword: validateRootPassword,
    connectionString: validateConnectionString
  }
}; 
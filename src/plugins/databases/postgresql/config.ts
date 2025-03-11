import { DatabasePluginConfig, ValidationRules } from '@types';
import { validateDatabase, validateUsername, validatePassword, validateSSLMode } from './validations';

export const postgresConfig: DatabasePluginConfig = {
  name: 'PostgreSQL',
  defaultPort: 5432,
  containerName: 'postgres',
  volumePath: '/var/lib/postgresql/data',
  image: {
    name: 'postgres',
    tag: 'latest'
  },
  defaultVersion: '16-alpine',
  envPrefix: 'POSTGRES',
  healthcheck: {
    command: 'pg_isready',
    interval: '10s',
    timeout: '5s',
    retries: 5
  },
  validations: {
    database: validateDatabase,
    username: validateUsername,
    password: validatePassword,
    sslMode: validateSSLMode
  },
  additionalQuestions: [
    {
      type: 'select',
      name: 'POSTGRES_SSL_MODE',
      message: 'Select SSL mode:',
      choices: [
        { value: 'disable', label: 'Disable' },
        { value: 'allow', label: 'Allow' },
        { value: 'prefer', label: 'Prefer' },
        { value: 'require', label: 'Require' },
        { value: 'verify-ca', label: 'Verify CA' },
        { value: 'verify-full', label: 'Verify Full' }
      ],
      default: 'disable'
    }
  ]
}; 
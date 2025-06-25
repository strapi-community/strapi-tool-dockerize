import { DatabasePluginConfig } from '@types';

export const mariadbConfig: DatabasePluginConfig = {
  name: 'MariaDB',
  defaultPort: 3306,
  containerName: 'mariadb',
  volumePath: '/var/lib/mysql',
  envPrefix: 'MARIADB',
  defaultVersion: '11.2',
  image: {
    name: 'mariadb',
    tag: '11.2'
  },
  healthcheck: {
    command: "mariadb-admin ping -h localhost",
    interval: '10s',
    timeout: '5s',
    retries: 5
  },
  validations: {
    database: {
      required: true,
      pattern: /^[a-zA-Z0-9_]+$/,
      minLength: 1
    },
    username: {
      required: true,
      pattern: /^[a-zA-Z0-9_]+$/,
      minLength: 1
    },
    password: {
      required: true,
      minLength: 8
    }
  },
  additionalQuestions: []
}; 
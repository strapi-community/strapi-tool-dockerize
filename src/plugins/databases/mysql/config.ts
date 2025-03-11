import { DatabasePluginConfig } from '@types';
import { questions } from './questions';

export const mysqlConfig: DatabasePluginConfig = {
  name: 'MySQL',
  defaultPort: 3306,
  containerName: 'mysql',
  volumePath: '/var/lib/mysql',
  envPrefix: 'MYSQL',
  defaultVersion: '8.0',
  image: {
    name: 'mysql',
    tag: '8.0'
  },
  healthcheck: {
    command: "mysqladmin ping -h localhost",
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
  additionalQuestions: questions
}; 
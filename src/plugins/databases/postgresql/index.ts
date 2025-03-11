import { BaseDatabasePlugin } from '../core/base-plugin';
import { DatabasePluginConfig, DatabaseAnswers } from '../core/types';

export class PostgreSQLPlugin extends BaseDatabasePlugin {
  constructor() {
    const config: DatabasePluginConfig = {
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
        test: (answers: DatabaseAnswers) => `pg_isready -U ${answers.username}`,
        interval: '10s',
        timeout: '5s',
        retries: 5
      }
    };
    super(config);
  }
} 
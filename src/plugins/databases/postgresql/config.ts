export function getTemplateVariables(config: Record<string, any>): Record<string, any> {
  return {
    database: {
      type: 'postgresql',
      name: config.POSTGRES_DB,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      port: config.POSTGRES_PORT || 5432,
      host: 'postgres' // Container name in docker-compose
    },
    volumes: {
      data: '/var/lib/postgresql/data'
    },
    image: {
      name: 'postgres',
      tag: config.POSTGRES_VERSION || '16-alpine'
    },
    healthcheck: {
      test: `pg_isready -U ${config.POSTGRES_USER}`,
      interval: '10s',
      timeout: '5s',
      retries: 5
    }
  };
} 
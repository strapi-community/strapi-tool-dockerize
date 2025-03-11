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
      tag: '16-alpine'
    }
  };
} 
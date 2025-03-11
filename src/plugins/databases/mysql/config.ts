export function getTemplateVariables(config: Record<string, any>): Record<string, any> {
  return {
    database: {
      type: 'mysql',
      name: config.MYSQL_DATABASE,
      user: config.MYSQL_USER,
      password: config.MYSQL_PASSWORD,
      rootPassword: config.MYSQL_ROOT_PASSWORD,
      port: config.MYSQL_PORT || 3306,
      host: 'mysql' // Container name in docker-compose
    },
    volumes: {
      data: '/var/lib/mysql'
    },
    image: {
      name: 'mysql',
      tag: '8.0'
    },
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  };
} 
export function getTemplateVariables(config: Record<string, any>): Record<string, any> {
  return {
    database: {
      type: 'mariadb',
      name: config.MARIADB_DATABASE,
      user: config.MARIADB_USER,
      password: config.MARIADB_PASSWORD,
      rootPassword: config.MARIADB_ROOT_PASSWORD,
      port: config.MARIADB_PORT || 3306,
      host: 'mariadb' // Container name in docker-compose
    },
    volumes: {
      data: '/var/lib/mysql'
    },
    image: {
      name: 'mariadb',
      tag: config.MARIADB_VERSION
    },
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  };
} 
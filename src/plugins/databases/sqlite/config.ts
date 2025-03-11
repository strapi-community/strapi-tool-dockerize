export function getTemplateVariables(config: Record<string, any>): Record<string, any> {
  return {
    database: {
      type: 'sqlite',
      filename: config.DATABASE_FILENAME,
      path: config.MOUNT_PATH
    },
    storage: {
      type: config.STORAGE_TYPE,
      volume: config.STORAGE_TYPE === 'volume' ? 'sqlite_data' : undefined,
      bindMount: config.STORAGE_TYPE === 'bind-mount' ? {
        source: './data',  // Local directory on host
        target: config.MOUNT_PATH
      } : undefined
    },
    // SQLite doesn't need a separate container, it runs within the Strapi service
    image: null,
    // Add warning for production use
    warnings: [
      config.STORAGE_TYPE === 'bind-mount' 
        ? 'Using bind mount for SQLite storage. Make sure the host directory exists and has proper permissions.'
        : 'Using Docker volume for SQLite storage. Data will persist but is managed by Docker.'
    ]
  };
} 
import { DatabasePlugin, PluginType } from '@types';
import MySQLPlugin from './databases/mysql';
import MariaDBPlugin from './databases/mariadb';
import PostgreSQLPlugin from './databases/postgresql';

// Plugin registry
const plugins: Record<string, DatabasePlugin> = {
  mysql: MySQLPlugin,
  mariadb: MariaDBPlugin,
  postgresql: PostgreSQLPlugin
} as const;

// Plugin type guard
export const isDatabasePlugin = (plugin: unknown): plugin is DatabasePlugin => {
  return plugin !== null && 
    typeof plugin === 'object' && 
    'type' in plugin && 
    (plugin as DatabasePlugin).type === 'database';
};

// Plugin utilities with proper typing
export const getPlugin = (name: string): DatabasePlugin | undefined => 
  plugins[name];

export const getPluginsByType = (type: PluginType): DatabasePlugin[] => 
  Object.values(plugins).filter(plugin => 
    isDatabasePlugin(plugin) && plugin.type === type
  );

export const getAllPlugins = (): DatabasePlugin[] => 
  Object.values(plugins);

// Export core functionality
export * from './core';

// Export plugin registry
export default plugins; 
import { DatabasePlugin } from '@types';

const plugins = new Map<string, DatabasePlugin>();

export async function loadPlugins() {
  const plugins = new Map<string, DatabasePlugin>();

  // Dynamic imports to get the actual plugin instances
  const postgresql = (await import('@plugins/databases/postgresql')).default;
  const mysql = (await import('@plugins/databases/mysql')).default;
  const mariadb = (await import('@plugins/databases/mariadb')).default;
  const sqlite = (await import('@plugins/databases/sqlite')).default;

  plugins.set('postgresql', postgresql);
  plugins.set('mysql', mysql);
  plugins.set('mariadb', mariadb);
  plugins.set('sqlite', sqlite);

  return plugins;
}

export function registerPlugin(plugin: DatabasePlugin) {
  plugins.set(plugin.name, plugin);
}

export function getPlugin(name: string): DatabasePlugin | undefined {
  return plugins.get(name);
}

export function getPluginQuestions(pluginName: string) {
  const plugin = plugins.get(pluginName);
  if (!plugin) {
    throw new Error(`Plugin ${pluginName} not found`);
  }

  return [
    {
      type: 'text',
      name: 'database',
      message: 'Database name?',
      default: 'strapi'
    },
    {
      type: 'text',
      name: 'username',
      message: 'Database username?',
      default: 'strapi'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Database password?',
      validate: (input: string) => input.length >= 8
    },
    {
      type: 'text',
      name: 'port',
      message: 'Database port?',
      default: plugin.defaultPort.toString()
    },
    // Add additional questions if they exist
    ...(plugin.additionalQuestions || [])
  ];
}

export function processPluginAnswers(pluginName: string, answers: any) {
  const plugin = plugins.get(pluginName);
  if (!plugin) {
    throw new Error(`Plugin ${pluginName} not found`);
  }

  if (!plugin.validateConfig(answers)) {
    throw new Error('Invalid configuration');
  }

  return {
    templateVariables: plugin.getTemplateVariables(answers),
    containerName: plugin.containerName,
    volumePath: plugin.volumePath
  };
}

export function getAvailablePlugins(): DatabasePlugin[] {
  return Array.from(plugins.values());
} 
import fs from 'fs';
import path from 'path';
import { DatabasePlugin } from './types';

export async function loadDatabasePlugins(pluginsPath: string): Promise<Map<string, DatabasePlugin>> {
  const plugins = new Map<string, DatabasePlugin>();
  const databasesPath = path.join(pluginsPath, 'databases');

  try {
    const entries = fs.readdirSync(databasesPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const plugin = await loadDatabasePlugin(path.join(databasesPath, entry.name));
        if (plugin) {
          plugins.set(plugin.name, plugin);
        }
      }
    }
  } catch (error) {
    console.error('Error loading plugins:', error);
  }

  return plugins;
}

async function loadDatabasePlugin(pluginPath: string): Promise<DatabasePlugin | null> {
  try {
    const [questions, config, validation] = await Promise.all([
      import(path.join(pluginPath, 'questions')),
      import(path.join(pluginPath, 'config')),
      import(path.join(pluginPath, 'validation'))
    ]);

    return {
      name: path.basename(pluginPath),
      getQuestions: questions.getQuestions,
      validateConfig: validation.validateConfig,
      getTemplateVariables: config.getTemplateVariables
    };
  } catch (error) {
    console.error(`Error loading plugin from ${pluginPath}:`, error);
    return null;
  }
}

export function getDatabasePlugin(plugins: Map<string, DatabasePlugin>, name: string): DatabasePlugin | undefined {
  return plugins.get(name);
}

export function getAllDatabasePlugins(plugins: Map<string, DatabasePlugin>): DatabasePlugin[] {
  return Array.from(plugins.values());
} 
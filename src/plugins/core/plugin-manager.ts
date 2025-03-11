import fs from 'fs';
import path from 'path';
import { Plugin } from './types';
import { DatabasePlugin } from '../databases/types';

export class PluginManager {
  private plugins: Map<string, Plugin>;
  private pluginsPath: string;

  constructor(pluginsPath: string) {
    this.plugins = new Map();
    this.pluginsPath = pluginsPath;
  }

  // Load all plugins from the plugins directory
  async loadPlugins(): Promise<void> {
    try {
      // Get all database plugin directories
      const databasesPath = path.join(this.pluginsPath, 'databases');
      const entries = fs.readdirSync(databasesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(databasesPath, entry.name);
          await this.loadPlugin(pluginPath);
        }
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }

  // Load a specific plugin from a directory
  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const indexPath = path.join(pluginPath, 'index.ts');
      if (fs.existsSync(indexPath)) {
        const plugin = await import(indexPath);
        const pluginInstance = this.instantiatePlugin(plugin);
        if (pluginInstance) {
          this.plugins.set(pluginInstance.name, pluginInstance);
        }
      }
    } catch (error) {
      console.error(`Error loading plugin from ${pluginPath}:`, error);
    }
  }

  // Create an instance of the plugin
  private instantiatePlugin(plugin: any): Plugin | null {
    const PluginClass = Object.values(plugin)[0];
    if (typeof PluginClass === 'function') {
      try {
        return new PluginClass();
      } catch (error) {
        console.error('Error instantiating plugin:', error);
      }
    }
    return null;
  }

  // Get a specific database plugin
  getDatabasePlugin(name: string): DatabasePlugin | undefined {
    const plugin = this.plugins.get(name);
    if (plugin?.type === 'database') {
      return plugin as DatabasePlugin;
    }
    return undefined;
  }

  // Get all available database plugins
  getAllDatabasePlugins(): DatabasePlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.type === 'database') as DatabasePlugin[];
  }

  // Load templates for a specific plugin
  async loadTemplates(pluginName: string): Promise<Record<string, string>> {
    const templates: Record<string, string> = {};
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      return templates;
    }

    const templatesPath = path.join(this.pluginsPath, plugin.type + 's', pluginName, 'templates');
    if (!fs.existsSync(templatesPath)) {
      return templates;
    }

    const files = fs.readdirSync(templatesPath);
    for (const file of files) {
      if (file.endsWith('.liquid')) {
        const templateName = path.basename(file, '.liquid');
        const templateContent = fs.readFileSync(path.join(templatesPath, file), 'utf-8');
        templates[templateName] = templateContent;
      }
    }

    return templates;
  }

  // Generate Docker configuration based on selected database
  async generateDockerConfig(databaseType: string, answers: Record<string, any>): Promise<{
    templates: Record<string, string>;
    variables: Record<string, any>;
  }> {
    const plugin = this.getDatabasePlugin(databaseType);
    if (!plugin) {
      throw new Error(`Database plugin ${databaseType} not found`);
    }

    // Load templates
    const templates = await this.loadTemplates(databaseType);

    // Get template variables from plugin
    const templateData = plugin.getTemplates(answers)[0]; // Get first template for now
    
    return {
      templates,
      variables: templateData.variables
    };
  }
} 
import { readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import type { DatabasePlugin, DiscoveredPlugin } from "../types";

// Import all built-in plugins statically
import { postgresqlPlugin } from "../plugins/databases/postgresql";
import { mysqlPlugin } from "../plugins/databases/mysql";
import { mariadbPlugin } from "../plugins/databases/mariadb";
import { sqlitePlugin } from "../plugins/databases/sqlite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Built-in plugins registry
const builtinPlugins: DatabasePlugin[] = [
  postgresqlPlugin,
  mysqlPlugin,
  mariadbPlugin,
  sqlitePlugin,
];

// Plugin registry
const discoveredPlugins = new Map<string, DiscoveredPlugin>();
let initialized = false;

export async function loadPluginsFromDirectory(
  directory: string
): Promise<DatabasePlugin[]> {
  const plugins: DatabasePlugin[] = [];

  if (!existsSync(directory)) {
    return plugins;
  }

  try {
    const items = readdirSync(directory);

    for (const item of items) {
      const itemPath = join(directory, item);
      const stat = statSync(itemPath);

      if (stat.isDirectory()) {
        // Look for index.ts in the plugin directory
        const pluginIndexPath = join(itemPath, "index.ts");
        const pluginIndexJsPath = join(itemPath, "index.js");

        // Check for either .ts or .js file (for built version)
        let pluginPath: string | null = null;
        if (existsSync(pluginIndexPath)) {
          pluginPath = pluginIndexPath;
        } else if (existsSync(pluginIndexJsPath)) {
          pluginPath = pluginIndexJsPath;
        }

        if (pluginPath) {
          try {
            // Import the plugin
            const pluginModule = await import(pluginPath);

            // Look for exported plugin (try different naming conventions)
            const pluginExport =
              pluginModule[`${item}Plugin`] ||
              pluginModule.default ||
              pluginModule.plugin;

            if (pluginExport && typeof pluginExport === "object") {
              plugins.push(pluginExport);
            }
          } catch (error) {
            console.warn(`Failed to load plugin from ${pluginPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to scan plugins directory ${directory}:`, error);
  }

  return plugins;
}

async function initialize() {
  if (initialized) return;

  // Register built-in plugins (statically imported)
  for (const plugin of builtinPlugins) {
    discoveredPlugins.set(plugin.type, {
      plugin,
      source: "builtin",
      path: "built-in",
    });
  }

  // Also try to load additional plugins from user directories (for extensibility)
  const additionalPluginDirs = [
    join(process.cwd(), "plugins", "databases"),
    join(process.cwd(), ".strapi-dockerize", "plugins", "databases"),
  ];

  for (const dir of additionalPluginDirs) {
    if (existsSync(dir)) {
      const additionalPlugins = await loadPluginsFromDirectory(dir);
      for (const plugin of additionalPlugins) {
        // User plugins override built-in ones
        discoveredPlugins.set(plugin.type, {
          plugin,
          source: "local",
          path: dir,
        });
      }
    }
  }

  initialized = true;
}

function getPlugin(type: string): DatabasePlugin {
  const discovered = discoveredPlugins.get(type);
  if (!discovered) {
    throw new Error(`Plugin '${type}' not found`);
  }
  return discovered.plugin;
}

function listPlugins(): DiscoveredPlugin[] {
  return Array.from(discoveredPlugins.values());
}

function listPluginTypes(): string[] {
  return Array.from(discoveredPlugins.keys());
}

function getPluginsByCategory(category: string): DiscoveredPlugin[] {
  return listPlugins().filter(
    ({ plugin }) => plugin.metadata?.category === category
  );
}

// Exported functions
export async function getDatabasePlugin(type: string): Promise<DatabasePlugin> {
  await initialize();
  return getPlugin(type);
}

export async function listDatabasePlugins(): Promise<string[]> {
  await initialize();
  return listPluginTypes();
}

export async function discoverPlugins(): Promise<DiscoveredPlugin[]> {
  await initialize();
  return listPlugins();
}

export async function getPluginsByCategoryExport(
  category: string
): Promise<DiscoveredPlugin[]> {
  await initialize();
  return getPluginsByCategory(category);
}

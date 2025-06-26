#!/usr/bin/env node

import {
  intro,
  outro,
  text,
  select,
  confirm,
  isCancel,
  cancel,
} from "@clack/prompts";
import { detectStrapiProject } from "./utils/detection";
import { runDockerizeWizard } from "./wizard";
import { generatePluginCommand } from "./utils/plugin-generator";
import { runPluginTests } from "./utils/plugin-tester";
import { discoverPlugins, listDatabasePlugins } from "./plugins";

async function main() {
  const args = process.argv.slice(2);

  // Handle plugin commands
  if (args.length > 0) {
    const command = args[0];

    switch (command) {
      case "generate-plugin":
      case "gen-plugin":
        await generatePluginCommand();
        return;

      case "test-plugins":
        await testPluginsCommand();
        return;

      case "list-plugins":
        await listPluginsCommand();
        return;

      case "help":
      case "--help":
      case "-h":
        showHelp();
        return;

      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
        return;
    }
  }

  // Main dockerize flow
  intro("🐳 Strapi Dockerize v2");

  const project = await detectStrapiProject();

  if (!project.isStrapi) {
    outro(
      "❌ This doesn't appear to be a Strapi project. Please run this command in a Strapi project directory."
    );
    process.exit(1);
  }

  console.log(`✅ Detected Strapi project: ${project.name}`);
  console.log(`📦 Package manager: ${project.packageManager}`);
  console.log(`🔧 Type: ${project.type}`);

  if (project.version) {
    console.log(`📋 Strapi version: ${project.version}`);
  }

  await runDockerizeWizard(project);

  outro("🎉 Docker configuration complete! Happy coding!");
}

async function testPluginsCommand() {
  intro("🧪 Testing Strapi Dockerize Plugins");

  try {
    const discoveredPlugins = await discoverPlugins();
    const plugins = discoveredPlugins.map((dp) => dp.plugin);

    if (plugins.length === 0) {
      outro("❌ No plugins found to test");
      return;
    }

    console.log(`Found ${plugins.length} plugins to test:`);
    plugins.forEach((plugin) => {
      console.log(`  - ${plugin.name} (${plugin.type})`);
    });

    const shouldContinue = await confirm({
      message: "Run tests for all plugins?",
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel("Testing cancelled");
      return;
    }

    await runPluginTests(plugins);
    outro("✅ Plugin testing complete!");
  } catch (error) {
    console.error("❌ Error testing plugins:", error);
    outro("❌ Plugin testing failed!");
  }
}

async function listPluginsCommand() {
  intro("📦 Available Strapi Dockerize Plugins");

  try {
    const discoveredPlugins = await discoverPlugins();

    if (discoveredPlugins.length === 0) {
      console.log("No plugins found");
      outro(
        "💡 Try running 'strapi-dockerize generate-plugin' to create your first plugin!"
      );
      return;
    }

    console.log(`\nFound ${discoveredPlugins.length} plugins:\n`);

    // Group by category
    const byCategory = discoveredPlugins.reduce((acc, dp) => {
      const category = dp.plugin.metadata?.category || "unknown";
      if (!acc[category]) acc[category] = [];
      acc[category].push(dp);
      return acc;
    }, {} as Record<string, typeof discoveredPlugins>);

    for (const [category, plugins] of Object.entries(byCategory)) {
      console.log(`📂 ${category.toUpperCase()}`);

      for (const dp of plugins) {
        const plugin = dp.plugin;
        const source =
          dp.source === "builtin" ? "🔧" : dp.source === "npm" ? "📦" : "📁";

        console.log(`  ${source} ${plugin.name} (${plugin.type})`);

        if (plugin.metadata?.description) {
          console.log(`     ${plugin.metadata.description}`);
        }

        if (plugin.metadata?.version) {
          console.log(`     Version: ${plugin.metadata.version}`);
        }

        console.log(`     Source: ${dp.source} (${dp.path})`);
        console.log("");
      }
    }

    outro("✅ Plugin listing complete!");
  } catch (error) {
    console.error("❌ Error listing plugins:", error);
    outro("❌ Plugin listing failed!");
  }
}

function showHelp() {
  console.log(`
🐳 Strapi Dockerize v2 - Generate Docker configurations for Strapi projects

USAGE:
  strapi-dockerize [command]

COMMANDS:
  (no command)           Run the interactive Docker configuration wizard
  generate-plugin       Create a new plugin template
  gen-plugin            Alias for generate-plugin
  test-plugins          Test all discovered plugins
  list-plugins          List all available plugins
  help                  Show this help message

EXAMPLES:
  strapi-dockerize                    # Run the main wizard
  strapi-dockerize generate-plugin    # Create a new plugin
  strapi-dockerize test-plugins       # Test all plugins
  strapi-dockerize list-plugins       # List available plugins

PLUGIN DEVELOPMENT:
  Plugins are automatically discovered from:
  - Built-in plugins (PostgreSQL, MySQL, MariaDB, SQLite)
  - ./plugins/ directory in your project
  - ~/.strapi-dockerize/plugins/ directory
  - npm packages matching 'strapi-dockerize-plugin-*'

  Use 'generate-plugin' to create a new plugin template with:
  - TypeScript support
  - Validation with Zod
  - Unit tests with Vitest
  - Liquid templates
  - Full documentation

For more information, visit: https://github.com/strapi-community/strapi-tool-dockerize
`);
}

main().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});

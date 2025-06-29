import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { defineCommand } from "citty";
import { existsSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { generateDockerFiles } from "./generators";
import { discoverPlugins } from "./plugins";
import type { DockerConfig } from "./types";
import { detectStrapiProject } from "./utils/detection";
import { generatePluginCommand } from "./utils/plugin-generator";
import { runPluginTests } from "./utils/plugin-tester";
import { runWizard } from "./wizard";
import {
  VALID_DATABASE_TYPES,
  getDefaultPort,
  isValidDatabaseType,
  getValidDatabaseTypesString,
} from "./utils/database-utils";
import { generateSecurePassword } from "./utils/security-utils";

export const main = defineCommand({
  meta: {
    name: "dockerize",
    version: "2.0.0",
    description: "Add Docker support to Strapi projects with ease 🚀",
  },
  args: {
    interactive: {
      type: "boolean",
      description: "Run in interactive mode (default: true)",
      default: true,
    },
  },
  async run({ args, cmd }) {
    // Only run interactive wizard if no subcommand was specified
    // (citty provides the cmd object which contains subcommand info)
    const subcommandUsed = process.argv
      .slice(2)
      .some((arg) =>
        [
          "new",
          "reset",
          "generate-plugin",
          "test-plugins",
          "list-plugins",
        ].includes(arg)
      );

    if (!subcommandUsed && args.interactive !== false) {
      await runWizard();
    }
  },
  subCommands: {
    new: defineCommand({
      meta: {
        description: "Generate Docker configuration with CLI options",
      },
      args: {
        "database-type": {
          type: "string",
          description: "Database type",
          default: "postgresql",
          valueHint: getValidDatabaseTypesString(),
        },
        environment: {
          type: "string",
          description: "Target environment",
          default: "both",
          valueHint: "development|production|both",
        },
        "use-compose": {
          type: "boolean",
          description: "Generate docker-compose.yml",
          default: true,
        },
        "database-name": {
          type: "string",
          description: "Database name",
          default: "strapi",
        },
        "database-user": {
          type: "string",
          description: "Database username",
          default: "strapi",
        },
        "database-password": {
          type: "string",
          description: "Database password (auto-generated if not provided)",
        },
        host: {
          type: "string",
          description: "Database host",
          default: "localhost",
        },
        port: {
          type: "string",
          description: "Database port (varies by database type)",
        },
        force: {
          type: "boolean",
          description: "Overwrite existing Docker files without confirmation",
          default: false,
        },
      },
      async run({ args }) {
        intro("🐳 Strapi Dockerize - CLI Mode");

        try {
          // Detect project
          const project = await detectStrapiProject();
          if (!project) {
            console.error("❌ No Strapi project detected in current directory");
            process.exit(1);
          }

          // Validate and extract string arguments
          const databaseType = String(args["database-type"]);
          const environment = String(args.environment);
          const databaseName = String(args["database-name"]);
          const databaseUser = String(args["database-user"]);
          const host = String(args.host);
          const useCompose = Boolean(args["use-compose"]);
          const databasePassword = args["database-password"]
            ? String(args["database-password"])
            : null;

          // Validate database type
          if (!isValidDatabaseType(databaseType)) {
            console.error(`❌ Invalid database type: ${databaseType}`);
            console.error(`Valid options: ${VALID_DATABASE_TYPES.join(", ")}`);
            process.exit(1);
          }

          // Validate environment
          const validEnvironments = ["development", "production", "both"];
          if (!validEnvironments.includes(environment)) {
            console.error(`❌ Invalid environment: ${environment}`);
            console.error(`Valid options: ${validEnvironments.join(", ")}`);
            process.exit(1);
          }

          // Set default ports if not provided
          let port = args.port ? String(args.port) : null;
          if (!port) {
            port = getDefaultPort(databaseType).toString();
          }

          // Generate password if not provided
          const password = databasePassword || generateSecurePassword();

          // Build configuration
          const config: DockerConfig = {
            database: {
              type: databaseType as
                | "postgresql"
                | "mysql"
                | "mariadb"
                | "sqlite",
              name: databaseName,
              user: databaseUser,
              password,
              host,
              port: parseInt(port),
            },
            environment: environment as "development" | "production" | "both",
            useCompose,
          };

          // Check for existing files
          if (!args.force) {
            const existingFiles = [
              "Dockerfile",
              "docker-compose.yml",
              "Dockerfile.prod",
            ].filter((file) => existsSync(join(process.cwd(), file)));

            if (existingFiles.length > 0) {
              console.log(
                `\n⚠️  Existing Docker files found: ${existingFiles.join(", ")}`
              );
              const shouldOverwrite = await confirm({
                message: "Do you want to overwrite existing Docker files?",
              });

              if (isCancel(shouldOverwrite) || !shouldOverwrite) {
                cancel("Operation cancelled");
                return;
              }
            }
          }

          // Generate files
          console.log("🔧 Generating Docker configuration...");
          await generateDockerFiles(project, config);

          outro("✅ Docker configuration generated successfully!");
          console.log("\n🚀 Next steps:");
          console.log("  1. Review the generated Docker files");
          console.log("  2. Run: docker-compose up -d");
          console.log("  3. Open: http://localhost:1337");
        } catch (error) {
          console.error("❌ Error generating Docker configuration:", error);
          process.exit(1);
        }
      },
    }),

    reset: defineCommand({
      meta: {
        description: "Remove all Docker-related files and configurations",
      },
      args: {
        force: {
          type: "boolean",
          description: "Skip confirmation prompt",
          default: false,
        },
      },
      async run({ args }) {
        intro("🗑️  Strapi Dockerize - Reset");

        try {
          const dockerFiles = [
            "Dockerfile",
            "Dockerfile.prod",
            "docker-compose.yml",
            ".dockerignore",
            "init-scripts",
          ];

          const existingFiles = dockerFiles.filter((file) =>
            existsSync(join(process.cwd(), file))
          );

          if (existingFiles.length === 0) {
            console.log("✅ No Docker files found to remove");
            outro("Nothing to clean up!");
            return;
          }

          console.log(`\n📁 Found Docker files: ${existingFiles.join(", ")}`);

          if (!args.force) {
            const shouldDelete = await confirm({
              message: "Are you sure you want to delete all Docker files?",
            });

            if (isCancel(shouldDelete) || !shouldDelete) {
              cancel("Reset cancelled");
              return;
            }
          }

          // Remove files
          for (const file of existingFiles) {
            const filePath = join(process.cwd(), file);
            try {
              if (existsSync(filePath)) {
                // Check if it's a directory
                const stats = require("fs").statSync(filePath);
                if (stats.isDirectory()) {
                  rmSync(filePath, { recursive: true, force: true });
                } else {
                  unlinkSync(filePath);
                }
                console.log(`🗑️  Removed: ${file}`);
              }
            } catch (error) {
              console.warn(`⚠️  Could not remove ${file}:`, error);
            }
          }

          // Clean up .env Docker section
          const envPath = join(process.cwd(), ".env");
          if (existsSync(envPath)) {
            try {
              const envContent = require("fs").readFileSync(envPath, "utf8");
              const dockerSectionRegex =
                /# 🐳 Docker Configuration \(Generated by Strapi Dockerize\)[\s\S]*?(?=\n# [^🐳]|\n[A-Z_]+=|$)/g;
              const cleanedContent = envContent
                .replace(dockerSectionRegex, "")
                .trim();

              if (cleanedContent !== envContent) {
                writeFileSync(envPath, cleanedContent + "\n", "utf8");
                console.log("🗑️  Cleaned Docker configuration from .env");
              }
            } catch (error) {
              console.warn("⚠️  Could not clean .env file:", error);
            }
          }

          outro("✅ Docker files removed successfully!");
        } catch (error) {
          console.error("❌ Error during reset:", error);
          process.exit(1);
        }
      },
    }),

    "generate-plugin": defineCommand({
      meta: {
        description: "Create a new database plugin template",
      },
      async run() {
        await generatePluginCommand();
      },
    }),

    "test-plugins": defineCommand({
      meta: {
        description: "Test all discovered plugins",
      },
      async run() {
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

          await runPluginTests(plugins);
          outro("✅ Plugin testing complete!");
        } catch (error) {
          console.error("❌ Error testing plugins:", error);
          outro("❌ Plugin testing failed!");
        }
      },
    }),

    "list-plugins": defineCommand({
      meta: {
        description: "List all available plugins",
      },
      async run() {
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
                dp.source === "builtin"
                  ? "🔧"
                  : dp.source === "npm"
                  ? "📦"
                  : "📁";

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
      },
    }),
  },
});

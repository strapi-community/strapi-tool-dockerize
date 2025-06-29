import { text, select } from "@clack/prompts";
import type { DatabasePlugin } from "../../types";
import { Liquid } from "liquidjs";
import { readFileSync } from "fs";
import { join } from "path";
import { generateSecurePassword } from "../../utils/security-utils";

// generateSecurePassword function moved to utils/security-utils.ts

export const mariadbPlugin: DatabasePlugin = {
  name: "MariaDB",
  type: "mariadb",

  async questions() {
    const dbName = await text({
      message: "Database name:",
      placeholder: "strapi",
      defaultValue: "strapi",
      validate: (value) => {
        if (!value) return "Database name is required";
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return "Database name can only contain letters, numbers, underscores and hyphens";
        }
      },
    });

    const dbUser = await text({
      message: "Database user:",
      placeholder: "strapi",
      defaultValue: "strapi",
      validate: (value) => {
        if (!value) return "Database user is required";
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return "Username can only contain letters, numbers, underscores and hyphens";
        }
      },
    });

    const passwordType = (await select({
      message: "How would you like to set the database password?",
      options: [
        {
          value: "generate",
          label: "Generate secure password",
          hint: "Recommended",
        },
        { value: "custom", label: "Enter custom password" },
      ],
    })) as "generate" | "custom";

    let dbPassword: string;
    if (passwordType === "generate") {
      dbPassword = generateSecurePassword();
      console.log(`🔐 Generated password: ${dbPassword}`);
    } else {
      dbPassword = (await text({
        message: "Enter database password:",
        validate: (value) => {
          if (!value) return "Password is required";
          if (value.length < 8)
            return "Password must be at least 8 characters long";
        },
      })) as string;
    }

    const dbPort = await text({
      message: "MariaDB port:",
      placeholder: "3306",
      defaultValue: "3306",
      validate: (value) => {
        const port = parseInt(value);
        if (isNaN(port)) return "Port must be a number";
        if (port < 1024 || port > 65535)
          return "Port must be between 1024 and 65535";
      },
    });

    return {
      name: dbName as string,
      user: dbUser as string,
      password: dbPassword,
      port: parseInt(dbPort as string),
      host: "mariadb", // Docker service name
    };
  },

  async generateFiles(config) {
    try {
      // Initialize Liquid template engine
      const liquid = new Liquid();

      // Load the compose template
      const templatePath = join(__dirname, "mariadb/templates/compose.liquid");
      const template = readFileSync(templatePath, "utf8");

      // Prepare template variables
      const templateVars = {
        serviceName: "mariadb",
        image: "mariadb",
        tag: "10.11",
        port: config.port,
        environment: {
          MARIADB_DATABASE: config.name,
          MARIADB_USER: config.user,
          MARIADB_PASSWORD: config.password,
          MARIADB_ROOT_PASSWORD: config.password,
          MARIADB_CHARACTER_SET_SERVER: "utf8mb4",
          MARIADB_COLLATION_SERVER: "utf8mb4_unicode_ci",
        },
      };

      // Render the template
      const rendered = await liquid.parseAndRender(template, templateVars);

      console.log("🐳 Generated docker-compose.yml for MariaDB:");
      console.log("─".repeat(50));
      console.log(rendered);
      console.log("─".repeat(50));

      // TODO: Actually write files to disk
      console.log("✅ MariaDB configuration ready!");
    } catch (error) {
      console.error("❌ Error generating files:", error);
      throw error;
    }
  },
};

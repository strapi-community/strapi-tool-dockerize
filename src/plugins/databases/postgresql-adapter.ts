import { select, text } from "@clack/prompts";
import { readFileSync } from "fs";
import { Liquid } from "liquidjs";
import { join } from "path";
import type { DatabasePlugin } from "../../types";
import { generateSecurePassword } from "../../utils/security-utils";

// generateSecurePassword function moved to utils/security-utils.ts

export const postgresqlPlugin: DatabasePlugin = {
  name: "PostgreSQL",
  type: "postgresql",

  metadata: {
    name: "PostgreSQL",
    type: "postgresql",
    version: "1.0.0",
    description:
      "PostgreSQL database plugin with secure password generation and health checks",
    author: "Strapi Community",
    category: "database",
    tags: ["postgresql", "database", "sql"],
    requirements: {
      node: ">=18.0.0",
      strapi: ">=4.0.0",
    },
  },

  async questions() {
    // Simple questions for now - we'll add more advanced ones later
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
      message: "PostgreSQL port:",
      placeholder: "5432",
      defaultValue: "5432",
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
      host: "postgres", // Docker service name
    };
  },

  async generateFiles(config) {
    try {
      // Initialize Liquid template engine
      const liquid = new Liquid();

      // Load the compose template
      const templatePath = join(
        __dirname,
        "postgresql/templates/compose.liquid"
      );
      const template = readFileSync(templatePath, "utf8");

      // Prepare template variables
      const templateVars = {
        image: {
          name: "postgres",
          tag: "15-alpine",
        },
        database: {
          name: config.name,
          user: config.user,
          password: config.password,
          port: config.port,
        },
        volumes: {
          data: "/var/lib/postgresql/data",
        },
        environment: "development", // We'll make this configurable later
      };

      // Render the template
      const rendered = await liquid.parseAndRender(template, templateVars);

      console.log("🐳 Generated docker-compose.yml:");
      console.log("─".repeat(50));
      console.log(rendered);
      console.log("─".repeat(50));

      // TODO: Actually write files to disk
      console.log("✅ PostgreSQL configuration ready!");
    } catch (error) {
      console.error("❌ Error generating files:", error);
      throw error;
    }
  },

  async validate(config) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate database name
    if (!config.name || typeof config.name !== "string") {
      errors.push("Database name is required and must be a string");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.name)) {
      errors.push(
        "Database name can only contain letters, numbers, underscores and hyphens"
      );
    }

    // Validate username
    if (!config.user || typeof config.user !== "string") {
      errors.push("Database user is required and must be a string");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.user)) {
      errors.push(
        "Username can only contain letters, numbers, underscores and hyphens"
      );
    }

    // Validate password
    if (!config.password || typeof config.password !== "string") {
      errors.push("Database password is required and must be a string");
    } else {
      if (config.password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }
      if (config.password === "password" || config.password === "123456") {
        warnings.push("Consider using a more secure password");
      }
    }

    // Validate port
    if (config.port) {
      const port = parseInt(config.port);
      if (isNaN(port) || port < 1024 || port > 65535) {
        errors.push("Port must be a number between 1024 and 65535");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },

  tests: [
    {
      name: "Password generation works",
      async test() {
        const password = generateSecurePassword();
        return {
          passed: password.length >= 16 && /[A-Za-z0-9!@#$%^&*]/.test(password),
          message:
            password.length >= 16
              ? "Password generation works correctly"
              : "Generated password is too short",
          details: { passwordLength: password.length },
        };
      },
    },
    {
      name: "Template file exists",
      async test() {
        const templatePath = join(
          __dirname,
          "postgresql/templates/compose.liquid"
        );
        try {
          const template = readFileSync(templatePath, "utf8");
          return {
            passed:
              template.includes("postgres") && template.includes("POSTGRES_DB"),
            message: "PostgreSQL template file is valid",
          };
        } catch (error) {
          return {
            passed: false,
            message: "PostgreSQL template file not found or invalid",
            details: error,
          };
        }
      },
    },
    {
      name: "Configuration validation",
      async test() {
        const validConfig = {
          name: "testdb",
          user: "testuser",
          password: "securepassword123",
          port: 5432,
        };

        const result = await postgresqlPlugin.validate!(validConfig);
        return {
          passed: result.valid,
          message: result.valid
            ? "Configuration validation works"
            : "Configuration validation failed",
          details: result,
        };
      },
    },
  ],
};

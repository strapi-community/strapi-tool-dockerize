import {
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
} from "@clack/prompts";
import chalk from "chalk";
import { generateDockerFiles } from "./generators";
import { getDatabasePlugin } from "./plugins";
import {
  detectStrapiProject,
  generateSecureDefaults,
  type ExistingDockerConfig,
} from "./utils/detection";

interface WizardConfig {
  database: string;
  config: Record<string, any>;
  existingDockerConfig?: ExistingDockerConfig;
  secureDefaults?: ReturnType<typeof generateSecureDefaults>;
}

export async function runWizard(): Promise<void> {
  intro("🐳 @strapi-community/dockerize");

  // Rich welcome message inspired by the original cli-welcome style
  note(
    chalk.bold("by Simen Daehlin / Eventyret") +
      "\n\n" +
      "Create Docker and Docker-compose files for your Strapi project with ease 🚀\n" +
      chalk.dim("https://github.com/strapi-community/strapi-tool-dockerize") +
      "\n\n" +
      chalk.yellow(
        "💡 This tool will generate optimized Docker configurations for your Strapi project"
      ),
    "🎉 Welcome to Strapi Dockerize"
  );

  // Detect project
  const project = await detectStrapiProject();

  if (!project.isStrapi) {
    outro(
      "❌ This doesn't appear to be a Strapi project. Please run this command in a Strapi project directory."
    );
    return;
  }

  // Build streamlined project information
  let projectInfo = `Project: ${project.name}\n`;
  projectInfo += `Strapi: ${project.version}\n`;

  // Add colored language info
  const languageFormatted =
    project.type === "typescript"
      ? chalk.blue("TypeScript")
      : chalk.yellow("JavaScript");
  projectInfo += `Language: ${languageFormatted}\n`;

  // Add Node version info with compatibility indicator
  if (project.nodeVersion) {
    const nodeIcon = project.nodeVersion.compatible ? "✅" : "⚠️";
    projectInfo += `Node: ${project.nodeVersion.current} ${nodeIcon}\n`;
  }

  // Add database info if detected
  if (project.dockerConfig?.existingDatabase?.type) {
    const dbType = project.dockerConfig.existingDatabase.type.toUpperCase();
    projectInfo += `Database: ${dbType}`;
  }

  note(projectInfo, "🔍 Project Detected");

  // Check for existing Docker configuration and prompt for regeneration
  if (project.dockerConfig) {
    const { hasDockerfile, hasDockerCompose, hasEnv } = project.dockerConfig;

    if (hasDockerfile || hasDockerCompose || hasEnv) {
      const shouldContinue = await confirm({
        message:
          "Found existing Docker configuration. Would you like to regenerate/update it?",
      });

      if (isCancel(shouldContinue)) {
        outro("Operation cancelled.");
        return;
      }

      if (!shouldContinue) {
        outro("Keeping existing Docker configuration unchanged.");
        return;
      }
    }
  }

  // Step 1: Database Selection
  const config: WizardConfig = {
    database: "",
    config: {},
    existingDockerConfig: project.dockerConfig,
  };

  // Smart pre-selection based on detected database
  let initialDatabase = "postgresql"; // Default fallback
  let detectedDatabase = false;

  if (project.dockerConfig?.existingDatabase?.type) {
    const detectedType = project.dockerConfig.existingDatabase.type;
    initialDatabase = detectedType;
    detectedDatabase = true;
  }

  const databaseOptions = [
    {
      value: "postgresql",
      label:
        detectedDatabase && initialDatabase === "postgresql"
          ? "PostgreSQL (currently configured)"
          : "PostgreSQL",
    },
    {
      value: "mysql",
      label:
        detectedDatabase && initialDatabase === "mysql"
          ? "MySQL (currently configured)"
          : "MySQL",
    },
    {
      value: "mariadb",
      label:
        detectedDatabase && initialDatabase === "mariadb"
          ? "MariaDB (currently configured)"
          : "MariaDB",
    },
    {
      value: "sqlite",
      label:
        detectedDatabase && initialDatabase === "sqlite"
          ? "SQLite (currently configured)"
          : "SQLite",
    },
  ];

  const databaseResult = await select({
    message: detectedDatabase
      ? `Select database (detected: ${initialDatabase.toUpperCase()}):`
      : "Select your database:",
    options: databaseOptions,
    initialValue: initialDatabase,
  });

  if (isCancel(databaseResult)) {
    outro("Operation cancelled.");
    return;
  }

  config.database = databaseResult as string;

  // Step 2: Environment Selection
  const environmentResult = await select({
    message: "Select your Docker environment setup:",
    options: [
      {
        value: "development",
        label:
          "Development only (docker-compose + Dockerfile for local development)",
      },
      {
        value: "production",
        label: "Production only (optimized Dockerfile.prod for deployment)",
      },
      {
        value: "both",
        label: "Both (development + production Docker configurations)",
      },
    ],
    initialValue: "both", // Most comprehensive option as default
  });

  if (isCancel(environmentResult)) {
    outro("Operation cancelled.");
    return;
  }

  const environment = environmentResult as string;

  // Determine useCompose based on environment
  const useCompose = environment === "development" || environment === "both";

  // Generate secure defaults AFTER database and environment selection
  const secureDefaults = generateSecureDefaults();

  // Step 3: Database Configuration
  const databasePlugin = await getDatabasePlugin(config.database);

  // Auto-fill configuration based on existing data and selected database type
  const existingDb = project.dockerConfig?.existingDatabase;
  const autoFillConfig = {
    databaseName:
      config.database === "sqlite"
        ? existingDb?.type === "sqlite"
          ? existingDb.name || ".tmp/data.db"
          : ".tmp/data.db"
        : existingDb?.type === config.database
        ? existingDb.name || secureDefaults.databaseName
        : secureDefaults.databaseName,
    databaseUser:
      config.database === "sqlite"
        ? undefined
        : existingDb?.type === config.database
        ? existingDb.user || secureDefaults.databaseUser
        : secureDefaults.databaseUser,
    databasePassword: secureDefaults.databasePassword, // Always generate new password for security
    databaseHost:
      config.database === "sqlite"
        ? undefined
        : existingDb?.type === config.database
        ? existingDb.host || "localhost"
        : "localhost",
    databasePort:
      config.database === "sqlite"
        ? undefined
        : existingDb?.type === config.database
        ? existingDb.port || getDefaultPort(config.database)
        : getDefaultPort(config.database),
  };

  // Show what we're auto-filling
  if (existingDb && config.database === existingDb.type) {
    const detectionSource =
      existingDb.detectedFrom === "config"
        ? "Strapi config"
        : existingDb.detectedFrom === "env"
        ? ".env"
        : "configuration";

    if (config.database === "sqlite") {
      note(
        `Auto-filling from detected ${detectionSource}:\n` +
          `• Database file: ${autoFillConfig.databaseName}`,
        "Smart Detection"
      );
    } else {
      note(
        `Auto-filling from detected ${detectionSource}:\n` +
          `• Database: ${autoFillConfig.databaseName}\n` +
          `• User: ${autoFillConfig.databaseUser}\n` +
          `• Host: ${autoFillConfig.databaseHost}\n` +
          `• Port: ${autoFillConfig.databasePort}\n` +
          `• Password: [newly generated for security]`,
        "Smart Detection"
      );
    }
  } else {
    if (config.database === "sqlite") {
      note(
        `Using default SQLite configuration:\n` +
          `• Database file: ${autoFillConfig.databaseName}`,
        "Default Configuration"
      );
    } else {
      note(
        `Using secure defaults:\n` +
          `• Database: ${autoFillConfig.databaseName}\n` +
          `• User: ${autoFillConfig.databaseUser}\n` +
          `• Password: [securely generated]\n` +
          `• Host: ${autoFillConfig.databaseHost}\n` +
          `• Port: ${autoFillConfig.databasePort}`,
        "Secure Defaults"
      );
    }
  }

  // Ask database-specific questions with auto-filled defaults
  if (databasePlugin && databasePlugin.questions) {
    config.config = await databasePlugin.questions(autoFillConfig);
  }

  // Step 4: Generate Files
  const generateSpinner = spinner();
  generateSpinner.start();
  generateSpinner.message("Generating Docker files...");

  try {
    // Create legacy config format for compatibility
    const dockerConfig = {
      database: {
        type: config.database as any,
        name:
          config.database === "sqlite"
            ? config.config.filename || autoFillConfig.databaseName
            : config.config.name || autoFillConfig.databaseName,
        user: config.config.user || autoFillConfig.databaseUser,
        password: config.config.password || autoFillConfig.databasePassword,
        port: config.config.port || autoFillConfig.databasePort,
        host: config.config.host || autoFillConfig.databaseHost,
      },
      environment: environment as any,
      useCompose,
    };

    generateSpinner.message("Creating Dockerfile...");
    await new Promise((resolve) => setTimeout(resolve, 200)); // Brief pause to see progress

    generateSpinner.message("Creating docker-compose.yml...");
    await new Promise((resolve) => setTimeout(resolve, 200)); // Brief pause to see progress

    generateSpinner.message("Updating .env file...");
    await generateDockerFiles(project, dockerConfig);

    generateSpinner.stop();

    // Dynamic success message based on what was generated
    let generatedFiles = [];
    if (environment === "development" || environment === "both") {
      generatedFiles.push("Dockerfile (development)");
    }
    if (environment === "production" || environment === "both") {
      generatedFiles.push("Dockerfile.prod (production)");
    }
    if (useCompose) {
      generatedFiles.push("docker-compose.yml");
    }
    generatedFiles.push(".env (updated)");

    let nextSteps = "";
    if (useCompose) {
      nextSteps =
        "• Run " +
        chalk.bold.yellow("docker-compose up -d") +
        " to start your project\n" +
        "• Your Strapi app will be available at " +
        chalk.underline("http://localhost:1337");
    } else {
      nextSteps =
        "• Build: " +
        chalk.bold.yellow("docker build -f Dockerfile.prod -t my-strapi .") +
        "\n" +
        "• Run: " +
        chalk.bold.yellow("docker run -p 1337:1337 my-strapi") +
        "\n" +
        "• Your Strapi app will be available at " +
        chalk.underline("http://localhost:1337");
    }

    // Celebratory outro inspired by the original goodbye function
    outro(
      chalk.green("🎉 Success!") +
        " " +
        chalk.yellow("Strapi") +
        " is now " +
        chalk.bold.blue("dockerized") +
        " 🐳\n\n" +
        chalk.cyan("📦 Generated files:") +
        "\n" +
        generatedFiles.map((file) => `• ${file}`).join("\n") +
        "\n\n" +
        chalk.cyan("🚀 Next steps:") +
        "\n" +
        nextSteps +
        "\n\n" +
        chalk.magenta("⭐️ Enjoyed this tool?") +
        "\n" +
        "Star us on GitHub: " +
        chalk.underline(
          "https://github.com/strapi-community/strapi-tool-dockerize"
        ) +
        "\n" +
        chalk.dim(
          "☕️ Buy Simen a coffee: https://opencollective.com/strapi/projects/strapi-tool-dockerize"
        )
    );
  } catch (error) {
    outro(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function getDefaultPort(database: string): number {
  switch (database) {
    case "postgresql":
      return 5432;
    case "mysql":
      return 3306;
    case "mariadb":
      return 3306;
    case "sqlite":
      return 0; // SQLite doesn't use ports
    default:
      return 3306;
  }
}

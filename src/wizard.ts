import { confirm, select, spinner, note } from "@clack/prompts";
import { generateDockerFiles } from "./generators";
import { getDatabasePlugin } from "./plugins";
import type { DockerConfig, StrapiProject } from "./types";

export async function runDockerizeWizard(
  project: StrapiProject
): Promise<void> {
  console.log("\n🐳 Let's set up Docker for your Strapi project!\n");

  // Step 1: Database Selection & Configuration
  console.log("Step 1 of 2: Database setup");
  const databaseType = (await select({
    message: "Which database would you like to use?",
    options: [
      {
        value: "postgresql",
        label: "PostgreSQL (recommended for production)",
      },
      {
        value: "mysql",
        label: "MySQL",
      },
      {
        value: "mariadb",
        label: "MariaDB",
      },
      {
        value: "sqlite",
        label: "SQLite (development only)",
      },
    ],
  })) as string;

  // Get database configuration
  const plugin = await getDatabasePlugin(databaseType);
  const databaseConfig = await plugin.questions();

  // Step 2: Environment setup with smart defaults
  console.log("\nStep 2 of 2: Environment setup");

  const environment = (await select({
    message: "Which environment?",
    options: [
      { value: "development", label: "Development (default)" },
      { value: "production", label: "Production" },
      { value: "both", label: "Both" },
    ],
  })) as string;

  // Auto-generate compose for better experience, but allow opt-out
  const generateCompose = await confirm({
    message: "Generate docker-compose.yml for easy management?",
    initialValue: true,
  });

  // Create configuration
  const dockerConfig: DockerConfig = {
    database: {
      type: databaseType as "postgresql" | "mysql" | "mariadb" | "sqlite",
      name: databaseConfig.name,
      user: databaseConfig.user,
      password: databaseConfig.password,
      port: databaseConfig.port,
      host: databaseConfig.host,
    },
    environment: environment as "development" | "production" | "both",
    useCompose: Boolean(generateCompose),
  };

  // Use clack's spinner for clean progress display
  const s = spinner();

  try {
    s.start(`Setting up ${databaseType.toUpperCase()} database`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    s.message(`Creating ${environment} environment`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    s.message(
      generateCompose
        ? "Generating Docker Compose setup"
        : "Creating Docker files"
    );
    await generateDockerFiles(project, dockerConfig);

    s.stop("✅ Docker setup complete!");

    // Show simple next steps
    console.log("\n🚀 To start your application:");
    if (generateCompose) {
      console.log("   docker-compose up -d");
    } else {
      console.log("   docker build -t strapi-app .");
      console.log("   docker run -p 1337:1337 --env-file .env strapi-app");
    }
    console.log("   Then visit: http://localhost:1337");
  } catch (error) {
    s.stop("❌ Setup failed");
    throw error;
  }
}

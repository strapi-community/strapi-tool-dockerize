import { select, text, confirm, spinner } from "@clack/prompts";
import type { StrapiProject, DatabaseConfig, DockerConfig } from "./types";
import { getDatabasePlugin } from "./plugins";
import { generateDockerFiles } from "./generators";

export async function runDockerizeWizard(
  project: StrapiProject
): Promise<void> {
  // Step 1: Database Selection
  const databaseType = (await select({
    message: "Which database would you like to use?",
    options: [
      {
        value: "postgresql",
        label: "PostgreSQL",
        hint: "Recommended for production",
      },
      { value: "mysql", label: "MySQL", hint: "Popular choice" },
      { value: "mariadb", label: "MariaDB", hint: "MySQL-compatible" },
      { value: "sqlite", label: "SQLite", hint: "Simple file-based database" },
    ],
  })) as "postgresql" | "mysql" | "mariadb" | "sqlite";

  // Step 2: Get database plugin and run its questions
  const plugin = await getDatabasePlugin(databaseType);
  const databaseConfig = await plugin.questions();

  // Step 3: Environment Selection
  const environment = (await select({
    message: "Which environment(s) would you like to configure?",
    options: [
      {
        value: "development",
        label: "Development only",
        hint: "Local development setup",
      },
      {
        value: "production",
        label: "Production only",
        hint: "Production-ready setup",
      },
      {
        value: "both",
        label: "Both environments",
        hint: "Separate dev and prod configs",
      },
    ],
  })) as "development" | "production" | "both";

  // Step 4: Docker Compose
  const useCompose = await confirm({
    message: "Would you like to generate a docker-compose file?",
    initialValue: true,
  });

  // Step 5: Generate files
  const s = spinner();
  s.start("Generating Docker configuration...");

  const config: DockerConfig = {
    database: {
      type: databaseType,
      name: databaseConfig.name,
      user: databaseConfig.user,
      password: databaseConfig.password,
      port: databaseConfig.port,
      host: databaseConfig.host,
    },
    environment,
    useCompose: Boolean(useCompose),
  };

  try {
    await generateDockerFiles(project, config);
    s.stop("✅ Docker configuration generated successfully!");
  } catch (error) {
    s.stop("❌ Failed to generate Docker configuration");
    throw error;
  }
}

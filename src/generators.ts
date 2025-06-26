import type { StrapiProject, DockerConfig } from "./types";
import { Liquid } from "liquidjs";
import { readFileSync } from "fs";
import { join } from "path";
import {
  writeFilesWithEnv,
  generateSecrets,
  type FileToWrite,
  type EnvFileToWrite,
} from "./utils/file-writer";

export async function generateDockerFiles(
  project: StrapiProject,
  config: DockerConfig
): Promise<void> {
  const liquid = new Liquid();
  const secrets = generateSecrets();

  // Map database types to Strapi database clients
  const databaseClientMap = {
    postgresql: "postgres",
    mysql: "mysql",
    mariadb: "mysql", // MariaDB uses mysql client in Strapi
    sqlite: "sqlite",
  };

  // Prepare template variables
  const templateVars = {
    packageManager: project.packageManager,
    environment:
      config.environment === "both" ? "development" : config.environment,
    database: {
      client: databaseClientMap[config.database.type],
      type: config.database.type,
      serviceName:
        config.database.type === "postgresql"
          ? "strapiDB"
          : config.database.type,
      name: config.database.name,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      host: config.database.host,
      image:
        config.database.type === "postgresql"
          ? "postgres"
          : config.database.type === "mariadb"
          ? "mariadb"
          : "mysql",
      tag:
        config.database.type === "postgresql"
          ? "16.0-alpine"
          : config.database.type === "mariadb"
          ? "10.11"
          : "8.0",
      charset: "utf8mb4",
      collation: "utf8mb4_unicode_ci",
    },
    secrets,
  };

  const files: FileToWrite[] = [];

  // Generate Dockerfile (development)
  const dockerfilePath = join(
    __dirname,
    "templates/dockerfile/development.liquid"
  );
  const dockerfileTemplate = readFileSync(dockerfilePath, "utf8");
  const dockerfile = await liquid.parseAndRender(
    dockerfileTemplate,
    templateVars
  );

  files.push({
    path: "Dockerfile",
    content: dockerfile,
    description: "Development Dockerfile",
  });

  // Generate Dockerfile.prod (production) if production or both
  if (config.environment === "production" || config.environment === "both") {
    const dockerfileProdPath = join(
      __dirname,
      "templates/dockerfile/production.liquid"
    );
    const dockerfileProdTemplate = readFileSync(dockerfileProdPath, "utf8");
    const dockerfileProd = await liquid.parseAndRender(
      dockerfileProdTemplate,
      templateVars
    );

    files.push({
      path: "Dockerfile.prod",
      content: dockerfileProd,
      description: "Production Dockerfile",
    });
  }

  // Generate docker-compose.yml if requested
  if (config.useCompose) {
    // SQLite uses a different template (no separate database service)
    const templateName =
      config.database.type === "sqlite" ? "sqlite" : "complete";
    const composePath = join(
      __dirname,
      `templates/compose/${templateName}.liquid`
    );
    const composeTemplate = readFileSync(composePath, "utf8");
    const compose = await liquid.parseAndRender(composeTemplate, templateVars);

    const description =
      config.database.type === "sqlite"
        ? "Docker Compose for Strapi with SQLite"
        : "Docker Compose with Strapi + Database";

    files.push({
      path: "docker-compose.yml",
      content: compose,
      description,
    });
  }

  // Prepare .env file for smart merging
  const envFile: EnvFileToWrite = {
    path: ".env",
    templateVars,
    description: "Environment variables (merged with existing)",
  };

  // Write all files with smart env handling
  await writeFilesWithEnv(files, envFile, project.path);
}

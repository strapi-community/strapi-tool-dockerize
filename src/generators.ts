import type { StrapiProject, DockerConfig } from "./types";
import { Liquid } from "liquidjs";
import { readFileSync } from "fs";
import { join } from "path";
import {
  writeFilesWithEnv,
  type FileToWrite,
  type EnvFileToWrite,
} from "./utils/file-writer";
import {
  getDatabaseClient,
  getDatabaseImage,
  getDatabaseServiceName,
  DATABASE_TYPES,
} from "./utils/database-utils";
import { generateSecrets } from "./utils/security-utils";

export async function generateDockerFiles(
  project: StrapiProject,
  config: DockerConfig
): Promise<void> {
  const liquid = new Liquid();
  const secrets = generateSecrets();

  // Get database configuration using consolidated utilities
  const databaseImage = getDatabaseImage(config.database.type);
  const databaseClient = getDatabaseClient(config.database.type);
  const serviceName = getDatabaseServiceName(config.database.type);

  // Prepare template variables
  const templateVars = {
    packageManager: project.packageManager,
    environment:
      config.environment === "both" ? "development" : config.environment,
    database: {
      client: databaseClient,
      type: config.database.type,
      serviceName,
      name: config.database.name,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      host: config.database.host,
      image: databaseImage.image,
      tag: databaseImage.tag,
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
      config.database.type === DATABASE_TYPES.SQLITE ? "sqlite" : "complete";
    const composePath = join(
      __dirname,
      `templates/compose/${templateName}.liquid`
    );
    const composeTemplate = readFileSync(composePath, "utf8");
    const compose = await liquid.parseAndRender(composeTemplate, templateVars);

    const description =
      config.database.type === DATABASE_TYPES.SQLITE
        ? "Docker Compose for Strapi with SQLite"
        : "Docker Compose with Strapi + Database";

    files.push({
      path: "docker-compose.yml",
      content: compose,
      description,
    });

    // Generate PostgreSQL initialization script if PostgreSQL is selected
    if (config.database.type === DATABASE_TYPES.POSTGRESQL) {
      const initScriptPath = join(
        __dirname,
        "templates/init-scripts/postgresql-init.sql.liquid"
      );
      const initScriptTemplate = readFileSync(initScriptPath, "utf8");
      const initScript = await liquid.parseAndRender(
        initScriptTemplate,
        templateVars
      );

      files.push({
        path: "init-scripts/01-init-strapi-user.sql",
        content: initScript,
        description:
          "PostgreSQL initialization script for Strapi user permissions",
      });
    }
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

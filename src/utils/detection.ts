import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { StrapiProject } from "../types";

export interface NodeVersionInfo {
  current: string;
  expected: string;
  compatible: boolean;
}

export interface ExistingDockerConfig {
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasEnv: boolean;
  existingDatabase?: {
    type?: string;
    name?: string;
    user?: string;
    host?: string;
    port?: number;
    detectedFrom?: "env" | "config" | "both";
  };
}

function detectNodeVersion(projectPath: string): NodeVersionInfo {
  let current = "unknown";
  let expected = "18"; // Default expected version

  try {
    // Get current Node version
    current = execSync("node --version", { encoding: "utf8" })
      .trim()
      .replace("v", "");
  } catch (error) {
    current = "unknown";
  }

  try {
    // Try to read expected version from package.json engines
    const packageJsonPath = join(projectPath, "package.json");
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      if (packageJson.engines?.node) {
        // Extract version number from engines.node (handles ">=18.0.0", "^18", etc.)
        const engineNode = packageJson.engines.node;
        const versionMatch = engineNode.match(/(\d+)/);
        if (versionMatch) {
          expected = versionMatch[1];
        }
      }
    }
  } catch (error) {
    // Use default if we can't read package.json
  }

  // Check compatibility (simple major version check)
  const currentMajor = parseInt(current.split(".")[0]);
  const expectedMajor = parseInt(expected);
  const compatible =
    !isNaN(currentMajor) &&
    !isNaN(expectedMajor) &&
    currentMajor >= expectedMajor;

  return {
    current: current === "unknown" ? "unknown" : `v${current}`,
    expected: `v${expected}+`,
    compatible,
  };
}

export async function detectStrapiProject(
  projectPath: string = process.cwd()
): Promise<
  StrapiProject & {
    dockerConfig?: ExistingDockerConfig;
    nodeVersion?: NodeVersionInfo;
  }
> {
  const packageJsonPath = join(projectPath, "package.json");

  if (!existsSync(packageJsonPath)) {
    return {
      isStrapi: false,
      name: "unknown",
      packageManager: "npm",
      type: "javascript",
      path: projectPath,
    };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    // Check if it's a Strapi project
    const isStrapi = Boolean(
      packageJson.dependencies?.["@strapi/strapi"] ||
        packageJson.devDependencies?.["@strapi/strapi"] ||
        packageJson.dependencies?.["strapi"] ||
        packageJson.devDependencies?.["strapi"]
    );

    if (!isStrapi) {
      return {
        isStrapi: false,
        name: packageJson.name || "unknown",
        packageManager: detectPackageManager(projectPath),
        type: "javascript",
        path: projectPath,
      };
    }

    // Detect TypeScript
    const isTypeScript = Boolean(
      existsSync(join(projectPath, "tsconfig.json")) ||
        packageJson.dependencies?.["typescript"] ||
        packageJson.devDependencies?.["typescript"]
    );

    // Detect existing Docker configuration
    const dockerConfig = detectExistingDockerConfig(projectPath);

    // Detect Node version information
    const nodeVersion = detectNodeVersion(projectPath);

    return {
      isStrapi: true,
      name: packageJson.name || "strapi-app",
      packageManager: detectPackageManager(projectPath),
      type: isTypeScript ? "typescript" : "javascript",
      path: projectPath,
      version:
        packageJson.dependencies?.["@strapi/strapi"] ||
        packageJson.devDependencies?.["@strapi/strapi"] ||
        packageJson.dependencies?.["strapi"] ||
        packageJson.devDependencies?.["strapi"],
      dockerConfig,
      nodeVersion,
    };
  } catch (error) {
    return {
      isStrapi: false,
      name: "unknown",
      packageManager: "npm",
      type: "javascript",
      path: projectPath,
    };
  }
}

function detectPackageManager(projectPath: string): "npm" | "yarn" | "pnpm" {
  if (existsSync(join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(projectPath, "yarn.lock"))) {
    return "yarn";
  }
  return "npm";
}

function detectExistingDockerConfig(projectPath: string): ExistingDockerConfig {
  const config: ExistingDockerConfig = {
    hasDockerfile: existsSync(join(projectPath, "Dockerfile")),
    hasDockerCompose: existsSync(join(projectPath, "docker-compose.yml")),
    hasEnv: existsSync(join(projectPath, ".env")),
  };

  // Enhanced database detection - prioritize Strapi config, then .env
  const existingDatabase = detectDatabaseConfiguration(projectPath);
  if (existingDatabase) {
    config.existingDatabase = existingDatabase;
  }

  return config;
}

function detectDatabaseConfiguration(
  projectPath: string
): ExistingDockerConfig["existingDatabase"] | null {
  let envConfig: any = null;
  let strapiConfig: any = null;

  // First, try to read .env file for DATABASE_CLIENT
  if (existsSync(join(projectPath, ".env"))) {
    try {
      const envContent = readFileSync(join(projectPath, ".env"), "utf8");
      envConfig = parseEnvForDatabase(envContent);
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Then, try to parse Strapi's database config (more authoritative)
  const dbConfigTsPath = join(projectPath, "config", "database.ts");
  const dbConfigJsPath = join(projectPath, "config", "database.js");

  if (existsSync(dbConfigTsPath) || existsSync(dbConfigJsPath)) {
    try {
      const configPath = existsSync(dbConfigTsPath)
        ? dbConfigTsPath
        : dbConfigJsPath;
      const configContent = readFileSync(configPath, "utf8");
      strapiConfig = parseStrapiDatabaseConfig(configContent);
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Combine both sources, prioritizing Strapi config
  if (strapiConfig || envConfig) {
    const detectedFrom =
      strapiConfig && envConfig ? "both" : strapiConfig ? "config" : "env";

    return {
      type: strapiConfig?.type || envConfig?.type,
      name: strapiConfig?.name || envConfig?.name,
      user: strapiConfig?.user || envConfig?.user,
      host: strapiConfig?.host || envConfig?.host,
      port: strapiConfig?.port || envConfig?.port,
      detectedFrom,
    };
  }

  return null;
}

function parseEnvForDatabase(
  envContent: string
): ExistingDockerConfig["existingDatabase"] | null {
  const lines = envContent.split("\n");
  const config: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/['"]/g, "");

    // Map common database environment variables
    switch (key) {
      case "DATABASE_CLIENT":
      case "DB_CLIENT":
        config.type = normalizeDbType(value);
        break;
      case "DATABASE_NAME":
      case "DB_NAME":
        config.name = value;
        break;
      case "DATABASE_USERNAME":
      case "DATABASE_USER":
      case "DB_USERNAME":
      case "DB_USER":
        config.user = value;
        break;
      case "DATABASE_HOST":
      case "DB_HOST":
        config.host = value;
        break;
      case "DATABASE_PORT":
      case "DB_PORT":
        config.port = parseInt(value);
        break;
    }
  }

  // Return config if we found at least the database type
  return config.type ? config : null;
}

function parseStrapiDatabaseConfig(
  configContent: string
): ExistingDockerConfig["existingDatabase"] | null {
  // Enhanced parsing for Strapi database config

  // Look for the default client assignment
  const clientMatch = configContent.match(
    /const client = env\(['"]DATABASE_CLIENT['"], ?['"]([^'"]+)['"]\)/
  );
  let detectedClient = clientMatch?.[1];

  // Also check for direct client assignment
  if (!detectedClient) {
    const directClientMatch = configContent.match(/client:\s*['"]([^'"]+)['"]/);
    detectedClient = directClientMatch?.[1];
  }

  if (!detectedClient) return null;

  // Parse connection details from the appropriate section
  const normalizedClient = normalizeDbType(detectedClient);

  // Look for connection objects
  let connectionSection = "";
  if (normalizedClient === "postgresql") {
    const postgresMatch = configContent.match(
      /postgres:\s*{([^}]+{[^}]*}[^}]*)}/s
    );
    connectionSection = postgresMatch?.[1] || "";
  } else if (normalizedClient === "mysql") {
    const mysqlMatch = configContent.match(/mysql:\s*{([^}]+{[^}]*}[^}]*)}/s);
    connectionSection = mysqlMatch?.[1] || "";
  } else if (normalizedClient === "sqlite") {
    const sqliteMatch = configContent.match(/sqlite:\s*{([^}]+{[^}]*}[^}]*)}/s);
    connectionSection = sqliteMatch?.[1] || "";
  }

  // Extract details from connection section
  let databaseName, userName, hostName, portNumber;

  if (normalizedClient === "sqlite") {
    // For SQLite, look for filename in the connection section
    const filenameMatch = connectionSection.match(
      /filename:\s*[^,}]+?env\(['"]DATABASE_FILENAME['"], ?['"]([^'"]*)['"]\)/
    );
    const directFilenameMatch = connectionSection.match(
      /filename:\s*path\.join\([^,}]+?['"]([^'"]*)['"]\)/
    );

    databaseName =
      filenameMatch?.[1] || directFilenameMatch?.[1] || ".tmp/data.db";
  } else {
    // For other databases
    const databaseMatch = connectionSection.match(
      /database:\s*env\(['"]DATABASE_NAME['"], ?['"]([^'"]*)['"]\)/
    );
    const userMatch = connectionSection.match(
      /user:\s*env\(['"]DATABASE_USERNAME['"], ?['"]([^'"]*)['"]\)/
    );
    const hostMatch = connectionSection.match(
      /host:\s*env\(['"]DATABASE_HOST['"], ?['"]([^'"]*)['"]\)/
    );
    const portMatch = connectionSection.match(
      /port:\s*env\.int\(['"]DATABASE_PORT['"], ?(\d+)\)/
    );

    databaseName = databaseMatch?.[1];
    userName = userMatch?.[1];
    hostName = hostMatch?.[1];
    portNumber = portMatch ? parseInt(portMatch[1]) : undefined;
  }

  return {
    type: normalizedClient,
    name: databaseName,
    user: userName,
    host: hostName,
    port: portNumber,
  };
}

function normalizeDbType(dbType: string): string {
  const normalized = dbType.toLowerCase();
  switch (normalized) {
    case "postgres":
    case "postgresql":
    case "pg":
      return "postgresql";
    case "mysql":
      return "mysql";
    case "mariadb":
      return "mariadb";
    case "sqlite":
    case "sqlite3":
      return "sqlite";
    default:
      return normalized;
  }
}

// Utility function to generate secure random values
export function generateSecureDefaults() {
  const generateRandomString = (length: number = 12): string => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateSecurePassword = (length: number = 16): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return {
    databaseName: `strapi_${generateRandomString(8)}`,
    databaseUser: `strapi_${generateRandomString(8)}`,
    databasePassword: generateSecurePassword(),
  };
}

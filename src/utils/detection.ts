import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { StrapiProject } from "../types";

export async function detectStrapiProject(
  projectPath: string = process.cwd()
): Promise<StrapiProject> {
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

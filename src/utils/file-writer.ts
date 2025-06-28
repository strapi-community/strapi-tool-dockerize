import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { confirm } from "@clack/prompts";
import {
  mergeEnvVariables,
  createDockerEnvSections,
  debugEnvMerge,
  type EnvSection,
} from "./env-manager";

export interface FileToWrite {
  path: string;
  content: string;
  description: string;
}

export interface EnvFileToWrite {
  path: string;
  templateVars: any;
  description: string;
}

export async function writeFiles(
  files: FileToWrite[],
  projectPath: string = process.cwd()
): Promise<void> {
  console.log("\n📁 Files to be created:");

  for (const file of files) {
    const fullPath = join(projectPath, file.path);
    const exists = existsSync(fullPath);

    console.log(`  ${exists ? "🔄" : "📄"} ${file.path} - ${file.description}`);
    if (exists) {
      console.log(`     ⚠️  File already exists and will be overwritten`);
    }
  }

  const shouldProceed = await confirm({
    message: "Create these files?",
    initialValue: true,
  });

  if (!shouldProceed) {
    console.log("❌ File creation cancelled");
    return;
  }

  console.log("\n🚀 Creating files...");

  for (const file of files) {
    try {
      const fullPath = join(projectPath, file.path);
      writeFileSync(fullPath, file.content, "utf8");
      console.log(`✅ Created ${file.path}`);
    } catch (error) {
      console.error(`❌ Failed to create ${file.path}:`, error);
      throw error;
    }
  }

  console.log("\n🎉 All files created successfully!");
}

// Generate secure secrets for Strapi
export function generateSecrets() {
  const generateSecret = (length: number = 64): string => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  return {
    jwt: generateSecret(64),
    adminJwt: generateSecret(64),
    appKeys: `${generateSecret(32)},${generateSecret(32)},${generateSecret(
      32
    )},${generateSecret(32)}`,
  };
}

export async function writeFilesWithEnv(
  files: FileToWrite[],
  envFile: EnvFileToWrite | null,
  projectPath: string = process.cwd()
): Promise<void> {
  // Note: File preview is now shown in the wizard, so we skip the preview here
  // and go straight to creation since user already confirmed

  // Write regular files
  for (const file of files) {
    try {
      const fullPath = join(projectPath, file.path);
      writeFileSync(fullPath, file.content, "utf8");
    } catch (error) {
      console.error(`❌ Failed to create ${file.path}:`, error);
      throw error;
    }
  }

  // Write env file with smart merging
  if (envFile) {
    try {
      const fullPath = join(projectPath, envFile.path);
      const dockerSections = createDockerEnvSections(
        envFile.templateVars,
        fullPath
      );
      const mergedContent = mergeEnvVariables(fullPath, dockerSections);
      writeFileSync(fullPath, mergedContent, "utf8");
    } catch (error) {
      console.error(`❌ Failed to create ${envFile.path}:`, error);
      throw error;
    }
  }
}

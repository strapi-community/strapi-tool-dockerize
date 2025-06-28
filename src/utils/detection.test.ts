import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectStrapiProject } from "./detection";
import type { StrapiProject } from "../types";

// Mock fs
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock child_process
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// Import the mocked modules
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

const mockFS = {
  existsSync: vi.mocked(existsSync),
  readFileSync: vi.mocked(readFileSync),
};

const mockExecSync = vi.mocked(execSync);

describe("detection utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectStrapiProject", () => {
    it("should detect a valid Strapi TypeScript project", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        if (path.includes("tsconfig.json")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
            engines: {
              node: ">=18.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockReturnValue("v20.0.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.isStrapi).toBe(true);
      expect(result.name).toBe("test-strapi-app");
      expect(result.type).toBe("typescript");
      expect(result.packageManager).toBe("npm");
    });

    it("should detect a valid Strapi JavaScript project", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        if (path.includes("tsconfig.json")) return false;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-js-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockReturnValue("v18.0.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.isStrapi).toBe(true);
      expect(result.name).toBe("test-strapi-js-app");
      expect(result.type).toBe("javascript");
    });

    it("should return false for non-Strapi project", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "regular-node-app",
            dependencies: {
              express: "^4.0.0",
            },
          });
        }
        return "";
      });

      const result = await detectStrapiProject("/test/path");

      expect(result.isStrapi).toBe(false);
    });

    it("should handle missing package.json", async () => {
      mockFS.existsSync.mockReturnValue(false);

      const result = await detectStrapiProject("/test/path");

      expect(result.isStrapi).toBe(false);
    });

    it("should handle malformed package.json", async () => {
      mockFS.existsSync.mockReturnValue(true);
      mockFS.readFileSync.mockReturnValue("invalid json" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.isStrapi).toBe(false);
    });

    it("should detect package manager from lock files", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        if (path.includes("pnpm-lock.yaml")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockReturnValue("v18.0.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.packageManager).toBe("pnpm");
    });

    it("should handle Node version detection", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
            engines: {
              node: ">=18.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockReturnValue("v18.5.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.nodeVersion?.current).toBe("v18.5.0");
      expect(result.nodeVersion?.expected).toBe("v18+");
      expect(result.nodeVersion?.compatible).toBe(true);
    });

    it("should detect incompatible Node version", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
            engines: {
              node: ">=18.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockReturnValue("v16.20.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.nodeVersion?.current).toBe("v16.20.0");
      expect(result.nodeVersion?.expected).toBe("v18+");
      expect(result.nodeVersion?.compatible).toBe(false);
    });

    it("should handle Node version detection failure", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
          });
        }
        return "";
      });

      mockExecSync.mockImplementation(() => {
        throw new Error("Command failed");
      });

      const result = await detectStrapiProject("/test/path");

      expect(result.nodeVersion?.current).toBe("unknown");
      expect(result.nodeVersion?.compatible).toBe(false);
    });

    it("should detect existing Docker configuration", async () => {
      mockFS.existsSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) return true;
        if (path.includes("docker-compose.yml")) return true;
        if (path.includes(".env")) return true;
        return false;
      });

      mockFS.readFileSync.mockImplementation((path: any) => {
        if (path.includes("package.json")) {
          return JSON.stringify({
            name: "test-strapi-app",
            dependencies: {
              "@strapi/strapi": "^4.0.0",
            },
          });
        }
        if (path.includes(".env")) {
          return `# 🐳 Docker Configuration
DATABASE_CLIENT=postgres
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi`;
        }
        return "";
      });

      mockExecSync.mockReturnValue("v18.0.0" as any);

      const result = await detectStrapiProject("/test/path");

      expect(result.dockerConfig?.hasDockerCompose).toBe(true);
      expect(result.dockerConfig?.hasEnv).toBe(true);
      expect(result.dockerConfig?.existingDatabase?.type).toBe("postgresql");
    });
  });
});

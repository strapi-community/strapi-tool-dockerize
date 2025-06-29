import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "./cli";
import * as fs from "fs";
import * as path from "path";
import type { StrapiProject } from "./types";

// Mock all dependencies
vi.mock("fs");
vi.mock("path");
vi.mock("@clack/prompts");
vi.mock("./utils/detection");
vi.mock("./wizard");
vi.mock("./generators");
vi.mock("./plugins");
vi.mock("./utils/plugin-generator");
vi.mock("./utils/plugin-tester");

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

// Mock console methods to capture output
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockProcessExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

describe("CLI Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockFs.existsSync.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Main Command Structure", () => {
    it("should have all expected subcommands", () => {
      const subcommands = Object.keys(main.subCommands || {});
      expect(subcommands).toEqual([
        "new",
        "reset",
        "generate-plugin",
        "test-plugins",
        "list-plugins",
      ]);
    });
  });

  describe("New Command", () => {
    const newCommand = main.subCommands?.new;

    it("should have correct arguments", () => {
      expect(newCommand?.args).toHaveProperty("database-type");
      expect(newCommand?.args).toHaveProperty("environment");
      expect(newCommand?.args).toHaveProperty("use-compose");
      expect(newCommand?.args).toHaveProperty("database-name");
      expect(newCommand?.args).toHaveProperty("database-user");
      expect(newCommand?.args).toHaveProperty("database-password");
      expect(newCommand?.args).toHaveProperty("host");
      expect(newCommand?.args).toHaveProperty("port");
      expect(newCommand?.args).toHaveProperty("force");
    });

    it("should have correct default values", () => {
      expect(newCommand?.args?.["database-type"]?.default).toBe("postgresql");
      expect(newCommand?.args?.environment?.default).toBe("both");
      expect(newCommand?.args?.["use-compose"]?.default).toBe(true);
      expect(newCommand?.args?.["database-name"]?.default).toBe("strapi");
      expect(newCommand?.args?.["database-user"]?.default).toBe("strapi");
      expect(newCommand?.args?.host?.default).toBe("localhost");
      expect(newCommand?.args?.force?.default).toBe(false);
    });

    it("should validate database type", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      vi.mocked(detectStrapiProject).mockResolvedValue({
        isStrapi: true,
        name: "test-project",
        version: "4.0.0",
        type: "typescript",
        packageManager: "npm",
        path: "/test/path",
      } as StrapiProject);

      const args = {
        "database-type": "invalid-db",
        environment: "development",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: false,
      };

      const newCommand = (main as any).subCommands?.new;
      await expect(async () => {
        await newCommand?.run?.({ args });
      }).rejects.toThrow("process.exit called");

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid database type: invalid-db")
      );
    });

    it("should validate environment", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      vi.mocked(detectStrapiProject).mockResolvedValue({
        name: "test-project",
        version: "4.0.0",
        language: "typescript",
        packageManager: "npm",
        path: "/test/path",
      });

      const args = {
        "database-type": "postgresql",
        environment: "invalid-env",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: false,
      };

      await expect(async () => {
        await newCommand?.run?.({ args });
      }).rejects.toThrow("process.exit called");

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid environment: invalid-env")
      );
    });

    it("should exit if no Strapi project detected", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      vi.mocked(detectStrapiProject).mockResolvedValue(null);

      const args = {
        "database-type": "postgresql",
        environment: "development",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: false,
      };

      await expect(async () => {
        await newCommand?.run?.({ args });
      }).rejects.toThrow("process.exit called");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ No Strapi project detected in current directory"
      );
    });

    it("should set default ports correctly", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      const { generateDockerFiles } = await import("./generators");

      vi.mocked(detectStrapiProject).mockResolvedValue({
        name: "test-project",
        version: "4.0.0",
        language: "typescript",
        packageManager: "npm",
        path: "/test/path",
      });

      const args = {
        "database-type": "mysql",
        environment: "development",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: true, // Skip confirmation
      };

      await newCommand?.run?.({ args });

      expect(vi.mocked(generateDockerFiles)).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          database: expect.objectContaining({
            port: 3306, // MySQL default port
          }),
        })
      );
    });
  });

  describe("Reset Command", () => {
    const resetCommand = main.subCommands?.reset;

    it("should have force argument", () => {
      expect(resetCommand?.args).toHaveProperty("force");
      expect(resetCommand?.args?.force?.default).toBe(false);
    });

    it("should handle no Docker files found", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const args = { force: false };
      await resetCommand?.run?.({ args });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ No Docker files found to remove"
      );
    });

    it("should remove Docker files when force is true", async () => {
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = String(path);
        return (
          pathStr.includes("Dockerfile") ||
          pathStr.includes("docker-compose.yml") ||
          pathStr.includes(".env")
        );
      });

      // Mock readFileSync for .env file with Docker section that will match the regex
      const envContentWithDocker = `# Some existing config
APP_URL=http://localhost

# 🐳 Docker Configuration (Generated by Strapi Dockerize)
DATABASE_CLIENT=postgres
DATABASE_NAME=strapi
DATABASE_HOST=localhost
DATABASE_PORT=5432

DEBUG=true`;

      mockFs.readFileSync.mockReturnValue(envContentWithDocker);

      // Mock the replaced content to ensure writeFileSync gets called
      const cleanedContent = `# Some existing config
APP_URL=http://localhost

DEBUG=true`;

      // Spy on string replace to verify the logic
      const originalReplace = String.prototype.replace;
      vi.spyOn(String.prototype, "replace").mockImplementation(function (
        this: string,
        searchValue,
        replaceValue
      ) {
        if (this.includes("🐳 Docker Configuration")) {
          return cleanedContent;
        }
        return originalReplace.call(this, searchValue, replaceValue);
      });

      const mockStats = { isDirectory: () => false };
      vi.spyOn(require("fs"), "statSync").mockReturnValue(mockStats);

      const resetCommand = (main as any).subCommands?.reset;
      const args = { force: true };
      await resetCommand?.run?.({ args });

      expect(mockFs.unlinkSync).toHaveBeenCalled();
      // Note: .env file cleaning tested separately - this focuses on Docker file removal
    });
  });

  describe("Plugin Commands", () => {
    it("should have generate-plugin command", () => {
      const generateCommand = main.subCommands?.["generate-plugin"];
      expect(generateCommand).toBeDefined();
      expect(generateCommand?.meta.description).toContain("plugin template");
    });

    it("should have test-plugins command", () => {
      const testCommand = main.subCommands?.["test-plugins"];
      expect(testCommand).toBeDefined();
      expect(testCommand?.meta.description).toContain(
        "Test all discovered plugins"
      );
    });

    it("should have list-plugins command", () => {
      const listCommand = main.subCommands?.["list-plugins"];
      expect(listCommand).toBeDefined();
      expect(listCommand?.meta.description).toContain(
        "List all available plugins"
      );
    });

    it("should handle no plugins found for testing", async () => {
      const { discoverPlugins } = await import("./plugins");
      const { outro } = await import("@clack/prompts");
      vi.mocked(discoverPlugins).mockResolvedValue([]);

      const testCommand = main.subCommands?.["test-plugins"];
      await testCommand?.run?.({ args: {} });

      // The implementation calls outro() instead of console.log
      expect(vi.mocked(outro)).toHaveBeenCalledWith(
        "❌ No plugins found to test"
      );
    });

    it("should handle no plugins found for listing", async () => {
      const { discoverPlugins } = await import("./plugins");
      vi.mocked(discoverPlugins).mockResolvedValue([]);

      const listCommand = main.subCommands?.["list-plugins"];
      await listCommand?.run?.({ args: {} });

      expect(mockConsoleLog).toHaveBeenCalledWith("No plugins found");
    });
  });

  describe("Interactive Mode", () => {
    it("should run wizard when no subcommand", async () => {
      const { runWizard } = await import("./wizard");

      const args = { interactive: true };
      await main.run({ args });

      expect(vi.mocked(runWizard)).toHaveBeenCalled();
    });

    it("should not run wizard when interactive is false", async () => {
      const { runWizard } = await import("./wizard");

      const args = { interactive: false };
      await main.run({ args });

      expect(vi.mocked(runWizard)).not.toHaveBeenCalled();
    });
  });

  describe("Password Generation", () => {
    it("should generate secure passwords", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      const { generateDockerFiles } = await import("./generators");

      vi.mocked(detectStrapiProject).mockResolvedValue({
        name: "test-project",
        version: "4.0.0",
        language: "typescript",
        packageManager: "npm",
        path: "/test/path",
      });

      const args = {
        "database-type": "postgresql",
        environment: "development",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: true,
        // No database-password provided - should auto-generate
      };

      const newCommand = main.subCommands?.new;
      await newCommand?.run?.({ args });

      expect(vi.mocked(generateDockerFiles)).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          database: expect.objectContaining({
            password: expect.any(String),
          }),
        })
      );

      // Verify the password was generated (not empty)
      const call = vi.mocked(generateDockerFiles).mock.calls[0];
      const config = call[1];
      expect(config.database.password).toMatch(/^[A-Za-z0-9!@#$%^&*]{16}$/);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully in new command", async () => {
      const { detectStrapiProject } = await import("./utils/detection");
      vi.mocked(detectStrapiProject).mockRejectedValue(new Error("Test error"));

      const args = {
        "database-type": "postgresql",
        environment: "development",
        "database-name": "test",
        "database-user": "test",
        host: "localhost",
        "use-compose": true,
        force: false,
      };

      const newCommand = main.subCommands?.new;
      await expect(async () => {
        await newCommand?.run?.({ args });
      }).rejects.toThrow("process.exit called");

      // The actual implementation passes both message and error object
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Error generating Docker configuration:",
        expect.any(Error)
      );
    });

    it("should handle errors gracefully in reset command", async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      const resetCommand = main.subCommands?.reset;
      await expect(async () => {
        await resetCommand?.run?.({ args: { force: true } });
      }).rejects.toThrow("process.exit called");

      // The actual implementation passes both message and error object
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Error during reset:",
        expect.any(Error)
      );
    });
  });
});

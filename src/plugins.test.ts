import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDatabasePlugin } from "./plugins";
import type { DatabasePlugin } from "./types";

// Mock the plugin-loader directly
vi.mock("./utils/plugin-loader", () => ({
  getDatabasePlugin: vi.fn(),
}));

import { getDatabasePlugin as mockGetDatabasePlugin } from "./utils/plugin-loader";

const mockPlugin: DatabasePlugin = {
  name: "PostgreSQL",
  type: "postgresql",
  metadata: {
    name: "PostgreSQL",
    type: "postgresql",
    description: "PostgreSQL database",
    category: "database" as const,
    version: "1.0.0",
  },
  questions: vi.fn().mockResolvedValue({
    name: "strapi",
    user: "strapi",
    password: "strapi",
  }),
  generateFiles: vi.fn(),
};

describe("plugins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDatabasePlugin", () => {
    it("should load PostgreSQL plugin", async () => {
      vi.mocked(mockGetDatabasePlugin).mockResolvedValue(mockPlugin);

      const plugin = await getDatabasePlugin("postgresql");

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe("PostgreSQL");
      expect(plugin.type).toBe("postgresql");
      expect(typeof plugin.questions).toBe("function");
      expect(mockGetDatabasePlugin).toHaveBeenCalledWith("postgresql");
    });

    it("should load MySQL plugin", async () => {
      const mysqlPlugin: DatabasePlugin = {
        ...mockPlugin,
        name: "MySQL",
        type: "mysql",
      };
      vi.mocked(mockGetDatabasePlugin).mockResolvedValue(mysqlPlugin);

      const plugin = await getDatabasePlugin("mysql");

      expect(plugin.name).toBe("MySQL");
      expect(plugin.type).toBe("mysql");
      expect(mockGetDatabasePlugin).toHaveBeenCalledWith("mysql");
    });

    it("should load MariaDB plugin", async () => {
      const mariadbPlugin: DatabasePlugin = {
        ...mockPlugin,
        name: "MariaDB",
        type: "mariadb",
      };
      vi.mocked(mockGetDatabasePlugin).mockResolvedValue(mariadbPlugin);

      const plugin = await getDatabasePlugin("mariadb");

      expect(plugin.name).toBe("MariaDB");
      expect(plugin.type).toBe("mariadb");
      expect(mockGetDatabasePlugin).toHaveBeenCalledWith("mariadb");
    });

    it("should load SQLite plugin", async () => {
      const sqlitePlugin: DatabasePlugin = {
        ...mockPlugin,
        name: "SQLite",
        type: "sqlite",
      };
      vi.mocked(mockGetDatabasePlugin).mockResolvedValue(sqlitePlugin);

      const plugin = await getDatabasePlugin("sqlite");

      expect(plugin.name).toBe("SQLite");
      expect(plugin.type).toBe("sqlite");
      expect(mockGetDatabasePlugin).toHaveBeenCalledWith("sqlite");
    });

    it("should throw error for unknown database type", async () => {
      vi.mocked(mockGetDatabasePlugin).mockRejectedValue(
        new Error("Plugin 'unknown' not found")
      );

      await expect(getDatabasePlugin("unknown" as any)).rejects.toThrow(
        "Plugin 'unknown' not found"
      );
    });

    it("should throw error for empty database type", async () => {
      vi.mocked(mockGetDatabasePlugin).mockRejectedValue(
        new Error("Plugin '' not found")
      );

      await expect(getDatabasePlugin("") as any).rejects.toThrow(
        "Plugin '' not found"
      );
    });

    it("should handle plugin with questions correctly", async () => {
      vi.mocked(mockGetDatabasePlugin).mockResolvedValue(mockPlugin);

      const plugin = await getDatabasePlugin("postgresql");
      const questions = await plugin.questions();

      expect(questions).toBeDefined();
      expect(questions.name).toBe("strapi");
      expect(questions.user).toBe("strapi");
    });

    it("should call plugin loader for each database type", async () => {
      const databaseTypes = ["postgresql", "mysql", "mariadb", "sqlite"];

      for (const dbType of databaseTypes) {
        const plugin: DatabasePlugin = {
          ...mockPlugin,
          type: dbType,
          name: dbType.toUpperCase(),
        };
        vi.mocked(mockGetDatabasePlugin).mockResolvedValue(plugin);

        await getDatabasePlugin(dbType as any);

        expect(mockGetDatabasePlugin).toHaveBeenCalledWith(dbType);
      }
    });
  });
});

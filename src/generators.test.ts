import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDockerFiles } from "./generators";
import type { StrapiProject, DockerConfig } from "./types";

// Mock dependencies
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

vi.mock("./utils/file-writer", () => ({
  writeFilesWithEnv: vi.fn(),
  generateSecrets: vi.fn(() => ({
    appKeys: "test-app-keys",
    apiTokenSalt: "test-api-token-salt",
    adminJwtSecret: "test-admin-jwt-secret",
    transferTokenSalt: "test-transfer-token-salt",
    jwtSecret: "test-jwt-secret",
  })),
}));

import { readFileSync } from "fs";
import { writeFilesWithEnv } from "./utils/file-writer";

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFilesWithEnv = vi.mocked(writeFilesWithEnv);

describe("generators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject: StrapiProject = {
    isStrapi: true,
    name: "test-strapi-app",
    packageManager: "npm",
    type: "javascript",
    path: "/test/path",
    version: "^5.0.0",
  };

  describe("generateDockerFiles", () => {
    it("should generate development files only", async () => {
      const config: DockerConfig = {
        database: {
          type: "postgresql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 5432,
          host: "localhost",
        },
        environment: "development",
        useCompose: true,
      };

      // Mock template files
      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("Docker Compose template");

      await generateDockerFiles(mockProject, config);

      expect(mockWriteFilesWithEnv).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: "Dockerfile",
            description: "Development Dockerfile",
          }),
          expect.objectContaining({
            path: "docker-compose.yml",
          }),
        ]),
        expect.objectContaining({
          path: ".env",
          description: "Environment variables (merged with existing)",
        }),
        "/test/path"
      );

      // Should not generate production dockerfile
      const files = mockWriteFilesWithEnv.mock.calls[0][0];
      expect(
        files.find((f: any) => f.path === "Dockerfile.prod")
      ).toBeUndefined();
    });

    it("should generate production files only", async () => {
      const config: DockerConfig = {
        database: {
          type: "mysql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 3306,
          host: "localhost",
        },
        environment: "production",
        useCompose: false,
      };

      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("Production Dockerfile template");

      await generateDockerFiles(mockProject, config);

      const files = mockWriteFilesWithEnv.mock.calls[0][0];

      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "Dockerfile",
            description: "Development Dockerfile",
          }),
          expect.objectContaining({
            path: "Dockerfile.prod",
            description: "Production Dockerfile",
          }),
        ])
      );

      // Should not generate docker-compose.yml
      expect(
        files.find((f: any) => f.path === "docker-compose.yml")
      ).toBeUndefined();
    });

    it("should generate both development and production files", async () => {
      const config: DockerConfig = {
        database: {
          type: "postgresql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 5432,
          host: "localhost",
        },
        environment: "both",
        useCompose: true,
      };

      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("Production Dockerfile template")
        .mockReturnValueOnce("Docker Compose template");

      await generateDockerFiles(mockProject, config);

      const files = mockWriteFilesWithEnv.mock.calls[0][0];

      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "Dockerfile",
            description: "Development Dockerfile",
          }),
          expect.objectContaining({
            path: "Dockerfile.prod",
            description: "Production Dockerfile",
          }),
          expect.objectContaining({
            path: "docker-compose.yml",
          }),
        ])
      );
    });

    it("should handle SQLite database with appropriate template", async () => {
      const config: DockerConfig = {
        database: {
          type: "sqlite",
          name: ".tmp/data.db",
          user: "",
          password: "",
          port: 0,
          host: "",
        },
        environment: "development",
        useCompose: true,
      };

      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("SQLite Docker Compose template");

      await generateDockerFiles(mockProject, config);

      const files = mockWriteFilesWithEnv.mock.calls[0][0];
      const composeFile = files.find(
        (f: any) => f.path === "docker-compose.yml"
      );

      expect(composeFile).toBeDefined();
      expect(composeFile?.description).toBe(
        "Docker Compose for Strapi with SQLite"
      );
    });

    it("should handle MariaDB database with correct image settings", async () => {
      const config: DockerConfig = {
        database: {
          type: "mariadb",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 3306,
          host: "localhost",
        },
        environment: "development",
        useCompose: true,
      };

      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("Docker Compose template");

      await generateDockerFiles(mockProject, config);

      expect(mockWriteFilesWithEnv).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          templateVars: expect.objectContaining({
            database: expect.objectContaining({
              client: "mysql", // MariaDB uses mysql client in Strapi
              type: "mariadb",
              image: "mariadb",
              tag: "10.11",
            }),
          }),
        }),
        "/test/path"
      );
    });

    it("should use yarn package manager when specified", async () => {
      const yarnProject: StrapiProject = {
        ...mockProject,
        packageManager: "yarn",
      };

      const config: DockerConfig = {
        database: {
          type: "postgresql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 5432,
          host: "localhost",
        },
        environment: "development",
        useCompose: false,
      };

      mockReadFileSync.mockReturnValueOnce("Development Dockerfile template");

      await generateDockerFiles(yarnProject, config);

      expect(mockWriteFilesWithEnv).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          templateVars: expect.objectContaining({
            packageManager: "yarn",
          }),
        }),
        "/test/path"
      );
    });

    it("should generate secure secrets for environment variables", async () => {
      const config: DockerConfig = {
        database: {
          type: "postgresql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 5432,
          host: "localhost",
        },
        environment: "development",
        useCompose: false,
      };

      mockReadFileSync.mockReturnValueOnce("Development Dockerfile template");

      await generateDockerFiles(mockProject, config);

      expect(mockWriteFilesWithEnv).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          templateVars: expect.objectContaining({
            secrets: expect.objectContaining({
              // Updated to match the new format from security-utils.ts
              jwt: expect.any(String),
              adminJwt: expect.any(String),
              appKeys: expect.any(String), // Now a comma-separated string
            }),
          }),
        }),
        "/test/path"
      );
    });

    it("should set correct database service name for PostgreSQL", async () => {
      const config: DockerConfig = {
        database: {
          type: "postgresql",
          name: "strapi",
          user: "strapi",
          password: "password123",
          port: 5432,
          host: "localhost",
        },
        environment: "development",
        useCompose: true,
      };

      mockReadFileSync
        .mockReturnValueOnce("Development Dockerfile template")
        .mockReturnValueOnce("Docker Compose template");

      await generateDockerFiles(mockProject, config);

      expect(mockWriteFilesWithEnv).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          templateVars: expect.objectContaining({
            database: expect.objectContaining({
              serviceName: "strapiDB",
              image: "postgres",
              tag: "16.0-alpine",
            }),
          }),
        }),
        "/test/path"
      );
    });
  });
});

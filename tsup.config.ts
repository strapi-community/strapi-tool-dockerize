import { defineConfig } from "tsup";

export default defineConfig({
  entry: [`src/index.ts`],
  format: [`esm`],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  minify: true,
  target: `node18`,
  noExternal: [`@clack/prompts`, `@clack/core`],
  external: [],
  banner: {
    js: `import { createRequire } from "module";const require = createRequire(import.meta.url);`,
  },
  // Copy template files and plugin templates to dist
  publicDir: false,
  onSuccess: async () => {
    const { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } =
      await import("fs");
    const { join } = await import("path");

    // Create template directories in dist
    const templateDirs = [
      "dist/templates/dockerfile",
      "dist/templates/compose",
      "dist/templates/init-scripts",
      "dist/plugins/databases/postgresql/templates",
      "dist/plugins/databases/mysql/templates",
      "dist/plugins/databases/mariadb/templates",
      "dist/plugins/databases/sqlite/templates",
    ];

    templateDirs.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    // Copy main template files
    const templateFiles = [
      "src/templates/dockerfile/development.liquid",
      "src/templates/dockerfile/production.liquid",
      "src/templates/compose/complete.liquid",
      "src/templates/compose/sqlite.liquid",
      "src/templates/env.liquid",
      "src/templates/init-scripts/postgresql-init.sql.liquid",
    ];

    templateFiles.forEach((file) => {
      const destFile = file.replace("src/", "dist/");
      copyFileSync(file, destFile);
      console.log(`✅ Copied template: ${file} → ${destFile}`);
    });

    // Copy plugin template files
    const pluginTemplateDirs = [
      "src/plugins/databases/postgresql/templates",
      "src/plugins/databases/mysql/templates",
      "src/plugins/databases/mariadb/templates",
    ];

    pluginTemplateDirs.forEach((dir) => {
      if (existsSync(dir)) {
        const files = readdirSync(dir);
        files.forEach((file) => {
          if (file.endsWith(".liquid")) {
            const srcFile = join(dir, file);
            const destFile = srcFile.replace("src/", "dist/");
            copyFileSync(srcFile, destFile);
            console.log(`✅ Copied plugin template: ${srcFile} → ${destFile}`);
          }
        });
      }
    });
  },
});

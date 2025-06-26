import { text, select, confirm } from "@clack/prompts";
import { Liquid } from "liquidjs";
import { readFileSync } from "fs";
import { join } from "path";
import type { DatabasePlugin, DatabaseConfig } from "../../types";

export const sqlitePlugin: DatabasePlugin = {
  name: "SQLite",
  type: "sqlite",

  async questions(): Promise<Record<string, any>> {
    const name = await text({
      message: "SQLite database filename:",
      placeholder: "strapi.db",
      initialValue: "strapi.db",
      validate: (value) => {
        if (!value) return "Database filename is required";
        if (!value.endsWith(".db"))
          return "Database filename should end with .db";
        return;
      },
    });

    if (typeof name === "symbol") {
      throw new Error("Database configuration cancelled");
    }

    return {
      type: "sqlite",
      name,
      user: "", // SQLite doesn't use username
      password: "", // SQLite doesn't use password
      port: 0, // SQLite doesn't use port
      host: "", // SQLite doesn't use host
    };
  },

  async generateFiles(config: Record<string, any>): Promise<void> {
    const liquid = new Liquid();

    // For SQLite, we create a simple compose service that just uses file-based storage
    const templateVars = {
      serviceName: "strapi-sqlite",
      database: {
        client: "sqlite",
        type: "sqlite",
        name: config.name,
        filename: config.name,
        // SQLite doesn't need these but we include them for template compatibility
        user: "",
        password: "",
        port: 0,
        host: "",
      },
    };

    // SQLite template (simplified - no separate database service needed)
    const template = `services:
  {{ serviceName }}:
    container_name: {{ serviceName }}
    restart: unless-stopped
    volumes:
      - ./data/{{ database.filename }}:/opt/app/data/{{ database.filename }}
      - strapi-sqlite-data:/opt/app/data
    environment:
      DATABASE_CLIENT: sqlite
      DATABASE_FILENAME: ./data/{{ database.filename }}
    # Note: SQLite runs within the Strapi container, no separate database service needed

volumes:
  strapi-sqlite-data:

networks:
  strapi:
    name: Strapi
    driver: bridge`;

    const rendered = await liquid.parseAndRender(template, templateVars);

    console.log("✅ SQLite configuration generated");
    console.log(
      "📝 Note: SQLite runs within the Strapi container - no separate database service needed"
    );
  },
};

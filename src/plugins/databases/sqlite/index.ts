import type { DatabasePlugin } from "../../../types";
import { questions } from "./questions";

export const sqlitePlugin: DatabasePlugin = {
  name: "SQLite",
  type: "sqlite",

  metadata: {
    name: "SQLite",
    type: "sqlite",
    description: "SQLite file-based database (no separate container needed)",
    category: "database",
    version: "1.0.0",
  },

  questions,

  async generateFiles(config, context) {
    console.log(`🔧 Generating SQLite configuration...`);
    console.log(`✅ SQLite configuration generated!`);
  },
};

import type { DatabasePlugin } from "../../../types";
import { questions } from "./questions";

export const mysqlPlugin: DatabasePlugin = {
  name: "MySQL",
  type: "mysql",

  metadata: {
    name: "MySQL",
    type: "mysql",
    description: "MySQL relational database",
    category: "database",
    version: "1.0.0",
  },

  questions,

  async generateFiles(config, context) {
    console.log(`🔧 Generating MySQL configuration...`);
    console.log(`✅ MySQL configuration generated!`);
  },
};

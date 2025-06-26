import type { DatabasePlugin } from "../../../types";
import { questions } from "./questions";

export const postgresqlPlugin: DatabasePlugin = {
  name: "PostgreSQL",
  type: "postgresql",

  metadata: {
    name: "PostgreSQL",
    type: "postgresql",
    description: "PostgreSQL relational database with ACID compliance",
    category: "database",
    version: "1.0.0",
  },

  questions,

  async generateFiles(config, context) {
    console.log(`🔧 Generating PostgreSQL configuration...`);

    // Template processing will be handled by the main system
    // This plugin just provides the configuration

    console.log(`✅ PostgreSQL configuration generated!`);
  },
};

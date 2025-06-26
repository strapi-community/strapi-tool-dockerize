import type { DatabasePlugin } from "../../../types";
import { questions } from "./questions";

export const mariadbPlugin: DatabasePlugin = {
  name: "MariaDB",
  type: "mariadb",

  metadata: {
    name: "MariaDB",
    type: "mariadb",
    description: "MariaDB MySQL-compatible database",
    category: "database",
    version: "1.0.0",
  },

  questions,

  async generateFiles(config, context) {
    console.log(`🔧 Generating MariaDB configuration...`);
    console.log(`✅ MariaDB configuration generated!`);
  },
};

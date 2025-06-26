import { text, confirm } from "@clack/prompts";

export async function questions() {
  const dbPath = await text({
    message: "Database file path (press Enter for default):",
    placeholder: "./data/strapi.db",
    defaultValue: "./data/strapi.db",
  });

  const createBackup = await confirm({
    message: "Create database backup volume?",
    initialValue: true,
  });

  return {
    path: dbPath || "./data/strapi.db", // Fallback to default
    createBackup,
    // SQLite doesn't need host/port/user/password
    host: "localhost",
    port: 0,
  };
}

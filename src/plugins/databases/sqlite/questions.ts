import { text, confirm } from "@clack/prompts";

export async function questions() {
  const dbPath = await text({
    message: "Database file path:",
    placeholder: "./data/strapi.db",
    defaultValue: "./data/strapi.db",
    validate: (value) => {
      if (!value) return "Database path is required";
    },
  });

  const createBackup = await confirm({
    message: "Create database backup volume?",
    initialValue: true,
  });

  return {
    path: dbPath,
    createBackup,
    // SQLite doesn't need host/port/user/password
    host: "localhost",
    port: 0,
  };
}

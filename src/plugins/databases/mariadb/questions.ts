import { text, select, password, note } from "@clack/prompts";
import { generateSecurePassword } from "../../../utils/security-utils";

export async function questions(defaults?: {
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseHost?: string;
  databasePort?: number;
}) {
  // Generate secure random defaults if not provided
  const randomDefaults = {
    databaseName: defaults?.databaseName || generateRandomName("db"),
    databaseUser: defaults?.databaseUser || generateRandomName("user"),
    databasePassword: defaults?.databasePassword || generateSecurePassword(),
    databaseHost: defaults?.databaseHost || "localhost",
    databasePort: defaults?.databasePort || 3306,
  };

  const dbName = await text({
    message: "Database name (press Enter for default):",
    placeholder: randomDefaults.databaseName,
    validate: (value) => {
      const val =
        (typeof value === "string" ? value.trim() : "") ||
        randomDefaults.databaseName;
      if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
        return "Database name can only contain letters, numbers, underscores and hyphens";
      }
    },
  });

  const finalDbName =
    (typeof dbName === "string" ? dbName.trim() : "") ||
    randomDefaults.databaseName;

  const dbUser = await text({
    message: "Database user (press Enter for default):",
    placeholder: randomDefaults.databaseUser,
    validate: (value) => {
      const val =
        (typeof value === "string" ? value.trim() : "") ||
        randomDefaults.databaseUser;
      if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
        return "Username can only contain letters, numbers, underscores and hyphens";
      }
    },
  });

  const finalDbUser =
    (typeof dbUser === "string" ? dbUser.trim() : "") ||
    randomDefaults.databaseUser;

  // Show what defaults were used if user left fields blank
  const dbNameEmpty = !dbName || (typeof dbName === "string" && !dbName.trim());
  const dbUserEmpty = !dbUser || (typeof dbUser === "string" && !dbUser.trim());

  if (dbNameEmpty || dbUserEmpty) {
    const usedDefaults = [];
    if (dbNameEmpty) usedDefaults.push(`Database: ${finalDbName}`);
    if (dbUserEmpty) usedDefaults.push(`User: ${finalDbUser}`);

    note(
      `Generated secure defaults:\n${usedDefaults.join("\n")}`,
      "Auto-generated Values"
    );
  }

  const passwordType = await select({
    message: "How would you like to set the database password?",
    options: [
      {
        value: "generate",
        label: "Generate secure password",
        hint: "Recommended",
      },
      { value: "custom", label: "Enter custom password" },
    ],
  });

  let dbPassword: string;
  if (passwordType === "custom") {
    dbPassword = (await password({
      message: "Database password:",
      validate: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8)
          return "Password must be at least 8 characters long";
      },
    })) as string;
  } else {
    dbPassword = randomDefaults.databasePassword;
    console.log(`🔐 Using secure password: ${dbPassword.substring(0, 4)}...`);
  }

  const dbPort = await text({
    message: "Database port (press Enter for default):",
    placeholder: String(randomDefaults.databasePort),
    validate: (value) => {
      const val =
        (typeof value === "string" ? value.trim() : "") ||
        String(randomDefaults.databasePort);
      const port = parseInt(val);
      if (isNaN(port)) return "Port must be a number";
      if (port < 1024 || port > 65535)
        return "Port must be between 1024 and 65535";
    },
  });

  return {
    name: finalDbName,
    user: finalDbUser,
    password: dbPassword,
    port: parseInt(
      (typeof dbPort === "string" ? dbPort.trim() : "") ||
        String(randomDefaults.databasePort)
    ),
    host: randomDefaults.databaseHost,
  };
}

function generateRandomName(prefix: string): string {
  const adjectives = [
    "swift",
    "bright",
    "cosmic",
    "noble",
    "mystic",
    "lunar",
    "solar",
    "crystal",
  ];
  const nouns = [
    "falcon",
    "phoenix",
    "dragon",
    "tiger",
    "eagle",
    "wolf",
    "bear",
    "lion",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${prefix}_${adjective}_${noun}_${number}`;
}

// generateSecurePassword function moved to utils/security-utils.ts

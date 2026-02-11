import type { DatabaseClient } from "../../config"
import type { DatabasePlugin } from "../types"
import { mariadbPlugin } from "./mariadb"
import { mysqlPlugin } from "./mysql"
import { postgresPlugin } from "./postgres"
import { sqlitePlugin } from "./sqlite"

export const databasePlugins = new Map<DatabaseClient, DatabasePlugin>([
	["postgres", postgresPlugin],
	["mysql", mysqlPlugin],
	["mariadb", mariadbPlugin],
	["sqlite", sqlitePlugin],
])

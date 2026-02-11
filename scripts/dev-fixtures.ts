import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const FIXTURES_DIR = join(import.meta.dirname, "..", "tmp", "fixtures")

interface Fixture {
	name: string
	strapiVersion: string
	database?: string
	databaseDep?: string
	packageManager: string
	lockfile?: string
	env?: Record<string, string>
}

const fixtures: Fixture[] = [
	{
		name: "v5-npm-postgres",
		strapiVersion: "^5.0.0",
		database: "postgres",
		databaseDep: "pg",
		packageManager: "npm",
		lockfile: "package-lock.json",
		env: {
			DATABASE_CLIENT: "postgres",
			DATABASE_HOST: "localhost",
			DATABASE_PORT: "5432",
			DATABASE_NAME: "strapi",
			DATABASE_USERNAME: "strapi",
			DATABASE_PASSWORD: "strapi",
		},
	},
	{
		name: "v5-pnpm-mysql",
		strapiVersion: "^5.0.0",
		database: "mysql",
		databaseDep: "mysql2",
		packageManager: "pnpm",
		lockfile: "pnpm-lock.yaml",
		env: {
			DATABASE_CLIENT: "mysql",
			DATABASE_HOST: "localhost",
			DATABASE_PORT: "3306",
			DATABASE_NAME: "strapi",
			DATABASE_USERNAME: "strapi",
			DATABASE_PASSWORD: "strapi",
		},
	},
	{
		name: "v5-bun-sqlite",
		strapiVersion: "^5.0.0",
		database: "sqlite",
		databaseDep: "better-sqlite3",
		packageManager: "bun",
		lockfile: "bun.lockb",
	},
	{
		name: "v4-npm-postgres",
		strapiVersion: "^4.15.0",
		database: "postgres",
		databaseDep: "pg",
		packageManager: "npm",
		lockfile: "package-lock.json",
		env: {
			DATABASE_CLIENT: "postgres",
			DATABASE_HOST: "localhost",
			DATABASE_PORT: "5432",
			DATABASE_NAME: "strapi",
			DATABASE_USERNAME: "strapi",
			DATABASE_PASSWORD: "strapi",
		},
	},
	{
		name: "v5-npm-nodetect",
		strapiVersion: "^5.0.0",
		packageManager: "npm",
		lockfile: "package-lock.json",
	},
]

async function createFixture(fixture: Fixture) {
	const dir = join(FIXTURES_DIR, fixture.name)
	await mkdir(dir, { recursive: true })

	const pkg: Record<string, unknown> = {
		name: `fixture-${fixture.name}`,
		version: "1.0.0",
		dependencies: {
			"@strapi/strapi": fixture.strapiVersion,
			...(fixture.databaseDep ? { [fixture.databaseDep]: "^8.0.0" } : {}),
		},
	}
	await writeFile(join(dir, "package.json"), JSON.stringify(pkg, null, "\t"))

	if (fixture.lockfile) {
		await writeFile(join(dir, fixture.lockfile), "")
	}

	if (fixture.env) {
		const envContent = Object.entries(fixture.env)
			.map(([k, v]) => `${k}=${v}`)
			.join("\n")
		await writeFile(join(dir, ".env"), `${envContent}\n`)
	}

	console.log(`  created ${fixture.name}`)
}

console.log(`\nCreating fixtures in tmp/fixtures/\n`)

for (const fixture of fixtures) {
	await createFixture(fixture)
}

console.log(`\nDone. ${fixtures.length} fixtures ready.\n`)

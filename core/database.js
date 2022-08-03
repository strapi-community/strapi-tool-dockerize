const path = require('path');
const { spinner, access, copyFile } = require('./utils');
const { getProjectType } = require('./detection');

async function generateDatabase(config) {
	return `${
		getProjectType() === 'ts' ? 'export default' : 'module.exports = '
	} ({ env }) => ({
	connection: {
		client: '${
			config.dbtype.toLowerCase() === 'postgresql' ? 'postgres' : 'mysql'
		}',
		connection: {
			host: env('DATABASE_HOST', 'localhost'),
			port: env.int('DATABASE_PORT', ${config.dbport}),
			database: env('DATABASE_NAME', '${config.dbname}'),
			user: env('DATABASE_USERNAME', '${config.dbuser}'),
			password: env('DATABASE_PASSWORD', '${config.dbpassword}'),
			ssl: env.bool('DATABASE_SSL', false)
		}
	}
});
`;
}

async function checkAndBackupDB() {
	const databasePath = path.join(
		process.cwd(),
		'config',
		`database.${getProjectType()}`
	);
	spinner.start(`Checking for existing config/database.${getProjectType()}`);
	const databaseOldPath = path.join(process.cwd(), 'config', 'database.backup');
	spinner.stopAndPersist({
		symbol: '🕵️‍♀️',
		text: ` Detected config/database.${getProjectType()}, made a backup at 👉 config/database.backup \n`
	});
	try {
		await access(databasePath);
		await copyFile(databasePath, databaseOldPath);
	} catch (error) {
		console.log(error);
		spinner.stopAndPersist({
			symbol: '❌',
			text: ` Unable to access config/database.${getProjectType()} does it exist 🤔 - check and try again \n`
		});
	}
}

module.exports = { checkAndBackupDB, generateDatabase };

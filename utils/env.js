const { createWriteStream, readFile } = require('fs');

async function appendEnvFile(config) {
	await readFile('.env', 'utf8', async (err, data) => {
		const logger = createWriteStream('.env', { flags: 'a' });

		if (data.includes('Strapi Dockerize variables')) {
			console.log('variables already exits');
			return;
		}
		const writeLine = line => logger.write(`\n${line}`);

		writeLine(`\n # Strapi Dockerize variables\n`);
		writeLine(`DATABASE_HOST=localhost`);
		writeLine(`DATABASE_PORT=${config.dbport}`);
		writeLine(`DATABASE_NAME=${config.dbname}`);
		writeLine(`DATABASE_USERNAME=${config.dbuser}`);
		writeLine(`DATABASE_PASSWORD=${config.dbpassword}`);
		writeLine(`DATABASE_CLIENT=${config.dbtype.toLowerCase()}`);
	});
}

module.exports = appendEnvFile;

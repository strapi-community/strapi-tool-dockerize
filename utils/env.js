const { createWriteStream, readFile } = require('fs');
const ora = require('ora');
const spinner = ora({ text: '' });

async function appendEnvFile(config) {
	spinner.start();
	await readFile('.env', 'utf8', async (err, data) => {
		const logger = createWriteStream('.env', { flags: 'a' });

		if (data.includes('Strapi Dockerize variables')) {
			spinner.stopAndPersist({
				symbol: '⚠️',
				text: ` .env file already contains Strapi Dockerize variables please update manually or remove them \n`
			});
			return;
		}
		const writeLine = line => logger.write(`\n${line}`);

		writeLine(`\n # Strapi Dockerize variables\n`);
		writeLine(`DATABASE_HOST=localhost`);
		writeLine(`DATABASE_PORT=${config.dbport}`);
		writeLine(`DATABASE_NAME=${config.dbname}`);
		writeLine(`DATABASE_USERNAME=${config.dbuser}`);
		writeLine(`DATABASE_PASSWORD=${config.dbpassword}`);
		writeLine(`NODE_ENV=development`);
		writeLine(
			`DATABASE_CLIENT=${
				config.dbtype.toLowerCase() === 'postgresql' ? 'postgres' : 'mysql'
			}`
		);
		spinner.stopAndPersist({
			symbol: '🕵️',
			text: ' Added Strapi Dockerize variables to .env file \n'
		});
	});
}

module.exports = appendEnvFile;

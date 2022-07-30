const { createWriteStream, readFile } = require('fs');
const { spinner, replace, outDir, chalk } = require('../utils');
const logger = createWriteStream('.env', { flags: 'a' });

const writeLine = line => logger.write(`\n${line}`);

async function appendEnvFile(config) {
	spinner.start();
	await readFile('.env', 'utf8', async (err, data) => {
		if (data && data.includes('Strapi Dockerize')) {
			await envUpdate(config.env);
			spinner.stopAndPersist({
				symbol: '⚠️',
				text: ` .env file already contains enviromental variables but we updated your NODE_ENV with ${chalk.green.bold(
					config.env.toUpperCase()
				)} the rest you need to update yourself 🙏 \n`
			});
			return;
		}

		writeLine(`# Strapi Dockerize variables \n`);
		// Needs to be updated to use the config object👇
		writeLine(`DATABASE_HOST=localhost`);

		writeLine(`DATABASE_PORT=${config.dbport}`);
		writeLine(`DATABASE_NAME=${config.dbname}`);
		writeLine(`DATABASE_USERNAME=${config.dbuser}`);
		writeLine(`DATABASE_PASSWORD=${config.dbpassword}`);
		writeLine(`NODE_ENV=${config.env.toLowerCase()}`);
		writeLine(
			`DATABASE_CLIENT=${
				config.dbtype.toLowerCase() === 'postgresql' ? 'postgres' : 'mysql'
			}`
		);
		spinner.stopAndPersist({
			symbol: '🕵️',
			text: ' Added Dockerize variables to .env file \n'
		});
	});
}

async function envUpdate(env) {
	const options = {
		files: `${outDir}/.env`,
		from: /(Development|Production)/i,
		to: `${env.toLowerCase()}`
	};
	try {
		await replace(options);
	} catch (error) {}
}
module.exports = appendEnvFile;

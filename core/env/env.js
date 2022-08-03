const { createWriteStream, readFile } = require('fs');
const {
	spinner,
	replace,
	outDir,
	chalk,
	generateError,
	getConfig
} = require('../../utils');
const logger = createWriteStream('.env', { flags: 'a' });

const writeLine = line => logger.write(`\n${line}`);
const config = getConfig();

async function appendEnvFile() {
	spinner.start(' 🪄  Working .env magic');

	await readFile('.env', 'utf8', async (err, data) => {
		if (data && data.includes('@strapi-community/dockerize variables ')) {
			await envUpdate(config.env);
			return;
		}

		writeLine('# @strapi-community/dockerize variables \n');
		writeLine(`DATABASE_HOST=${config.dbhost}`);
		writeLine(`DATABASE_PORT=${config.dbport}`);
		writeLine(`DATABASE_NAME=${config.dbname}`);
		writeLine(`DATABASE_USERNAME=${config.dbuser}`);
		writeLine(`DATABASE_PASSWORD=${config.dbpassword}`);
		writeLine(
			`NODE_ENV=${
				config.env.toLowerCase() === 'both' ||
				config.env.toLowerCase() === 'development'
					? 'development'
					: 'production'
			}`
		);
		writeLine(
			`DATABASE_CLIENT=${
				config.dbtype.toLowerCase() === 'postgresql' ? 'postgres' : 'mysql'
			}`
		);
		spinner.stopAndPersist({
			symbol: '🕵️',
			text: `  Added ${chalk.blue('Dockerize')} variables in ${chalk.yellow(
				'.env'
			)} file \n`
		});
	});
}

async function envUpdate(env) {
	const options = {
		files: `${outDir}/.env`,
		from: [
			/(Development|Production)/i,
			/both/i,
			/DATABASE_CLIENT=\s*([^\n\r]*)/,
			/DATABASE_HOST=\s*([^\n\r]*)/,
			/DATABASE_NAME=\s*([^\n\r]*)/,
			/DATABASE_USERNAME=\s*([^\n\r]*)/,
			/DATABASE_PASSWORD=\s*([^\n\r]*)/,
			/DATABASE_PORT=\s*([^\n\r]*)/
		],
		to: [
			`${env.toLowerCase()}`,
			'development',
			`DATABASE_CLIENT=${
				config.dbtype.toLowerCase() === 'postgresql' ? 'postgres' : 'mysql'
			}`,
			`DATABASE_HOST=${getConfig().dbhost}`,
			`DATABASE_NAME=${getConfig().dbname}`,
			`DATABASE_USERNAME=${getConfig().dbuser}`,
			`DATABASE_PASSWORD=${getConfig().dbpassword}`,
			`DATABASE_PORT=${getConfig().dbport}`
		]
	};
	try {
		await replace(options);
		spinner.stopAndPersist({
			symbol: '🕵️',
			text: `  Updated ${chalk.blue('Dockerize')} variables in ${chalk.yellow(
				'.env'
			)} file \n`
		});
	} catch (error) {
		await generateError(error);
	}
}
module.exports = appendEnvFile;

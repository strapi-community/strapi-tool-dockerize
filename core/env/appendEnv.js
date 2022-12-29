const { createWriteStream, readFile } = require(`fs`);
const {
	spinner,
	replace,
	chalk,
	generateError,
	config
} = require(`../../utils`);

const logger = createWriteStream(`.env`, { flags: `a` });

const writeLine = line => logger.write(`\n${line}`);

const appendEnv = async () => {
	spinner.start(` 🪄  Working .env magic`);

	await readFile(`.env`, `utf8`, async (err, data) => {
		if (data && data.includes(`@strapi-community/dockerize variables`)) {
			await envUpdate(config.env);
			return;
		}

		writeLine(`# @strapi-community/dockerize variables \n`);
		writeLine(`DATABASE_HOST=${config.dbhost}`);
		writeLine(`DATABASE_PORT=${config.dbport}`);
		writeLine(`DATABASE_NAME=${config.dbname}`);
		writeLine(`DATABASE_USERNAME=${config.dbuser}`);
		writeLine(`DATABASE_PASSWORD=${config.dbpassword}`);
		writeLine(
			`NODE_ENV=${
				config.env.toLowerCase() === `both` ||
				config.env.toLowerCase() === `development`
					? `development`
					: `production`
			}`
		);
		writeLine(
			`DATABASE_CLIENT=${config.dbtype === `postgresql` ? `postgres` : `mysql`}`
		);
		writeLine(`# @strapi-community/dockerize end variables \n`);
		spinner.stopAndPersist({
			symbol: `🕵️`,
			text: `  Added ${chalk.bold.blue(
				`Dockerize`
			)} variables in ${chalk.yellow(`.env`)} \n`
		});
	});
};

const envUpdate = async env => {
	const options = {
		files: `${config.outDir}/.env`,
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
			`development`,
			`DATABASE_CLIENT=${
				config.dbtype.toLowerCase() === `postgresql` ? `postgres` : `mysql`
			}`,
			`DATABASE_HOST=${config.dbhost}`,
			`DATABASE_NAME=${config.dbname}`,
			`DATABASE_USERNAME=${config.dbuser}`,
			`DATABASE_PASSWORD=${config.dbpassword}`,
			`DATABASE_PORT=${config.dbport}`
		]
	};

	try {
		await replace(options);
		spinner.stopAndPersist({
			symbol: `🕵️`,
			text: `  Updated ${chalk.bold.blue(
				`Dockerize`
			)} variables in ${chalk.yellow(`.env`)} \n`
		});
	} catch (error) {
		await generateError(error);
	}
};
module.exports = appendEnv;

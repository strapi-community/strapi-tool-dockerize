const path = require(`path`);
const fse = require(`fs-extra`);

const { generateDatabase } = require(`../database`);
const { spinner, chalk, generateError, config } = require(`../../utils`);

const createEnv = async () => {
	if (config.env.toLowerCase() === `both`) {
		await _envSetup(`production`);
		await _envSetup(`development`);
	}
	await _envSetup(config.env);
	await _cleanupFolders();

	spinner.stopAndPersist({
		symbol: `💾`,
		text: ` Added ${chalk.bold.green(
			config.dbtype.toUpperCase()
		)} configuration to database.${config.projectType} \n`
	});
};

const _cleanupFolders = async () => {
	const envPath = path.join(process.cwd(), `config`, `env`, `both`);
	if (await fse.pathExists(envPath)) {
		await fse.remove(envPath);
	}
};

const _envSetup = async envType => {
	const databasePath = path.join(
		process.cwd(),
		`config`,
		`env`,
		`${envType.toLowerCase()}`,
		`database.${config.projectType}`
	);
	try {
		await fse.outputFile(
			databasePath,
			(await generateDatabase(config)).toString()
		);
	} catch (error) {
		await generateError(error);
	}
};

module.exports = createEnv;

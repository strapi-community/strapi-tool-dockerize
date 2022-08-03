const path = require('path');
const fse = require('fs-extra');

const { generateDatabase } = require('../database');
const { spinner, chalk, generateError } = require('../utils');
const { getProjectType } = require('../detection');

async function _envSetup(config, envType) {
	const databasePath = path.join(
		process.cwd(),
		'config',
		'env',
		`${envType.toLowerCase()}`,
		`database.${getProjectType()}`
	);

	try {
		await fse.outputFile(
			databasePath,
			(await generateDatabase(config)).toString()
		);
	} catch (error) {
		await generateError(error);
	}
}

async function createEnv(config) {
	if (config.env.toLowerCase() === 'both') {
		await _envSetup(config, 'production');
		await _envSetup(config, 'development');
	}
	await _envSetup(config, config.env);
	await _cleanupFolders();

	spinner.stopAndPersist({
		symbol: '💾',
		text: ` Added ${chalk.bold.green(
			config.dbtype.toUpperCase()
		)} configuration to database.${getProjectType()} \n`
	});
}
async function _cleanupFolders() {
	// check if folder config/env/both exists if it does remove the directory and all files if not do nothing
	const envPath = path.join(process.cwd(), 'config', 'env', 'both');
	if (await fse.pathExists(envPath)) {
		await fse.remove(envPath);
	}
}

module.exports = createEnv;

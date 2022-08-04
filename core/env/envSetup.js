const path = require('path');
const fse = require('fs-extra');

const { generateDatabase } = require('../database');
const {
	spinner,
	chalk,
	generateError,
	getProjectType,
	getConfig
} = require('../../utils');
const config = getConfig();

async function _envSetup(envType) {
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

async function createEnv() {
	if (config.env.toLowerCase() === 'both') {
		await _envSetup('production');
		await _envSetup('development');
	}
	await _envSetup(config.env);
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

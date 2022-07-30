const { access } = require('fs/promises');
const { constants } = require('fs');
const { spinner } = require('./utils');
const execa = require('execa');

async function installDependecies(config) {
	try {
		await access(`yarn.lock`, constants.R_OK);
		await checkForOldDependecies(config, { type: 'yarn', command: 'remove' });

		spinner.start(` 📦 Installing dependencies using yarn...`);
		await execa(`yarn`, [
			`add`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'pg' : 'mysql'}`
		]);
		spinner.stopAndPersist({
			symbol: '📦',
			text: ` ${config.dbtype} dependencies installed with YARN \n`
		});
	} catch (err) {
		await checkForOldDependecies(config, { type: 'npm', command: 'uninstall' });

		spinner.start(` 📦 Installing dependencies using npm...`);
		await execa(`npm`, [
			`install`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'pg' : 'mysql'}`
		]);

		spinner.stopAndPersist({
			symbol: '📦',
			text: ` ${config.dbtype} dependencies installed with NPM \n`
		});
	}
}
async function checkForOldDependecies(config, options) {
	try {
		spinner.start(` 📦 Checking for old dependencies...`);
		await access(`package.json`, constants.R_OK);
		if (config.dbtype.toLowerCase() === 'postgresql') {
			spinner.start(' 📦  Removing old dependencies...');
			await execa(`${options.type}`, [`${options.command}`, `mysql`]);
		} else {
			await execa(`${options.type}`, [`${options.command}`, `pg`]);
		}

		spinner.stopAndPersist({
			symbol: '📦',
			text: ` Old dependencies removed \n`
		});
	} catch (err) {}
}
module.exports = installDependecies;

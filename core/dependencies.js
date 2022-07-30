const { access } = require('fs/promises');
const { constants } = require('fs');
const { spinner, packageManagerUsed, chalk, execa } = require('./utils');

async function installDependecies(config) {
	try {
		await checkForOldDependecies(config, {
			type: packageManagerUsed(),
			command: packageManagerUsed() === 'yarn' ? 'remove' : 'uninstall'
		});
		spinner.start(
			` 📦 Installing dependencies using ${chalk.bold.yellow(
				packageManagerUsed().toUpperCase()
			)}...`
		);
		await execa(packageManagerUsed(), [
			`${packageManagerUsed() === 'yarn' ? 'add' : 'install'}`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'pg' : 'mysql'}`
		]);
		spinner.stopAndPersist({
			symbol: '📦',
			text: ` ${config.dbtype} dependencies installed with ${chalk.bold.yellow(
				packageManagerUsed().toUpperCase()
			)} \n`
		});
	} catch (err) {
		console.log(err);
	}
}
async function checkForOldDependecies(config, options) {
	try {
		spinner.start(` 📦 Checking for old dependencies...`);
		await access(`package.json`, constants.R_OK);
		spinner.start(` 📦 Cleaning up old dependencies...`);

		await execa(`${options.type}`, [
			`${options.command}`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'mysql' : 'pg'}`
		]);

		spinner.stopAndPersist({
			symbol: '📦',
			text: ` Cleaned up old dependencies \n`
		});
	} catch (err) {
		spinner.stopAndPersist({
			symbol: '📦',
			text: ` No old dependencies to clean up \n`
		});
		return;
	}
}
module.exports = installDependecies;

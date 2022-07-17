const ora = require('ora');
const { access } = require('fs/promises');
const { constants } = require('fs');
const execa = require('execa');
const spinner = ora({ text: '' });

async function installDependecies(config) {
	try {
		await access(`yarn.lock`, constants.R_OK);
		spinner.start(` 📦 Installing dependencies using yarn...`);
		await execa(`yarn`, [
			`add`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'pg' : 'mysql'}`
		]);
		spinner.stopAndPersist({
			symbol: '✅',
			text: ` ${config.dbtype} dependencies installed with YARN \n`
		});
	} catch (err) {
		spinner.start(` 📦 Installing dependencies using npm...`);
		await execa(`npm`, [
			`install`,
			`${config.dbtype.toLowerCase() === 'postgresql' ? 'pg' : 'mysql'}`
		]);
		spinner.stopAndPersist({
			symbol: '✅',
			text: ` ${config.dbtype} dependencies installed with NPM \n`
		});
	}
}
module.exports = installDependecies;

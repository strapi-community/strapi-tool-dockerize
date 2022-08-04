const replace = require('replace-in-file');
const { access, copyFile } = require('fs/promises');
const { constants } = require('fs');
const execa = require('execa');
const ora = require('ora');
const spinner = ora({ text: '' });
const chalk = require('chalk');
const config = require('./config').getConfig();

async function yarnLockToPackageLock() {
	const options = {
		files: `${config.outDir}/docker-compose.yml`,
		from: '- ./yarn.lock:/opt/yarn.lock',
		to: '- ./package-lock.json:/opt/package-lock.json'
	};
	try {
		await access('package-lock.json', constants.R_OK);
		await replace(options);
	} catch (error) {}
}
async function checkForDataFolder() {
	const options = {
		files: `${config.outDir}/.dockerignore`,
		from: 'data/',
		to: ''
	};
	try {
		await access('data', constants.R_OK);
		await replace(options);
	} catch (error) {}
}

module.exports = {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	replace,
	chalk,
	execa,
	access,
	constants,
	copyFile
};

const replace = require('replace-in-file');
const { access, copyFile } = require('fs/promises');
const { constants } = require('fs');
const execa = require('execa');
const ora = require('ora');
const spinner = ora({ text: '' });
const chalk = require('chalk');
const { dockerComposeDir, dockerfileDir, outDir } = require('./const');

async function yarnLockToPackageLock() {
	const options = {
		files: `${outDir}/docker-compose.yml`,
		from: '- ./yarn.lock:/opt/yarn.lock',
		to: '- ./package-lock.json:/opt/package-lock.json'
	};
	try {
		await access(`package-lock.json`, constants.R_OK);
		await replace(options);
	} catch (err) {}
}
async function checkForDataFolder() {
	const options = {
		files: `${outDir}/.dockerignore`,
		from: 'data/',
		to: ''
	};
	try {
		await access(`data`, constants.R_OK);
		await replace(options);
	} catch (err) {}
}

module.exports = {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	dockerComposeDir,
	dockerfileDir,
	outDir,
	replace,
	chalk,
	execa,
	access,
	constants,
	copyFile
};

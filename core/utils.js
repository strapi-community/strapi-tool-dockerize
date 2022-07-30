const path = require('path');
const replace = require('replace-in-file');
const { access } = require('fs/promises');
const { constants } = require('fs');
const ora = require('ora');
const spinner = ora({ text: '' });

let _projectType = 'js';

const dockerComposeDir = path.join(__dirname, '../templates/docker-compose');
const dockerfileDir = path.join(__dirname, '../templates/dockerfiles');
const outDir = path.join(process.cwd());

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

async function isTS() {
	spinner.start(' 💻 Detecting Project type... ');
	try {
		await access(path.join(process.cwd(), 'tsconfig.json'));
		_projectType = 'ts';
		spinner.stopAndPersist({
			symbol: '💻',
			text: ' TypeScript project detected \n'
		});
	} catch (error) {
		spinner.stopAndPersist({
			symbol: '💻',
			text: ' JavaScript project detected \n'
		});
	}
}
function projectType() {
	return _projectType;
}

module.exports = {
	yarnLockToPackageLock,
	checkForDataFolder,
	isTS,
	projectType,
	spinner,
	dockerComposeDir,
	dockerfileDir,
	outDir
};

const path = require('path');
const { spinner, chalk, constants, access, generateError } = require('./utils');

let _projectType = 'js';
let _packageManager = '';
let _env = 'development';

async function detectProjectType() {
	spinner.start(' 💻 Detecting Project type... ');
	try {
		await access(path.join(process.cwd(), 'tsconfig.json'));
		_projectType = 'ts';
	} catch (error) {
		await generateError(error);
	}
	spinner.stopAndPersist({
		symbol: '🍿',
		text: ` ${
			_projectType === 'ts'
				? `${chalk.bold.blueBright('TypeScript')}`
				: `${chalk.bold.yellow('JavaScript')}`
		} project detected \n`
	});
}

async function detectPackageManager() {
	spinner.start(' 💻 Detecting package manager... ');
	try {
		await access(`yarn.lock`, constants.R_OK);
		_packageManager = 'yarn';
	} catch (error) {
		_packageManager = 'npm';
	}
	spinner.stopAndPersist({
		symbol: '📦',
		text: ` ${chalk.bold.yellow(getPackageManager().toUpperCase())} detected \n`
	});
}
function setEnv(env) {
	env.toLowerCase() === 'both' ? (_env = 'production') : (_env = env);
}

function getEnv() {
	return _env;
}

function getProjectType() {
	return _projectType;
}
function getPackageManager() {
	return _packageManager;
}

module.exports = {
	detectPackageManager,
	detectProjectType,
	getProjectType,
	getPackageManager,
	setEnv,
	getEnv
};

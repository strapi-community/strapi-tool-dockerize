const generateError = require('./bugreport');
const goodbye = require('./goodbye');
const { setConfig, getConfig } = require('./config');
const {
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
} = require('./utils');
const {
	detectPackageManager,
	detectProjectType,
	getProjectType,
	getPackageManager,
	setEnv,
	getEnv
} = require('./detection');

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
	copyFile,
	generateError,
	goodbye,
	detectPackageManager,
	detectProjectType,
	getProjectType,
	getPackageManager,
	setEnv,
	getEnv,
	setConfig,
	getConfig
};
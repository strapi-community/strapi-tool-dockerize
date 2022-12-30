const generateError = require(`./bugreport`);
const goodbye = require(`./goodbye`);
const { setConfig, config } = require(`./config`);
const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	replace,
	chalk,
	execa,
	access,
	constants,
	copyFile
} = require(`./utils`);
const { createStrapiProject } = require(`./createStrapi`);
const {
	detectPackageManager,
	detectProjectType,
	detectDownloadsAndStars,
	detectStrapiProject
} = require(`./detection`);

module.exports = {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
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
	detectStrapiProject,
	setConfig,
	config,
	detectDownloadsAndStars,
	createStrapiProject
};

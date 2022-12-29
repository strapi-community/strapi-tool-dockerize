const { createDockerComposeFiles, createDockerFiles } = require(`./copyFiles`);
const installDependecies = require(`./dependencies`);
const { checkAndBackupDB, generateDatabase } = require(`./database`);
const { appendEnv, createEnv, resetEnv } = require(`./env`);
const questions = require(`./questions`);
module.exports = {
	createDockerComposeFiles,
	createDockerFiles,
	checkAndBackupDB,
	generateDatabase,
	installDependecies,
	questions,
	appendEnv,
	createEnv,
	resetEnv
};

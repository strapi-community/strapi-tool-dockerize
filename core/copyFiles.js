const { copyFile } = require('fs/promises');
const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	chalk,
	generateError
} = require('./utils');
const { dockerComposeDir, dockerfileDir, outDir } = require('./const');
const { getPackageManager, getEnv } = require('./detection');
const { getConfig } = require('./config');
async function whatToCreate(createCompose) {
	if (createCompose) await createDockerComposeFiles();
	await createDockerFiles();
}

async function createDockerFiles() {
	spinner.start();
	try {
		await copyFile(
			`${dockerfileDir}/development/Dockerfile.${getPackageManager()}`,
			`${outDir}/Dockerfile`
		);
		if (getEnv() === 'production') {
			await copyFile(
				`${dockerfileDir}/${production}/Dockerfile.${getPackageManager()}`,
				`${outDir}/Dockerfile.prod`
			);
		}
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ` ${chalk.bold.blue('Dockerfile')} for ${chalk.yellow(
				getEnv().toUpperCase()
			)} added \n`
		});
	} catch (error) {}

	await copyFile(`${dockerfileDir}/.dockerignore`, `${outDir}/.dockerignore`);
	await checkForDataFolder();
}
async function createDockerComposeFiles() {
	const config = getConfig();
	spinner.start(' 🐳  Creating docker-compose.yml file');
	await copyFile(
		`${dockerComposeDir}/docker-compose.${config.dbtype.toLowerCase()}`,
		`${outDir}/docker-compose.yml`
	);
	spinner.stopAndPersist({
		symbol: '🐳',
		text: ` Added docker-compose file with ${chalk.bold.green(
			config.dbtype.toUpperCase()
		)} configuration \n`
	});
	await yarnLockToPackageLock();
}

module.exports = whatToCreate;

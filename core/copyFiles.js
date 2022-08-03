const { copyFile } = require('fs/promises');
const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	dockerComposeDir,
	dockerfileDir,
	outDir,
	chalk
} = require('./utils');
const { getPackageManager, getEnv } = require('./detection');
async function whatToCreate(createCompose, config) {
	if (createCompose)
		await createDockerComposeFiles(config.dbtype.toLowerCase());
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
	} catch (err) {}
	await copyFile(`${dockerfileDir}/.dockerignore`, `${outDir}/.dockerignore`);
	await checkForDataFolder();
}
async function createDockerComposeFiles(type) {
	spinner.start(' 🐳  Creating docker-compose.yml file');
	await copyFile(
		`${dockerComposeDir}/docker-compose.${type.toLowerCase()}`,
		`${outDir}/docker-compose.yml`
	);
	spinner.stopAndPersist({
		symbol: '🐳',
		text: ` Added docker-compose file with ${chalk.bold.green(
			type.toUpperCase()
		)} configuration \n`
	});
	await yarnLockToPackageLock();
}

module.exports = whatToCreate;

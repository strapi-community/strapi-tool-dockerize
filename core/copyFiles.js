const { copyFile } = require('fs/promises');
const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	dockerComposeDir,
	dockerfileDir,
	outDir,
	packageManagerUsed,
	chalk
} = require('./utils');

async function whatToCreate(createCompose, config) {
	if (createCompose)
		await createDockerComposeFiles(config.dbtype.toLowerCase());
	await createDockerFiles();
}

async function createDockerFiles() {
	spinner.start();
	try {
		await copyFile(
			`${dockerfileDir}/Dockerfile.${packageManagerUsed()}`,
			`${outDir}/Dockerfile`
		);
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ` ${chalk.bold.blue('Dockerfile')} with ${chalk.yellow(
				packageManagerUsed().toUpperCase()
			)} setup added \n`
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

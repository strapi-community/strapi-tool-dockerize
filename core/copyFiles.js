const { access, copyFile } = require('fs/promises');
const { constants } = require('fs');
const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	dockerComposeDir,
	dockerfileDir,
	outDir,
	packageManagerUsed
} = require('./utils');

async function whatToCreate(createCompose, config) {
	console.log(config);
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
			text: ` Dockerfile with ${packageManagerUsed().toUpperCase()} setup added \n`
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
		text: ` Added docker-compose file with ${type.toUpperCase()} configuration \n`
	});
	await yarnLockToPackageLock();
}

module.exports = whatToCreate;

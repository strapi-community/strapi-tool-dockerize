const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	chalk,
	generateError,
	getPackageManager,
	getEnv,
	getConfig,
	copyFile
} = require('../utils');

const config = getConfig();
async function whatToCreate(createCompose) {
	if (createCompose) await createDockerComposeFiles();
	await createDockerFiles();
}

async function createDockerFiles() {
	spinner.start();
	try {
		await copyFile(
			`${config.dockerfileDir}/development/Dockerfile.${getPackageManager()}`,
			`${config.outDir}/Dockerfile`
		);
		if (getEnv() === 'production') {
			await copyFile(
				`${config.dockerfileDir}/production/Dockerfile.${getPackageManager()}`,
				`${config.outDir}/Dockerfile.prod`
			);
		}
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ` ${chalk.bold.blue('Dockerfile')} for ${chalk.yellow(
				getEnv().toUpperCase()
			)} added \n`
		});
	} catch (error) {
		generateError(error);
	}

	await copyFile(
		`${config.dockerfileDir}/.dockerignore`,
		`${config.outDir}/.dockerignore`
	);
	await checkForDataFolder();
}
async function createDockerComposeFiles() {
	const config = getConfig();
	spinner.start(' 🐳  Creating docker-compose.yml file');
	await copyFile(
		`${config.dockerComposeDir}/docker-compose.${config.dbtype.toLowerCase()}`,
		`${config.outDir}/docker-compose.yml`
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

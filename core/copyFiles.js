const {
	yarnLockToPackageLock,
	checkForDataFolder,
	spinner,
	chalk,
	generateError,
	copyFile,
	config
} = require('../utils');

const whatToCreate = async createCompose => {
	if (createCompose) await createDockerComposeFiles();
	await createDockerFiles();
};

const createDockerFiles = async () => {
	spinner.start();
	try {
		await copyFile(
			`${config.dockerfileDir}/development/Dockerfile.${config.packageManager}`,
			`${config.outDir}/Dockerfile`
		);
		if (config.env === 'production' || config.env === 'both') {
			await copyFile(
				`${config.dockerfileDir}/production/Dockerfile.${config.packageManager}`,
				`${config.outDir}/Dockerfile.prod`
			);
		}
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ` ${chalk.bold.blue('Dockerfile')} for ${chalk.yellow(
				config.env === 'both'
					? 'development and production'
					: config.env.toUpperCase()
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
};
const createDockerComposeFiles = async () => {
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
};

module.exports = whatToCreate;

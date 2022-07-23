const path = require('path');
const ora = require('ora');
const { access, copyFile } = require('fs/promises');
const { constants } = require('fs');

const dockerComposeDir = path.join(__dirname, '../templates/docker-compose');
const dockerfileDir = path.join(__dirname, '../templates/dockerfiles');
const outDir = path.join(process.cwd());
const spinner = ora({ text: '' });
const replace = require('replace-in-file');

async function whatToCreate(createCompose, dbType) {
	if (createCompose) await createDockerComposeFiles(dbType);
	await createDockerFiles();
}

async function createDockerFiles() {
	spinner.start();
	try {
		await access(`yarn.lock`, constants.R_OK);
		await copyFile(`${dockerfileDir}/Dockerfile.yarn`, `${outDir}/Dockerfile`);
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ' Dockerfile with YARN setup added \n'
		});
	} catch (err) {
		await copyFile(`${dockerfileDir}/Dockerfile.npm`, `${outDir}/Dockerfile`);
		spinner.stopAndPersist({
			symbol: '🐳',
			text: ' Dockerfile with NPM support added \n'
		});
	}
	await copyFile(`${dockerfileDir}/.dockerignore`, `${outDir}/.dockerignore`);
	await checkForDataFolder();
}
async function createDockerComposeFiles(type) {
	spinner.start();
	try {
		await access(`docker-compose.yml`, constants.R_OK);
		spinner.stopAndPersist({
			symbol: '⚠️',
			text: ' docker-compose.yml already exists, skipping \n'
		});
	} catch (err) {
		switch (type) {
			case 'mysql':
				await copyFile(
					`${dockerComposeDir}/docker-compose.mysql`,
					`${outDir}/docker-compose.yml`
				);
				spinner.stopAndPersist({
					symbol: '🚀',
					text: ' Docker Compose file with MySQL database added \n'
				});
				break;
			case 'mariadb':
				await copyFile(
					`${dockerComposeDir}/docker-compose.mariadb`,
					`${outDir}/docker-compose.yml`
				);
				spinner.stopAndPersist({
					symbol: '🚀',
					text: ' Docker Compose with MariaDB database added \n'
				});
				break;
			case 'postgresql':
				await copyFile(
					`${dockerComposeDir}/docker-compose.postgres`,
					`${outDir}/docker-compose.yml`
				);
				spinner.stopAndPersist({
					symbol: '🚀',
					text: ' Docker Compose with PostgreSQL database added \n'
				});
				break;
		}
	}
	await yarnLockToPackageLock();
}

async function yarnLockToPackageLock() {
	const options = {
		files: `${outDir}/docker-compose.yml`,
		from: '- ./yarn.lock:/opt/yarn.lock',
		to: '- ./package-lock.json:/opt/package-lock.json'
	};
	try {
		await access(`package-lock.json`, constants.R_OK);
		await replace(options);
	} catch (err) {}
}
async function checkForDataFolder() {
	const options = {
		files: `${outDir}/.dockerignore`,
		from: 'data/',
		to: ''
	};
	try {
		await access(`data`, constants.R_OK);
		await replace(options);
	} catch (err) {}
}
module.exports = whatToCreate;

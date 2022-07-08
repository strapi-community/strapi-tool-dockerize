const alert = require('cli-alerts');
const path = require('path');
const copy = require('copy-template-dir');
const fs = require('fs');

const dockerComposeDir = path.join(__dirname, '../templates/docker-compose');
const dockerfileDir = path.join(__dirname, '../templates/dockerfiles');
const outDir = path.join(process.cwd());

async function whatToCreate(createCompose, dbType) {
	if (createCompose) await createDockerComposeFiles(dbType);
	await createDockerFiles();
}

// Create two inputs one for docker compose one for Dockerfile
// copy the folders correctly into the current directory
// rename and overwrite files

async function createDockerFiles() {
	copy(dockerfileDir, outDir, () => {
		fs.access('yarn.lock', fs.F_OK, err => {
			if (err) {
				fs.rename(`${outDir}/Dockerfile.npm`, `${outDir}/Dockerfile`, () => {});
				fs.unlink(`${outDir}/Dockerfile.yarn`, () => {});
			} else {
				fs.rename(
					`${outDir}/Dockerfile.yarn`,
					`${outDir}/Dockerfile`,
					() => {}
				);
				fs.unlink(`${outDir}/Dockerfile.npm`, () => {});
			}
		});
	});
}
async function createDockerComposeFiles(type) {
	console.log(type);
	switch (type) {
		case 'mysql':
			alert({ type: 'success', msg: '🚀 Creating MySQL docker compose files' });
			await fs.copyFileSync(
				`${dockerComposeDir}/docker-compose.mysql`,
				`${outDir}/docker-compose.yml`
			);
			return;
		case 'mariadb':
			alert({
				type: 'success',
				msg: '🚀 Creating MariaDB docker compose files'
			});
			await fs.copyFileSync(
				`${dockerComposeDir}/docker-compose.mariadb`,
				`${outDir}/docker-compose.yml`
			);

			return;
		case 'postgresql':
			alert({
				type: 'success',
				msg: '🚀 Creating Postgres docker compose files'
			});
			await fs.copyFileSync(
				`${dockerComposeDir}/docker-compose.postgres`,
				`${outDir}/docker-compose.yml`
			);
			return;
	}
}

module.exports = whatToCreate;

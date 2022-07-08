const alert = require('cli-alerts');
const path = require('path');
const copy = require('copy-template-dir');
const fs = require('fs');

const inDir = path.join(__dirname, '../templates');
const outDir = path.join(process.cwd());

copy(inDir, outDir, info => createCorrectFile(info));

function createCorrectFile(config) {
	console.log(config);
	fs.access('yarn.lock', fs.F_OK, err => {
		if (err) {
			fs.rename(`${outDir}/Dockerfile.npm`, `${outDir}/Dockerfile`, () => {});
			fs.unlink(`${outDir}/Dockerfile.yarn`, () => {});
		} else {
			fs.rename(`${outDir}/Dockerfile.yarn`, `${outDir}/Dockerfile`, () => {});
			fs.unlink(`${outDir}/Dockerfile.npm`, () => {});
		}
	});
	alert({ type: 'success', msg: '🚀 All done ready to go' });
}
function createDockerCompose(type) {
	switch (type.toLowerCase()) {
		case 'mysql':
			fs.rename(
				`${outDir}/docker-compose.mysql`,
				`${outDir}/docker-compose.yml`,
				() => {}
			);
			fs.unlink(`${outDir}/docker-compose.postgres`, () => {});
			fs.unlink(`${outDir}/docker-compose.mariadb`, () => {});
			break;
		case 'mariadb':
			fs.rename(
				`${outDir}/docker-compose.mariadb`,
				`${outDir}/docker-compose.yml`,
				() => {}
			);
			fs.unlink(`${outDir}/docker-compose.postgres`, () => {});
			fs.unlink(`${outDir}/docker-compose.mysl`, () => {});
			break;
		case 'postgres':
			fs.rename(
				`${outDir}/docker-compose.postgres`,
				`${outDir}/docker-compose.yml`,
				() => {}
			);
			fs.unlink(`${outDir}/docker-compose.mariadb`, () => {});
			fs.unlink(`${outDir}/docker-compose.mysql`, () => {});
			break;
	}
}

module.exports = copy;

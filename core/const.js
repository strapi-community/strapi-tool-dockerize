const path = require('path');
const config = {};

const dockerComposeDir = path.join(__dirname, '../templates/compose');
const dockerfileDir = path.join(__dirname, '../templates/dockerfiles');
const outDir = path.join(process.cwd());

module.exports = {
	config,
	dockerComposeDir,
	dockerfileDir,
	outDir
};

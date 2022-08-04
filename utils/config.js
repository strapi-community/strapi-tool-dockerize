const path = require('path');

const _config = {
	dockerComposeDir: path.join(__dirname, '../templates/compose'),
	dockerfileDir: path.join(__dirname, '../templates/dockerfiles'),
	outDir: path.join(process.cwd())
};
const setConfig = newConfig => Object.assign(_config, newConfig);
const getConfig = () => _config;

module.exports = { setConfig, getConfig };

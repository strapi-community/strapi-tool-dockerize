const path = require('path');

const _config = {
	url: 'https://github.com/strapi-community/strapi-tool-dockerize',
	dockerComposeDir: path.join(__dirname, '../templates/compose'),
	dockerfileDir: path.join(__dirname, '../templates/dockerfiles'),
	outDir: path.join(process.cwd()),
	projectType: 'ts',
	packageManager: '',
	env: 'development',
	npmDownloads: 0,
	githubStars: 0
};
const setConfig = newConfig => Object.assign(_config, newConfig);
const config = _config;

module.exports = { setConfig, config };

const welcome = require('cli-welcome');
const pkg = require('../package.json');
const unhandled = require('cli-handle-unhandled');

module.exports = ({ clear = true }) => {
	unhandled();
	welcome({
		title: `@strapi-community/dockerize`,
		tagLine: `by Simen Daehlin`,
		description: pkg.description,
		version: pkg.version,
		bgColor: '#ac94fb',
		color: '#ffffff',
		bold: true,
		clear
	});
};

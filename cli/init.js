const welcome = require(`cli-welcome`);
const pkg = require(`../package.json`);
const unhandled = require(`cli-handle-unhandled`);

module.exports = ({ clear = true }) => {
	unhandled();
	welcome({
		title: `@strapi-community/dockerize`,
		tagLine: `by Simen Daehlin`,
		description: `${pkg.description}\n${pkg.url}`,
		version: pkg.version,
		bgColor: `#8d76f9`,
		bold: true,
		clear
	});
};

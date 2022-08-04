const { spinner, chalk } = require('./utils');
const { pkg } = require('../cli/cli');
const fetch = require('node-fetch');

const goodbye = async (quit = false) => {
	const github = await fetch(
		'https://api.github.com/repos/strapi-community/strapi-tool-dockerize'
	);
	const { stargazers_count } = await github.json();
	if (quit) {
		spinner.stopAndPersist({
			symbol: '☝️',
			text: `  ${chalk.yellow('Strapi')} is now ${chalk.bold.blueBright(
				'dockerized'
			)} 🐳 - have a look at the logs above for more info. 🚀 \n`
		});
	}
	spinner.stopAndPersist({
		symbol: '⭐️',
		text: ` ${chalk.bold.green(
			'Star the project on GitHub if you liked this tool 🙏 \n'
		)}`
	});
	spinner.stopAndPersist({
		symbol: '🎉',
		text: ` ${chalk.bold.yellow(
			`We now have got ${stargazers_count} ⭐️'s and counting... \n`
		)} `
	});
	console.log(`👉  ${pkg.url} 👈 \n`);
};

module.exports = goodbye;

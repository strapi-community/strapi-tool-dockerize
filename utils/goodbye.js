const { spinner, chalk } = require('./utils');
const { pkg } = require('../cli/cli');

const goodbye = (quit = false) => {
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
	console.log(`👉  ${pkg.url} 👈 \n`);
};

module.exports = goodbye;

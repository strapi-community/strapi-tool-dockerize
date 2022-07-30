#!/usr/bin/env node

/**
 * strapi-tool-strapi-tool-dockerize
 * Add docker support for a Strapi Project
 *
 * @author Simen Daehlin <https://dehlin.dev>
 */

const init = require('./cli/init');
const cli = require('./cli/cli');
const log = require('./cli/log');
const questions = require('./core/questions');
const { pkg } = require('./cli/cli');
const {
	detectProjectType,
	spinner,
	yarnOrNpm,
	chalk
} = require('./core/utils');

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);
	(await detectProjectType()) && (await yarnOrNpm());
	await questions();
	debug && log(flags);

	spinner.stopAndPersist({
		symbol: '☝️',
		text: `  Strapi is now ${chalk.bold.blueBright(
			'dockerized  🐳'
		)} - have a look at the logs above for more info. 🚀 \n`
	});
	spinner.stopAndPersist({
		symbol: '⭐️',
		text: ` ${chalk.bold.green(
			'Star the project on GitHub if you liked this tool 🙏. \n'
		)}`
	});
	console.log(`👉  ${pkg.url} 👈 \n`);
})();

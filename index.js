#!/usr/bin/env node

/**
 * strapi-tool-strapi-tool-dockerize
 * Add docker support for a Strapi Project
 *
 * @author Simen Daehlin <https://dehlin.dev>
 */

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');
const questions = require('./utils/questions');
const { pkg } = require('./utils/cli');
const ora = require('ora');
const spinner = ora({ text: '' });

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);
	await questions();
	debug && log(flags);

	spinner.stopAndPersist({
		symbol: '☝️',
		text: ` Strapi is now dockerized  🐳 - have a look at the logs above for more info. 🚀 \n`
	});
	spinner.stopAndPersist({
		symbol: '⭐️',
		text: ` Star the project on GitHub if you liked this tool 🙏. \n`
	});
	console.log(`👉 ${pkg.homepage} 👈 \n`);
})();

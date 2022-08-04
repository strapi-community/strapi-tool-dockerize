#!/usr/bin/env node

/**
 * strapi-tool-strapi-tool-dockerize
 * Add docker support for a Strapi Project
 *
 * @author Simen Daehlin <https://dehlin.dev>
 */

const { cli, init, log } = require('./cli');
const questions = require('./core/questions');
const { detectProjectType, detectPackageManager, goodbye } = require('./utils');
const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

(async () => {
	init({ clear });
	input.includes('help') && cli.showHelp(0);
	try {
		await detectProjectType();
		await detectPackageManager();
		await questions();
		debug && log(flags);
		goodbye();
	} catch (error) {
		goodbye(false);
	}
})();

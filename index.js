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
const { detectProjectType, detectPackageManager } = require('./core/detection');
const goodbye = require('./core/goodbye');
const { generateError } = require('./core/utils');
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
		await generateError(error);
	}
})();

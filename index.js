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
const whatToCreate = require('./utils/copyFiles');
const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;
const { prompt, toggle } = require('enquirer');
const alert = require('cli-alerts');
const appendEnvFile = require('./utils/env');

(async () => {
	// init({ clear });
	input.includes(`help`) && cli.showHelp(0);
	let response;

	const dockerCompose = await toggle({
		name: 'useCompose',
		message: 'Do you want to create a docker-compose file?',
		enabled: 'Yes',
		disabled: 'No'
	});

	if (dockerCompose) {
		response = await prompt([
			{
				type: 'select',
				name: 'dbtype',
				message: 'What database do you want to use?',
				hint: 'SQLite is not an option when using docker-compose',
				choices: ['MySQL', 'MariaDB', 'PostgreSQL']
			},
			{
				type: 'input',
				name: 'dbname',
				message: 'Database Name',
				initial: 'strapi'
			},
			{
				type: 'input',
				name: 'dbuser',
				message: 'Database Username',
				initial: 'strapi'
			},
			{
				type: 'password',
				name: 'dbpassword',
				message: 'Database Password',
				validate: value => {
					if (value.length < 1) {
						return 'Password is required';
					}
					return true;
				}
			}
		]);
		const portNumberAnswer = await prompt({
			type: 'numeral',
			name: 'dbport',
			message: 'Database Port',
			initial: response.dbtype.toLowerCase() === 'postgresql' ? 5432 : 3306
		});
		response.dbport = portNumberAnswer.dbport;

		await whatToCreate(dockerCompose, response.dbtype.toLowerCase());
		await appendEnvFile(response);
	} else {
		await whatToCreate(dockerCompose);
	}

	debug && log(flags);
})();

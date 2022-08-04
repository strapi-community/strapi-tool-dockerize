const whatToCreate = require('./copyFiles');
const { prompt, toggle } = require('enquirer');
const { createEnv, appendEnvFile } = require('./env');
const installDependecies = require('./dependencies');
const { setEnv, setConfig } = require('../utils');
module.exports = async () => {
	let config;
	const dockerCompose = await toggle({
		name: 'useCompose',
		message: 'Do you want to create a docker-compose file? 🐳',
		enabled: 'Yes',
		disabled: 'No'
	});
	// TODO: ADD Heroku to providers
	// const deployment = await prompt({
	// 	type: 'select',
	// 	name: 'answer',
	// 	message: 'Are you deploying to any of the following host 🚀',
	// 	hint: 'Currently we are only supporting Heroku',
	// 	choices: ['Other', 'Heroku']
	// });

	if (dockerCompose) {
		const env = await prompt({
			type: 'select',
			name: 'answer',
			message: 'What enviroments do you want to configure?',
			choices: ['Development', 'Production', 'Both']
		});
		config = await prompt([
			{
				type: 'select',
				name: 'dbtype',
				message: 'What database do you want to use?',
				hint: 'SQLite is not an option when using docker-compose',
				choices: ['MySQL', 'MariaDB', 'PostgreSQL']
			},
			{
				type: 'input',
				name: 'dbhost',
				message: 'Database Host',
				initial: 'localhost'
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
			initial: config.dbtype.toLowerCase() === 'postgresql' ? 5432 : 3306
		});
		config.dbport = portNumberAnswer.dbport;
		config.env = env.answer.toLowerCase();
		//config.deployment = deployment.answer;
		setConfig(config);
		setEnv(env.answer.toLowerCase());
		await whatToCreate(dockerCompose);
		await appendEnvFile();
		await createEnv();
		await installDependecies();
	} else {
		const env = await prompt({
			type: 'select',
			name: 'answer',
			message: 'What enviroment do you want to configure for?',
			choices: ['Development', 'Production']
		});
		setEnv(env.answer.toLowerCase());
		await whatToCreate(dockerCompose);
	}
};

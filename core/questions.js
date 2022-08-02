const whatToCreate = require('./copyFiles');
const { prompt, toggle } = require('enquirer');
const appendEnvFile = require('./env/env');
const createEnv = require('./env/envSetup');
const installDependecies = require('./dependencies');
const { setEnv } = require('./utils');

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
			message: 'What enviroments do you want to configure 💻',
			choices: ['Development', 'Production', 'Both']
		});
		config = await prompt([
			{
				type: 'select',
				name: 'dbtype',
				message: 'What database do you want to use? 💾',
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
			message: 'Database Port 💾',
			initial: config.dbtype.toLowerCase() === 'postgresql' ? 5432 : 3306
		});
		config.dbport = portNumberAnswer.dbport;
		config.env = env.answer;
		//config.deployment = deployment.answer;
		setEnv(env.answer);
		await whatToCreate(dockerCompose, config);
		await appendEnvFile(config);
		await createEnv(config);
		await installDependecies(config);
	} else {
		const env = await prompt({
			type: 'select',
			name: 'answer',
			message: 'What enviroment do you want the app to run in 🐳',
			choices: ['Development', 'Production']
		});
		setEnv(env.answer);
		await whatToCreate(dockerCompose, config);
	}
};

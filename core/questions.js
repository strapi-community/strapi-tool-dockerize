const whatToCreate = require('./copyFiles');
const { prompt, toggle } = require('enquirer');
const appendEnvFile = require('./env');
const checkAndBackupDB = require('./database');
const installDependecies = require('./dependencies');

module.exports = async () => {
	let config;
	const dockerCompose = await toggle({
		name: 'useCompose',
		message: 'Do you want to create a docker-compose file? 🐳',
		enabled: 'Yes',
		disabled: 'No'
	});
	const env = await prompt({
		type: 'select',
		name: 'answer',
		message: 'What enviroments do you want to configure 💻',
		choices: ['Development', 'Production', 'Both']
	});
	const deployment = await prompt({
		type: 'select',
		name: 'answer',
		message: 'Are you deploying to any of the following host 🚀',
		hint: 'Currently we are only supporting Heroku',
		choices: ['Heroku', 'Other']
	});

	if (dockerCompose) {
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
				hint: 'Defaults to strapi',
				initial: 'strapi',
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
		config.production = productionReady.production;
		config.env = env.answer;
		config.deployment = deployment.answer;

		await whatToCreate(dockerCompose, config);
		await appendEnvFile(config);
		await checkAndBackupDB(config);
		await installDependecies(config);
	} else {
		await whatToCreate(dockerCompose, config);
	}
};

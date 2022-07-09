const whatToCreate = require('./copyFiles');
const { prompt, toggle } = require('enquirer');
const appendEnvFile = require('./env');
const checkAndBackupDB = require('./database');
const installDependecies = require('./dependencies');

module.exports = async () => {
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
		await checkAndBackupDB(response);
		await installDependecies(response);
	} else {
		await whatToCreate(dockerCompose);
	}
};

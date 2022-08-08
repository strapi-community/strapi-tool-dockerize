const { prompt, toggle } = require(`enquirer`);
const { setConfig, config } = require(`../utils`);
module.exports = async () => {
	const dockerCompose = await toggle({
		name: `useCompose`,
		message: `Do you want to create a docker-compose file? 🐳`,
		enabled: `Yes`,
		disabled: `No`
	});
	setConfig({ dockerCompose });
	if (config.dockerCompose) {
		const questions = await prompt([
			{
				type: `select`,
				name: `env`,
				message: `What enviroments do you want to configure?`,
				choices: [`Development`, `Production`, `Both`]
			},
			{
				type: `select`,
				name: `dbtype`,
				message: `What database do you want to use?`,
				hint: `SQLite is not an option when using docker-compose`,
				choices: [`MySQL`, `MariaDB`, `PostgreSQL`]
			},
			{
				type: `input`,
				name: `dbhost`,
				message: `Database Host`,
				initial: `localhost`
			},
			{
				type: `input`,
				name: `dbname`,
				message: `Database Name`,
				initial: `strapi`
			},
			{
				type: `input`,
				name: `dbuser`,
				message: `Database Username`,
				initial: `strapi`
			},
			{
				type: `password`,
				name: `dbpassword`,
				message: `Database Password`,
				validate: value =>
					value.length < 3 ? `Password is required (min 3 characters)` : true
			}
		]);
		const dbPort = await prompt({
			type: `numeral`,
			name: `dbport`,
			message: `Database Port`,
			initial: questions.dbtype.toLowerCase() === `postgresql` ? 5432 : 3306
		});
		setConfig({
			...config,
			...questions,
			env: questions.env.toLowerCase(),
			dbtype: questions.dbtype.toLowerCase(),
			dbport: dbPort.dbport
		});

		return true;
	} else {
		const env = await prompt({
			type: `select`,
			name: `answer`,
			message: `What enviroment do you want to configure for?`,
			choices: [`Development`, `Production`]
		});
		setConfig({ env: env.answer.toLowerCase() });

		return false;
	}
};

const prompts = require(`prompts`);

const { setConfig, config } = require(`../utils`);

const enableTerminalCursor = () => {
	process.stdout.write(`\x1B[?25h`);
};

const onState = state => {
	if (state.aborted) {
		// If we don't re-enable the terminal cursor before exiting
		// the program, the cursor will remain hidden
		enableTerminalCursor();
		process.stdout.write(`\n`);
		process.exit(1);
	}
};

module.exports = async () => {
	const dockerCompose = await prompts({
		name: `dockerCompose`,
		message: `Do you want to create a docker-compose file? 🐳`,
		active: `Yes`,
		inactive: `No`,
		type: `toggle`,
		onState
	});
	setConfig(dockerCompose);
	if (config.dockerCompose) {
		const questions = await prompts([
			{
				type: `select`,
				name: `env`,
				message: `What environments do you want to configure?`,
				choices: [
					{
						title: `Development`,
						value: `development`,
						description: `Creates a development environment`
					},
					{
						title: `Production`,
						value: `production`,
						description: `Creates a production environment`
					},
					{
						title: `Both`,
						value: `both`,
						description: `Creates development and production environments`
					},
					{
						title: `Custom`,
						value: `custom`,
						description: `Custom environment name`
					}
				],
				onState
			},
			{
				type: prev => (prev == `custom` ? `text` : null),
				name: `env`,
				message: `What is the name of the environment`,
				onState
			},
			{
				type: `text`,
				name: `projectName`,
				message: `Whats the name of the project?`,
				initial: `strapi`,
				onState
			},
			{
				type: `select`,
				name: `dbtype`,
				message: `What database do you want to use?`,
				hint: `SQLite is not an option when using docker-compose`,
				choices: [
					{
						title: `MySQL`,
						value: `mysql`,
						description: `Setup with MySQL database and dependencies`
					},
					{
						title: `MariaDB`,
						value: `mariadb`,
						description: `Setup with MariaDB database and dependencies`
					},
					{
						title: `PostgreSQL`,
						value: `postgresql`,
						description: `Setup with PostgreSQL database and dependencies`
					}
				],
				onState
			},
			{
				type: `text`,
				name: `dbhost`,
				message: `Database Host`,
				initial: `localhost`,
				onState
			},
			{
				type: `text`,
				name: `dbname`,
				message: `Database Name`,
				initial: `strapi`,
				onState
			},
			{
				type: `text`,
				name: `dbuser`,
				message: `Database Username`,
				initial: `strapi`,
				onState
			},
			{
				type: `password`,
				name: `dbpassword`,
				message: `Database Password`,
				validate: value =>
					value.length < 3 ? `Password is required (min 3 characters)` : true,
				onState
			}
		]);
		const dbPort = await prompts({
			type: `number`,
			name: `dbport`,
			message: `Database Port`,
			initial: questions.dbtype === `postgresql` ? 5432 : 3306,
			onState
		});
		setConfig({
			...config,
			...questions,
			env: questions.env.toLowerCase(),
			dbtype: questions.dbtype,
			dbport: dbPort.dbport
		});

		return true;
	} else {
		const env = await prompts({
			type: `select`,
			name: `answer`,
			message: `What environment do you want to configure for?`,
			choices: [
				{
					title: `Development`,
					value: `development`,
					description: `Great for Development but biggest size`
				},
				{
					title: `Production`,
					value: `production`,
					description: `Creates an additional .prod file which is smaller and optimized for production`
				}
			],
			onState
		});
		setConfig({ env: env.answer.toLowerCase() });

		return false;
	}
};

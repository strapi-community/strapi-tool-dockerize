const meow = require(`meow`);
const meowHelp = require(`cli-meow-help`);

const flags = {
	clear: {
		type: `boolean`,
		default: true,
		desc: `Clear the console`
	},
	version: {
		type: `boolean`,
		alias: `v`,
		desc: `Print CLI version`
	},
	dbtype: {
		type: `string`,
		default: `postgres`,
		alias: `c`,
		desc: `Database client`
	},
	dbhost: {
		type: `string`,
		default: `localhost`,
		alias: `h`,
		desc: `Database host`
	},
	dbport: {
		type: `number`,
		default: 5432,
		alias: `p`,
		desc: `Database port`
	},
	dbname: {
		type: `string`,
		default: `strapi`,
		alias: `name`,
		desc: `Database name`
	},
	dbuser: {
		type: `string`,
		default: `strapi`,
		alias: `u`,
		desc: `Database user`
	},
	dbpassword: {
		type: `string`,
		default: `strapi`,
		alias: `p`,
		desc: `Database password`
	},
	type: {
		type: `string`,
		default: `js`,
		alias: `t`,
		desc: `Project type`
	},
	packagemanager: {
		type: `string`,
		default: `yarn`,
		alias: `pm`,
		desc: `Package manager`
	},
	env: {
		type: `string`,
		default: `development`,
		alias: `e`,
		desc: `Environment`
	},
	useCompose: {
		type: `boolean`,
		default: false,
		alias: `u`,
		desc: `Use docker-compose`
	}
};
const commands = {
	help: { desc: `Print help info` },
	new: { desc: `Create a new project` },
	reset: { desc: `Reset the project` }
};

const helpText = meowHelp({
	name: `strapi-tool-dockerize`,
	flags,
	commands
});

const options = {
	inferType: true,
	description: false,
	hardRejection: false,
	flags
};

module.exports = meow(helpText, options);

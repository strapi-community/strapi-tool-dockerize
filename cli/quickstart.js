const { setConfig } = require(`../utils`);

/**
 * It takes the flags passed to the CLI and sets them as the config for the project
 * @returns true
 */
const quickStart = async flags => {
	const {
		projectname,
		projecttype,
		packagemanager,
		env,
		usecompose,
		dbtype,
		dbhost,
		dbname,
		dbuser,
		dbpassword,
		dbport
	} = flags;

	setConfig({
		projectName: (projectname && projectname.toLowerCase()) || `mystrapi`,
		projectType: (projecttype && projecttype.toLowerCase()) || `js`,
		packageManager: (packagemanager && packagemanager.toLowerCase()) || `yarn`,
		env: (env && env.toLowerCase()) || `development`,
		dockerCompose:
			usecompose && usecompose.toLowerCase() === `false` ? false : true,
		dbtype:
			dbtype && dbtype.toLowerCase() === `postgres`
				? `postgresql`
				: (dbtype && dbtype.toLowerCase()) || `postgresql`,
		dbhost: dbhost || ``,
		dbport: dbport || null,
		dbname: dbname || ``,
		dbuser: dbuser || ``,
		dbpassword: dbpassword || ``,
		quickStart: true
	});
	return true;
};

module.exports = quickStart;

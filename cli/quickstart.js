const { setConfig } = require(`../utils`);
const quickStart = async flags => {
	const {
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
		projectType: projecttype.toLowerCase(),
		packageManager: packagemanager.toLowerCase(),
		env: env.toLowerCase(),
		dockerCompose: usecompose.toLowerCase() === `false` ? false : true,
		dbtype:
			dbtype.toLowerCase() === `postgres` ? `postgresql` : dbtype.toLowerCase(),
		dbhost: dbhost,
		dbport: dbport,
		dbname: dbname,
		dbuser: dbuser,
		dbpassword: dbpassword,
		quickStart: true
	});
	return true;
};

module.exports = quickStart;

const { setConfig } = require(`../utils`);
const quickStart = async flags => {
	setConfig({
		dbtype: flags.dbclient,
		dbhost: flags.dbhost,
		dbport: flags.dbport,
		dbname: flags.dbname,
		dbuser: flags.dbuser,
		dbpassword: flags.dbpassword,
		type: flags.type,
		packagemanager: flags.packagemanager,
		dockerCompose: flags.usecompose,
		env: flags.env
	});
	return true;
};
module.exports = quickStart;

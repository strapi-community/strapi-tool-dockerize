const { access } = require('fs');
const path = require('path');

async function jsOrTs() {
	try {
		await access(path.join(process.cwd(), 'tsconfig.json'));
		return true;
	} catch (error) {
		return false;
	}
}
module.exports = jsOrTs;

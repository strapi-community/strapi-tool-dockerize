const { exec } = require(`child_process`);
const isWindows = process.platform === `win32`;

async function checkPackage(packageName) {
	return new Promise((resolve) => {
		const command = isWindows ? `where ${packageName}` : `which ${packageName}`;
		exec(command, (error) => {
			if (error) {
				resolve(false); 
			} else {
				resolve(true); 
			}
		});
	});
}

async function checkInstalledPackages() {
	const npmExists = await checkPackage(`npm`);
	const yarnExists = await checkPackage(`yarn`);

	if (npmExists && yarnExists) {
		return [`npm`, `yarn`]; 
	} else if (npmExists) {
		return [`npm`]; 
	} else if (yarnExists) {
		return [`yarn`]; 
	} else {
		return []; 
	}
}

module.exports = {
	checkInstalledPackages
};

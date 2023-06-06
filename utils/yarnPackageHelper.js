const { exec } = require(`child_process`);
const { config } = require(`./config`);
const {checkInstalledPackages} = require(`./packageDetection`);
const prompts = require(`prompts`);
const { spinner, chalk } = require(`./utils`);

async function installYarn() {
	return new Promise((resolve, reject) => {
		exec(`npm install -g yarn`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error: ${error.message}`);
				reject(error);
				return;
			}
			if (stderr) {
				console.error(`Stderr: ${stderr}`);
				reject(new Error(stderr));
				return;
			}
			resolve(stdout);
		});
	});
}

async function checkForYarnPackage() {
	if (config.packageManager === `yarn`) {
		const checkIfYarnIsInstalled = await checkInstalledPackages();
		let response = ``;
		if (!checkIfYarnIsInstalled.includes(`yarn`)) {
			response = await prompts([
				{
					name: `installYarnPrompt`,
					message: `Yarn not installed! Shall we install it for you? (Strapi Recommended)`,
					active: `Yes`,
					inactive: `No`,
					type: `toggle`
				}
			]);

			if (response[`installYarnPrompt`] === true) {
				await installYarn();
				config.packageManager = `yarn`;
				spinner.stopAndPersist({
					text: `\n✅ Yarn installed successfully!\n`
				});
			} else {
				config.packageManager = `npm`;
			}
		}

		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` Using ${chalk.bold.blueBright(
				config.packageManager.toUpperCase()
			)} \n`
		});
	}
}


module.exports = {
	installYarn,
	checkForYarnPackage
};
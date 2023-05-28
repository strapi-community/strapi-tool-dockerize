const path = require(`path`);
const { spinner, chalk, constants, access } = require(`./utils`);
const { setConfig, config } = require(`./config`);
const fetch = require(`node-fetch`);
const { checkInstalledPackages } = require(`./packageDetection`);
const prompts = require(`prompts`);
const { checkForYarnPackage } = require(`./yarnPackageHelper`);
const { readFile } = require(`fs`).promises;

const detectDownloadsAndStars = async () => {
	spinner.start(` 🦄  ${chalk.yellow(`Prepping some magic`)} `);
	try {
		const npm = await fetch(
			`https://api.npmjs.org/downloads/point/last-month/@strapi-community/dockerize`
		);
		const github = await fetch(
			`https://api.github.com/repos/strapi-community/strapi-tool-dockerize`
		);

		const { downloads } = await npm.json();
		const { stargazers_count } = await github.json();
		setConfig({ npmDownloads: downloads, githubStars: stargazers_count });

		spinner.stopAndPersist({
			symbol: `🎉`,
			text: ` ${chalk.bold.yellow(`You`)}, and ${chalk.bold.green(
				config.npmDownloads
			)} other people have used this tool this month\n`
		});
	} catch (error) {
		console.log(error);
	}
};
const detectProjectType = async () => {
	spinner.start(` 💻 Detecting Project type... `);
	try {
		if (config.quickStart) {
			spinner.stopAndPersist({
				symbol: `🍿`,
				text: ` ${
					config.projectType === `ts`
						? `${chalk.bold.blueBright(`TypeScript`)}`
						: `${chalk.bold.yellow(`JavaScript`)}`
				} set by cli arguments \n`
			});
			return;
		}
		await access(path.join(process.cwd(), `tsconfig.json`));
		setConfig({ projectType: `ts` });
	} catch (error) {}

	if (!config.quickStart) {
		spinner.stopAndPersist({
			symbol: `🍿`,
			text: ` ${
				config.projectType === `ts`
					? `${chalk.bold.blueBright(`TypeScript`)}`
					: `${chalk.bold.yellow(`JavaScript`)}`
			} project detected \n`
		});
	}
};

const detectPackageManager = async () => {
	spinner.start(` 💻 Detecting package manager... `);
	spinner.stop();
	try {
		if (config.quickStart) {
			spinner.stopAndPersist({
				symbol: `🍿`,
				text: ` ${
					config.packageManager === `yarn`
						? `${chalk.bold.yellow(`Yarn`)}`
						: `${chalk.bold.greenBright(`NPM`)}`
				} set by cli arguments \n`
			});
			await checkForYarnPackage();
			return;
		}
	} catch (error) {
		config.packageManager = `npm`;
		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` Exception Occured! falling back to ${chalk.bold.blueBright(
				config.packageManager.toUpperCase()
			)} \n`
		});
	}

	if (!config.quickStart) {
		const installedPackages = await checkInstalledPackages();
		if (installedPackages.length === 2) {
			spinner.stopAndPersist({
				symbol: `📂`,
				text: `Detected Yarn & NPM ... \n`
			});
			const choosePackageManager = await prompts([
				{
					name: `packageManager`,
					message: `Which package manager do you want to use ? (Strapi Recommends yarn)`,
					type: `select`,
					choices: [
						{
							title: `Yarn`,
							value: `yarn`,
						},
						{
							title: `NPM`,
							value: `npm`,
						},
					]
				}
			]);
			config.packageManager = choosePackageManager[`packageManager`];
			spinner.stopAndPersist({
				symbol: `\n📦`,
				text: `Using ${chalk.bold.blueBright(
					config.packageManager.toUpperCase()
				)} \n`
			});
			return;
		} else {
			try {
				await access(`yarn.lock`, constants.R_OK);
				config.packageManager = `yarn`;
				if (!installedPackages.includes(`yarn`)) {
					await checkForYarnPackage();
				}
				return;
			} catch (error) {
				config.packageManager = `npm`;
			}			  
			spinner.stopAndPersist({
				symbol: `📦`,
				text: ` ${chalk.bold.yellow(
					config.packageManager.toUpperCase()
				)} detected \n`
			});
			return;
		}
	}
};
const detectStrapiProject = async () => {
	spinner.start(` 💻 Detecting Strapi project... `);
	try {
		const packageJson = await readFile(
			path.join(process.cwd(), `package.json`),
			`utf8`
		);

		const packageObj = JSON.parse(packageJson);
		if (Object.prototype.hasOwnProperty.call(packageObj, `dependencies`)) {
			if (
				Object.prototype.hasOwnProperty.call(
					packageObj.dependencies,
					`@strapi/strapi`
				)
			) {
				const strapiVersion = packageObj.dependencies[`@strapi/strapi`];
				spinner.stopAndPersist({
					symbol: `🚀`,
					text: ` ${chalk.bold.yellowBright(
						`Strapi ${strapiVersion}`
					)} detected \n`
				});
				return true;
			} else {
				spinner.stopAndPersist({
					symbol: `⛔️`,
					text: ` ${chalk.bold.red(`Strapi project not detected`)} \n`
				});
				return false;
			}
		}
	} catch (error) {
		spinner.stopAndPersist({
			symbol: `⛔️`,
			text: ` ${chalk.bold.red(`Strapi project not detected`)} \n`
		});
		return false;
	}
};

module.exports = {
	detectPackageManager,
	detectProjectType,
	detectDownloadsAndStars,
	detectStrapiProject
};

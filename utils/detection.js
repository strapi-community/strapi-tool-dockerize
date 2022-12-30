const path = require(`path`);
const { spinner, chalk, constants, access } = require(`./utils`);
const { setConfig, config } = require(`./config`);
const fetch = require(`node-fetch`);
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
			return;
		}
		await access(`yarn.lock`, constants.R_OK);
		config.packageManager = `yarn`;
	} catch (error) {
		config.packageManager = `npm`;
	}
	if (!config.quickStart) {
		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` ${chalk.bold.yellow(
				config.packageManager.toUpperCase()
			)} detected \n`
		});
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

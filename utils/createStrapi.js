const prompts = require(`prompts`);
const { promisify } = require(`util`);
const { spawn } = require(`child_process`);
const ora = require(`ora`);
const spinner = ora({ text: `` });
const chalk = require(`chalk`);
const goodbye = require(`./goodbye`);
const createStrapiProject = async () => {
	const newProject = await prompts({
		name: `strapiProject`,
		message: `Do you want to create a new Strapi Project`,
		active: `Yes`,
		inactive: `No`,
		type: `toggle`
	});
	if (newProject.strapiProject) {
		const extraQuestions = await prompts([
			{
				type: `text`,
				name: `projectName`,
				message: `Whats the name of the project?`,
				initial: `my-project`
			},
			{
				name: `typescript`,
				message: `Do you want to use TypeScript`,
				active: `Yes`,
				inactive: `No`,
				type: `toggle`
			}
		]);
		const command = `npx`;
		const args = [
			`create-strapi-app@latest`,
			extraQuestions.projectName,
			`--quickstart`,
			extraQuestions.typescript ? `--typescript` : ``,
			`--no-run`
		];

		const childProcess = spawn(command, args);
		childProcess.stdout.on(`data`, data => {
			console.log(`${data}`);
		});

		childProcess.stderr.on(`data`, data => {
			console.log(`${data}`);
		});

		// Convert the childProcess.on('close') event into a Promise
		const onClosePromise = promisify(childProcess.on.bind(childProcess));
		spinner.stopAndPersist({
			symbol: `🚀`,
			text: ` ${chalk.bold.yellow(
				`Creating Strapi Project from npx create-strapi-app@latest - please wait...`
			)} \n`
		});
		await onClosePromise(`close`);
		spinner.stopAndPersist({
			symbol: `🚀`,
			text: ` ${chalk.bold.yellow(
				`Strapi Project created! please CD into ${extraQuestions.projectName} and run the tool again`
			)} \n`
		});
		await goodbye();
		process.exit(1);
	} else {
		process.exit(1);
	}
};

module.exports = { createStrapiProject };

const prompts = require(`prompts`);
const { promisify } = require(`util`);
const { spawn } = require(`child_process`);
const ora = require(`ora`);
const spinner = ora({ text: `` });
const chalk = require(`chalk`);
const fs = require('fs');
const goodbye = require('./goodbye');
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
			},
			{
				name: `projectPath`,
				message: `Do you want to assign a path for new project ?`
				 + ` (leave blank for current directory )`,
				type: `text`
			}
		]);

		async function checkPathAccessibility(targetPath) {
			try {
			  await fs.access(targetPath, fs.constants.F_OK | fs.constants.R_OK);
			  const stats = await fs.stat(targetPath);
		  
			  if (stats.isDirectory()) {
				return true;
			  }
			} catch (err) {
			  if (err.code === 'ENOENT') {
				console.error(` ${chalk.bold.yellow(
					`🟨 Path does not exist, continuing in current directory!`
				)} \n`);
			  } else {
				console.error(` ${chalk.bold.red(
					`🛑 Path is not accessible please use accessible path for creating project, exiting...`
				)} \n`);
				await goodbye();
				process.exit(1);
			  }
			  throw err;
			}
		  }

		const checkIfPathExists = extraQuestions.projectPath;

		if (checkIfPathExists === '' || checkIfPathExists === 'undefined' || checkIfPathExists === null) {
			extraQuestions.projectPath = '.';
		} else {
			await checkPathAccessibility(checkIfPathExists)
				.then((result) => {
					console.log(result);
				})
				.catch((error) => {
					console.error(error.message);
				});
		}

		const projectPath = `${extraQuestions.projectPath}/${extraQuestions.projectName}`;

		const command = `npx`;
		const args = [
			`create-strapi-app@latest`,
			projectPath,
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
				`Strapi Project created! at path  ${projectPath}`
			)} \n`
		});
		return projectPath;
	} else {
		process.exit(1);
	}
};

module.exports = { createStrapiProject };

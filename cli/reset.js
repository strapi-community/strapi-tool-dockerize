const { unlink, rm } = require(`fs/promises`);
const { access, constants, spinner, chalk } = require(`../utils`);
const { resetEnv } = require(`../core`);

const FILES_TO_REMOVE = [
	{
		directory: `${process.cwd()}`,
		file: `Dockerfile`
	},
	{
		directory: `${process.cwd()}`,
		file: `Dockerfile.prod`
	},
	{
		directory: `${process.cwd()}`,
		file: `.dockerignore`
	},
	{
		directory: `${process.cwd()}`,
		file: `docker-compose.yml`
	}
];

const resetFiles = async () => {
	spinner.start(` 🦄  ${chalk.yellow(`Searching for our files...`)} `);
	for await (let file of FILES_TO_REMOVE) {
		try {
			await access(`${file.directory}/${file.file}`);
			await unlink(`${file.directory}/${file.file}`);
			spinner.stopAndPersist({
				symbol: `🧹`,
				text: ` Cleaned up ${chalk.yellow(file.file)} \n`
			});
		} catch (error) {
			if (error.code === `ENOENT`) {
				spinner.stopAndPersist({
					symbol: `🧹`,
					text: ` No ${chalk.yellow(`${file.file}`)} found \n`
				});
				continue;
			}
		}
	}
	await resetDirectories();
	await resetEnv();
};

const resetDirectories = async () => {
	spinner.start(` 🦄  ${chalk.yellow(`Searching for our directories...`)} `);
	const directory = `${process.cwd()}/config/env`;
	try {
		await access(directory, constants.F_OK);
		await rm(directory, { recursive: true });
		spinner.stopAndPersist({
			symbol: `🧹`,
			text: ` Cleand up ${chalk.yellow(`env`)} folder \n`
		});
	} catch (error) {
		if (error.code === `ENOENT`) {
			spinner.stopAndPersist({
				symbol: `🧹`,
				text: ` ${chalk.yellow(`Directories`)} looks clean \n`
			});
		}
	}
};

module.exports = resetFiles;

const fs = require(`fs`);
const path = require(`path`);
const util = require(`util`);
const exec = util.promisify(require(`child_process`).exec);
const { spinner, chalk, constants } = require(`./utils`);

const detectDockerFiles = async () => {
	const dockerIgnoreFile = `.dockerignore`;
	const backupDir = `backup`;
	spinner.stopAndPersist({
		symbol: `🐳`,
		text: `Checking for existing Docker files... \n`
	});

	const dockerFileRegex = /^Dockerfile(\..+)?$/;
	const filesToCheck = await fs.promises.readdir(`.`);
	const dockerFiles = filesToCheck.filter(file => dockerFileRegex.test(file));
	if (dockerFiles.length > 0) {
		spinner.stopAndPersist({
			symbol: `🐳`,
			text: `Docker files found in root directory! \n`
		});
		try {
			await fs.promises.access(backupDir, fs.constants.F_OK);
		} catch (err) {
			await fs.promises.mkdir(backupDir);
		}
		const backupFiles = await fs.promises.readdir(backupDir);
		await Promise.all(
			dockerFiles.map(async file => {
				const backupFile = path.join(backupDir, file);
				if (backupFiles.includes(file)) {
					spinner.text = `Renaming existing backup file ${file}...`;
					const backupFileNew = path.join(backupDir, `${file}.${Date.now()}`);
					await fs.promises.rename(backupFile, backupFileNew);
					spinner.stopAndPersist({
						symbol: `🎉`,
						text: `Renamed existing backup file ${file} to ${path.basename(
							backupFileNew
						)}! \n`
					});
				}
				spinner.text = `Moving ${file} to backup directory...`;
				if (file === `Dockerfile.prod`) {
					const backupFile = path.join(
						backupDir,
						`Dockerfile.prod.${Date.now()}`
					);
					await fs.promises
						.rename(file, backupFile)
						.then(() => {
							spinner.stopAndPersist({
								symbol: `🎉`,
								text: `Backed up ${file} successfully! \n`
							});
						})
						.catch(err => {
							spinner.fail(`Error backing up ${file}: ${err.message}`);
						});
				} else {
					const backupFile = path.join(backupDir, `${file}.${Date.now()}`);
					await fs.promises
						.rename(file, backupFile)
						.then(() => {
							spinner.stopAndPersist({
								symbol: `🎉`,
								text: `Backed up ${file} successfully! \n`
							});
						})
						.catch(err => {
							spinner.fail(`Error backing up ${file}: ${err.message}`);
						});
				}
			})
		);
		spinner.stopAndPersist({
			symbol: `🐳`,
			text: `Dockerfiles found and backed up successfully! \n`
		});
	} else {
		spinner.stopAndPersist({
			symbol: `🧠`,
			text: `No Dockerfiles found, nothing to backup...`
		});
	}

	if (fs.existsSync(dockerIgnoreFile)) {
		spinner.text = `Moving .dockerignore file to backup directory...`;
		const backupFile = path.join(backupDir, dockerIgnoreFile);
		await fs.promises
			.rename(dockerIgnoreFile, backupFile)
			.then(() => {
				spinner.stopAndPersist({
					symbol: `🎉`,
					text: `Backed up ${dockerIgnoreFile} successfully! \n`
				});
			})
			.catch(err => {
				spinner.fail(`Error backing up ${dockerIgnoreFile}: ${err.message}`);
			});
		spinner.stopAndPersist({
			symbol: `🐳`,
			text: `.dockerignore file found and backed up successfully! \n`
		});
	}
};

module.exports = {
	detectDockerFiles
};

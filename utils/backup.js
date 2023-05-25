const fs = require(`fs`);
const path = require(`path`);
const { spinner, chalk } = require(`./utils`);

const detectDockerFiles = async () => {
	const backupDir = `backup`;
	spinner.stopAndPersist({
		symbol: `🐳`,
		text: ` Checking for existing Docker files... \n`
	});

	const dockerFileRegex = /^Dockerfile(\..+)?$/;
	const filesToCheck = await fs.promises.readdir(`.`);
	const dockerFiles = filesToCheck.filter(
		file => dockerFileRegex.test(file) || file === `.dockerignore`
	);
	if (dockerFiles.length > 0) {
		spinner.stopAndPersist({
			symbol: `🐳`,
			text: ` Found: ${chalk.yellow(
				dockerFiles.join(`, `)
			)} in project directory.  \n`
		});
		try {
			await fs.promises.access(backupDir, fs.constants.F_OK);
		} catch (err) {
			await fs.promises.mkdir(backupDir);
		}
		const backupFiles = await fs.promises.readdir(backupDir);
		const backedUpFiles = [];
		await Promise.all(
			dockerFiles.map(async file => {
				try {
					const backupFile = path.join(backupDir, file);
					if (backupFiles.includes(file)) {
						const backupFileNew = path.join(backupDir, `${file}.${Date.now()}`);
						await fs.promises.rename(backupFile, backupFileNew);
					}
					spinner.stopAndPersist({
						symbol: `🪄`,
						text: `  Moving ${chalk.yellow(file)} to backup directory... \n`
					});
					spinner.text = ``;
					if (file === `Dockerfile.prod`) {
						const backupFile = path.join(
							backupDir,
							`Dockerfile.prod.${Date.now()}`
						);
						await fs.promises
							.rename(file, backupFile)
							.then(() => {
								backedUpFiles.push(file);
							})
							.catch(err => {
								console.error(`Error backing up ${file}: ${err.message}`);
							});
					} else {
						const backupFile = path.join(backupDir, `${file}.${Date.now()}`);
						await fs.promises
							.rename(file, backupFile)
							.then(() => {
								backedUpFiles.push(file);
							})
							.catch(err => {
								console.error(`Error backing up ${file}: ${err.message}`);
							});
					}
				} catch (error) {
					console.log(error);
				}
			})
		);
		if (backedUpFiles.length > 0) {
			spinner.stopAndPersist({
				symbol: `📦`,
				text: ` Backed up ${chalk.yellow(backedUpFiles.join(`, `))} \n`
			});
		}
	} else {
		spinner.stopAndPersist({
			symbol: `💁`,
			text: ` No Dockerfiles found in the root directory. Skipping backup. \n`
		});
	}
};

module.exports = {
	detectDockerFiles
};

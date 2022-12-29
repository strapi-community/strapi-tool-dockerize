const { spinner, chalk } = require(`./utils`);
const { config } = require(`./config`);
const { pkg } = require(`../cli/cli`);

const goodbye = async (quit = false) => {
	if (quit) {
		spinner.stopAndPersist({
			symbol: `☝️`,
			text: `  ${chalk.yellow(`Strapi`)} is now ${chalk.bold.blueBright(
				`dockerized`
			)} 🐳 - have a look at the logs above for more info. 🚀 \n`
		});
		if (config.dockerCompose) {
			spinner.stopAndPersist({
				symbol: `🐳`,
				text: ` You can now start your project with ${chalk.bold.yellow(
					`docker-compose up -d`
				)}\n`
			});
		}
	}

	spinner.stopAndPersist({
		symbol: `⭐️`,
		text: ` ${chalk.bold.green(
			`Star the project on GitHub if you liked this tool 🙏 \n`
		)}`
	});
	spinner.stopAndPersist({
		symbol: `🎉`,
		text: ` ${chalk.bold.yellow(
			`We now have got ${config.githubStars} 🌟 and counting... \n`
		)} `
	});
	console.log(`👉  ${pkg.url} 👈 \n`);
	console.log(
		`${chalk.bold.yellow(
			`☕️ Feeling generious, feel free to buy me a ☕️ 👇`
		)} \n`
	);
	console.log(`🙏 ${pkg.openCollective} \n`);
};

module.exports = goodbye;

const { spinner, chalk, execa, access, constants, generateError, config } = require(`../utils`)

const installDependecies = async () => {
	try {
		await checkForOldDependecies(config.packageManager === `yarn` ? `remove` : `uninstall`)
		spinner.start(
			` 📦 Installing dependencies using ${chalk.bold.yellow(
				config.packageManager.toUpperCase(),
			)}...`,
		)
		await execa(config.packageManager, [
			`${config.packageManager === `yarn` ? `add` : `install`}`,
			`${config.dbtype.toLowerCase() === `postgresql` ? `pg` : `mysql2`}`,
		])
		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` ${chalk.green(
				config.dbtype.toUpperCase(),
			)} dependencies installed with ${chalk.bold.yellow(config.packageManager.toUpperCase())} \n`,
		})
	} catch (error) {
		console.log(error)
		await generateError(error)
	}
}
const checkForOldDependecies = async (command) => {
	try {
		spinner.start(` 📦 Checking for old dependencies...`)
		await access(`package.json`, constants.R_OK)
		spinner.start(` 📦 Cleaning up old dependencies...`)

		await execa(`${config.packageManager}`, [
			`${command}`,
			...(config.dbtype.toLowerCase() === `postgresql` ? [`mysql`, `mysql2`] : [`pg`, `mysql`]),
		])

		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` Cleaned up old dependencies \n`,
		})
	} catch (error) {
		spinner.stopAndPersist({
			symbol: `📦`,
			text: ` No old dependencies to clean up \n`,
		})
		return
	}
}
module.exports = installDependecies

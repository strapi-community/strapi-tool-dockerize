const { readFile, writeFile } = require(`fs`).promises;
const { spinner, chalk } = require(`../../utils`);

const removeLinesContainingPhrase = async () => {
	// Read the contents of the .env file
	const envFileContents = await readFile(`.env`, `utf8`);

	// Split the contents of the file into an array of lines
	const envLines = envFileContents.split(`\n`);

	// Find the indices of the start and end markers
	const startIndex = envLines.indexOf(
		`# @strapi-community/dockerize variables`
	);
	const endIndex = envLines.indexOf(
		`# @strapi-community/dockerize end variables`
	);

	// Find the indices of the lines with matching keys or markers
	const indices = envLines
		.map((line, index) => {
			// Split the line into a key-value pair using a regular expression
			const [key] = line.split(/=(.+)/);
			return line === `` ||
				index === startIndex ||
				index === endIndex ||
				(index > startIndex && index < endIndex && key)
				? index
				: null;
		})
		.filter(Boolean);

	// Remove the lines with matching keys or markers from the array of lines
	indices.reverse().forEach(index => envLines.splice(index, 1));

	// Join the array of lines back into a string
	const updatedEnvFileContents = envLines.join(`\n`);

	// Write the updated contents back to the .env file
	await writeFile(`.env`, updatedEnvFileContents, `utf8`);
	spinner.stopAndPersist({
		symbol: `🧹`,
		text: ` Cleaned up ${chalk.yellow(`.env`)} file \n`
	});
};

module.exports = removeLinesContainingPhrase;

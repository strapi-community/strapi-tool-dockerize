const alert = require('cli-alerts');
const path = require('path');
const copy = require('copy-template-dir');
const fs = require('fs');

const inDir = path.join(__dirname, '../templates');
const outDir = path.join(process.cwd());

const copyFiles = info => copy(inDir, outDir, info => createCorrectFile());

function createCorrectFile() {
	fs.access('yarn.lock', fs.F_OK, err => {
		if (err) {
			fs.rename(
				`${outDir}/Dockerfile.npm`,
				`${outDir}/Dockerfile`,
				() => {}
			);
			fs.unlink(`${outDir}/Dockerfile.yarn`, () => {});
		} else {
			fs.rename(
				`${outDir}/Dockerfile.yarn`,
				`${outDir}/Dockerfile`,
				() => {}
			);
			fs.unlink(`${outDir}/Dockerfile.npm`, () => {});
		}
	});
	alert({ type: 'success', msg: '🚀 All done ready to go' });
	alert({
		type: 'info',
		msg: '🚀 If you liked this application please give a 🙌 to @Eventyret on our Strapi Discord'
	});
}

module.exports = copyFiles;

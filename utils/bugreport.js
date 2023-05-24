const open = require(`open`);
const newGithubIssueUrl = require(`new-github-issue-url`);

const generateError = async error => {
	const url = newGithubIssueUrl({
		repo: `strapi-tool-dockerize`,
		user: `strapi-community`,
		title: `Error: Please add a title`,
		template: `BUG_REPORT.md`,
		assignee: `eventyret`,
		body: `## 🐛  Bug Report
		
<!-- Please give as much information as possible just submitting this with no other information from yourself, the issue will just be closed -->
## 🤷‍♀️ What did you do
<!-- A clear and concise description of the behavior. -->

## ⛔️  Error log

${error.message}

### 🕵️‍♀️ Stack trace

\`\`\`bash
${error.stack}
\`\`\`

## 🙇‍♀️  Expected behavior/code

A clear and concise description of what you expected to happen (or code).

## 👩‍💻 Environment

- 📦  Node version:  ${process.version}
- 💻  OS: ${process.platform} ${process.arch}

## 💡 Possible Solution

<!-- Only if you have suggestions on a fix for the bug -->

## 📺 Additional context/Screenshots
<!-- Add any other context about the problem here. If applicable, add screenshots to help explain. -->
`
	});
	await open(url);
};

module.exports = generateError;

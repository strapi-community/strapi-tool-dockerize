<!-- markdownlint-disable MD024 -->

# Change Log 📄

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1]( (2022-07-29)

### Feature

- Added support to look for TS files 🚀
- Ability to auto publish package to npm 📦

### Bugfixes

- Removed unused imports 🏎

## [4.0.13]( (2022-07-23)

### Feature

- Now removing mysql or postgres dependencies if we re run the tool or switch 🚀

### Bugfixes

- Removed unused imports 🏎
- Fixed [#7](https://github.com/strapi-community/strapi-tool-dockerize/issues/7) 🐛
  now checking if the data folder exists if it does we won't ignore it with docker. 🐛

## [4.0.12]( (2022-07-17)

### Bugfixes

- Fixed a bug where incorrect dependencies were being added to the `package.json` file. 🐛
- Removed wrong commited console.log 🤦‍♂️

## [4.0.9]( (2022-07-12)

### Bugfixes

- Fixed an error on first time run. 🐛

## [4.0.8]( (2022-07-09)

### Bugfixes

- Removed extra `}` causign an issue with variables 🐛

## [4.0.7]( (2022-07-09)

### Bugfixes

- Fixed missing pacakge 🤦‍♂️
- Removed yarn replaced with npm for project 🐛

## [4.0.6]( (2022-07-09)

### Bugfixes

- Fixed #5 (yarn.lock vs package-lock.json in docker-compose) 🐛

## [4.0.5]( (2022-07-09)

### Features

- `docker-compose` support added 🚀
- Generate `Dockerfile` for the use 🚀r
- Readme now completed 📄

### Bugfixes

- Fixed wrong version of `execa` 🐛
- Fixed a little typo 🤦‍♂️
- Added spacing to some of the messages 🐛
- Added missing `NODE_ENV` to .env file 🐛

<div align="center">
<h1>@Strapi-community/dockerize</h1>
<img src="https://raw.githubusercontent.com/strapi-community/strapi-tool-dockerize/main/.github/assets/banner.png">

<p>Add docker support for a Strapi Project with ease 🚀</p>

_Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a ☕️ if this tool was helpful_ [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

<p>
  <a href="https://discord.strapi.io">
    <img src="https://img.shields.io/discord/811989166782021633?color=blue&label=strapi-discord" alt="Strapi Discord">
  </a>
  <a href="https://www.npmjs.org/package/@strapi-community/dockerize">
    <img src="https://img.shields.io/npm/v/@strapi-community/dockerize/latest.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.org/package/@strapi-community/dockerize">
    <img src="https://img.shields.io/npm/dm/@strapi-community/dockerize" alt="Monthly download on NPM" />
  </a>
</p>
</div>

## Table of Contents <!-- omit in toc -->

- [🚦 Current Status](#-current-status)
- [✨ Usage](#-usage)
  - [🤖 Using CLI Arguments](#-using-cli-arguments)
  - [🧹 Resetting project](#-resetting-project)
- [🚀 Features](#-features)
- [🐳 Docker-compose support](#-docker-compose-support)
- [🎗 Contributing](#-contributing)
- [⭐️ Show your support](#️-show-your-support)
- [🔗 Links](#-links)
- [🌎 Community support](#-community-support)
- [🙋‍♀️ Authors](#️-authors)
- [🙋‍♂️ Contributors (Thank you 🙏)](#️-contributors-thank-you-)
- [🔖 License](#-license)

## 🚦 Current Status

This package is currently under development and should be considered **STABLE** in terms of state. I/We are currently accepting contributions and/or dedicated contributors to help develop and maintain this package.

For more information on contributing please see [the contrib message below](#contributing).

## ✨ Usage

```bash
npx @strapi-community/dockerize
```

You can also call it directly with arguments

```bash
npx @strapi-community/dockerize new --dbclient=mysql --dbhost=localhost --dbport=1234 --dbname=strapi --dbusername=strapi --dbpassword=strapi --projecttype=js --packagemanager=yarn --usecompose=false --env=both
```

### 🤖 Using CLI Arguments

Please note the `new` keyword is required for this to take effect.

```markdown
npx @strapi-community/dockerize
--dbtype=<dbtype>
--dbhost=<dbhost>
--dbport=<dbport>
--dbname=<dbname>
--dbuser=<dbuser>
--dbpassword=<dbpassword>
--type=<type>
--packagemanager=<packagemanager>
--useCompose=<useCompose>
--env=<env>
```

```markdown
| 💻 Command     | 💬 Value                                | 🦄 Type | 🐲 Default    |
| -------------- | --------------------------------------- | ------- | ------------- |
| dbtype         | `postgres` \| `mysql` \| `mariadb`      | String  | `postgres`    |
| dbhost         |                                         | String  | `localhost`   |
| dbport         | `5432` \| `3306`                        | Number  | `5432`        |
| dbname         |                                         | String  | `strapi`      |
| dbuser         |                                         | String  | `strapi`      |
| dbpassword     |                                         | String  | `strapi`      |
| type           | `ts` \| `js`                            | String  | `js`          |
| packagemanager | `yarn` \| `npm`                         | String  | `yarn`        |
| useCompose     | `true` \| `false`                       | Boolean | `false`       |
| env            | `development` \| `production` \| `both` | String  | `development` |
```

### 🧹 Resetting project

```bash
npx @strapi-community/dockerize reset
```

_Note_ that **RESET** will delete the `config/env` folder with all of it's content

## 🚀 Features

- Easy add support for docker
- Auto detects `yarn` or `npm` in your project
- Build a docker-compose file

## 🐳 Docker-compose support

- Postgres 14.5
- MySQL 8
- MariaDB 10

## 🎗 Contributing

I/We are actively looking for contributors, maintainers, and others to help shape this package. As this plugins sole purpose within the Strapi community is to be used by other developers and plugin maintainers to get fast responses time.

If interested please feel free to email the lead maintainer Simen at: simen@dehlin.dev or ping `Cookie Monster#6725` on Discord.

## ⭐️ Show your support

Give a star if this project helped you.
Feel free to buy [@Eventyret] a ☕️ if it was helpful. [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

## 🔗 Links

- [NPM package](https://www.npmjs.com/package/@strapi-community/dockerize)
- [GitHub repository](https://github.com/strapi-community/strapi-tool-dockerize)

## 🌎 Community support

- For general help using Strapi, please refer to [the official Strapi documentation](https://strapi.io/documentation/).
- For support with this plugin you can DM me in the Strapi Discord [channel](https://discord.strapi.io/).

## 🙋‍♀️ Authors

- [@Eventyret / Simen Daehlin](https://github.com/Eventyret)

## 🙋‍♂️ Contributors (Thank you 🙏)

- [@DimitriGilbert](https://github.com/DimitriGilbert)
- [@YEK-PLUS](https://github.com/YEK-PLUS)
- [@RobbieClarken](https://github.com/RobbieClarken)
- [@nevotheless](https://github.com/nevotheless)
- [@SudeepPatel-0812](https://github.com/SudeepPatel-0812)

## 🔖 License

See the [LICENSE](./LICENSE.md) file for licensing information.

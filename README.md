<div align="center">
<h1>@strapi-community/dockerize</h1>
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
    <img src="https://img.shields.io/npm/dm/@strapi-community/dockerize" alt="Monthly Downloads" />
  </a>
  <a href="https://github.com/strapi-community/strapi-tool-dockerize/actions">
    <img src="https://github.com/strapi-community/strapi-tool-dockerize/workflows/CI/badge.svg" alt="CI Status" />
  </a>
</p>

<p>
  <strong>Version 2.0</strong> - Complete TypeScript rewrite with modern architecture ✨
</p>

_Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a ☕️ if this tool was helpful_

[![Open Collective](https://img.shields.io/opencollective/all/strapi-tool-dockerize?color=blue&label=financial%20contributors)](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

</div>

---

## 📖 Table of Contents

- [🎯 What's New in v2.0](#-whats-new-in-v20)
- [✨ Quick Start](#-quick-start)
- [🚀 Features](#-features)
- [🗄️ Database Support](#️-database-support)
- [🔧 Advanced Usage](#-advanced-usage)
- [🐳 Generated Files](#-generated-files)
- [⚙️ Configuration Options](#️-configuration-options)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📋 Changelog](#-changelog)
- [💖 Support](#-support)
- [📄 License](#-license)

---

## 🎯 What's New in v2.0

<table>
<tr>
<td>

### 🔥 **Complete Rewrite**

- **TypeScript** - Full type safety
- **Modern CLI** - Beautiful interactive prompts
- **Plugin Architecture** - Extensible and modular
- **99% Faster Tests** - 250ms vs 20+ seconds!

</td>
<td>

### ⚡ **Enhanced Features**

- **SQLite Support** - Local development made easy
- **Smart .env Management** - No more duplicates
- **Environment Selection** - Dev, prod, or both
- **Auto-detection** - Project type, Node version, package manager

</td>
</tr>
</table>

> 🚨 **Breaking Changes**: v2.0 includes breaking changes. See [CHANGELOG.md](./CHANGELOG.md) for migration guide.

---

## ✨ Quick Start

### 🚀 Interactive Mode (Recommended)

```bash
npx @strapi-community/dockerize
```

The interactive wizard will guide you through:

- 🔍 **Project detection** - Validates your Strapi project
- 🗄️ **Database selection** - PostgreSQL, MySQL, MariaDB, or SQLite
- 🌍 **Environment choice** - Development, production, or both
- ⚙️ **Configuration** - Customizable settings with smart defaults

### 🤖 CLI Mode

```bash
npx @strapi-community/dockerize new \
  --database-type=postgresql \
  --environment=both \
  --use-compose=true
```

---

## 🚀 Features

### 🎯 **Core Features**

- ✅ **Multi-Database Support** - PostgreSQL, MySQL, MariaDB, SQLite
- ✅ **Environment Flexibility** - Development, production, or both
- ✅ **Smart Detection** - Auto-detects project configuration
- ✅ **Secure Defaults** - Generates secure passwords and secrets
- ✅ **Modern CLI** - Beautiful, interactive interface

### 🔧 **Advanced Features**

- ✅ **Plugin Architecture** - Extensible system for custom databases
- ✅ **Template Engine** - Powered by LiquidJS for flexible templates
- ✅ **Smart .env Management** - Preserves existing variables
- ✅ **Node Version Checking** - Ensures compatibility
- ✅ **Package Manager Detection** - Works with npm, yarn, pnpm

### 🛡️ **Reliability Features**

- ✅ **Comprehensive Testing** - 26 unit tests with 99% speed improvement
- ✅ **TypeScript Safety** - Full type coverage
- ✅ **Error Handling** - Graceful error handling with helpful messages
- ✅ **Validation** - Input validation and sanitization

---

## 🗄️ Database Support

<table>
<tr>
<th>Database</th>
<th>Version</th>
<th>Development</th>
<th>Production</th>
<th>Docker Compose</th>
</tr>
<tr>
<td>🐘 PostgreSQL</td>
<td>16-alpine</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>🐬 MySQL</td>
<td>8.0</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>🦭 MariaDB</td>
<td>10.11</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>🗃️ SQLite</td>
<td>Built-in</td>
<td>✅</td>
<td>✅</td>
<td>N/A</td>
</tr>
</table>

---

## 🔧 Advanced Usage

### 📋 **CLI Arguments**

```bash
npx @strapi-community/dockerize new [options]
```

| Option                | Values                                     | Default          | Description                 |
| --------------------- | ------------------------------------------ | ---------------- | --------------------------- |
| `--database-type`     | `postgresql`, `mysql`, `mariadb`, `sqlite` | `postgresql`     | Database type               |
| `--environment`       | `development`, `production`, `both`        | `both`           | Target environment          |
| `--use-compose`       | `true`, `false`                            | `true`           | Generate docker-compose.yml |
| `--database-name`     | string                                     | `strapi`         | Database name               |
| `--database-user`     | string                                     | `strapi`         | Database username           |
| `--database-password` | string                                     | _auto-generated_ | Database password           |
| `--host`              | string                                     | `localhost`      | Database host               |
| `--port`              | number                                     | _varies by DB_   | Database port               |

### 🔄 **Reset Command**

```bash
npx @strapi-community/dockerize reset
```

> ⚠️ **Warning**: This will remove all Docker-related files and configurations.

### 🏗️ **Project Types**

The tool automatically detects and supports:

- **TypeScript** projects with `tsconfig.json`
- **JavaScript** projects
- **npm**, **yarn**, or **pnpm** package managers
- **Strapi v4** and **v5** projects

---

## 🐳 Generated Files

### 📁 **File Structure**

```
your-strapi-project/
├── Dockerfile                 # Development container
├── Dockerfile.prod           # Production container (if selected)
├── docker-compose.yml        # Development services (if selected)
├── .env                      # Updated with Docker configuration
├── .dockerignore             # Optimized Docker ignore rules
└── README-DOCKER.md          # Docker usage instructions
```

### 📝 **Environment Variables**

The tool intelligently manages your `.env` file:

```bash
# 🐳 Docker Configuration (Generated by Strapi Dockerize)
DATABASE_CLIENT=postgres
DATABASE_NAME=strapi_abc123
DATABASE_USERNAME=strapi_def456
DATABASE_PASSWORD=SecurePass123!@#
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=false

# Docker Secrets
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=randomSalt123
ADMIN_JWT_SECRET=adminSecret456
TRANSFER_TOKEN_SALT=transferSalt789
JWT_SECRET=jwtSecret012
```

### 🚀 **Docker Commands**

#### Development

```bash
# Start with docker-compose
docker-compose up -d

# Or build and run manually
docker build -t my-strapi-app .
docker run -p 1337:1337 my-strapi-app
```

#### Production

```bash
# Build production image
docker build -f Dockerfile.prod -t my-strapi-app:prod .

# Run production container
docker run -p 1337:1337 --env-file .env my-strapi-app:prod
```

---

## ⚙️ Configuration Options

### 🗄️ **Database Configurations**

<details>
<summary><strong>PostgreSQL</strong></summary>

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "${DATABASE_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

</details>

<details>
<summary><strong>MySQL</strong></summary>

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ${DATABASE_NAME}
      MYSQL_USER: ${DATABASE_USERNAME}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "${DATABASE_PORT}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
```

</details>

<details>
<summary><strong>MariaDB</strong></summary>

```yaml
# docker-compose.yml
services:
  mariadb:
    image: mariadb:10.11
    environment:
      MARIADB_DATABASE: ${DATABASE_NAME}
      MARIADB_USER: ${DATABASE_USERNAME}
      MARIADB_PASSWORD: ${DATABASE_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "${DATABASE_PORT}:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
```

</details>

<details>
<summary><strong>SQLite</strong></summary>

```bash
# .env additions
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Note: SQLite doesn't require docker-compose services
```

</details>

---

## 🧪 Testing

### 🚀 **Run Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### 📊 **Test Coverage**

- **26 comprehensive unit tests**
- **Fast execution** (~250ms total)
- **Core functionality coverage**:
  - Plugin loading and database support
  - Project detection and validation
  - File generation and templating
  - Environment management
  - Error handling scenarios

---

## 🤝 Contributing

We actively welcome contributions! Here's how you can help:

### 🐛 **Bug Reports**

- Use the [issue tracker](https://github.com/strapi-community/strapi-tool-dockerize/issues)
- Include your OS, Node version, and Strapi version
- Provide steps to reproduce

### 💡 **Feature Requests**

- Check existing [feature requests](https://github.com/strapi-community/strapi-tool-dockerize/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
- Explain the use case and expected behavior

### 🔧 **Development Setup**

```bash
# Clone the repository
git clone https://github.com/strapi-community/strapi-tool-dockerize.git
cd strapi-tool-dockerize

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 📋 **Development Requirements**

- Node.js 18+
- TypeScript knowledge
- Familiarity with Docker and Strapi

### 👥 **Core Team**

- **[@Eventyret](https://github.com/Eventyret)** - Lead Maintainer & Creator

Want to become a maintainer? Reach out on [Discord](https://discord.strapi.io/) or email simen@dehlin.dev

---

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes and migration guides.

### Recent Updates

- **v2.0.0-beta.1** - Complete TypeScript rewrite with modern architecture
- **v1.x.x** - Legacy JavaScript-based versions

---

## 💖 Support

### 🌟 **Star this project**

If this tool helped you, please give it a star on GitHub!

### ☕ **Buy me a coffee**

Support development through [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

### 💬 **Community**

- [Strapi Discord](https://discord.strapi.io/) - Join the `#tools` channel
- [GitHub Discussions](https://github.com/strapi-community/strapi-tool-dockerize/discussions)
- [Twitter](https://twitter.com/strapijs) - Follow for updates

### 📚 **Resources**

- [Strapi Documentation](https://strapi.io/documentation/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.

---

<div align="center">

### 🙏 **Contributors**

Thanks to all our amazing contributors!

[![Contributors](https://contrib.rocks/image?repo=strapi-community/strapi-tool-dockerize)](https://github.com/strapi-community/strapi-tool-dockerize/graphs/contributors)

**Special Thanks**

- [@DimitriGilbert](https://github.com/DimitriGilbert)
- [@YEK-PLUS](https://github.com/YEK-PLUS)
- [@RobbieClarken](https://github.com/RobbieClarken)
- [@nevotheless](https://github.com/nevotheless)
- [@SudeepPatel-0812](https://github.com/SudeepPatel-0812)

---

**Made with ❤️ by the Strapi Community**

</div>

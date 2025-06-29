# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-16

### 🎯 Major Rewrite

Version 2.0 represents a **complete rewrite** of the strapi-tool-dockerize from JavaScript to TypeScript with modern architecture and enhanced user experience.

#### Complete TypeScript Migration

- **Full TypeScript Rewrite**: Migrated entire codebase from JavaScript to TypeScript
- **Type Safety**: Comprehensive type definitions and interfaces
- **Modern Architecture**: Plugin-based system for database support
- **Developer Experience**: Better IDE support, autocomplete, and error detection

#### Enhanced User Experience

- **Interactive CLI**: Modern wizard-style interface with beautiful prompts
- **Environment Selection**: Choose development, production, or both configurations
- **Project Detection**: Auto-detects Strapi version, language, Node version, and package manager
- **Streamlined Output**: Consolidated project information display

### 🐛 Issues Resolved

This release addresses real community-reported issues:

#### MySQL 8.4 Compatibility - **Thanks to [@koeppel](https://github.com/koeppel)**

- **Fixed MySQL 8.4 Compatibility** - Resolves deprecated `--default-authentication-plugin` parameter
- Addresses [PR #119](https://github.com/strapi-community/strapi-tool-dockerize/pull/119) and related MySQL 8.4+ compatibility issues
- Replaces deprecated `--default-authentication-plugin=mysql_native_password` with `--mysql-native-password=ON`
- Maintains character set, collation, and native password authentication functionality

#### Package Manager & Installation Issues

- **Better Package Manager Detection** - Addresses [#137](https://github.com/strapi-community/strapi-tool-dockerize/issues/137)
  - Improved detection of npm, yarn, pnpm
  - Better error handling during installation
  - Enhanced validation of project state

#### Database Configuration Problems

- **MySQL Installation Improvements** - Helps with [#123](https://github.com/strapi-community/strapi-tool-dockerize/issues/123)
  - Better database client configuration
  - Improved connection string generation
  - Modern MySQL image usage

#### Environment & Configuration

- **Environment Selection** - Addresses [#132](https://github.com/strapi-community/strapi-tool-dockerize/issues/132)
  - Clear development vs production environment selection
  - Better documentation of environment-specific configurations
  - Separate Dockerfile and docker-compose configurations

#### Project Creation & Validation

- **Enhanced Project Validation** - Helps with [#131](https://github.com/strapi-community/strapi-tool-dockerize/issues/131)
  - Better Strapi project detection and validation
  - Improved error messages for invalid projects
  - Better handling of edge cases

### ✨ New Features

#### Database Support Expansion

- **SQLite Support**: New database option for local development (file-based)
  - Proper directory bind mounting for data persistence (`.tmp` directory)
  - No separate database service needed (simplified docker-compose)
  - Correct filename handling matching Strapi defaults (`.tmp/data.db`)
  - Fixed path configuration to align with official Strapi documentation
- **Enhanced PostgreSQL**: Improved configuration with alpine images
  - **Schema Permissions Fix**: Automatically grants required SCHEMA permissions to prevent Strapi admin 500 errors
  - Includes initialization script (`init-scripts/01-init-strapi-user.sql`) that runs on first container startup
  - Addresses PostgreSQL user permissions as documented in [Strapi's PostgreSQL guide](https://docs.strapi.io/cms/configurations/database#postgresql)
- **MariaDB Support**: Alternative to MySQL with better defaults
- **Database Plugins**: Modular plugin system for database configurations

#### Smart Configuration Management

- **Intelligent .env Management**:
  - Preserves existing environment variables
  - Updates only Docker-related sections with clear headers
  - Prevents duplication of configuration blocks
  - Organized section management

#### Environment Flexibility

- **Multi-Environment Support**:
  - **Development only**: docker-compose + Dockerfile for local development
  - **Production only**: optimized Dockerfile.prod for deployment
  - **Both**: complete development + production setup (default)

#### Security Enhancements

- **Auto-generated Secrets**: Secure random generation of:
  - Database passwords
  - APP_KEYS (4 random keys)
  - JWT secrets
  - API tokens
  - Transfer tokens

### 🔧 Technical Improvements

#### Modern Architecture

- **Plugin System**: Extensible architecture for database plugins
- **Template Engine**: LiquidJS-powered templating system
- **Modular Design**: Separation of concerns with utility modules
- **Comprehensive Error Handling**: User-friendly error messages

#### Developer Experience

- **Comprehensive Testing**: 26 unit tests covering core functionality (v1.x had no tests)
- **Fast Test Execution**: Complete test suite runs in ~250ms
- **TypeScript Support**: Full type coverage for better maintainability
- **Modern Build System**: Using tsup for optimized builds

#### Code Quality

- **Modern JavaScript**: ES2022+ features with proper async/await usage
- **Organized Code Structure**: Clear separation of utilities, plugins, and core logic
- **Documentation**: Comprehensive inline documentation
- **Linting**: ESLint and Prettier configuration for consistent code style

### 🔄 Breaking Changes

**⚠️ Important**: Version 2.0 is essentially a new tool. The usage pattern is different from v1.x.

#### New Usage Pattern

- **Interactive Mode**: `npx @strapi-community/dockerize` (default and primary method)
- **Plugin Development**: `npx @strapi-community/dockerize generate-plugin`
- **Plugin Testing**: `npx @strapi-community/dockerize test-plugins`
- **Plugin Listing**: `npx @strapi-community/dockerize list-plugins`

#### What Changed

- **Command Structure**: New interactive wizard instead of single command
- **File Templates**: Completely new template system
- **Environment Variables**: Updated .env variable organization
- **Docker Configuration**: Enhanced Dockerfile and docker-compose.yml templates

#### For Users Upgrading from v1.x

Since this is essentially a new tool with a different approach:

1. **No migration needed** - v2.0 generates fresh Docker configurations
2. **Remove old Docker files manually** if you want a fresh start (Dockerfile, docker-compose.yml, etc.)
3. **Run the new interactive wizard**: `npx @strapi-community/dockerize`
4. **Review generated files** and customize as needed

### 📋 Development Improvements

#### Testing Infrastructure (New!)

- **Vitest Framework**: Modern testing framework with fast execution
- **Comprehensive Test Coverage**: 26 tests covering core functionality
- **Mocking Strategy**: File system and process mocking for reliable tests
- **CI Integration**: Automated testing on pull requests

#### Development Workflow

- **TypeScript Build**: Modern build process with tsup
- **Development Mode**: Hot reload during development
- **Package Management**: Support for npm, yarn, and pnpm
- **Linting & Formatting**: ESLint and Prettier integration

---

## [1.x.x] - Legacy JavaScript Versions

### Historical Context

The v1.x series was built in JavaScript and served the community well, but several foundational issues emerged:

- No automated testing (making maintenance and contributions difficult)
- Limited error handling and validation
- Package manager compatibility issues
- Environment configuration confusion
- Database setup problems (like the MySQL 8.4 compatibility issue)

Version 2.0 represents a complete ground-up rewrite addressing these foundational issues with modern tooling and architecture.

---

## Community Contributors

### Special Thanks

- **[@koeppel](https://github.com/koeppel)** - Identified and provided solution for MySQL 8.4 compatibility issue in [PR #119](https://github.com/strapi-community/strapi-tool-dockerize/pull/119)
- **[@Simon-Dirks](https://github.com/Simon-Dirks)** - Grammar and documentation improvements in [PR #139](https://github.com/strapi-community/strapi-tool-dockerize/pull/139)
- **[@Eventyret](https://github.com/Eventyret)** - Lead maintainer and v2.0 architect
- All community members who reported issues and provided feedback

---

## Links

- **GitHub Repository**: https://github.com/strapi-community/strapi-tool-dockerize
- **NPM Package**: https://www.npmjs.com/package/@strapi-community/dockerize
- **Issue Tracker**: https://github.com/strapi-community/strapi-tool-dockerize/issues
- **Discord**: https://discord.strapi.io/ (join the #tools channel)
- **Support**: [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

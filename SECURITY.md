# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |
| 0.4.x   | :x:                |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, email **simen.dehlin@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Any relevant configuration or output files

## What to Expect

- **Acknowledgment** within 48 hours of your report
- **Initial assessment** within 5 business days
- **Resolution timeline** communicated after assessment, depending on severity
- You will be kept updated as the fix progresses
- Credit will be given in the release notes (unless you prefer to stay anonymous)

If you have not received a response within 48 hours, please follow up on the same email thread.

## Scope

This project is a CLI tool that **generates** Docker configuration files (Dockerfiles, docker-compose files, etc.). It does not build images or run containers.

The following are **in scope**:

- Security issues in the generated output (exposed ports, weak defaults, insecure configurations)
- Vulnerabilities in the CLI tool itself (dependency issues, code injection, etc.)
- Sensitive data handling during the prompt flow

The following are **out of scope**:

- Vulnerabilities in Docker, Docker Compose, or Strapi itself
- Issues in user-modified generated files

## Known Security Considerations

- **Development mode**: Generated configurations use default database passwords for convenience. These are intended for local development only and should never be used in production.
- **Production mode**: Generated configurations use Docker secrets for sensitive values like database credentials, avoiding plaintext passwords in environment variables or compose files.

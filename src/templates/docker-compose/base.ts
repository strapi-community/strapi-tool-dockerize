export const baseComposeTemplate = `version: '3'
services:
  strapi:
    container_name: strapi
    image: node:{{nodeVersion}}
    working_dir: /app
    volumes:
      - ./:/app
    ports:
      - '1337:1337'
    command: npm run develop
`; 
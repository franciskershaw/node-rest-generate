# Node REST API Generator

A CLI tool to quickly scaffold Node.js REST API projects with customizable options for frameworks, databases, and more.

## Features

- Generate a complete REST API project structure
- Choose your preferred backend framework (Express, Fastify, or Koa)
- Select a database engine (MongoDB, PostgreSQL, MySQL, SQLite)
- Choose an ORM/ODM based on your database selection
- Add additional features like authentication, validation, and Swagger documentation
- Set up a complete TypeScript environment

## Installation

### Local Installation (Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/rest-generate.git
cd rest-generate

# Install dependencies
npm install

# Build the project
npm run build

# Link the package locally
npm link
```

### Global Installation (When Published)

```bash
npm install -g rest-generate
```

## Usage

```bash
# Create a new REST API project
rest-generate create my-api-project
```

The CLI will prompt you to select:

1. A backend framework (Express, Fastify, Koa)
2. A database (MongoDB, PostgreSQL, MySQL, SQLite)
3. An ORM/ODM (Mongoose, Prisma, Sequelize, etc.)
4. Additional features (Authentication, Validation, Swagger, etc.)

## Project Structure

The generated project will have the following structure:

```
my-api-project/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── utils/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rest-generate.git
cd rest-generate

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## License

MIT

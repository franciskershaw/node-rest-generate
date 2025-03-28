import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { execSync } from "child_process";
import {
  ProjectOptions,
  Framework,
  Database,
  ORM,
  Feature,
} from "../types/project.js";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(execSync);

// Get the templates directory path
const TEMPLATES_DIR = path.join(__dirname, "../../templates");

// Helper functions for type guards
function isDatabaseMongoDB(database: Database): database is "mongodb" {
  return database === "mongodb";
}

function isORMMongoose(orm: ORM): orm is "mongoose" {
  return orm === "mongoose";
}

function isFrameworkExpress(framework: Framework): framework is "express" {
  return framework === "express";
}

// Function to check if database is none
function isDatabaseNone(database: Database): database is "none" {
  return database === "none";
}

// Function to check if ORM is none
function isORMNone(orm: ORM): orm is "none" {
  return orm === "none";
}

/**
 * Generate a project based on the provided options
 * @param projectDir The directory where the project will be created
 * @param options The project configuration options
 */
export async function generateProject(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  console.log(chalk.blue("Generating project..."));

  // Create project directory if it doesn't exist
  await fs.ensureDir(projectDir);

  // Generate project structure based on selected options
  await generateProjectStructure(projectDir, options);

  // Generate package.json
  await generatePackageJson(projectDir, options);

  // Generate environment variables file
  await generateEnvFile(projectDir, options);

  // Copy template files based on framework, database, etc.
  await copyTemplateFiles(projectDir, options);

  console.log(chalk.blue("Project structure generated."));
}

/**
 * Generate the basic project directory structure
 */
async function generateProjectStructure(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  const dirs = [
    "src",
    "src/controllers",
    "src/routes",
    "src/middleware",
    "src/utils",
    "src/config",
  ];

  // Add database-specific directories
  if (options.database !== "none") {
    dirs.push("src/models");

    if (options.orm !== "none") {
      dirs.push(`src/${options.orm === "mongoose" ? "schemas" : "models"}`);
    }
  }

  // Add feature-specific directories
  if (options.features.includes("auth")) {
    dirs.push("src/auth");
  }

  if (options.features.includes("tests")) {
    dirs.push("tests");
    dirs.push("tests/unit");
    dirs.push("tests/integration");
  }

  // Create directories
  await Promise.all(
    dirs.map((dir) => fs.ensureDir(path.join(projectDir, dir)))
  );
}

/**
 * Generate package.json with appropriate dependencies
 */
async function generatePackageJson(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  const isTypeScript = options.language === "typescript";
  const mainFile = isTypeScript ? "dist/index.js" : "src/index.js";
  const srcExt = isTypeScript ? "ts" : "js";

  const packageJson = {
    name: options.name,
    version: "1.0.0",
    description: "A Node.js REST API",
    type: "module",
    main: mainFile,
    scripts: {
      start: `node ${mainFile}`,
      dev: isTypeScript
        ? `ts-node-dev --respawn --transpile-only src/index.${srcExt}`
        : `nodemon src/index.${srcExt}`,
      build: isTypeScript
        ? "tsc"
        : 'echo "No build step needed for JavaScript"',
      test: options.features.includes("tests")
        ? "jest"
        : 'echo "No tests configured"',
    },
    dependencies: getDependencies(options),
    devDependencies: getDevDependencies(options),
  };

  await fs.writeJSON(path.join(projectDir, "package.json"), packageJson, {
    spaces: 2,
  });
}

/**
 * Get dependencies based on selected options
 */
function getDependencies(options: ProjectOptions): Record<string, string> {
  const dependencies: Record<string, string> = {
    "@types/node": "latest",
    dotenv: "latest",
  };

  // Framework dependencies
  switch (options.framework) {
    case "express":
      dependencies["express"] = "latest";
      dependencies["cors"] = "latest";
      dependencies["helmet"] = "latest";
      dependencies["morgan"] = "latest";
      break;
    /* The following cases are commented out for now
    "fastify":
      dependencies["fastify"] = "latest";
      dependencies["@fastify/cors"] = "latest";
      dependencies["@fastify/helmet"] = "latest";
      break;
    "koa":
      dependencies["koa"] = "latest";
      dependencies["koa-router"] = "latest";
      dependencies["koa-bodyparser"] = "latest";
      dependencies["@koa/cors"] = "latest";
      break;
    */
  }

  // Database dependencies
  if (isDatabaseMongoDB(options.database)) {
    dependencies["mongodb"] = "latest";
  }
  /* The following database options are commented out for now
  else if (options.database === "postgres") {
    dependencies["pg"] = "latest";
  }
  else if (options.database === "mysql") {
    dependencies["mysql2"] = "latest";
  }
  else if (options.database === "sqlite") {
    dependencies["sqlite3"] = "latest";
    dependencies["sqlite"] = "latest";
  }
  */

  // ORM dependencies
  if (isORMMongoose(options.orm)) {
    dependencies["mongoose"] = "latest";
  }
  /* The following ORM options are commented out for now
  else if (options.orm === "prisma") {
    dependencies["@prisma/client"] = "latest";
  }
  else if (options.orm === "sequelize") {
    dependencies["sequelize"] = "latest";
  }
  else if (options.orm === "typeorm") {
    dependencies["typeorm"] = "latest";
    dependencies["reflect-metadata"] = "latest";
  }
  else if (options.orm === "drizzle") {
    dependencies["drizzle-orm"] = "latest";
  }
  */

  // Authentication dependencies
  if (options.features.includes("auth")) {
    dependencies["passport"] = "latest";
    dependencies["express-session"] = "latest";

    if (options.authStrategy === "jwt") {
      dependencies["passport-jwt"] = "latest";
      dependencies["jsonwebtoken"] = "latest";
    } else if (options.authStrategy === "session") {
      dependencies["connect-mongo"] = "latest";
      dependencies["express-session"] = "latest";
      dependencies["passport-local"] = "latest";
    } else if (options.authStrategy === "oauth") {
      dependencies["passport-google-oauth20"] = "latest";
      dependencies["passport-github2"] = "latest";
    }

    dependencies["bcrypt"] = "latest";
  }

  // Validation dependencies
  if (options.features.includes("validation")) {
    if (options.validationLibrary === "joi") {
      dependencies["joi"] = "latest";
    } else if (options.validationLibrary === "zod") {
      dependencies["zod"] = "latest";
    }
  }

  // Swagger dependencies
  if (options.features.includes("swagger")) {
    dependencies["swagger-ui-express"] = "latest";
    dependencies["swagger-jsdoc"] = "latest";
  }

  return dependencies;
}

/**
 * Get dev dependencies based on project options
 */
function getDevDependencies(options: ProjectOptions): Record<string, string> {
  const devDependencies: Record<string, string> = {};

  // TypeScript
  if (options.language === "typescript") {
    devDependencies["typescript"] = "^5.2.2";
    devDependencies["@types/node"] = "^20.6.3";
    devDependencies["ts-node"] = "^10.9.1";
    devDependencies["nodemon"] = "^3.0.1";
    devDependencies["tsconfig-paths"] = "^4.2.0";
    devDependencies["rimraf"] = "^5.0.1";
  } else {
    // JavaScript with ES modules support
    devDependencies["nodemon"] = "^3.0.1";
  }

  // Linting and formatting
  if (options.language === "typescript") {
    devDependencies["eslint"] = "^8.49.0";
    devDependencies["@typescript-eslint/eslint-plugin"] = "^6.7.2";
    devDependencies["@typescript-eslint/parser"] = "^6.7.2";
    devDependencies["prettier"] = "^3.0.3";
  } else {
    devDependencies["eslint"] = "^8.49.0";
    devDependencies["prettier"] = "^3.0.3";
  }

  // ORM dev dependencies
  if (options.orm === "mongoose") {
    // No specific dev dependencies for mongoose
    /* Commented out for now
  } else if (options.orm === "prisma") {
    devDependencies["prisma"] = "^5.3.1";
  } else if (options.orm === "drizzle") {
    if (options.database === "postgres") {
      devDependencies["drizzle-kit"] = "^0.19.13";
    } else if (options.database === "mysql") {
      devDependencies["drizzle-kit"] = "^0.19.13";
    } else if (options.database === "sqlite") {
      devDependencies["drizzle-kit"] = "^0.19.13";
    }
  */
  }

  // Testing
  if (options.features.includes("tests")) {
    devDependencies["jest"] = "^29.7.0";
    if (options.language === "typescript") {
      devDependencies["ts-jest"] = "^29.1.1";
      devDependencies["@types/jest"] = "^29.5.5";
    }
    if (isFrameworkExpress(options.framework)) {
      devDependencies["supertest"] = "^6.3.3";
      if (options.language === "typescript") {
        devDependencies["@types/supertest"] = "^2.0.12";
      }
      /* Commented out for now
    } else if (options.framework === "fastify") {
      // Fastify has built-in testing support
    } else if (options.framework === "koa") {
      devDependencies["supertest"] = "^6.3.3";
      if (options.language === "typescript") {
        devDependencies["@types/supertest"] = "^2.0.12";
      }
    */
    }
  }

  return devDependencies;
}

/**
 * Generate .env and .env.example files
 */
async function generateEnvFile(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  const envContent: string[] = [
    "# Server Configuration",
    "PORT=3000",
    "NODE_ENV=development",
    "",
  ];

  // Database connection
  if (options.database !== "none") {
    envContent.push("# Database Configuration");

    switch (options.database) {
      case "mongodb":
        envContent.push(
          "MONGODB_URI=mongodb://localhost:27017/" + options.name
        );
        break;
      /* Commented out for now
      case "postgres":
        envContent.push("POSTGRES_HOST=localhost");
        envContent.push("POSTGRES_PORT=5432");
        envContent.push("POSTGRES_USER=postgres");
        envContent.push("POSTGRES_PASSWORD=postgres");
        envContent.push("POSTGRES_DB=" + options.name);
        envContent.push(
          "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/" +
            options.name
        );
        break;
      case "mysql":
        envContent.push("MYSQL_HOST=localhost");
        envContent.push("MYSQL_PORT=3306");
        envContent.push("MYSQL_USER=root");
        envContent.push("MYSQL_PASSWORD=root");
        envContent.push("MYSQL_DB=" + options.name);
        envContent.push(
          "DATABASE_URL=mysql://root:root@localhost:3306/" + options.name
        );
        break;
      case "sqlite":
        envContent.push("SQLITE_FILE=./" + options.name + ".db");
        envContent.push("DATABASE_URL=file:./" + options.name + ".db");
        break;
      */
    }

    envContent.push("");
  }

  // Authentication
  if (options.features.includes("auth")) {
    envContent.push("# Authentication");
    envContent.push("JWT_SECRET=your-secret-key");
    envContent.push("JWT_EXPIRES_IN=1d");
    if (
      options.authStrategy === "session" ||
      options.authStrategy === "oauth"
    ) {
      envContent.push("SESSION_SECRET=your-session-secret");
    }
    if (options.authStrategy === "oauth") {
      envContent.push("# OAuth Configuration");
      envContent.push("GOOGLE_CLIENT_ID=your-google-client-id");
      envContent.push("GOOGLE_CLIENT_SECRET=your-google-client-secret");
      envContent.push("GITHUB_CLIENT_ID=your-github-client-id");
      envContent.push("GITHUB_CLIENT_SECRET=your-github-client-secret");
    }
    envContent.push("");
  }

  await fs.writeFile(
    path.join(projectDir, ".env.example"),
    envContent.join("\n")
  );
  await fs.writeFile(path.join(projectDir, ".env"), envContent.join("\n"));

  // Add .env to .gitignore
  await fs.writeFile(
    path.join(projectDir, ".gitignore"),
    "node_modules\ndist\n.env\n"
  );
}

/**
 * Copy template files based on the selected options
 */
async function copyTemplateFiles(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  // Copy tsconfig.json
  const tsconfigTemplatePath = path.join(
    TEMPLATES_DIR,
    "common",
    "tsconfig.json"
  );
  const tsconfigPath = path.join(projectDir, "tsconfig.json");

  // For now, since we don't have actual template files yet, we'll create a basic tsconfig
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      strict: true,
      outDir: "./dist",
      rootDir: "./src",
      resolveJsonModule: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "**/*.test.ts", "dist"],
  };

  await fs.writeJSON(tsconfigPath, tsconfig, { spaces: 2 });

  // Create a basic README.md
  const readmeContent = `# ${options.name}

A Node.js REST API project built with ${options.framework}${
    options.database !== "none" ? ` and ${options.database}` : ""
  }.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
${options.database !== "none" ? `- ${options.database} database` : ""}

### Installation

1. Clone the repository
2. Install dependencies

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
   - Copy \`.env.example\` to \`.env\` and update the values

4. Start the development server

\`\`\`bash
npm run dev
\`\`\`

## Scripts

- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm start\`: Start production server
${options.features.includes("tests") ? "- `npm test`: Run tests" : ""}

## Project Structure

\`\`\`
src/
├── controllers/    # Request handlers
├── routes/         # API routes
├── middleware/     # Express/Fastify/Koa middleware
├── models/         # Data models
├── config/         # Configuration files
└── utils/          # Utility functions
\`\`\`
`;

  await fs.writeFile(path.join(projectDir, "README.md"), readmeContent);

  // Create basic index.js file based on the selected framework
  await generateIndexFile(projectDir, options);

  // Generate basic controller, route, and model files
  await generateBasicFiles(projectDir, options);
}

/**
 * Generate the main index file
 */
async function generateIndexFile(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  const isTypeScript = options.language === "typescript";
  const fileExtension = isTypeScript ? ".ts" : ".js";
  const typeDefs = isTypeScript ? ": any" : "";

  let indexContent = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
${options.database === "mongodb" ? "import mongoose from 'mongoose';" : ""}
${options.features.includes("auth") ? "import passport from 'passport';" : ""}
${
  options.features.includes("auth") && options.authStrategy === "session"
    ? "import session from 'express-session';"
    : ""
}
${
  options.features.includes("auth") &&
  options.authStrategy === "session" &&
  options.database === "mongodb"
    ? "import MongoStore from 'connect-mongo';"
    : ""
}

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
${
  options.database === "mongodb"
    ? `
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.name}')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
`
    : ""
}

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

${
  options.features.includes("auth") && options.authStrategy === "session"
    ? `
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  ${
    options.database === "mongodb"
      ? `
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.name}'
  }),`
      : ""
  }
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
`
    : options.features.includes("auth")
    ? `
// Initialize Passport
app.use(passport.initialize());
`
    : ""
}

${
  options.features.includes("swagger")
    ? `
// Swagger documentation
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${options.name} API',
      version: '1.0.0',
      description: 'API documentation for ${options.name}',
    },
    servers: [
      {
        url: 'http://localhost:' + port,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.${fileExtension}'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
`
    : ""
}

// Routes
app.get('/', (req, res${typeDefs}) => {
  res.json({ message: 'Welcome to ${options.name} API' });
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
`;

  await fs.writeFile(
    path.join(projectDir, "src", `index${fileExtension}`),
    indexContent
  );
}

/**
 * Generate basic controller, route, and model files
 */
async function generateBasicFiles(
  projectDir: string,
  options: ProjectOptions
): Promise<void> {
  // Create a basic controller
  const controllerContent = `/**
 * Example controller
 */
export const getHello = async (req, res) => {
  return res.json({ message: 'Hello World!' });
};

export const createItem = async (req, res) => {
  const item = req.body;
  // Implementation would depend on the database and ORM
  return res.status(201).json({ message: 'Item created', item });
};
`;

  await fs.writeFile(
    path.join(projectDir, "src", "controllers", "example.controller.ts"),
    controllerContent
  );

  // Create a basic route file
  let routeContent = "";
  if (isFrameworkExpress(options.framework)) {
    routeContent = `import { Router } from 'express';
import { getHello, createItem } from '../controllers/example.controller.js';

const router = Router();

router.get('/hello', getHello);
router.post('/items', createItem);

export default router;
`;
    /* Commented out for now
  } else if (options.framework === "fastify") {
    routeContent = `import { FastifyInstance } from 'fastify';
import { getHello, createItem } from '../controllers/example.controller.js';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/hello', getHello);
  fastify.post('/items', createItem);
}
`;
  } else if (options.framework === "koa") {
    routeContent = `import Router from 'koa-router';
import { getHello, createItem } from '../controllers/example.controller.js';

const router = new Router({ prefix: '/api' });

router.get('/hello', getHello);
router.post('/items', createItem);

export default router;
`;
  */
  }

  await fs.writeFile(
    path.join(projectDir, "src", "routes", "example.routes.ts"),
    routeContent
  );

  // Create a basic model if a database is selected
  if (!isDatabaseNone(options.database)) {
    let modelContent = "";

    if (isORMMongoose(options.orm)) {
      modelContent = `import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Example = mongoose.model('Example', exampleSchema);
`;
      /* Commented out for now
    } else if (options.orm === "prisma") {
      // Create prisma schema
      const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${
    options.database === "postgres" ? "postgresql" : options.database
  }"
  url      = env("DATABASE_URL")
}

model Example {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  createdAt   DateTime @default(now())
}
`;
      await fs.ensureDir(path.join(projectDir, "prisma"));
      await fs.writeFile(
        path.join(projectDir, "prisma", "schema.prisma"),
        prismaSchema
      );

      modelContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const Example = prisma.example;
`;
    */
    } else {
      modelContent = `// Example model file
// Implementation depends on your ORM and database choice

export interface Example {
  id?: number;
  name: string;
  description?: string;
  createdAt?: Date;
}

// Example repository functions
export const findAll = async () => {
  // Implementation depends on your database and ORM choice
  return [];
};

export const findById = async (id: number) => {
  // Implementation depends on your database and ORM choice
  return null;
};

export const create = async (data: Omit<Example, 'id' | 'createdAt'>) => {
  // Implementation depends on your database and ORM choice
  return { ...data, id: 1, createdAt: new Date() };
};
`;
    }

    await fs.writeFile(
      path.join(projectDir, "src", "models", "example.model.ts"),
      modelContent
    );
  }
}

/**
 * Generate database URL based on options
 */
function generateDatabaseUrl(options: ProjectOptions): string {
  if (isDatabaseNone(options.database)) {
    return "";
  }

  if (isDatabaseMongoDB(options.database)) {
    return `mongodb://localhost:27017/${options.name}`;
  }

  /* Commented out for now
  if (options.database === "postgres") {
    return `postgresql://postgres:postgres@localhost:5432/${options.name}`;
  }
  
  if (options.database === "mysql") {
    return `mysql://root:root@localhost:3306/${options.name}`;
  }
  
  if (options.database === "sqlite") {
    return `file:./${options.name}.db`;
  }
  */

  return "";
}

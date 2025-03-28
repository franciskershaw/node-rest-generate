import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { select, checkbox, confirm } from "@inquirer/prompts";
import { generateProject } from "../utils/generator.js";
import {
  ProjectOptions,
  Framework,
  Database,
  ORM,
  Feature,
  Language,
  ValidationLibrary,
  AuthStrategy,
} from "../types/project.js";

type Choice<T> = {
  name: string;
  value: T;
};

/**
 * Main function to create a new project
 * @param projectName The name of the project to create
 */
export async function createProject(projectName: string): Promise<void> {
  console.log(chalk.blue(`Creating a new REST API project: ${projectName}`));

  // Ensure project name is valid
  const projectDir = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectDir)) {
    const shouldContinue = await confirm({
      message: `Directory ${projectName} already exists. Continue? This may overwrite files.`,
      default: false,
    });

    if (!shouldContinue) {
      console.log(chalk.yellow("Project creation cancelled."));
      process.exit(0);
    }
  }

  try {
    // Select language
    const language = await select<Language>({
      message: "Select a language:",
      choices: [
        { name: "TypeScript", value: "typescript" },
        { name: "JavaScript", value: "javascript" },
      ],
    });

    // Framework selection - currently limited to Express
    const framework = await select<Framework>({
      message: "Select a backend framework:",
      choices: [
        { name: "Express", value: "express" },
        /* Commented out for now
        { name: "Fastify", value: "fastify" },
        { name: "Koa", value: "koa" },
        */
      ],
    });

    // Database selection - currently limited to MongoDB
    const database = await select<Database>({
      message: "Select a database:",
      choices: [
        { name: "MongoDB", value: "mongodb" },
        /* Commented out for now
        { name: "PostgreSQL", value: "postgres" },
        { name: "MySQL", value: "mysql" },
        { name: "SQLite", value: "sqlite" },
        { name: "None", value: "none" },
        */
      ],
    });

    // ORM selection - currently limited to Mongoose for MongoDB
    // We'll keep the conditional logic for future extensibility
    let ormChoices: Choice<ORM>[] = [
      { name: "Mongoose", value: "mongoose" },
      /* Commented out for now
      { name: "Prisma", value: "prisma" },
      { name: "None", value: "none" },
      */
    ];

    /*
    // This is commented out for now, but preserved for future use
    if (database === "none") {
      ormChoices = [{ name: "None", value: "none" }];
    } else if (database !== "mongodb") {
      ormChoices = [
        { name: "Prisma", value: "prisma" },
        { name: "Sequelize", value: "sequelize" },
        { name: "TypeORM", value: "typeorm" },
        { name: "Drizzle", value: "drizzle" },
        { name: "None", value: "none" },
      ];
    }
    */

    const orm = await select<ORM>({
      message: "Select an ORM/ODM:",
      choices: ormChoices,
    });

    // Select additional features
    const features = await checkbox<Feature>({
      message: "Select additional features:",
      choices: [
        { name: "Authentication (Passport)", value: "auth" },
        { name: "Validation", value: "validation" },
        { name: "Swagger/OpenAPI Documentation", value: "swagger" },
        { name: "Docker", value: "docker" },
        { name: "Testing (Jest)", value: "tests" },
      ],
    });

    // Additional configuration based on selected features
    let validationLibrary: ValidationLibrary | undefined;
    let authStrategy: AuthStrategy | undefined;

    if (features.includes("validation")) {
      validationLibrary = await select<ValidationLibrary>({
        message: "Select a validation library:",
        choices: [
          { name: "Joi", value: "joi" },
          { name: "Zod", value: "zod" },
        ],
      });
    }

    if (features.includes("auth")) {
      authStrategy = await select<AuthStrategy>({
        message: "Select an authentication strategy:",
        choices: [
          { name: "JWT", value: "jwt" },
          { name: "Session-based", value: "session" },
          { name: "OAuth (Google, GitHub, etc.)", value: "oauth" },
        ],
      });
    }

    // Collect project options
    const projectOptions: ProjectOptions = {
      name: projectName,
      language,
      framework,
      database,
      orm,
      features,
      validationLibrary,
      authStrategy,
    };

    // Generate project with collected options
    await generateProject(projectDir, projectOptions);

    console.log(
      chalk.green(`
✅ Project ${projectName} successfully created!

Next steps:
  cd ${projectName}
  npm install
  npm run dev
    `)
    );
  } catch (error) {
    console.error(chalk.red("Error during project creation:"), error);
    process.exit(1);
  }
}

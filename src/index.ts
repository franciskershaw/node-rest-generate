import { Command } from "commander";
import chalk from "chalk";
import { createProject } from "./commands/create.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

/**
 * Main function to run the CLI
 */
export async function run(): Promise<void> {
  const program = new Command();

  program
    .name("rest-generate")
    .description("Generate Node.js REST API projects with customizable options")
    .version(packageJson.version);

  program
    .command("create <project-name>")
    .description("Create a new REST API project")
    .action(async (projectName: string) => {
      try {
        await createProject(projectName);
      } catch (error) {
        console.error(chalk.red("Error creating project:"), error);
        process.exit(1);
      }
    });

  // If no arguments, show help
  if (process.argv.length === 2) {
    program.help();
  }

  await program.parseAsync(process.argv);
}

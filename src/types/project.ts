/**
 * Framework options supported by the generator
 */
export type Framework = "express";
/* Commented out for now, to be added back later
  | "fastify" 
  | "koa"
  */

/**
 * Database options supported by the generator
 */
export type Database = "mongodb" | "none";
/* Commented out for now, to be added back later
  | "postgres" 
  | "mysql" 
  | "sqlite" 
  */

/**
 * ORM options supported by the generator
 */
export type ORM = "mongoose" | "none";
/* Commented out for now, to be added back later
  | "prisma" 
  | "sequelize" 
  | "typeorm" 
  | "drizzle" 
  */

/**
 * TypeScript or JavaScript option
 */
export type Language = "typescript" | "javascript";

/**
 * Validation library options
 */
export type ValidationLibrary = "joi" | "zod";

/**
 * Authentication strategy options
 */
export type AuthStrategy = "jwt" | "session" | "oauth";

/**
 * Feature options that can be added to a project
 */
export type Feature = "auth" | "validation" | "swagger" | "docker" | "tests";

/**
 * Configuration options for project generation
 */
export interface ProjectOptions {
  /** Project name */
  name: string;
  /** Selected language */
  language: Language;
  /** Selected framework */
  framework: Framework;
  /** Selected database */
  database: Database;
  /** Selected ORM/ODM */
  orm: ORM;
  /** Selected additional features */
  features: Feature[];
  /** Validation library if validation feature is selected */
  validationLibrary?: ValidationLibrary;
  /** Authentication strategy if auth feature is selected */
  authStrategy?: AuthStrategy;
}

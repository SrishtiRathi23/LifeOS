import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: join(process.cwd(), ".env") });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required.");
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined
});

const migrationFiles = [
  join(process.cwd(), "prisma", "initial_migration.sql"),
  join(process.cwd(), "prisma", "migrations", "20260504123000_production_ready", "migration.sql")
];

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function readSqlFile(file) {
  const buffer = readFileSync(file);
  const hasUtf16Nulls = buffer.subarray(0, 200).some((byte, index) => index % 2 === 1 && byte === 0);
  return buffer.toString(hasUtf16Nulls ? "utf16le" : "utf8").replace(/^\uFEFF/, "");
}

const ignorableCodes = new Set([
  "42P07", // duplicate_table
  "42710", // duplicate_object
  "42701", // duplicate_column
  "23505" // unique_violation
]);

await client.connect();

try {
  for (const file of migrationFiles) {
    const sql = readSqlFile(file);
    for (const statement of splitStatements(sql)) {
      try {
        await client.query(statement);
      } catch (error) {
        if (!ignorableCodes.has(error.code)) {
          console.error("Failed statement:", statement.slice(0, 180).replace(/\s+/g, " "));
          throw error;
        }
      }
    }
  }
  console.log("SQL migrations applied.");
} finally {
  await client.end();
}

import fs from "fs/promises";
import path from "path";

import { db } from "../lib/db";
import { TableColumn, TableSchema } from "../types/schema";

async function getTables(): Promise<string[]> {
  const result = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  return result.rows.map((row) => row.table_name);
}

async function getColumns(tableName: string): Promise<TableColumn[]> {
  const result = await db.query(
    `
    SELECT
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `,
    [tableName],
  );

  return result.rows;
}

async function main() {
  await db.connect();

  const tables = await getTables();

  const schema: TableSchema[] = [];

  for (const table of tables) {
    console.log(`Inspecting: ${table}`);

    const columns = await getColumns(table);

    schema.push({
      table_name: table,
      columns,
    });
  }

  await db.end();

  const outputDir = path.join(process.cwd(), ".output");

  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "supabase-schema.json");

  await fs.writeFile(outputPath, JSON.stringify(schema, null, 2));

  console.log(`\nSchema exported to:`);
  console.log(outputPath);
}

main().catch(console.error);

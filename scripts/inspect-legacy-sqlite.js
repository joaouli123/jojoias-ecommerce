/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const sqlite3 = require("sqlite3");

const candidates = [
  path.join(process.cwd(), "prisma", "dev.db"),
  path.join(process.cwd(), "prisma", "prisma", "dev.db"),
];

function readTables(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows.map((row) => row.name));
    });
  });
}

function readCount(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM "${tableName}"`, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row?.count ?? 0);
    });
  });
}

async function inspectFile(filePath) {
  const db = await new Promise((resolve, reject) => {
    const instance = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(instance);
    });
  });

  try {
    const tables = await readTables(db);
    console.log(`DB ${filePath}`);

    for (const tableName of tables) {
      const count = await readCount(db, tableName);
      console.log(`  ${tableName}: ${count}`);
    }
  } finally {
    await new Promise((resolve) => db.close(resolve));
  }
}

async function main() {
  for (const filePath of candidates) {
    try {
      await inspectFile(filePath);
    } catch (error) {
      console.log(`DB ${filePath}`);
      console.log(`  ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
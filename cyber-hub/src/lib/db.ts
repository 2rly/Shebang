import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "radar.db");

function createDb(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'user',
      company       TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_product_versions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_name    TEXT    NOT NULL,
      current_version TEXT    NOT NULL,
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_name)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      category    TEXT    NOT NULL DEFAULT 'General Discussion',
      upvotes     INTEGER NOT NULL DEFAULT 0,
      downvotes   INTEGER NOT NULL DEFAULT 0,
      views       INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      value     INTEGER NOT NULL CHECK(value IN (-1, 1)),
      UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      tags        TEXT    NOT NULL DEFAULT '[]',
      status      TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      article_id  INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      content     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      CHECK(
        (post_id IS NOT NULL AND article_id IS NULL) OR
        (post_id IS NULL AND article_id IS NOT NULL)
      )
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT    NOT NULL CHECK(role IN ('user', 'assistant')),
      content     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add columns to existing users table if missing
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes("username")) {
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''`);
  }
  if (!colNames.includes("role")) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  }

  return db;
}

// Survive HMR in dev — reuse the same connection across hot reloads
const globalForDb = globalThis as unknown as { __radarDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__radarDb) {
    globalForDb.__radarDb = createDb();
  }
  return globalForDb.__radarDb;
}

import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let schemaEnsured = false;

export async function ensureSchema(d1: D1Database) {
  if (schemaEnsured) return;

  // 1. Create transactions table if not exists using d1.prepare().run()
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL, note TEXT, tag TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      )
      .run();
  } catch (error) {
    console.warn('create transactions table error (handled):', error);
  }

  // 2. Ensure 'tag' column exists if table was previously created without it
  try {
    await d1.prepare(`ALTER TABLE transactions ADD COLUMN tag TEXT`).run();
  } catch {
    // Column already exists
  }

  // 3. Ensure transactions indexes
  try {
    await d1.batch([
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id)`,
      ),
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions (user_id, created_at)`,
      ),
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions (user_id, type)`,
      ),
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_transactions_user_tag ON transactions (user_id, tag)`,
      ),
    ]);
  } catch (error) {
    console.warn('create transactions indexes error (handled):', error);
  }

  // 4. Create tags table if not exists
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'ALL', color TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      )
      .run();
  } catch (error) {
    console.warn('create tags table error (handled):', error);
  }

  // 5. Ensure tags indexes
  try {
    await d1.batch([
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags (user_id)`,
      ),
      d1.prepare(
        `CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags (user_id, name)`,
      ),
    ]);
  } catch (error) {
    console.warn('create tags indexes error (handled):', error);
  }

  // 6. Create user_settings table if not exists
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY NOT NULL, tags_seeded INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      )
      .run();
  } catch (error) {
    console.warn('create user_settings table error (handled):', error);
  }

  // 7. Create read-only financial sharing grants
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS financial_shares (id TEXT PRIMARY KEY NOT NULL, owner_user_id TEXT NOT NULL, owner_name TEXT NOT NULL, viewer_email TEXT NOT NULL, created_at INTEGER NOT NULL)`,
    )
    .run();
  await d1.batch([
    d1.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_shares_owner_viewer ON financial_shares (owner_user_id, viewer_email)`,
    ),
    d1.prepare(
      `CREATE INDEX IF NOT EXISTS idx_financial_shares_viewer_email ON financial_shares (viewer_email)`,
    ),
  ]);

  schemaEnsured = true;
}

export async function getDb() {
  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.',
    );
  }

  await ensureSchema(env.DB);
  return drizzle(env.DB, { schema });
}

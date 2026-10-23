import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type', { enum: ['ADD', 'SUBTRACT'] }).notNull(),
    amount: integer('amount').notNull(),
    note: text('note'),
    tag: text('tag'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_transactions_user_id').on(table.userId),
    index('idx_transactions_user_created').on(table.userId, table.createdAt),
    index('idx_transactions_user_type').on(table.userId, table.type),
    index('idx_transactions_user_tag').on(table.userId, table.tag),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    type: text('type', { enum: ['INCOME', 'EXPENSE', 'ALL'] })
      .notNull()
      .default('ALL'),
    color: text('color'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_tags_user_id').on(table.userId),
    index('idx_tags_user_name').on(table.userId, table.name),
  ],
);

export type TagItem = typeof tags.$inferSelect;
export type NewTagItem = typeof tags.$inferInsert;

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id').primaryKey(),
  tagsSeeded: integer('tags_seeded', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export const financialShares = sqliteTable(
  'financial_shares',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').notNull(),
    ownerName: text('owner_name').notNull(),
    viewerEmail: text('viewer_email').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_financial_shares_owner_viewer').on(
      table.ownerUserId,
      table.viewerEmail,
    ),
    index('idx_financial_shares_viewer_email').on(table.viewerEmail),
  ],
);

export type FinancialShare = typeof financialShares.$inferSelect;
export type NewFinancialShare = typeof financialShares.$inferInsert;

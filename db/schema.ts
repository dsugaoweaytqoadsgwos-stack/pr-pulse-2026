import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const liveEvents = sqliteTable(
  'live_events',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    eventDate: text('event_date').notNull(),
    category: text('category').notNull(),
    riskLevel: text('risk_level').notNull(),
    score: integer('score').notNull(),
    authority: integer('authority', { mode: 'boolean' }).notNull().default(false),
    sourceCount: integer('source_count').notNull().default(1),
    primaryDomain: text('primary_domain').notNull(),
    sourceUrls: text('source_urls').notNull(),
    recommendation: text('recommendation').notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),
    fetchedAt: integer('fetched_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_live_events_published_at').on(table.publishedAt),
    index('idx_live_events_score').on(table.score),
  ],
);

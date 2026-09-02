CREATE TABLE `live_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`event_date` text NOT NULL,
	`category` text NOT NULL,
	`risk_level` text NOT NULL,
	`score` integer NOT NULL,
	`authority` integer DEFAULT false NOT NULL,
	`source_count` integer DEFAULT 1 NOT NULL,
	`primary_domain` text NOT NULL,
	`source_urls` text NOT NULL,
	`recommendation` text NOT NULL,
	`published_at` integer NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_live_events_published_at` ON `live_events` (`published_at`);--> statement-breakpoint
CREATE INDEX `idx_live_events_score` ON `live_events` (`score`);
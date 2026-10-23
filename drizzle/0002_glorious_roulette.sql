CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'ALL' NOT NULL,
	`color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tags_user_id` ON `tags` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_tags_user_name` ON `tags` (`user_id`,`name`);
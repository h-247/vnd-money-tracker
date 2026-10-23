CREATE TABLE `financial_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_name` text NOT NULL,
	`viewer_email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_financial_shares_owner_viewer` ON `financial_shares` (`owner_user_id`,`viewer_email`);--> statement-breakpoint
CREATE INDEX `idx_financial_shares_viewer_email` ON `financial_shares` (`viewer_email`);
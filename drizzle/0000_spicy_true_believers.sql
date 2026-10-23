CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_user_id` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user_created` ON `transactions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user_type` ON `transactions` (`user_id`,`type`);
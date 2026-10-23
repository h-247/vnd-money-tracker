ALTER TABLE `transactions` ADD `tag` text;--> statement-breakpoint
CREATE INDEX `idx_transactions_user_tag` ON `transactions` (`user_id`,`tag`);
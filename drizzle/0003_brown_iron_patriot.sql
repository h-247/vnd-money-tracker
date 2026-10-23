CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`tags_seeded` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

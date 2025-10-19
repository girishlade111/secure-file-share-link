CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`password_hash` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_token_unique` ON `files` (`token`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `files` (`token`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `files` (`expires_at`);
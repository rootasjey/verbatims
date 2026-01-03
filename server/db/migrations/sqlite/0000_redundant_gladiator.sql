CREATE TABLE `author_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_id` integer NOT NULL,
	`user_id` integer,
	`ip_address` text,
	`user_agent` text,
	`viewed_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_author_views_author` ON `author_views` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_author_views_user` ON `author_views` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_author_views_date` ON `author_views` (`viewed_at`);--> statement-breakpoint
CREATE TABLE `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_fictional` integer DEFAULT false,
	`birth_date` text,
	`birth_location` text,
	`death_date` text,
	`death_location` text,
	`job` text,
	`description` text,
	`image_url` text,
	`socials` text DEFAULT '[]',
	`views_count` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`shares_count` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_authors_name` ON `authors` (`name`);--> statement-breakpoint
CREATE TABLE `backup_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_key` text NOT NULL,
	`export_log_id` integer,
	`import_log_id` integer,
	`filename` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`compressed_size` integer,
	`content_hash` text,
	`compression_type` text DEFAULT 'none',
	`storage_status` text DEFAULT 'uploading',
	`retention_days` integer DEFAULT 90,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`uploaded_at` integer,
	`expires_at` integer,
	`last_accessed_at` integer,
	`access_count` integer DEFAULT 0,
	`metadata` text,
	FOREIGN KEY (`export_log_id`) REFERENCES `export_logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`import_log_id`) REFERENCES `import_logs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `backup_files_file_key_unique` ON `backup_files` (`file_key`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_import_log` ON `backup_files` (`import_log_id`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_file_key` ON `backup_files` (`file_key`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_export_log` ON `backup_files` (`export_log_id`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_status` ON `backup_files` (`storage_status`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_created` ON `backup_files` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_expires` ON `backup_files` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_backup_files_path` ON `backup_files` (`file_path`);--> statement-breakpoint
CREATE TABLE `collection_quotes` (
	`collection_id` integer,
	`quote_id` integer,
	`added_at` integer DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`collection_id`, `quote_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `user_collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `export_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`export_id` text NOT NULL,
	`filename` text NOT NULL,
	`format` text NOT NULL,
	`data_type` text NOT NULL,
	`filters_applied` text,
	`record_count` integer,
	`file_size` integer,
	`user_id` integer,
	`include_relations` integer DEFAULT false,
	`include_metadata` integer DEFAULT false,
	`download_count` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`expires_at` integer DEFAULT (datetime('now', '+24 hours')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `export_logs_export_id_unique` ON `export_logs` (`export_id`);--> statement-breakpoint
CREATE INDEX `idx_export_logs_export_id` ON `export_logs` (`export_id`);--> statement-breakpoint
CREATE INDEX `idx_export_logs_user` ON `export_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_export_logs_data_type` ON `export_logs` (`data_type`);--> statement-breakpoint
CREATE INDEX `idx_export_logs_created` ON `export_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_export_logs_expires` ON `export_logs` (`expires_at`);--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`import_id` text NOT NULL,
	`filename` text,
	`format` text NOT NULL,
	`data_type` text NOT NULL,
	`record_count` integer,
	`successful_count` integer,
	`failed_count` integer,
	`warnings_count` integer,
	`user_id` integer,
	`options` text,
	`status` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_logs_import_id_unique` ON `import_logs` (`import_id`);--> statement-breakpoint
CREATE INDEX `idx_import_logs_import_id` ON `import_logs` (`import_id`);--> statement-breakpoint
CREATE INDEX `idx_import_logs_status` ON `import_logs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_import_logs_created` ON `import_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `quote_references` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`original_language` text DEFAULT 'en',
	`release_date` text,
	`description` text,
	`primary_type` text NOT NULL,
	`secondary_type` text,
	`image_url` text,
	`urls` text DEFAULT '[]',
	`views_count` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`shares_count` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_references_type` ON `quote_references` (`primary_type`);--> statement-breakpoint
CREATE TABLE `quote_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer NOT NULL,
	`reporter_id` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending',
	`reviewed_by` integer,
	`reviewed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_quote_reports_status` ON `quote_reports` (`status`);--> statement-breakpoint
CREATE TABLE `quote_tags` (
	`quote_id` integer,
	`tag_id` integer,
	PRIMARY KEY(`quote_id`, `tag_id`),
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quote_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer NOT NULL,
	`user_id` integer,
	`ip_address` text,
	`user_agent` text,
	`viewed_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_quote_views_quote` ON `quote_views` (`quote_id`);--> statement-breakpoint
CREATE INDEX `idx_quote_views_user` ON `quote_views` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_quote_views_date` ON `quote_views` (`viewed_at`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`language` text DEFAULT 'en',
	`author_id` integer,
	`reference_id` integer,
	`user_id` integer NOT NULL,
	`status` text DEFAULT 'draft',
	`moderator_id` integer,
	`moderated_at` integer,
	`rejection_reason` text,
	`views_count` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`shares_count` integer DEFAULT 0,
	`is_featured` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reference_id`) REFERENCES `quote_references`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_quotes_status` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_quotes_author` ON `quotes` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_reference` ON `quotes` (`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_user` ON `quotes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_created` ON `quotes` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_quotes_featured` ON `quotes` (`is_featured`);--> statement-breakpoint
CREATE INDEX `idx_quotes_language` ON `quotes` (`language`);--> statement-breakpoint
CREATE TABLE `reference_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference_id` integer NOT NULL,
	`user_id` integer,
	`ip_address` text,
	`user_agent` text,
	`viewed_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`reference_id`) REFERENCES `quote_references`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_reference_views_reference` ON `reference_views` (`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_reference_views_user` ON `reference_views` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_reference_views_date` ON `reference_views` (`viewed_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`color` text DEFAULT '#3B82F6',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`likeable_type` text NOT NULL,
	`likeable_id` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_like` ON `user_likes` (`user_id`,`likeable_type`,`likeable_id`);--> statement-breakpoint
CREATE INDEX `idx_user_likes_user` ON `user_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_likes_likeable` ON `user_likes` (`likeable_type`,`likeable_id`);--> statement-breakpoint
CREATE TABLE `user_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text,
	`email` text,
	`category` text NOT NULL,
	`tags` text DEFAULT '[]',
	`message` text NOT NULL,
	`target_type` text DEFAULT 'general',
	`target_id` integer,
	`ip_address` text,
	`user_agent` text,
	`status` text DEFAULT 'new',
	`reviewed_by` integer,
	`reviewed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_user_messages_created` ON `user_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_category` ON `user_messages` (`category`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_status` ON `user_messages` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_target` ON `user_messages` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_user` ON `user_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_ip` ON `user_messages` (`ip_address`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_session_token_unique` ON `user_sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_token` ON `user_sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_expires` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'user',
	`is_active` integer DEFAULT true,
	`email_verified` integer DEFAULT false,
	`biography` text,
	`job` text,
	`language` text DEFAULT 'en',
	`location` text DEFAULT 'On Earth',
	`socials` text DEFAULT '[]',
	`last_login_at` integer DEFAULT CURRENT_TIMESTAMP,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);
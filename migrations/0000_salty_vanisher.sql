CREATE TABLE `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`broker_id` text NOT NULL,
	`broker_name` text NOT NULL,
	`session_id` text,
	`entity_type` text,
	`entity_id` integer,
	`timestamp` integer NOT NULL,
	`metadata` text DEFAULT '{}',
	`duration_ms` integer
);
--> statement-breakpoint
CREATE TABLE `broker_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`broker_id` text NOT NULL,
	`broker_name` text NOT NULL,
	`metric_date` integer NOT NULL,
	`total_chats` integer DEFAULT 0 NOT NULL,
	`total_decisions` integer DEFAULT 0 NOT NULL,
	`avg_response_time` real DEFAULT 0 NOT NULL,
	`avg_confidence` real DEFAULT 0 NOT NULL,
	`successful_decisions` integer DEFAULT 0 NOT NULL,
	`escalated_cases` integer DEFAULT 0 NOT NULL,
	`documents_uploaded` integer DEFAULT 0 NOT NULL,
	`active_policies` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`broker_id` text,
	`broker_name` text NOT NULL,
	`sender` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer NOT NULL,
	`message_type` text DEFAULT 'text' NOT NULL,
	`metadata` text DEFAULT '{}',
	`policy_number` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`attachments` text DEFAULT '[]'
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_filename` text NOT NULL,
	`file_type` text NOT NULL,
	`uploaded_by` text,
	`broker_name` text NOT NULL,
	`upload_date` integer NOT NULL,
	`processed_date` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`extracted_rules` text DEFAULT '[]' NOT NULL,
	`content` text,
	`file_size` integer,
	`content_hash` text,
	`is_active` integer DEFAULT true NOT NULL,
	`file_path` text,
	`mime_type` text,
	`extracted_data` text DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_message_id` integer,
	`broker_id` text,
	`broker_name` text NOT NULL,
	`reason` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assigned_to` text,
	`assigned_to_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolution_notes` text
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_number` text NOT NULL,
	`client_name` text NOT NULL,
	`policy_type` text NOT NULL,
	`premium` real NOT NULL,
	`coverage_amount` real NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`claims_history` text DEFAULT '[]' NOT NULL,
	`risk_profile` text DEFAULT 'medium' NOT NULL,
	`renewal_date` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policies_policy_number_unique` ON `policies` (`policy_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `underwriting_decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` integer,
	`broker_id` text,
	`broker_name` text NOT NULL,
	`session_id` text,
	`request_type` text NOT NULL,
	`request_details` text NOT NULL,
	`decision` text NOT NULL,
	`decision_reason` text NOT NULL,
	`confidence` real NOT NULL,
	`processed_by` text NOT NULL,
	`timestamp` integer NOT NULL,
	`response_time_ms` integer NOT NULL,
	`rules_applied` text DEFAULT '[]'
);
--> statement-breakpoint
CREATE TABLE `underwriting_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule_type` text NOT NULL,
	`conditions` text NOT NULL,
	`action` text NOT NULL,
	`confidence` real NOT NULL,
	`source` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`source_document_id` integer
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`ai_personality` text DEFAULT 'professional' NOT NULL,
	`auto_save_chats` integer DEFAULT true NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`data_retention_days` integer DEFAULT 90 NOT NULL,
	`privacy_level` text DEFAULT 'standard' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`username` text,
	`password` text,
	`role` text DEFAULT 'broker' NOT NULL,
	`name` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
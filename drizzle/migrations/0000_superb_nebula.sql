CREATE TABLE `checklist_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`isCompleted` integer DEFAULT 0,
	`order` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`companyName` text NOT NULL,
	`industry` text,
	`position` text,
	`jobUrl` text,
	`deadline` integer,
	`notes` text,
	`status` text DEFAULT 'interested' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cover_letters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`company` text,
	`position` text,
	`content` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`category` text,
	`company` text,
	`position` text,
	`difficulty` text DEFAULT 'medium',
	`isPublic` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`isDefault` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`company` text,
	`type` text DEFAULT 'other' NOT NULL,
	`scheduledAt` integer NOT NULL,
	`description` text,
	`isCompleted` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text,
	`email` text,
	`password` text,
	`name` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`bio` text,
	`targetJob` text,
	`targetCompany` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
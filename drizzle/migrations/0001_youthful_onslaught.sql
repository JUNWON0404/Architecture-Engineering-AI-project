CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sector` text NOT NULL,
	`established` integer,
	`employees` text,
	`revenue` text,
	`location` text,
	`website` text,
	`description` text,
	`thumbnail` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_name_unique` ON `companies` (`name`);--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`companyId` integer NOT NULL,
	`title` text NOT NULL,
	`position` text NOT NULL,
	`description` text,
	`requiredMajors` text,
	`salary` text,
	`location` text,
	`postedAt` integer NOT NULL,
	`deadline` integer,
	`isActive` integer DEFAULT 1,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);

CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"isCompleted" integer DEFAULT 0,
	"order" integer DEFAULT 0,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"rank" integer,
	"brand" text,
	"hiringSeason" text,
	"salaryGuide" text,
	"established" integer,
	"employees" text,
	"revenue" text,
	"location" text,
	"website" text,
	"description" text,
	"thumbnail" text,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "company_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"companyName" text NOT NULL,
	"industry" text,
	"position" text,
	"jobUrl" text,
	"deadline" integer,
	"notes" text,
	"status" text DEFAULT 'interested' NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cover_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"position" text,
	"content" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"category" text,
	"company" text,
	"position" text,
	"difficulty" text DEFAULT 'medium',
	"isPublic" integer DEFAULT 0,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"title" text NOT NULL,
	"position" text NOT NULL,
	"description" text,
	"requiredMajors" text,
	"salary" text,
	"location" text,
	"postedAt" integer NOT NULL,
	"deadline" integer,
	"isActive" integer DEFAULT 1,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"isDefault" integer DEFAULT 0,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"type" text DEFAULT 'other' NOT NULL,
	"scheduledAt" integer NOT NULL,
	"description" text,
	"isCompleted" integer DEFAULT 0,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text,
	"email" text,
	"password" text,
	"name" text,
	"loginMethod" text,
	"role" text DEFAULT 'user' NOT NULL,
	"bio" text,
	"targetJob" text,
	"targetCompany" text,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"lastSignedIn" integer NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "freelancer_profiles" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_slug_unique" UNIQUE("slug");
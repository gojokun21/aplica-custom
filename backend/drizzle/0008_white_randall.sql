CREATE TABLE "seo_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(200) NOT NULL,
	"title" varchar(200),
	"description" varchar(500),
	"keywords" varchar(500),
	"og_image_url" varchar(500),
	"title_template" varchar(120),
	"noindex" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_path_unique" UNIQUE("path")
);

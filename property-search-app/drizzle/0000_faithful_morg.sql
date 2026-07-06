CREATE TABLE "data_source_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" varchar(120) NOT NULL,
	"official_access_method" text,
	"terms_url" text,
	"provenance_note" text NOT NULL,
	"allowed_use_summary" text NOT NULL,
	"blocked_use_summary" text NOT NULL,
	"live_integration_enabled" boolean DEFAULT false NOT NULL,
	"assessed_at" timestamp with time zone DEFAULT now() NOT NULL
);

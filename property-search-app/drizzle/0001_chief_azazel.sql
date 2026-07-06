CREATE TYPE "public"."confidence_label" AS ENUM('official', 'high', 'medium', 'low', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."ownership_role" AS ENUM('owner', 'co_owner', 'administrator', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."search_audit_status" AS ENUM('success', 'empty_result', 'blocked', 'rate_limited', 'invalid', 'error');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('mock', 'official', 'lawful_import');--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"source_type" "source_type" DEFAULT 'mock' NOT NULL,
	"official_access_method" text,
	"terms_url" text,
	"provenance_note" text NOT NULL,
	"allowed_use_summary" text NOT NULL,
	"blocked_use_summary" text NOT NULL,
	"retention_summary" text,
	"live_integration_enabled" boolean DEFAULT false NOT NULL,
	"assessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"ownership_role" "ownership_role" DEFAULT 'unknown' NOT NULL,
	"confidence_label" "confidence_label" DEFAULT 'unknown' NOT NULL,
	"confidence_score" numeric(5, 4),
	"provenance_note" text NOT NULL,
	"source_record_id" varchar(160),
	"source_url" text,
	"retrieved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"normalized_name" varchar(160) NOT NULL,
	"source_id" integer,
	"source_record_id" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"address_line_1" varchar(220) NOT NULL,
	"address_line_2" varchar(220),
	"normalized_address" varchar(260) NOT NULL,
	"postal_code" varchar(4) NOT NULL,
	"municipality" varchar(120) NOT NULL,
	"country_code" varchar(2) DEFAULT 'DK' NOT NULL,
	"cadastral_identifier" varchar(160),
	"property_identifier" varchar(160),
	"source_id" integer,
	"source_record_id" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_hash" varchar(128) NOT NULL,
	"normalized_query_length" integer NOT NULL,
	"requester_session_id" varchar(128),
	"requester_ip_hash" varchar(128),
	"user_agent_hash" varchar(128),
	"status" "search_audit_status" NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"blocked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ownership_links" ADD CONSTRAINT "ownership_links_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_links" ADD CONSTRAINT "ownership_links_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_links" ADD CONSTRAINT "ownership_links_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "data_sources_name_unique" ON "data_sources" USING btree ("name");
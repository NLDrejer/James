CREATE TYPE "public"."source_import_batch_status" AS ENUM('validated', 'imported', 'rejected', 'deleted');--> statement-breakpoint
CREATE TABLE "source_import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"source_key" varchar(80) NOT NULL,
	"approval_reference" text NOT NULL,
	"legal_basis" text NOT NULL,
	"imported_by" varchar(160) NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	"source_terms_version" text NOT NULL,
	"raw_input_hash" varchar(128) NOT NULL,
	"status" "source_import_batch_status" DEFAULT 'validated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_import_batches_record_count_non_negative" CHECK ("source_import_batches"."record_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ownership_links" DROP CONSTRAINT "ownership_links_confidence_score_range";--> statement-breakpoint
ALTER TABLE "source_import_batches" ADD CONSTRAINT "source_import_batches_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_import_batches_source_id_idx" ON "source_import_batches" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_import_batches_source_key_idx" ON "source_import_batches" USING btree ("source_key");--> statement-breakpoint
CREATE UNIQUE INDEX "source_import_batches_raw_input_hash_unique" ON "source_import_batches" USING btree ("raw_input_hash");--> statement-breakpoint
ALTER TABLE "ownership_links" ADD CONSTRAINT "ownership_links_confidence_score_range" CHECK ("ownership_links"."confidence_score" IS NULL OR ("ownership_links"."confidence_score" >= 0 AND "ownership_links"."confidence_score" <= 1));
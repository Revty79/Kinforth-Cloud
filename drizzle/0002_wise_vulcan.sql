CREATE TABLE "family_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"relation" text,
	"phone" text NOT NULL,
	"secondary_phone" text,
	"email" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_file" (
	"id" text PRIMARY KEY NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"original_name" text NOT NULL,
	"stored_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_file_stored_name_unique" UNIQUE("stored_name")
);
--> statement-breakpoint
ALTER TABLE "family_contact" ADD CONSTRAINT "family_contact_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_file" ADD CONSTRAINT "family_file_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_contact_created_by_user_id_idx" ON "family_contact" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "family_contact_full_name_idx" ON "family_contact" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "family_file_uploaded_by_user_id_idx" ON "family_file" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "family_file_category_idx" ON "family_file" USING btree ("category");--> statement-breakpoint
CREATE INDEX "family_file_created_at_idx" ON "family_file" USING btree ("created_at");
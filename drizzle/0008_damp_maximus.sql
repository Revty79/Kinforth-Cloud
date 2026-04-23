CREATE TABLE "family_user_access_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'family_member' NOT NULL,
	"private_storage_limit_bytes" bigint DEFAULT 5368709120 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_user_access_profile" ADD CONSTRAINT "family_user_access_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_user_access_profile_role_idx" ON "family_user_access_profile" USING btree ("role");
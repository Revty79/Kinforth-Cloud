CREATE TABLE "family_shopping_item" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_by_name" text NOT NULL,
	"label" text NOT NULL,
	"bucket" text NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"checked_by_user_id" text,
	"checked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_shopping_item" ADD CONSTRAINT "family_shopping_item_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_shopping_item" ADD CONSTRAINT "family_shopping_item_checked_by_user_id_user_id_fk" FOREIGN KEY ("checked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_shopping_item_created_by_user_id_idx" ON "family_shopping_item" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "family_shopping_item_checked_by_user_id_idx" ON "family_shopping_item" USING btree ("checked_by_user_id");--> statement-breakpoint
CREATE INDEX "family_shopping_item_bucket_idx" ON "family_shopping_item" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "family_shopping_item_is_checked_idx" ON "family_shopping_item" USING btree ("is_checked");--> statement-breakpoint
CREATE INDEX "family_shopping_item_created_at_idx" ON "family_shopping_item" USING btree ("created_at");
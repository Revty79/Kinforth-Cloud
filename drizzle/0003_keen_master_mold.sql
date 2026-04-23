CREATE TABLE "chore_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"assigned_by_user_id" text NOT NULL,
	"date" text NOT NULL,
	"chore_title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_item" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chore_assignment" ADD CONSTRAINT "chore_assignment_assigned_by_user_id_user_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_item" ADD CONSTRAINT "chore_item_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chore_assignment_date_unique_idx" ON "chore_assignment" USING btree ("date");--> statement-breakpoint
CREATE INDEX "chore_assignment_assigned_by_user_id_idx" ON "chore_assignment" USING btree ("assigned_by_user_id");--> statement-breakpoint
CREATE INDEX "chore_assignment_date_idx" ON "chore_assignment" USING btree ("date");--> statement-breakpoint
CREATE INDEX "chore_item_created_by_user_id_idx" ON "chore_item" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "chore_item_title_idx" ON "chore_item" USING btree ("title");
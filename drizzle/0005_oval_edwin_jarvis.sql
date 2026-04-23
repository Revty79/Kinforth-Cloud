CREATE TABLE "family_billboard_post" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_by_name" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"sent_by_user_id" text NOT NULL,
	"sent_by_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_billboard_post" ADD CONSTRAINT "family_billboard_post_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_chat_message" ADD CONSTRAINT "family_chat_message_sent_by_user_id_user_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_billboard_post_created_by_user_id_idx" ON "family_billboard_post" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "family_billboard_post_created_at_idx" ON "family_billboard_post" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "family_chat_message_sent_by_user_id_idx" ON "family_chat_message" USING btree ("sent_by_user_id");--> statement-breakpoint
CREATE INDEX "family_chat_message_created_at_idx" ON "family_chat_message" USING btree ("created_at");
CREATE TABLE "private_cloud_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"sent_by_user_id" text NOT NULL,
	"sent_by_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_cloud_file" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"title" text NOT NULL,
	"original_name" text NOT NULL,
	"stored_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "private_cloud_file_stored_name_unique" UNIQUE("stored_name")
);
--> statement-breakpoint
ALTER TABLE "private_cloud_chat_message" ADD CONSTRAINT "private_cloud_chat_message_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_cloud_chat_message" ADD CONSTRAINT "private_cloud_chat_message_sent_by_user_id_user_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_cloud_file" ADD CONSTRAINT "private_cloud_file_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_cloud_chat_message_owner_user_id_idx" ON "private_cloud_chat_message" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "private_cloud_chat_message_sent_by_user_id_idx" ON "private_cloud_chat_message" USING btree ("sent_by_user_id");--> statement-breakpoint
CREATE INDEX "private_cloud_chat_message_created_at_idx" ON "private_cloud_chat_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "private_cloud_file_owner_user_id_idx" ON "private_cloud_file" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "private_cloud_file_category_idx" ON "private_cloud_file" USING btree ("category");--> statement-breakpoint
CREATE INDEX "private_cloud_file_created_at_idx" ON "private_cloud_file" USING btree ("created_at");
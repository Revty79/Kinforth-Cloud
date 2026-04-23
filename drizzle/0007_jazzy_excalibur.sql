ALTER TABLE "private_cloud_chat_message" ADD COLUMN "recipient_user_id" text;--> statement-breakpoint
UPDATE "private_cloud_chat_message"
SET "recipient_user_id" = "owner_user_id"
WHERE "recipient_user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "private_cloud_chat_message" ALTER COLUMN "recipient_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "private_cloud_chat_message" ADD CONSTRAINT "private_cloud_chat_message_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_cloud_chat_message_recipient_user_id_idx" ON "private_cloud_chat_message" USING btree ("recipient_user_id");

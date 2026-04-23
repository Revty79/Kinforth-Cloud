ALTER TABLE "calendar_event" ADD COLUMN "scope" text DEFAULT 'family' NOT NULL;--> statement-breakpoint
CREATE INDEX "calendar_event_scope_idx" ON "calendar_event" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "calendar_event_scope_date_idx" ON "calendar_event" USING btree ("scope","date");--> statement-breakpoint
CREATE INDEX "calendar_event_scope_user_date_idx" ON "calendar_event" USING btree ("scope","user_id","date");
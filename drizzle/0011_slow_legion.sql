DROP INDEX "chore_assignment_date_unique_idx";--> statement-breakpoint
ALTER TABLE "chore_assignment" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "chore_assignment_date_assigned_by_unique_idx" ON "chore_assignment" USING btree ("date","assigned_by_user_id");--> statement-breakpoint
CREATE INDEX "chore_assignment_completed_at_idx" ON "chore_assignment" USING btree ("completed_at");
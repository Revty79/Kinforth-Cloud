import { and, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { choreAssignment } from "@/db/schema";
import {
  getCompletedChoreExpiryCutoff,
  type ChoreAssignment,
} from "./chore-calendar";

type ChoreAssignmentRowWithUser = {
  id: string;
  date: string;
  choreTitle: string;
  assignedByUserId: string;
  assignedUserName: string;
  completedAt: Date | null;
  createdAt: Date;
};

export function toChoreAssignment(
  row: ChoreAssignmentRowWithUser,
): ChoreAssignment {
  return {
    id: row.id,
    date: row.date,
    choreTitle: row.choreTitle,
    assignedUserId: row.assignedByUserId,
    assignedUserName: row.assignedUserName,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function cleanupExpiredCompletedChoreAssignments(now = new Date()) {
  const cutoff = getCompletedChoreExpiryCutoff(now);
  await db
    .delete(choreAssignment)
    .where(
      and(
        isNotNull(choreAssignment.completedAt),
        lte(choreAssignment.completedAt, cutoff),
      ),
    );
}

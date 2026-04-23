import { isCalendarDateKey } from "./calendar";

export const COMPLETED_CHORE_RETENTION_HOURS = 6;
export const COMPLETED_CHORE_RETENTION_MS = COMPLETED_CHORE_RETENTION_HOURS * 60 * 60 * 1000;

export type ChoreItem = {
  id: string;
  title: string;
  createdAt: string;
};

export type ChoreAssignment = {
  id: string;
  date: string;
  choreTitle: string;
  assignedUserId: string;
  assignedUserName: string;
  completedAt: string | null;
  createdAt: string;
};

export function isValidChoreTitle(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 80;
}

export function normalizeChoreTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseDateKey(dateKey: string) {
  if (!isCalendarDateKey(dateKey)) {
    return null;
  }

  const [yearString, monthString, dayString] = dateKey.split("-");
  return new Date(
    Number(yearString),
    Number(monthString) - 1,
    Number(dayString),
  );
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCompletedChoreExpiryCutoff(now = new Date()) {
  return new Date(now.getTime() - COMPLETED_CHORE_RETENTION_MS);
}

export function isCompletedChoreExpired(
  completedAt: string | null,
  now = Date.now(),
) {
  if (!completedAt) {
    return false;
  }

  const completedTimestamp = Date.parse(completedAt);
  if (Number.isNaN(completedTimestamp)) {
    return false;
  }

  return completedTimestamp <= now - COMPLETED_CHORE_RETENTION_MS;
}

export function buildCalendarCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = Array.from(
    { length: firstWeekday },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

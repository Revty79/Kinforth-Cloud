export const calendarEventScopes = ["family", "personal"] as const;

export type CalendarEventScope = (typeof calendarEventScopes)[number];

export const customCalendarEventTypes = [
  "Family",
  "School",
  "Home",
  "Health",
] as const;

export type CustomCalendarEventType = (typeof customCalendarEventTypes)[number];

export type CalendarCustomEvent = {
  id: string;
  date: string;
  title: string;
  type: CustomCalendarEventType;
  time?: string;
};

export function isCalendarDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isCalendarTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isCustomCalendarEventType(
  value: string,
): value is CustomCalendarEventType {
  return customCalendarEventTypes.includes(value as CustomCalendarEventType);
}

export function isCalendarEventScope(value: string): value is CalendarEventScope {
  return calendarEventScopes.includes(value as CalendarEventScope);
}

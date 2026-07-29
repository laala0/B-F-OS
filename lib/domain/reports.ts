// Date-only string helpers (YYYY-MM-DD) for the Daily/Weekly reports.
//
// Everything here is deliberately UTC-anchored internally (parseDate /
// toDateStr) so day-math never drifts with the server's local timezone —
// but "what day is it right now" has to go through the *company's*
// timezone (todayInTimezone), not the server's or UTC's. Vancouver is
// hours behind UTC, so a naive `new Date().toISOString().slice(0, 10)`
// would flip over to "tomorrow" while it's still mid-afternoon locally.

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

function dateFormatterFor(timezone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function todayInTimezone(timezone: string): string {
  return dateFormatterFor(timezone).format(new Date());
}

// Which calendar day (in the company's timezone) a UTC instant like
// tasks.completed_at falls on — same reasoning as todayInTimezone.
export function dateInTimezone(iso: string, timezone: string): string {
  return dateFormatterFor(timezone).format(new Date(iso));
}

// Monday-start week containing dateStr.
export function weekRange(dateStr: string): { start: string; end: string } {
  const dow = parseDate(dateStr).getUTCDay(); // 0 = Sun … 6 = Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = addDays(dateStr, diffToMonday);
  const end = addDays(start, 6);
  return { start, end };
}

export function formatDateLabel(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateRangeLabel(start: string, end: string): string {
  return `${formatDateLabel(start)} – ${formatDateLabel(end)}`;
}

export function isInRange(
  dateStr: string | null,
  start: string,
  end: string
): boolean {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

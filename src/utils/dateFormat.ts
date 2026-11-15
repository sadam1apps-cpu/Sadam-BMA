/**
 * Formats a date string or Date object strictly as 'YYYY-MM-DD' (e.g. '2026-11-24'),
 * stripping any ISO time/timezone suffix such as 'T22:00:00.000Z'.
 */
export function formatDateOnly(value?: string | Date | null, fallback = ''): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return fallback;
    return value.toISOString().slice(0, 10);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // Match leading YYYY-MM-DD (e.g. '2026-11-24' or '2026-11-24T22:00:00.000Z')
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Handle Google Visualization API format: Date(2026,10,24) (0-indexed month)
  const gvizMatch = trimmed.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
  if (gvizMatch) {
    const year = gvizMatch[1];
    const month = String(Number(gvizMatch[2]) + 1).padStart(2, '0');
    const day = String(Number(gvizMatch[3])).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed;
}

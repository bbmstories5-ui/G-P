import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';

export interface TimelineBucket {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Creates standardized, mathematically contiguous timeline buckets
 * so no timestamps are lost or miscategorized.
 */
export function buildTimelineBuckets(range: string, now: Date = new Date()): TimelineBucket[] {
  const buckets: TimelineBucket[] = [];

  if (range === '7d') {
    // 7 discrete daily buckets (6 days ago to today)
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const start = startOfDay(day);
      const end = i === 0 ? now : endOfDay(day);
      buckets.push({
        key: format(day, 'yyyy-MM-dd'),
        label: format(day, 'MMM dd'),
        startDate: start,
        endDate: end,
      });
    }
  } else if (range === '30d') {
    // 10 contiguous 3-day intervals covering the entire 30-day window up to today
    // Bucket 9 (latest) covers the last 3 days ending at `now`
    for (let b = 9; b >= 0; b--) {
      const daysAgoStart = b * 3 + 2;
      const daysAgoEnd = b * 3;
      const start = startOfDay(subDays(now, daysAgoStart));
      const end = daysAgoEnd === 0 ? now : endOfDay(subDays(now, daysAgoEnd));
      const labelDate = subDays(now, daysAgoEnd);
      buckets.push({
        key: `30d-bucket-${9 - b}`,
        label: format(labelDate, 'MMM dd'),
        startDate: start,
        endDate: end,
      });
    }
  } else {
    // Monthly buckets for 3m, 6m, 12m
    const monthCount = range === '3m' ? 3 : range === '6m' ? 6 : 12;
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = i === 0 ? now : endOfMonth(monthDate);
      buckets.push({
        key: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMM'),
        startDate: start,
        endDate: end,
      });
    }
  }

  return buckets;
}

/**
 * Finds the bucket an event timestamp belongs to.
 */
export function findMatchingBucketIndex(date: Date, buckets: TimelineBucket[]): number {
  if (!buckets.length) return -1;

  // Check if date falls directly inside a bucket
  for (let i = 0; i < buckets.length; i++) {
    if (date >= buckets[i].startDate && date <= buckets[i].endDate) {
      return i;
    }
  }

  // If slightly after the latest bucket (due to clock skew), place in latest bucket
  if (date > buckets[buckets.length - 1].endDate) {
    return buckets.length - 1;
  }

  // If before earliest bucket, it is out of range
  return -1;
}

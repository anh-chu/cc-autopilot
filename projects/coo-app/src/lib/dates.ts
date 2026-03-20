import {
  format,
  formatDistanceToNow,
  differenceInMinutes,
  differenceInWeeks,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  isYesterday,
  subDays,
} from "date-fns";

export {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  isYesterday,
  subDays,
  differenceInMinutes,
};

export function formatTime(date: Date | number, use24h: boolean): string {
  return format(new Date(date), use24h ? "HH:mm" : "h:mm a");
}

export function formatDate(date: Date | number): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d");
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }
  return `${secs}s`;
}

export function formatTimerDisplay(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function timeAgo(date: Date | number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function babyAgeWeeks(birthDate: string): number {
  return differenceInWeeks(new Date(), new Date(birthDate));
}

export function babyAgeDisplay(birthDate: string): string {
  const weeks = babyAgeWeeks(birthDate);
  if (weeks < 1) return "Newborn";
  if (weeks < 8) return `${weeks} weeks`;
  const months = Math.floor(weeks / 4.33);
  if (months < 24) return `${months} months`;
  const years = Math.floor(months / 12);
  return `${years} years`;
}

export function groupByDay<T extends { startedAt: number }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = format(new Date(item.startedAt), "yyyy-MM-dd");
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

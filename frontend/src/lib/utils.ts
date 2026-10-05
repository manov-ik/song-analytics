export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(sec: number): string {
  return formatTime(sec);
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

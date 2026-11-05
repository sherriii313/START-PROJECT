const DAY = 864e5;
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const sum = (arr, f = (x) => x.amount) => arr.reduce((n, x) => n + f(x), 0);
export const round = (n) => Math.round(n * 100) / 100;
export const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10 : cur ? 100 : 0);

export function periodRange(period, now = new Date()) {
  let start, prevStart;
  if (period === "today") { start = startOfDay(now); prevStart = new Date(start - DAY); }
  else if (period === "week") { start = startOfDay(new Date(now - 6 * DAY)); prevStart = new Date(start - 7 * DAY); }
  else if (period === "month") { start = new Date(now.getFullYear(), now.getMonth(), 1); prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); }
  else { start = new Date(now.getFullYear(), 0, 1); prevStart = new Date(now.getFullYear() - 1, 0, 1); }
  return { start, end: now, prevStart, prevEnd: start };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export { MONTHS };

// Labels + a function that maps a Date to its bucket index for a period.
export function buckets(period, now = new Date()) {
  if (period === "today") return { labels: Array.from({ length: 24 }, (_, h) => `${h}:00`), index: (d) => d.getHours() };
  if (period === "week") {
    const { start } = periodRange("week", now);
    const labels = Array.from({ length: 7 }, (_, i) => new Date(+start + i * DAY).toLocaleDateString("en-US", { weekday: "short" }));
    return { labels, index: (d) => Math.floor((startOfDay(d) - start) / DAY) };
  }
  if (period === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { labels: Array.from({ length: days }, (_, i) => String(i + 1)), index: (d) => d.getDate() - 1 };
  }
  return { labels: MONTHS, index: (d) => d.getMonth() };
}

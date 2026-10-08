/** Timezone-aware day/month boundaries without external libraries. */
export const APP_TIMEZONE = () => process.env.APP_TIMEZONE || "Asia/Kolkata";

function partsInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, Number(p.value)]));
}

/** Offset (local - UTC) in ms for the given instant. */
function offsetMs(date, timeZone) {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The UTC instant at which local midnight of y-m-d occurs in `timeZone`. */
function zonedMidnight(year, monthIndex, day, timeZone) {
  const guess = Date.UTC(year, monthIndex, day);
  const first = offsetMs(new Date(guess), timeZone);
  let result = guess - first;
  const second = offsetMs(new Date(result), timeZone);
  if (second !== first) result = guess - second; // DST edge
  return new Date(result);
}

export function startOfToday(now = new Date(), timeZone = APP_TIMEZONE()) {
  const p = partsInZone(now, timeZone);
  return zonedMidnight(p.year, p.month - 1, p.day, timeZone);
}

export function startOfMonth(now = new Date(), timeZone = APP_TIMEZONE()) {
  const p = partsInZone(now, timeZone);
  return zonedMidnight(p.year, p.month - 1, 1, timeZone);
}

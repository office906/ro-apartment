// Reads your Google Calendar (secret iCal address) and returns only busy date ranges.
// Event titles and details are never sent to the browser.
// Set ICAL_URL in Netlify: Site configuration > Environment variables.

const pad = n => String(n).padStart(2, "0");
const toISO = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function parseValue(v) {
  // 20270201 or 20270201T100000Z / 20270201T100000
  const y = +v.slice(0, 4), m = +v.slice(4, 6) - 1, d = +v.slice(6, 8);
  return { date: new Date(Date.UTC(y, m, d)), allDay: !v.includes("T") };
}

export default async () => {
  const url = process.env.ICAL_URL;
  if (!url) return Response.json({ error: "ICAL_URL not set" }, { status: 503 });

  let text;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`calendar ${r.status}`);
    text = await r.text();
  } catch (e) {
    return Response.json({ error: "calendar unreachable" }, { status: 502 });
  }

  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const busy = [];
  let ev = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") ev = {};
    else if (line === "END:VEVENT") {
      if (ev && ev.start && !ev.free && !ev.cancelled) {
        const end = ev.end || { date: ev.start.date, allDay: ev.start.allDay };
        // all-day DTEND is exclusive already; timed events block their whole last day
        let endDate = new Date(end.date);
        if (!end.allDay || !ev.end) endDate.setUTCDate(endDate.getUTCDate() + 1);
        busy.push({ start: toISO(ev.start.date), end: toISO(endDate) });
      }
      ev = null;
    } else if (ev) {
      const m = line.match(/^(DTSTART|DTEND)[^:]*:(\d{8}(T\d{6}Z?)?)/);
      if (m) ev[m[1] === "DTSTART" ? "start" : "end"] = parseValue(m[2]);
      if (line.startsWith("TRANSP:TRANSPARENT")) ev.free = true;
      if (line.startsWith("STATUS:CANCELLED")) ev.cancelled = true;
    }
  }

  const today = toISO(new Date());
  const horizon = new Date(); horizon.setUTCMonth(horizon.getUTCMonth() + 18);
  const result = busy
    .filter(b => b.end > today && b.start < toISO(horizon))
    .sort((a, b) => a.start.localeCompare(b.start));

  return Response.json(
    { busy: result, updated: new Date().toISOString() },
    { headers: { "cache-control": "public, max-age=600" } }
  );
};

export const config = { path: "/api/availability" };

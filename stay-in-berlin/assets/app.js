// Availability calendar + booking-request date checks
(() => {
  const MIN_DAYS = 60;   // ~2 months
  const MAX_DAYS = 184;  // ~6 months
  const MONTHS_SHOWN = 12;

  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let busy = [];       // [{start: Date, end: Date (exclusive)}]
  let live = false;

  const isBusy = d => busy.some(r => d >= r.start && d < r.end);
  const rangeFree = (a, b) => busy.every(r => b <= r.start || a >= r.end);

  function nextFree() {
    for (let i = 1; i < 540; i++) {
      const s = addDays(today, i);
      if (rangeFree(s, addDays(s, MIN_DAYS))) return s;
    }
    return null;
  }

  function render() {
    const cal = document.getElementById("calendar");
    if (!cal) return;
    cal.innerHTML = "";
    const dows = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    for (let m = 0; m < MONTHS_SHOWN; m++) {
      const first = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const box = document.createElement("div");
      box.className = "month";
      const h = document.createElement("h3");
      h.textContent = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const grid = document.createElement("div");
      grid.className = "days";
      dows.forEach(d => { const s = document.createElement("span"); s.className = "dow"; s.textContent = d; grid.append(s); });
      const offset = (first.getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) { const s = document.createElement("span"); s.className = "blank"; grid.append(s); }
      const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysIn; d++) {
        const date = new Date(first.getFullYear(), first.getMonth(), d);
        const s = document.createElement("span");
        s.textContent = d;
        if (date < today) s.className = "past";
        else if (isBusy(date)) { s.className = "busy"; s.title = "Taken"; }
        grid.append(s);
      }
      box.append(h, grid);
      cal.append(box);
    }

    const nf = document.getElementById("next-free");
    const note = document.getElementById("cal-note");
    if (live) {
      const n = nextFree();
      nf.textContent = n ? `Free from ${fmt(n)}` : "Fully booked for now. Send a request to join the waiting list.";
      note.textContent = "Updated live from the owner's calendar. Days shown as free can still be requested by someone else, so send your request early.";
    } else {
      nf.textContent = "Send your dates to check availability.";
      note.textContent = "The live calendar could not be loaded. Send a request and you'll get an answer within 24 hours.";
    }
  }

  async function load() {
    try {
      const r = await fetch("/api/availability", { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      busy = (data.busy || []).map(b => ({ start: parse(b.start), end: parse(b.end) }));
      live = true;
    } catch (e) { live = false; }
    render();
  }

  // Form date checks
  const inEl = document.getElementById("move-in");
  const outEl = document.getElementById("move-out");
  const msg = document.getElementById("date-msg");
  function checkDates() {
    if (!inEl || !outEl) return;
    inEl.min = iso(addDays(today, 1));
    if (inEl.value) {
      const a = parse(inEl.value);
      outEl.min = iso(addDays(a, MIN_DAYS));
      outEl.max = iso(addDays(a, MAX_DAYS));
    }
    msg.className = "date-msg";
    outEl.setCustomValidity("");
    if (!inEl.value || !outEl.value) { msg.textContent = ""; return; }
    const a = parse(inEl.value), b = parse(outEl.value);
    const days = Math.round((b - a) / 864e5);
    let problem = "";
    if (days < MIN_DAYS) problem = "The minimum stay is 2 months.";
    else if (days > MAX_DAYS) problem = "The maximum stay is 6 months.";
    if (problem) { msg.textContent = problem; outEl.setCustomValidity(problem); return; }
    if (live && !rangeFree(a, b)) {
      msg.textContent = "Part of these dates is already taken. You can still send the request; I'll suggest the closest option.";
    } else {
      msg.textContent = `${Math.round(days / 30.4)} months. ${live ? "These dates look free." : ""}`.trim();
      msg.classList.add("ok");
    }
  }
  inEl && inEl.addEventListener("change", checkDates);
  outEl && outEl.addEventListener("change", checkDates);

  // Sketch / photo slider
  const rv = document.querySelector(".reveal");
  const rr = rv && rv.querySelector(".r-range");
  rr && rr.addEventListener("input", () => rv.style.setProperty("--pos", rr.value + "%"));

  // Photo viewer
  const lb = document.querySelector(".lightbox");
  const shots = [...document.querySelectorAll(".gallery .ph")];
  let cur = 0;
  function show(i) {
    cur = (i + shots.length) % shots.length;
    const img = shots[cur].querySelector("img");
    lb.querySelector("img").src = img.currentSrc || img.src;
    lb.querySelector("img").alt = img.alt;
    lb.querySelector("figcaption").textContent = shots[cur].querySelector("figcaption").textContent;
  }
  if (lb && lb.showModal) {
    shots.forEach((f, i) => f.querySelector(".ph-open").addEventListener("click", () => { show(i); lb.showModal(); }));
    lb.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
    lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
    lb.addEventListener("click", e => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
    lb.addEventListener("keydown", e => { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  }

  load().then(checkDates);
})();

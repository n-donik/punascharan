// Spaced-repetition scheduler (SM-2 flavored, four Anki-style ratings).
// State per card: { ease, interval (days), reps, lapses, due (ms epoch), last (ms epoch) }
(() => {
  const PC = (window.PC ||= {});
  const DAY = 86400000, MIN = 60000;

  const RATINGS = [
    { id: "again",  label: "Again",     key: "1" },
    { id: "hard",   label: "Hard",      key: "2" },
    { id: "medium", label: "Medium",    key: "3" },
    { id: "easy",   label: "Very Easy", key: "4" },
  ];

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const fresh = () => ({ ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, last: 0 });

  function apply(state, rating, now = Date.now()) {
    const s = { ...(state || fresh()) };
    const iv = s.interval;
    let next;
    switch (rating) {
      case "again":
        s.lapses += 1; s.reps = 0; s.interval = 0;
        s.ease = clamp(s.ease - 0.2, 1.3, 3);
        s.due = now + MIN; s.last = now;
        return s;
      case "hard":
        next = iv === 0 ? 0.25 : Math.max(1, iv * 1.2);
        s.ease = clamp(s.ease - 0.15, 1.3, 3);
        break;
      case "medium":
        next = s.reps === 0 ? 1 : s.reps === 1 ? 3 : iv * s.ease;
        break;
      case "easy":
        next = s.reps === 0 ? 4 : s.reps === 1 ? 7 : iv * s.ease * 1.3;
        s.ease = clamp(s.ease + 0.15, 1.3, 3);
        break;
      default:
        throw new Error(`Unknown rating: ${rating}`);
    }
    s.reps += 1; s.interval = next; s.due = now + next * DAY; s.last = now;
    return s;
  }

  // Human-friendly duration for the button previews, e.g. "10m", "3d", "2.5mo".
  function fmt(ms) {
    const trim = (n) => String(Math.round(n * 10) / 10);
    const m = ms / MIN;
    if (m < 1.5) return "1m";
    if (m < 60) return `${Math.round(m)}m`;
    const h = m / 60;
    if (h < 24) return `${Math.round(h)}h`;
    const d = h / 24;
    if (d < 30) return `${trim(d)}d`;
    if (d < 365) return `${trim(d / 30)}mo`;
    return `${trim(d / 365)}y`;
  }

  PC.srs = { RATINGS, fresh, apply, fmt };
})();

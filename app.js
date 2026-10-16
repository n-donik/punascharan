(() => {
  const SPATIAL_PER_CYCLE = 4;      // spatial slides before each retrieval slide
  const SPATIAL_MS = 7000;          // dwell time on a spatial slide
  const QUESTION_MS = 6000;         // time to think before the answer is revealed
  const ANSWER_MS = 12000;          // time the answer stays up
  const TICK_MS = 100;

  const $ = (id) => document.getElementById(id);
  const carousel = $("carousel"), stage = $("stage"), bar = $("progress-bar");
  const dotsEl = $("dots"), toggleBtn = $("toggle");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  // ---- theme
  const root = document.documentElement;
  const savedTheme = store.get("theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  $("theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  });

  // ---- topic filters
  const enabled = new Set(Object.keys(TOPICS));
  const filters = $("topic-filters");
  for (const [id, t] of Object.entries(TOPICS)) {
    const label = document.createElement("label");
    const input = Object.assign(document.createElement("input"), { type: "checkbox", checked: true });
    const span = document.createElement("span");
    span.textContent = t.label;
    input.addEventListener("change", () => {
      if (input.checked) enabled.add(id); else enabled.delete(id);
      if (!enabled.size) { enabled.add(id); input.checked = true; return; } // keep at least one
      rebuild();
    });
    label.append(input, span);
    filters.append(label);
  }

  // ---- deck: N spatial slides, then 1 retrieval slide, repeating
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Round-robin across topics so consecutive slides rarely share a topic.
  function interleave(items) {
    const byTopic = {};
    for (const it of shuffle(items)) (byTopic[it.topic] ||= []).push(it);
    const lists = shuffle(Object.values(byTopic));
    const out = [];
    while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift());
    return out;
  }

  function buildDeck() {
    const spatial = interleave(SPATIAL.filter((s) => enabled.has(s.topic)).map((s) => ({ ...s, kind: "spatial" })));
    const retrieval = interleave(RETRIEVAL.filter((r) => enabled.has(r.topic)).map((r) => ({ ...r, kind: "retrieval" })));
    const deck = [];
    let r = 0;
    for (let i = 0; i < spatial.length; i += SPATIAL_PER_CYCLE) {
      deck.push(...spatial.slice(i, i + SPATIAL_PER_CYCLE));
      if (retrieval.length) deck.push(retrieval[r++ % retrieval.length]);
    }
    if (!deck.some((s) => s.kind === "retrieval") && retrieval.length) deck.push(retrieval[0]);
    return deck;
  }

  let deck = [], index = 0, elapsed = 0, revealed = false;
  let userPaused = false, hoverPaused = false, hiddenPaused = false;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const duration = (s) => (s.kind === "retrieval" ? QUESTION_MS + ANSWER_MS : SPATIAL_MS);

  function renderDots() {
    dotsEl.replaceChildren(...deck.map((s, i) => el("span", `dot ${s.kind === "retrieval" ? "retrieval" : ""} ${i === index ? "active" : ""}`)));
  }

  function showAnswer(slide, holder) {
    const ans = el("div", "answer");
    ans.append(el("div", "answer-label", "Answer"));
    if (slide.code) ans.append(el("pre", "code", slide.code));
    ans.append(el("p", "", slide.a));
    holder.replaceChildren(ans);
  }

  function render(direction = "forward") {
    const slide = deck[index];
    revealed = false;
    elapsed = 0;
    carousel.dataset.kind = slide.kind;
    $("slide-kind").textContent = slide.kind === "retrieval" ? "Active recall" : "Spatial repetition";
    $("slide-topic").textContent = TOPICS[slide.topic].label;
    $("slide-count").textContent = `${index + 1} / ${deck.length}`;

    const node = el("article", `slide ${direction === "back" ? "back" : ""}`);
    if (slide.kind === "spatial") {
      node.append(el("h2", "term", slide.term), el("p", "def", slide.def));
      if (slide.note) node.append(el("p", "note", slide.note));
    } else {
      const holder = el("div", "answer-wrap");
      const thinking = el("div", "thinking");
      thinking.append(el("span", "", "Think it through…"));
      const btn = el("button", "", "Reveal now");
      btn.type = "button";
      btn.addEventListener("click", reveal);
      thinking.append(btn);
      holder.append(thinking);
      node.append(el("h2", "question", slide.q), holder);
    }
    stage.replaceChildren(node);
    renderDots();
    updateBar();
  }

  function reveal() {
    const slide = deck[index];
    if (slide.kind !== "retrieval" || revealed) return;
    revealed = true;
    elapsed = Math.max(elapsed, QUESTION_MS);
    showAnswer(slide, stage.querySelector(".answer-wrap"));
  }

  function updateBar() {
    bar.style.width = `${Math.min(100, (elapsed / duration(deck[index])) * 100)}%`;
  }

  function go(delta) {
    const next = index + delta;
    if (next >= deck.length) { deck = buildDeck(); index = 0; }
    else if (next < 0) index = deck.length - 1;
    else index = next;
    render(delta < 0 ? "back" : "forward");
  }

  function rebuild() { deck = buildDeck(); index = 0; render(); }

  // ---- timing
  const paused = () => userPaused || hoverPaused || hiddenPaused;
  setInterval(() => {
    if (paused() || !deck.length) return;
    elapsed += TICK_MS;
    const slide = deck[index];
    if (slide.kind === "retrieval" && !revealed && elapsed >= QUESTION_MS) reveal();
    updateBar();
    if (elapsed >= duration(slide)) go(1);
  }, TICK_MS);

  function syncPauseUI() {
    const p = userPaused;
    toggleBtn.textContent = p ? "Play" : "Pause";
    toggleBtn.setAttribute("aria-label", p ? "Play" : "Pause");
    // Only announce slide changes politely when the user is in control.
    stage.setAttribute("aria-live", p ? "polite" : "off");
  }

  $("next").addEventListener("click", () => go(1));
  $("prev").addEventListener("click", () => go(-1));
  toggleBtn.addEventListener("click", () => { userPaused = !userPaused; syncPauseUI(); });
  carousel.addEventListener("mouseenter", () => (hoverPaused = true));
  carousel.addEventListener("mouseleave", () => (hoverPaused = false));
  carousel.addEventListener("focusin", () => (hoverPaused = true));
  carousel.addEventListener("focusout", () => (hoverPaused = false));
  document.addEventListener("visibilitychange", () => (hiddenPaused = document.hidden));

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === " " && !e.target.matches("button")) { e.preventDefault(); toggleBtn.click(); }
    else if (e.key.toLowerCase() === "r") reveal();
  });

  syncPauseUI();
  rebuild();
})();

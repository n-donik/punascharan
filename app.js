(() => {
  const { srs, io, uid } = window.PC;
  const NEW_PER_SESSION = 20;      // new cards introduced per study session (unless "study ahead")
  const AGAIN_GAP = 3;             // an "Again" card returns after this many other cards
  const TYPE_LABEL = { definition: "Definition", retrieval: "Active recall", quiz: "Quiz" };

  const $ = (id) => document.getElementById(id);
  const h = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return n;
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  const repo = new PC.LocalRepo();
  const S = {
    decks: [], cards: [], progress: {}, enabled: new Set(),
    queue: [], qi: 0, revealed: false, picked: null, anim: null, studyAhead: false,
    view: "study", manage: null,
  };

  const deckById = (id) => S.decks.find((d) => d.id === id);
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  async function reload() {
    S.decks = await repo.listDecks();
    S.cards = await repo.listCards();
    S.progress = await repo.allProgress();
    for (const id of [...S.enabled]) if (!deckById(id)) S.enabled.delete(id);
  }

  // ---------------------------------------------------------------- toast / dialogs
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function confirmDialog(message, okLabel = "Delete") {
    return new Promise((resolve) => {
      const d = $("confirm-dialog");
      $("confirm-msg").textContent = message;
      $("confirm-ok").textContent = okLabel;
      d.returnValue = "";
      d.addEventListener("close", () => resolve(d.returnValue === "ok"), { once: true });
      d.showModal();
    });
  }

  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  function download(name, text, type = "application/json") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = h("a", { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const fileSlug = (s) => (s || "decks").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "decks";

  // ---------------------------------------------------------------- queue
  const isDue = (c, now) => { const p = S.progress[c.id]; return p && p.due <= now; };

  function buildQueue() {
    const now = Date.now();
    const pool = S.cards.filter((c) => S.enabled.has(c.deckId));
    const due = pool.filter((c) => isDue(c, now)).sort((a, b) => S.progress[a.id].due - S.progress[b.id].due);
    const fresh = shuffle(pool.filter((c) => !S.progress[c.id]));
    if (S.studyAhead) {
      const rest = pool.filter((c) => S.progress[c.id] && S.progress[c.id].due > now).sort((a, b) => S.progress[a.id].due - S.progress[b.id].due);
      S.queue = [...due, ...fresh, ...rest];
    } else {
      S.queue = [...due, ...fresh.slice(0, NEW_PER_SESSION)];
    }
    S.qi = 0; S.revealed = false; S.picked = null; S.anim = "forward";
  }

  const currentCard = () => S.queue[S.qi];
  const canRate = (c) => c && (c.type === "definition" || (c.type === "retrieval" && S.revealed) || (c.type === "quiz" && S.picked !== null));

  // ---------------------------------------------------------------- study view
  function renderFilters() {
    $("deck-filters").replaceChildren(...S.decks.map((d) => {
      const input = h("input", { type: "checkbox" });
      input.checked = S.enabled.has(d.id);
      input.addEventListener("change", () => {
        if (input.checked) S.enabled.add(d.id); else S.enabled.delete(d.id);
        store.set("pc.enabled", JSON.stringify([...S.enabled]));
        buildQueue(); renderStudy();
      });
      return h("label", {}, input, h("span", { text: d.title }));
    }));
  }

  function renderStats() {
    const now = Date.now();
    const pool = S.cards.filter((c) => S.enabled.has(c.deckId));
    const due = pool.filter((c) => isDue(c, now)).length;
    const fresh = pool.filter((c) => !S.progress[c.id]).length;
    $("study-stats").textContent = `${due} due · ${fresh} new`;
  }

  function nextDueText() {
    const now = Date.now();
    const upcoming = S.cards.filter((c) => S.enabled.has(c.deckId) && S.progress[c.id] && S.progress[c.id].due > now).map((c) => S.progress[c.id].due);
    return upcoming.length ? `Next card is due in ${srs.fmt(Math.min(...upcoming) - now)}.` : "";
  }

  function emptyNode() {
    const hasCards = S.cards.some((c) => S.enabled.has(c.deckId));
    if (!S.decks.length) {
      return h("div", { class: "slide empty" }, h("h2", { text: "No decks yet" }), h("p", { text: "Create a deck or import one to start studying." }),
        h("button", { class: "btn primary-btn", onclick: () => setView("decks") }, "Go to Decks"));
    }
    if (!S.enabled.size || !hasCards) {
      return h("div", { class: "slide empty" }, h("h2", { text: hasCards ? "Pick a deck" : "No cards here yet" }),
        h("p", { text: hasCards ? "Select at least one deck below." : "Add cards to a selected deck in the Decks tab." }));
    }
    return h("div", { class: "slide empty" }, h("h2", { text: "You're all caught up 🎉" }), h("p", { text: nextDueText() || "Nothing is due right now." }),
      S.studyAhead ? null : h("button", { class: "btn primary-btn", onclick: () => { S.studyAhead = true; buildQueue(); renderStudy(); } }, "Study ahead anyway"));
  }

  function cardNode(card) {
    const cls = `slide ${S.anim === "back" ? "back" : S.anim ? "" : "still"}`;
    const node = h("article", { class: cls });
    if (card.type === "definition") {
      node.append(h("h2", { class: "term", text: card.term }), h("p", { class: "def", text: card.definition }));
      if (card.note) node.append(h("p", { class: "note", text: card.note }));
    } else if (card.type === "retrieval") {
      node.append(h("h2", { class: "question", text: card.question }));
      if (!S.revealed) {
        node.append(h("button", { class: "reveal-btn", type: "button", onclick: reveal }, "Show answer"));
      } else {
        const ans = h("div", { class: "answer" }, h("div", { class: "answer-label", text: "Answer" }));
        if (card.code) ans.append(h("pre", { class: "code", text: card.code }));
        ans.append(h("p", { text: card.answer }));
        node.append(ans);
      }
    } else {
      node.append(h("h2", { class: "question", text: card.question }));
      const answered = S.picked !== null;
      node.append(h("div", { class: "choices", role: "group", "aria-label": "Answer choices" }, card.choices.map((text, i) => {
        const state = !answered ? "" : i === card.correctIndex ? "correct" : i === S.picked ? "wrong" : "";
        return h("button", { class: `choice ${state}`, type: "button", disabled: answered, onclick: () => pick(i) },
          h("span", { class: "n", text: String(i + 1) }), h("span", { text }));
      })));
      if (answered) {
        const ok = S.picked === card.correctIndex;
        node.append(h("p", { class: `verdict ${ok ? "ok" : "no"}`, text: ok ? "Correct" : `Not quite. The answer is ${card.correctIndex + 1}.` }));
        if (card.explanation) node.append(h("p", { class: "note", text: card.explanation }));
      }
    }
    return node;
  }

  function renderRatings(card) {
    const enabled = canRate(card);
    const now = Date.now();
    const suggested = card && card.type === "quiz" && S.picked !== null ? (S.picked === card.correctIndex ? "medium" : "again") : null;
    $("ratings").replaceChildren(...srs.RATINGS.map((r) => h("button", {
      class: `rate ${r.id === suggested ? "suggest" : ""}`, type: "button", "data-r": r.id, disabled: !enabled,
      "aria-label": `${r.label}${card && enabled ? `, next review in ${srs.fmt(srs.apply(S.progress[card.id], r.id, now).due - now)}` : ""}`,
      onclick: () => rate(r.id),
    }, h("span", { text: r.label }), h("span", { class: "when", text: card && enabled ? srs.fmt(srs.apply(S.progress[card.id], r.id, now).due - now) : "·" }))));
  }

  function renderStudy() {
    const card = currentCard(), carousel = $("carousel"), stage = $("stage");
    renderFilters(); renderStats();
    const none = !card;
    $("prev").disabled = $("next").disabled = S.queue.length < 2;
    if (none) {
      carousel.dataset.type = "empty";
      $("slide-kind").textContent = "Study"; $("slide-topic").textContent = "";
      stage.replaceChildren(emptyNode());
      renderRatings(null);
    } else {
      const deck = deckById(card.deckId);
      carousel.dataset.type = card.type;
      carousel.style.setProperty("--deck", deck ? deck.color : "var(--accent)");
      $("slide-kind").textContent = TYPE_LABEL[card.type];
      $("slide-topic").textContent = deck ? deck.title : "";
      stage.replaceChildren(cardNode(card));
      renderRatings(card);
    }
    S.anim = null;
  }

  function move(d) {
    if (S.queue.length < 2) return;
    S.qi = (S.qi + d + S.queue.length) % S.queue.length;
    S.revealed = false; S.picked = null; S.anim = d < 0 ? "back" : "forward";
    renderStudy();
  }

  function reveal() {
    const c = currentCard();
    if (!c || c.type !== "retrieval" || S.revealed) return;
    S.revealed = true; renderStudy();
  }

  function pick(i) {
    const c = currentCard();
    if (!c || c.type !== "quiz" || S.picked !== null) return;
    S.picked = i; renderStudy();
  }

  async function rate(r) {
    const card = currentCard();
    if (!card || !canRate(card)) return;
    const next = srs.apply(S.progress[card.id], r);
    S.progress[card.id] = next;
    await repo.saveProgress(card.id, next);
    S.queue.splice(S.qi, 1);
    if (r === "again") S.queue.splice(Math.min(S.queue.length, S.qi + AGAIN_GAP), 0, card);
    if (S.qi >= S.queue.length) S.qi = 0;
    S.revealed = false; S.picked = null; S.anim = "forward";
    renderStudy();
  }

  $("prev").addEventListener("click", () => move(-1));
  $("next").addEventListener("click", () => move(1));

  document.addEventListener("keydown", (e) => {
    if (S.view !== "study" || document.querySelector("dialog[open]")) return;
    if (e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
    const c = currentCard();
    if (e.key === "ArrowRight") move(1);
    else if (e.key === "ArrowLeft") move(-1);
    else if (e.key === " " && c && c.type === "retrieval" && !S.revealed) { e.preventDefault(); reveal(); }
    else if (/^[1-9]$/.test(e.key) && c) {
      const n = Number(e.key);
      if (c.type === "quiz" && S.picked === null) { if (n <= c.choices.length) pick(n - 1); }
      else if (canRate(c) && n <= 4) rate(srs.RATINGS[n - 1].id);
    }
  });

  // ---------------------------------------------------------------- views
  function setView(v) {
    S.view = v;
    $("view-study").hidden = v !== "study";
    $("view-decks").hidden = v !== "decks";
    document.querySelectorAll(".tabs button").forEach((b) => { if (b.dataset.view === v) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (v === "study") { buildQueue(); renderStudy(); } else renderDecks();
  }
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { S.manage = null; setView(b.dataset.view); }));

  // ---------------------------------------------------------------- decks view
  function deckStats(d) {
    const now = Date.now();
    const cards = S.cards.filter((c) => c.deckId === d.id);
    return { total: cards.length, due: cards.filter((c) => isDue(c, now)).length, fresh: cards.filter((c) => !S.progress[c.id]).length };
  }

  function renderDecks() {
    const root = $("decks-root");
    const deck = S.manage && deckById(S.manage);
    if (S.manage && !deck) S.manage = null;
    root.replaceChildren(deck ? manageNode(deck) : listNode());
  }

  function listNode() {
    const wrap = h("div");
    wrap.append(h("div", { class: "bar" },
      h("h1", { text: "Your decks" }),
      h("button", { class: "btn primary-btn", type: "button", onclick: () => openDeckDialog() }, "New deck"),
      h("button", { class: "btn", type: "button", onclick: openImport }, "Import JSON"),
      h("button", { class: "btn", type: "button", onclick: () => exportDecks(null, true, "punascharan-backup.json") }, "Export all (with progress)")));

    wrap.append(S.decks.length
      ? h("div", { class: "grid" }, S.decks.map((d) => {
        const st = deckStats(d);
        return h("div", { class: "deck", style: `--c:${d.color}` },
          h("h3", { text: d.title }),
          d.description ? h("p", { text: d.description }) : null,
          h("p", { class: "meta", text: `${st.total} cards · ${st.due} due · ${st.fresh} new` }),
          h("div", { class: "actions" },
            h("button", { class: "btn small primary-btn", type: "button", onclick: () => studyOnly(d.id) }, "Study"),
            h("button", { class: "btn small", type: "button", onclick: () => { S.manage = d.id; renderDecks(); } }, "Manage"),
            h("button", { class: "btn small", type: "button", onclick: () => exportDecks([d.id], false, `${fileSlug(d.title)}.json`) }, "Export")));
      }))
      : h("p", { text: "No decks yet. Create one, import a file, or restore the sample decks." }));

    wrap.append(h("h2", { class: "section-title", text: "Tools" }), h("div", { class: "bar" },
      h("button", { class: "btn", type: "button", onclick: restoreSamples }, "Restore sample decks"),
      h("button", { class: "btn", type: "button", onclick: () => exportGraph("json") }, "Export graph JSON (Neo4j)"),
      h("button", { class: "btn", type: "button", onclick: () => exportGraph("cypher") }, "Export Cypher (Neo4j)")));
    return wrap;
  }

  function manageNode(d) {
    const cards = S.cards.filter((c) => c.deckId === d.id).sort((a, b) => a.created - b.created);
    const wrap = h("div", { style: `--c:${d.color}` });
    wrap.append(
      h("button", { class: "back-link", type: "button", onclick: () => { S.manage = null; renderDecks(); } }, "‹ All decks"),
      h("div", { class: "bar" },
        h("h1", { text: d.title }),
        h("button", { class: "btn primary-btn", type: "button", onclick: () => openCardDialog(null, d.id) }, "Add card"),
        h("button", { class: "btn", type: "button", onclick: () => openDeckDialog(d) }, "Edit deck"),
        h("button", { class: "btn", type: "button", onclick: () => exportDecks([d.id], false, `${fileSlug(d.title)}.json`) }, "Export"),
        h("button", { class: "btn", type: "button", onclick: async () => { if (await confirmDialog(`Reset all study progress for "${d.title}"?`, "Reset")) { await repo.resetProgress(d.id); await reload(); renderDecks(); toast("Progress reset"); } } }, "Reset progress"),
        h("button", { class: "btn danger-btn", type: "button", onclick: async () => { if (await confirmDialog(`Delete "${d.title}" and its ${cards.length} cards? This cannot be undone.`)) { await repo.deleteDeck(d.id); S.enabled.delete(d.id); S.manage = null; await reload(); renderDecks(); toast("Deck deleted"); } } }, "Delete deck")),
      d.description ? h("p", { class: "hint", text: d.description }) : null);

    wrap.append(cards.length
      ? h("ul", { class: "card-list" }, cards.map((c) => h("li", { class: "card-item" },
        h("span", { class: `badge ${c.type}`, text: TYPE_LABEL[c.type] }),
        h("span", { class: "front", text: c.type === "definition" ? c.term : c.question }),
        h("button", { class: "btn small", type: "button", onclick: () => openCardDialog(c, d.id) }, "Edit"),
        h("button", { class: "btn small", type: "button", "aria-label": "Delete card", onclick: async () => { if (await confirmDialog("Delete this card?")) { await repo.deleteCard(c.id); await reload(); renderDecks(); } } }, "Delete"))))
      : h("p", { text: "This deck has no cards yet." }));
    return wrap;
  }

  async function studyOnly(deckId) {
    S.enabled = new Set([deckId]);
    store.set("pc.enabled", JSON.stringify([...S.enabled]));
    S.studyAhead = false; S.manage = null;
    setView("study");
  }

  // ---------------------------------------------------------------- deck dialog
  let editingDeck = null;
  function openDeckDialog(deck = null) {
    editingDeck = deck;
    const f = $("deck-form");
    $("deck-dialog-title").textContent = deck ? "Edit deck" : "New deck";
    f.title.value = deck ? deck.title : "";
    f.description.value = deck ? deck.description : "";
    f.color.value = deck ? deck.color : "#3b5bdb";
    $("deck-error").textContent = "";
    $("deck-dialog").showModal();
  }
  $("deck-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const now = Date.now();
      const d = io.normalizeDeck({ ...(editingDeck || {}), id: editingDeck ? editingDeck.id : uid(), title: f.title.value, description: f.description.value, color: f.color.value, updated: now, created: editingDeck ? editingDeck.created : now });
      await repo.saveDeck(d);
      if (!editingDeck) S.enabled.add(d.id);
      store.set("pc.enabled", JSON.stringify([...S.enabled]));
      await reload(); $("deck-dialog").close(); renderDecks();
    } catch (err) { $("deck-error").textContent = err.message; }
  });

  // ---------------------------------------------------------------- card dialog
  let editingCard = null;
  const cardForm = $("card-form");
  function syncCardType() {
    const t = cardForm.type.value;
    cardForm.querySelectorAll("[data-for]").forEach((g) => {
      const on = g.dataset.for === t;
      g.hidden = !on;
      g.querySelectorAll("input, textarea").forEach((el) => (el.disabled = !on));
    });
  }
  cardForm.type.addEventListener("change", syncCardType);

  function openCardDialog(card, deckId) {
    editingCard = card;
    cardForm.reset();
    cardForm.deckId.replaceChildren(...S.decks.map((d) => h("option", { value: d.id, text: d.title })));
    cardForm.deckId.value = card ? card.deckId : deckId;
    cardForm.type.value = card ? card.type : "definition";
    cardForm.type.disabled = !!card;               // changing type would orphan fields; create a new card instead
    $("card-dialog-title").textContent = card ? "Edit card" : "New card";
    if (card) {
      cardForm.tags.value = card.tags.join(", ");
      if (card.type === "definition") { cardForm.term.value = card.term; cardForm.definition.value = card.definition; cardForm.note.value = card.note; }
      else if (card.type === "retrieval") { cardForm.question.value = card.question; cardForm.answer.value = card.answer; cardForm.code.value = card.code; }
      else { cardForm.qquestion.value = card.question; cardForm.choices.value = card.choices.join("\n"); cardForm.correct.value = card.correctIndex + 1; cardForm.explanation.value = card.explanation; }
    }
    syncCardType();
    $("card-error").textContent = "";
    $("card-dialog").showModal();
  }

  cardForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = cardForm, type = editingCard ? editingCard.type : f.type.value;
    const raw = {
      ...(editingCard || {}), id: editingCard ? editingCard.id : uid(), type,
      created: editingCard ? editingCard.created : Date.now(), updated: Date.now(),
      tags: f.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (type === "definition") Object.assign(raw, { term: f.term.value, definition: f.definition.value, note: f.note.value });
    else if (type === "retrieval") Object.assign(raw, { question: f.question.value, answer: f.answer.value, code: f.code.value });
    else Object.assign(raw, { question: f.qquestion.value, choices: f.choices.value.split("\n"), correctIndex: Number(f.correct.value) - 1, explanation: f.explanation.value });
    try {
      const card = io.normalizeCard(raw, f.deckId.value);
      await repo.saveCard(card);
      await reload(); $("card-dialog").close(); renderDecks();
    } catch (err) { $("card-error").textContent = err.message; }
  });

  // ---------------------------------------------------------------- import / export
  function openImport() {
    $("import-text").value = ""; $("import-file").value = ""; $("import-error").textContent = "";
    $("import-dialog").showModal();
  }
  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) $("import-text").value = await file.text();
  });
  $("import-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const parsed = io.parseBundle($("import-text").value);
      const mode = e.target.mode.value;
      const res = await io.importBundle(repo, parsed, mode);
      for (const { deck } of parsed.decks) if (mode !== "copy") S.enabled.add(deck.id);
      await reload();
      // copies get new ids; enable every deck so the user sees the result
      S.decks.forEach((d) => S.enabled.add(d.id));
      store.set("pc.enabled", JSON.stringify([...S.enabled]));
      $("import-dialog").close(); renderDecks();
      toast(`Imported ${res.decks} deck${res.decks === 1 ? "" : "s"}, ${res.cards} cards`);
    } catch (err) { $("import-error").textContent = err.message; }
  });

  async function exportDecks(ids, withProgress, name) {
    const bundle = await io.exportBundle(repo, ids, withProgress);
    download(name, JSON.stringify(bundle, null, 2));
    toast("Exported " + name);
  }

  async function exportGraph(kind) {
    const graph = io.toGraph(S.decks, S.cards);
    if (kind === "json") download("punascharan-graph.json", JSON.stringify(graph, null, 2));
    else download("punascharan-graph.cypher", io.toCypher(graph), "text/plain");
    toast(`Exported ${graph.nodes.length} nodes, ${graph.relationships.length} relationships`);
  }

  async function restoreSamples() {
    await repo.addMissing(PC.buildSeed());
    await reload();
    S.decks.forEach((d) => S.enabled.add(d.id));
    renderDecks(); toast("Sample decks restored");
  }

  // ---------------------------------------------------------------- theme + boot
  const root = document.documentElement;
  const savedTheme = store.get("theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  $("theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  });

  (async function boot() {
    await repo.init(PC.buildSeed());
    await reload();
    let saved = null;
    try { saved = JSON.parse(store.get("pc.enabled")); } catch { /* none */ }
    S.enabled = new Set(Array.isArray(saved) ? saved.filter((id) => deckById(id)) : S.decks.map((d) => d.id));
    if (!Array.isArray(saved)) S.decks.forEach((d) => S.enabled.add(d.id));
    setView("study");
  })();

  window.PC.debug = { S, repo };   // handy for inspecting state in the console
})();

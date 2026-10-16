// JSON import/export, validation, and Neo4j-ready graph export.
//
// Bundle format (version 1):
//   { format: "punascharan", version: 1, exportedAt,
//     decks: [ { id, title, description, color, cards: [ card, ... ] } ],
//     progress?: { [cardId]: { ease, interval, reps, lapses, due, last } } }
//
// Card (common): id, type ("definition" | "retrieval" | "quiz"), tags[], links[{type, target}]
//   definition: term, definition, note
//   retrieval:  question, answer, code
//   quiz:       question, choices[2-8], correctIndex (0-based), explanation
(() => {
  const PC = (window.PC ||= {});
  const FORMAT = "punascharan", VERSION = 1;
  const TYPES = ["definition", "retrieval", "quiz"];
  const LINK_TYPES = ["RELATED_TO", "PREREQUISITE_OF"];
  const MAX_DECKS = 500, MAX_CARDS = 20000;

  const str = (v, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const num = (v, fallback) => (v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : fallback);
  const color = (v) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#3b5bdb");

  function normalizeCard(raw, deckId) {
    if (!raw || typeof raw !== "object") throw new Error("A card is not an object.");
    if (!TYPES.includes(raw.type)) throw new Error(`Unknown card type "${raw.type}".`);
    const now = Date.now();
    const c = {
      id: str(raw.id, 120) || PC.uid(),
      deckId,
      type: raw.type,
      tags: Array.isArray(raw.tags) ? [...new Set(raw.tags.map((t) => str(t, 60)).filter(Boolean))].slice(0, 20) : [],
      links: Array.isArray(raw.links)
        ? raw.links.filter((l) => l && LINK_TYPES.includes(l.type) && str(l.target, 120)).map((l) => ({ type: l.type, target: str(l.target, 120) })).slice(0, 50)
        : [],
      created: num(raw.created, now),
      updated: num(raw.updated, now),
    };
    if (c.type === "definition") {
      Object.assign(c, { term: str(raw.term, 200), definition: str(raw.definition), note: str(raw.note) });
      if (!c.term || !c.definition) throw new Error("Definition cards need a term and a definition.");
    } else if (c.type === "retrieval") {
      Object.assign(c, { question: str(raw.question), answer: str(raw.answer), code: typeof raw.code === "string" ? raw.code.slice(0, 5000) : "" });
      if (!c.question || !c.answer) throw new Error("Active retrieval cards need a question and an answer.");
    } else {
      const choices = Array.isArray(raw.choices) ? raw.choices.map((x) => str(x, 500)).filter(Boolean) : [];
      Object.assign(c, { question: str(raw.question), choices, correctIndex: Number(raw.correctIndex), explanation: str(raw.explanation) });
      if (!c.question) throw new Error("Quiz cards need a question.");
      if (choices.length < 2 || choices.length > 8) throw new Error("Quiz cards need between 2 and 8 choices.");
      if (!Number.isInteger(c.correctIndex) || c.correctIndex < 0 || c.correctIndex >= choices.length) throw new Error("Quiz correctIndex is out of range.");
    }
    return c;
  }

  function normalizeDeck(raw) {
    if (!raw || typeof raw !== "object") throw new Error("A deck is not an object.");
    const title = str(raw.title, 120);
    if (!title) throw new Error("Every deck needs a title.");
    const now = Date.now();
    return {
      id: str(raw.id, 120) || PC.uid(), title, description: str(raw.description, 500),
      color: color(raw.color), created: num(raw.created, now), updated: num(raw.updated, now),
    };
  }

  function parseBundle(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("That is not valid JSON."); }
    if (!data || data.format !== FORMAT) throw new Error(`Not a Punascharan file (missing format "${FORMAT}").`);
    if (!(Number(data.version) <= VERSION)) throw new Error(`This file is version ${data.version}; this app reads up to version ${VERSION}.`);
    if (!Array.isArray(data.decks) || !data.decks.length) throw new Error("The file contains no decks.");
    if (data.decks.length > MAX_DECKS) throw new Error("Too many decks in one file.");
    let total = 0;
    const decks = data.decks.map((rd, i) => {
      try {
        const deck = normalizeDeck(rd);
        const rawCards = Array.isArray(rd.cards) ? rd.cards : [];
        total += rawCards.length;
        if (total > MAX_CARDS) throw new Error("Too many cards in one file.");
        const cards = rawCards.map((c, j) => {
          try { return normalizeCard(c, deck.id); } catch (e) { throw new Error(`card ${j + 1}: ${e.message}`); }
        });
        return { deck, cards };
      } catch (e) { throw new Error(`Deck ${i + 1}: ${e.message}`); }
    });
    const progress = {};
    if (data.progress && typeof data.progress === "object") {
      for (const [id, p] of Object.entries(data.progress)) {
        if (p && typeof p === "object") {
          progress[id] = { ease: num(p.ease, 2.5), interval: num(p.interval, 0), reps: num(p.reps, 0), lapses: num(p.lapses, 0), due: num(p.due, 0), last: num(p.last, 0) };
        }
      }
    }
    return { decks, progress };
  }

  // mode "merge": decks/cards with matching ids are updated in place (progress imported if present).
  // mode "copy":  everything gets fresh ids so nothing is overwritten.
  async function importBundle(repo, parsed, mode) {
    let decks = 0, cards = 0;
    for (const { deck, cards: cs } of parsed.decks) {
      let d = deck, list = cs;
      if (mode === "copy") {
        const remap = new Map(cs.map((c) => [c.id, PC.uid()]));
        d = { ...deck, id: PC.uid(), title: `${deck.title} (copy)` };
        list = cs.map((c) => ({
          ...c, id: remap.get(c.id), deckId: d.id,
          links: c.links.map((l) => ({ ...l, target: remap.get(l.target) || l.target })),
        }));
      }
      await repo.saveDeck(d); decks++;
      for (const c of list) {
        await repo.saveCard({ ...c, deckId: d.id }); cards++;
        if (mode !== "copy" && parsed.progress[c.id]) await repo.saveProgress(c.id, parsed.progress[c.id]);
      }
    }
    return { decks, cards };
  }

  async function exportBundle(repo, deckIds, withProgress) {
    const allDecks = await repo.listDecks();
    const picked = deckIds ? allDecks.filter((d) => deckIds.includes(d.id)) : allDecks;
    const progress = withProgress ? await repo.allProgress() : null;
    const out = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), decks: [] };
    const outProgress = {};
    for (const d of picked) {
      const cards = (await repo.listCards(d.id)).map(({ deckId, ...rest }) => rest);
      out.decks.push({ id: d.id, title: d.title, description: d.description, color: d.color, cards });
      if (progress) for (const c of cards) if (progress[c.id]) outProgress[c.id] = progress[c.id];
    }
    if (progress) out.progress = outProgress;
    return out;
  }

  // ---- Neo4j mapping --------------------------------------------------------------
  // (:Card:Definition|Retrieval|Quiz) -[:IN_DECK]-> (:Deck)
  // (:Card) -[:TAGGED]-> (:Concept)
  // (:Card) -[:RELATED_TO | :PREREQUISITE_OF]-> (:Card)
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  function toGraph(decks, cards) {
    const nodes = [], rels = [], concepts = new Map(), ids = new Set(cards.map((c) => c.id));
    for (const d of decks) nodes.push({ id: d.id, labels: ["Deck"], properties: { id: d.id, title: d.title, description: d.description, color: d.color } });
    for (const c of cards) {
      const { deckId, tags, links, type, ...fields } = c;
      nodes.push({ id: c.id, labels: ["Card", cap(type)], properties: { ...fields, type } });
      rels.push({ type: "IN_DECK", from: c.id, to: deckId });
      for (const t of tags || []) {
        const cid = `concept:${slug(t)}`;
        if (!concepts.has(cid)) concepts.set(cid, { id: cid, labels: ["Concept"], properties: { id: cid, name: t } });
        rels.push({ type: "TAGGED", from: c.id, to: cid });
      }
      for (const l of links || []) if (ids.has(l.target)) rels.push({ type: l.type, from: c.id, to: l.target });
    }
    return { nodes: [...nodes, ...concepts.values()], relationships: rels };
  }

  function toCypher(graph) {
    const q = (v) => JSON.stringify(v);
    const val = (v) => (Array.isArray(v) ? `[${v.map(q).join(", ")}]` : q(v));
    const lines = [
      "// Generated by Punascharan. Run in Neo4j Browser or cypher-shell.",
      "CREATE CONSTRAINT card_id IF NOT EXISTS FOR (n:Card) REQUIRE n.id IS UNIQUE;",
      "CREATE CONSTRAINT deck_id IF NOT EXISTS FOR (n:Deck) REQUIRE n.id IS UNIQUE;",
      "CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE;",
    ];
    for (const n of graph.nodes) {
      const props = Object.entries(n.properties)
        .filter(([k, v]) => k !== "id" && v !== "" && v != null)
        .map(([k, v]) => `${k}: ${val(v)}`).join(", ");
      lines.push(`MERGE (n:${n.labels[0]} {id: ${q(n.id)}}) SET n:${n.labels.join(":")}, n += {${props}};`);
    }
    for (const r of graph.relationships) {
      lines.push(`MATCH (a {id: ${q(r.from)}}), (b {id: ${q(r.to)}}) MERGE (a)-[:${r.type}]->(b);`);
    }
    return lines.join("\n");
  }

  PC.io = { normalizeCard, normalizeDeck, parseBundle, importBundle, exportBundle, toGraph, toCypher, LINK_TYPES };
})();

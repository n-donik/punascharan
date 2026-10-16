// Builds the sample decks from content.js (REVIEW, RETRIEVAL, QUIZ) in the app's data model.
(() => {
  const PC = (window.PC ||= {});
  const COLORS = { ds: "#3b82f6", ml: "#8b5cf6", torch: "#ef4444", ksprod: "#0d9488", kssales: "#d97706", ai: "#ec4899", llm: "#6366f1", harness: "#16a34a" };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  PC.buildSeed = () => {
    const decks = Object.entries(TOPICS).map(([id, t]) => ({
      id: `sample-${id}`, title: t.label, description: "Sample deck", color: COLORS[id] || "#3b5bdb", created: 0, updated: 0,
    }));
    const base = (topic, kind, key) => ({
      id: `sample-${topic}-${kind}-${slug(key)}`, deckId: `sample-${topic}`,
      tags: [TOPICS[topic].label], links: [], created: 0, updated: 0,
    });
    const cards = [
      ...REVIEW.map((r) => ({ ...base(r.topic, "def", r.term), type: "definition", term: r.term, definition: r.def, note: r.note || "" })),
      ...RETRIEVAL.map((r) => ({ ...base(r.topic, "rec", r.q), type: "retrieval", question: r.q, answer: r.a, code: r.code || "" })),
      ...QUIZ.map((r) => ({ ...base(r.topic, "quiz", r.q), type: "quiz", question: r.q, choices: r.choices, correctIndex: r.correctIndex, explanation: r.explanation || "" })),
    ];
    return { decks, cards };
  };
})();

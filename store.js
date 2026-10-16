// Storage layer. The app only talks to a "repository" with the async methods below, so the
// localStorage implementation can later be swapped for a Neo4j-backed one (see DATA_MODEL.md).
//
// Repository interface (all async):
//   init(seed)                      seed first-run data
//   listDecks() / saveDeck(d) / deleteDeck(id)          deleteDeck cascades to cards + progress
//   listCards(deckId?) / saveCard(c) / deleteCard(id)
//   allProgress() / saveProgress(cardId, state) / resetProgress(deckId?)
//   addMissing(seed)                restore sample decks without touching existing data
(() => {
  const PC = (window.PC ||= {});
  const KEY = "punascharan.v2";

  PC.uid = () =>
    (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : `id-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  class LocalRepo {
    constructor() { this.data = null; }

    _read() {
      try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* corrupt or blocked */ }
      return null;
    }
    _write() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* quota/private mode: stay in memory */ } }

    async init(seed) {
      this.data = this._read();
      if (!this.data || typeof this.data !== "object") {
        this.data = { version: 1, decks: {}, cards: {}, progress: {} };
        await this.addMissing(seed);
      }
    }

    async addMissing(seed) {
      for (const d of seed.decks) if (!this.data.decks[d.id]) this.data.decks[d.id] = d;
      for (const c of seed.cards) if (!this.data.cards[c.id]) this.data.cards[c.id] = c;
      this._write();
    }

    async listDecks() { return Object.values(this.data.decks).sort((a, b) => (a.created - b.created) || a.title.localeCompare(b.title)); }
    async saveDeck(d) { this.data.decks[d.id] = d; this._write(); return d; }
    async deleteDeck(id) {
      delete this.data.decks[id];
      for (const c of Object.values(this.data.cards)) if (c.deckId === id) { delete this.data.cards[c.id]; delete this.data.progress[c.id]; }
      this._write();
    }

    async listCards(deckId) {
      const all = Object.values(this.data.cards);
      return deckId ? all.filter((c) => c.deckId === deckId) : all;
    }
    async saveCard(c) { this.data.cards[c.id] = c; this._write(); return c; }
    async deleteCard(id) { delete this.data.cards[id]; delete this.data.progress[id]; this._write(); }

    async allProgress() { return { ...this.data.progress }; }
    async saveProgress(cardId, state) { this.data.progress[cardId] = state; this._write(); }
    async resetProgress(deckId) {
      for (const c of Object.values(this.data.cards)) if (!deckId || c.deckId === deckId) delete this.data.progress[c.id];
      this._write();
    }
  }

  PC.LocalRepo = LocalRepo;
})();

# Data model and Neo4j migration plan

## Today: JSON in localStorage
`store.js` implements a `LocalRepo` behind an async repository interface (`listDecks`, `saveCard`, `saveProgress`, ...).
`app.js` only talks to that interface, so a Neo4j-backed repo (served through a small API) can replace it without UI changes.

Progress (`ease`, `interval`, `reps`, `lapses`, `due`, `last`) is stored separately from card content, so shared decks never carry someone else's study history.

## Exchange format (`io.js`)
```json
{ "format": "punascharan", "version": 1,
  "decks": [ { "id": "...", "title": "...", "description": "...", "color": "#3b82f6",
    "cards": [
      { "id": "...", "type": "definition", "term": "...", "definition": "...", "note": "", "tags": [], "links": [] },
      { "id": "...", "type": "retrieval", "question": "...", "answer": "...", "code": "" },
      { "id": "...", "type": "quiz", "question": "...", "choices": ["a", "b"], "correctIndex": 1, "explanation": "" }
    ] } ],
  "progress": { "<cardId>": { "ease": 2.5, "interval": 1, "reps": 1, "lapses": 0, "due": 0, "last": 0 } } }
```
`progress` is optional. Card `links` are `{ "type": "RELATED_TO" | "PREREQUISITE_OF", "target": "<cardId>" }`.

## Graph mapping
| JSON | Neo4j |
| --- | --- |
| deck | `(:Deck {id, title, description, color})` |
| card | `(:Card:Definition|Retrieval|Quiz {id, ...fields})-[:IN_DECK]->(:Deck)` |
| tag | `(:Card)-[:TAGGED]->(:Concept {id, name})` |
| link | `(:Card)-[:RELATED_TO|:PREREQUISITE_OF]->(:Card)` |
| progress (future) | `(:User)-[:REVIEWED {ease, interval, reps, lapses, due, last}]->(:Card)` |

The Decks tab exports this as graph JSON (`nodes` / `relationships`) or as a Cypher script (`MERGE` statements plus uniqueness constraints).
The Cypher has not been run against a live Neo4j instance yet.

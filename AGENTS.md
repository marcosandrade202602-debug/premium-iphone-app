# AGENTS

## Architecture
- `public/index.html` loads scripts in order (global scope, no bundler): `js/core.js` (state, IndexedDB persistence, `calc` calculations, demo data) → `js/smart.js` (category suggestions, `parseQuick` text parsing, `insights()`, `answerLocal()`, `aiSummary()`) → `js/ui.js` (icons, `openSheet`, toast, charts, swipe) → `js/views.js` (screens `V.home/tx/wallet/stats`) → `js/forms.js` (forms and actions) → `js/main.js` (render, assistant, settings, PIN, onboarding, boot).
- `public/styles.css`: iOS design system (CSS variables, light/dark theme via `data-theme`).
- `netlify/functions/assistant.mts`: `/api/assistant` endpoint (claude-haiku-5-5 via AI Gateway). It receives only an aggregated summary, and only when the user turns on the AI.

## Conventions
- Amounts are always stored in integer cents; dates are ISO `YYYY-MM-DD` strings in local time.
- Every mutation calls `save()`, which persists and re-renders. Use `snap()` before destructive changes so "Desfazer" (undo) works.
- The IndexedDB key `meumes/kv/s` stays compatible with v1; `migrate()` upgrades old data.
- All UI text is in pt-BR.

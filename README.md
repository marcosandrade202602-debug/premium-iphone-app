# MEU MÊS

Personal finance app (pt-BR) with an iPhone-style interface. It shows how much you can spend today and covers cards with installments, bills, goals, budgets, insights and an assistant. Data stays on the device (IndexedDB).

## Technologies
- Static HTML/CSS/JS without a framework (`public/`), installable PWA with a service worker
- Netlify Functions + Netlify AI Gateway (Anthropic) for the optional AI assistant (`/api/assistant`)
- Netlify Image CDN for the icon

## Running locally
```
npm install
netlify dev --port 8889
```

## Roadmap
- Test it on a real iPhone and polish the details
- Optional cloud sync between devices
- Bank statement import (OFX/CSV)

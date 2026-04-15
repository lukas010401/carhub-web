# carhub-web

## Memo Node.js (multi-projets)

Ce projet frontend Next.js doit tourner avec Node **20 LTS** (recommande: `20.11.1`).

Version historique encore utilisee sur d'autres projets: `12.14.1`.

Workflow conseille:

```powershell
# Avant de travailler sur carhub-web
nvm use 20.11.1
node -v
npm run dev
```

```powershell
# Avant de revenir sur un ancien projet
nvm use 12.14.1
node -v
```

Notes:
- `.nvmrc` est present dans ce repo pour indiquer la version cible.
- Sur Windows (`nvm-windows`), la commande reste `nvm use <version>`.

## API locale

Le frontend doit pointer directement vers l'API HTTPS locale pour eviter la redirection CORS (307):

```powershell
NEXT_PUBLIC_API_BASE_URL=https://localhost:7177
```



# Guide d'utilisation de l'espace administrateur

- `guide-admin.pdf` : le guide (PDF prêt à lire ou à imprimer).
- `guide-admin.tex` : sources LaTeX (français, `pdflatex`). Compilation : `latexmk -pdf guide-admin.tex` (deux passes pour la table des matières).
- `images/` : captures annotées utilisées par le guide.
- `capture/capture.mjs` : script Playwright qui régénère toutes les captures, avec leurs pastilles numérotées.

## Régénérer les captures

Les captures se font sur une base de **démonstration** (le seed efface la base ciblée : ne jamais le lancer sur la production).

```bash
# 1. base vide + migrations + données de démonstration (backend)
export DATABASE_URL="postgresql://<user>:<mot de passe>@localhost:5432/camerrideshare_guide?schema=public"
npx prisma migrate deploy && npx prisma db seed
# 2. API (build puis) :  PORT=3001 node dist/src/main
# 3. frontend :  VITE_API_PROXY_TARGET=http://localhost:3001 npx vite --host 127.0.0.1 --port 5174
# 4. captures (depuis un dossier où `playwright` est installé) :
node capture/capture.mjs images            # toutes les figures
node capture/capture.mjs images 11 22      # seulement celles dont le nom commence par 11 ou 22
```

Variables : `BASE` (défaut `http://127.0.0.1:5174`), `ADMIN_PHONE` (`692100263`), `ADMIN_PASSWORD` (`password123`), `CHROME` (chemin d'un Chrome/Chromium).

Quand l'interface change, relancez le script, recompilez le PDF et relisez les légendes : elles décrivent chaque pastille par son numéro.

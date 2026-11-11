# Guide d'utilisation de l'espace investisseur

- `guide-investisseur.pdf` : le guide (PDF prêt à lire ou à imprimer).
- `guide-investisseur.tex` : sources LaTeX (français, `pdflatex`). Compilation : `latexmk -pdf guide-investisseur.tex` (deux passes pour la table des matières).
- `images/` : captures annotées utilisées par le guide. `32-installation-iphone.png` est partagée avec le guide de l'administrateur.
- `capture/capture-investisseur.mjs` : script Playwright qui régénère les captures, avec leurs pastilles numérotées.

## Régénérer les captures

Les captures se font sur une base de **démonstration** (le seed efface la base ciblée : ne jamais le lancer sur la production). La marche à suivre est la même que pour le guide de l'administrateur (voir `../guide-admin/README.md`) ; seul le script change :

```bash
node capture/capture-investisseur.mjs images            # toutes les figures
node capture/capture-investisseur.mjs images 08 11      # seulement celles dont le nom commence par 08 ou 11
```

Variables : `BASE` (défaut `http://127.0.0.1:5174`), `INVESTOR_PHONE` (`690000004`, Jean-Pierre Nkoulou dans le seed), `INVESTOR_PASSWORD` (`password123`), `CHROME` (chemin d'un Chrome/Chromium).

Quand l'interface change, relancez le script, recompilez le PDF et relisez les légendes : elles décrivent chaque pastille par son numéro.

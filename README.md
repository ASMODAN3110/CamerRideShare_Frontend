# CamerRideShare

Plateforme de gestion de flotte de motos-taxis au Cameroun. Interface moderne (PWA) avec espaces **Grand Patron** (admin), **Investisseur** et **Conducteur**. Données mockées pour l’instant — pas d’API backend branchée.

## Stack

| Technologie | Usage |
|---|---|
| **React 19** + **TypeScript** | UI fonctionnelle, typée |
| **Vite 7** | Build et dev server |
| **Tailwind CSS 4** | Styles, dark mode (`class` sur `<html>`) |
| **React Router v7** | Navigation SPA |
| **Recharts 3.8** | Graphiques (dashboard admin / investisseur) |
| **GSAP 3.15** | Animations scroll (`AnimatedContent`) |
| **Motion 12** | Effets texte (`BlurText`) |
| **Lucide React** | Icônes |
| Composants UI maison | `Button`, `Card`, `Badge`, `Avatar`, `Table`, `Switch`, `Progress` (`src/components/ui/`) |

## Structure du projet

```
src/
├── App.tsx                 # Routes et thème global
├── components/
│   ├── Sidebar.tsx         # Navigation Grand Patron
│   ├── InvestorSidebar.tsx # Navigation investisseur
│   ├── DriverSidebar.tsx   # Navigation conducteur
│   ├── AnimatedContent.tsx # Animation GSAP au scroll
│   ├── MagicBento.tsx      # SpotlightSection, ParticleHover, EffectCard
│   └── ui/                 # Composants réutilisables
├── pages/
│   ├── ConnexionPage.tsx
│   ├── InscriptionPage.tsx
│   ├── DashboardPage.tsx   # Admin
│   ├── ParcPage.tsx
│   ├── PaiementsPage.tsx
│   ├── InvestisseursPage.tsx
│   ├── ParametresPage.tsx
│   ├── investor/           # Espace investisseur
│   └── driver/             # Espace conducteur
public/
├── manifest.webmanifest    # PWA
└── sw.js                   # Service Worker
```

## Pages et routes

### Pages publiques

| Route | Page | Description |
|---|---|---|
| `/` | — | Redirige vers `/inscription` |
| `/inscription` | InscriptionPage | Création de compte |
| `/connexion` | ConnexionPage | Connexion téléphone + mot de passe |

### Espace Grand Patron (Admin)

Sidebar : `Sidebar.tsx` — thème géré par `App.tsx`.

| Route | Page | Description |
|---|---|---|
| `/dashboard` | DashboardPage | Statistiques globales, carte des motos, graphiques |
| `/parc` | ParcPage | Gestion du parc de motos |
| `/paiements` | PaiementsPage | Suivi des transactions financières |
| `/investisseurs` | InvestisseursPage | Gestion des investisseurs |
| `/parametres` | ParametresPage | Profil admin, configuration plateforme, accès, notifications |

### Espace Investisseur

Sidebar : `InvestorSidebar.tsx` — thème géré localement par page.

| Route | Page | Description |
|---|---|---|
| `/investor-dashboard` | InvestorDashboard | ROI, statistiques, graphique Recharts, cartes motos |
| `/investor-fleet` | InvestorFleet | Mon parc automobile (onglets, recherche, grille) |
| `/investor-revenues` | RevenueHistory | Historique des revenus (filtre, pagination, export CSV, impression) |
| `/investor-reports` | InvestorReports | Rapports & analyses (filtres période, graphiques CSS, rentabilité, coûts) |
| `/investor-settings` | InvestorSettings | Profil, sécurité (mot de passe, 2FA), déconnexion |

### Espace Conducteur

Sidebar : `DriverSidebar.tsx` — thème géré localement par page.

| Route | Page | Description |
|---|---|---|
| `/driver-dashboard` | DriverDashboard | Tableau de bord (progression, paiements) |
| `/driver-payments` | DriverPayments | Historique des versements et solde restant |
| `/driver-support` | DriverSupport | FAQ, contact, signalement |
| `/driver-settings` | DriverSettings | Paramètres du compte, sécurité, notifications, langue |

## Effets visuels

- **SpotlightSection** — projecteur lumineux suivant la souris (`MagicBento.tsx`)
- **ParticleHover** — particules flottantes au survol des cartes
- **EffectCard** — tilt, magnétisme, ripple, bordure lumineuse
- **AnimatedContent** — apparition au scroll (GSAP) sur inscription/connexion et pages admin
- Les effets `MagicBento` sont surtout visibles en **dark mode**

## PWA

- Manifest : `public/manifest.webmanifest`
- Service Worker : `public/sw.js` (cache busting)
- Mode standalone, thème bleu `#2563eb`

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview    # Aperçu du build de production
npm run lint       # ESLint
```

### Accès rapide par espace (dev)

```
http://localhost:5173/dashboard          # Admin
http://localhost:5173/investor-dashboard # Investisseur
http://localhost:5173/driver-dashboard # Conducteur
```

## Docker

**Développement** (hot reload, port mappé 8081) :

```bash
docker compose up -d   # http://localhost:8081
```

Le `docker-compose.yml` utilise la cible `dev` du Dockerfile (Vite sur le port 5173, volume `./src` monté).

**Production** (nginx, port 80) :

```bash
docker build --target runner -t camerrideshare-frontend .
docker run -p 8080:80 camerrideshare-frontend
```

Build multi-stage : `deps` → `build` (`npm run build`) → `nginx:alpine` avec config SPA dans `nginx/default.conf`.

## Notes

- Toutes les données affichées sont **statiques / mockées** (MVP UI).
- Le thème clair/sombre est persisté dans `localStorage` (`theme`).
- Route inconnue (`*`) → redirection vers `/connexion`.

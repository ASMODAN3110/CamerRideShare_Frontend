# CamerRideShare

Plateforme de gestion de flotte de motos-taxis au Cameroun. Interface moderne avec espaces administrateur, investisseur et conducteur.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** — dark mode natif
- **shadcn/ui** — composants primitifs (Button, Card, Badge, Avatar, Table, Switch, Progress)
- **GSAP 3.15** — animations de particules et effets de hover (MagicBento)
- **Recharts 3.8** — graphiques (LineChart, PieChart, BarChart)
- **Lucide React** — icônes
- **React Router v7** — navigation

## Pages

### Espace Grand Patron (Admin)
| Route | Page | Description |
|---|---|---|
| `/dashboard` | DashboardPage | Statistiques globales, carte des motos, graphiques |
| `/parc` | ParcPage | Gestion du parc de motos |
| `/paiements` | PaiementsPage | Suivi des transactions financières |
| `/investisseurs` | InvestisseursPage | Gestion des investisseurs |
| `/parametres` | ParametresPage | Configuration plateforme, accès, notifications |

### Espace Investisseur
| Route | Page | Description |
|---|---|---|
| `/investor-dashboard` | InvestorDashboard | Tableau de bord (ROI, flotte) |
| `/investor-fleet` | InvestorFleet | Parc automobile détaillé |
| `/investor-revenues` | RevenueHistory | Historique des revenus |
| `/investor-reports` | InvestorReports | Rapports et analyses |
| `/investor-settings` | InvestorSettings | Paramètres du compte |

### Espace Conducteur
| Route | Page | Description |
|---|---|---|
| `/driver-dashboard` | DriverDashboard | Tableau de bord conducteur (progression, paiements) |
| `/driver-payments` | DriverPayments | Historique des versements et solde restant |
| `/driver-support` | DriverSupport | FAQ, contact direct, signalement de problèmes |
| `/driver-settings` | DriverSettings | Paramètres du compte, sécurité, notifications, langue |

### Pages publiques
| Route | Description |
|---|---|
| `/connexion` | Connexion par téléphone + mot de passe |
| `/inscription` | Inscription |

## Effets visuels

- **SpotlightSection** — projecteur lumineux suivant la souris
- **EffectCard** — particules animées, tilt, magnétisme, ripple au clic, bordure lumineuse (bleu ciel)
- Tous les effets s'activent surtout en dark mode

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build → dist/
```

## Docker

```bash
docker compose up -d   # http://localhost:8080
```

Multi-stage : deps → build → nginx:alpine (port 80). Dev : `npm run dev -- --host 0.0.0.0 --port 5173`.

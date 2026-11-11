// Captures annotées du guide de l'espace investisseur (Playwright).
//
// Prérequis : API et frontend lancés sur une base de DÉMONSTRATION (jamais la base de production), par exemple :
//   - base vide + « npx prisma migrate deploy » + « npx prisma db seed » (le seed efface la base ciblée)
//   - API : DATABASE_URL=… PORT=3001 node dist/src/main
//   - Frontend : VITE_API_PROXY_TARGET=http://localhost:3001 npx vite --host 127.0.0.1 --port 5174
// Usage : node capture.mjs <dossier-images> [figure ...]    (sans figure : toutes)
//   BASE=http://127.0.0.1:5174  INVESTOR_PHONE=690000004  INVESTOR_PASSWORD=password123  CHROME=<chemin chrome.exe>
import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.argv[2] ?? 'images'
const ONLY = process.argv.slice(3)
const BASE = process.env.BASE ?? 'http://127.0.0.1:5174'
const PHONE = process.env.INVESTOR_PHONE ?? '690000004'
const PASSWORD = process.env.INVESTOR_PASSWORD ?? 'password123'
const CHROME = process.env.CHROME ?? process.env.USERPROFILE + '/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe'
fs.mkdirSync(OUT, { recursive: true })

const ORANGE = '#E8590C'
const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
const W = 1440
const newCtx = (extra = {}) => browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1.5, locale: 'fr-FR', timezoneId: 'Africa/Douala', ...extra })

// ── Connexion : une session réutilisée par toutes les figures ───────────────
const loginCtx = await newCtx()
{
  const lp = await loginCtx.newPage()
  await lp.goto(BASE + '/connexion')
  await lp.waitForSelector('#login-phone')
  await lp.fill('#login-phone', PHONE)
  await lp.fill('#login-password', PASSWORD)
  await lp.keyboard.press('Enter')
  await lp.waitForURL('**/investor-dashboard')
  await lp.close()
}
const STATE = await loginCtx.storageState()
await loginCtx.close()

let ctx, p
const open = async (path, { h = 900, w = W, mobile = false, auth = true } = {}) => {
  if (ctx) await ctx.close()
  ctx = await newCtx({
    viewport: { width: w, height: h },
    ...(auth ? { storageState: STATE } : {}),
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  })
  p = await ctx.newPage()
  await p.goto(BASE + path)
  await p.waitForTimeout(2200)
}
const view = async (h) => { await p.setViewportSize({ width: W, height: h }); await p.waitForTimeout(600) }
const sleep = (ms) => p.waitForTimeout(ms)

// ── Repérage des éléments et dessin des repères ─────────────────────────────
const locOf = (s) => {
  const scope = s.within ? p.locator(s.within).last() : p
  let l
  if (s.role) l = scope.getByRole(s.role, { name: s.name, exact: s.exact ?? false })
  else if (s.sel) l = scope.locator(s.sel)
  else if (s.ph) l = scope.getByPlaceholder(s.ph)
  else if (s.label) l = scope.getByLabel(s.label, { exact: true })
  else l = scope.getByText(s.text, { exact: s.exact ?? true })
  return l.nth(s.nth ?? 0)
}
const rectOf = async (s) => {
  if (s.fn) { const h = await p.evaluateHandle('(' + s.fn + ')()'); return h.evaluate((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }) }
  if (s.rect) return { x: s.rect[0], y: s.rect[1], w: s.rect[2], h: s.rect[3] }
  if (s.union) {
    const rs = await Promise.all(s.union.map(rectOf))
    const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y))
    return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y }
  }
  const loc = locOf(s)
  await loc.waitFor({ state: 'visible', timeout: 8000 }).catch(() => { throw new Error('repère introuvable : ' + JSON.stringify(s)) })
  return loc.evaluate((el, up) => {
    let e = el
    if (up === 'card') {
      while (e.parentElement) {
        const cs = getComputedStyle(e)
        if (parseFloat(cs.borderTopLeftRadius) >= 8 && (cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0) && e.getBoundingClientRect().height > 60) break
        e = e.parentElement
      }
    } else if (up === 'tr') e = el.closest('tr') ?? el
    else if (up === 'dialog') e = el.closest('[role=dialog]') ?? el
    else for (let i = 0; i < (up ?? 0); i++) e = e.parentElement ?? e
    const r = e.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, s.up ?? 0)
}

const draw = async (items) => {
  await p.evaluate(([items, color]) => {
    const root = document.createElement('div')
    root.id = '__ann'
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647'
    for (const it of items) {
      const box = document.createElement('div')
      box.style.cssText = `position:absolute;left:${it.x}px;top:${it.y}px;width:${it.w}px;height:${it.h}px;border:3px solid ${color};border-radius:8px;box-shadow:0 0 0 2px #fff;box-sizing:border-box;`
      root.appendChild(box)
      const b = document.createElement('div')
      b.textContent = String(it.n)
      b.style.cssText = `position:absolute;left:${it.bx}px;top:${it.by}px;width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font:700 16px/28px Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;`
      root.appendChild(b)
    }
    document.body.appendChild(root)
  }, [items, ORANGE])
}
const undraw = () => p.evaluate(() => document.getElementById('__ann')?.remove())

/** Dessine les repères numérotés (spec.n, spec.pos : tl|tr|bl|br|l|r|t|b, spec.pad), puis photographie. */
async function snap(name, marks = [], opts = {}) {
  await sleep(500)
  const vh = await p.evaluate(() => innerHeight)
  let clip
  if (opts.of) {
    // recadrage sur un élément (dialogue, carte…) avec une tranche verticale facultative [y0, y1] relative à l'élément
    const r = await rectOf(opts.of)
    const pad = opts.pad ?? 28
    const y0 = opts.y0 ?? 0, y1 = opts.y1 ?? r.h
    clip = { x: Math.max(r.x - pad, 0), y: Math.max(r.y + y0 - pad, 0), width: r.w + 2 * pad, height: y1 - y0 + 2 * pad }
  } else if (opts.clip) clip = { ...opts.clip }
  else clip = { x: 256, y: 0, width: W - 256, height: opts.h ?? vh }
  clip.width = Math.min(clip.width, W - clip.x)
  clip.height = Math.min(clip.height, vh - clip.y)
  const items = []
  for (const m of marks) {
    const r = await rectOf(m)
    const pad = m.pad ?? 4
    const x = r.x - pad + (m.dx ?? 0), y = r.y - pad + (m.dy ?? 0), w = r.w + 2 * pad + (m.dw ?? 0), h = r.h + 2 * pad + (m.dh ?? 0)
    const pos = m.pos ?? 'tl'
    const bx = { tl: x - 14, bl: x - 14, l: x - 36, tr: x + w - 14, br: x + w - 14, r: x + w + 8, t: x + w / 2 - 14, b: x + w / 2 - 14 }[pos]
    const by = { tl: y - 14, tr: y - 14, t: y - 34, bl: y + h - 14, br: y + h - 14, b: y + h + 8, l: y + h / 2 - 14, r: y + h / 2 - 14 }[pos]
    items.push({ n: m.n, x, y, w, h, bx: Math.min(Math.max(bx, clip.x + 3), clip.x + clip.width - 31), by: Math.min(Math.max(by, clip.y + 3), clip.y + clip.height - 31) })
  }
  await draw(items)
  await p.screenshot({ path: `${OUT}/${name}.png`, clip })
  await undraw()
  console.log('ok  ', name)
}

const scrollDialog = (to) => p.evaluate((to) => {
  const d = document.querySelector('[role=dialog]')
  for (const e of [d, ...d.querySelectorAll('*')]) if (e.scrollHeight > e.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) e.scrollTop = to === 'end' ? e.scrollHeight : to
}, to)

const DLG = { within: '[role=dialog]' }
const dlgOf = { sel: '[role=dialog]', nth: 0 }
const figures = {}
const fig = (name, fn) => { figures[name] = fn }

// ═══ 1. Connexion et repères ═══════════════════════════════════════════════
fig('01-connexion', async () => {
  await open('/connexion', { auth: false })
  await snap('01-connexion', [
    { n: 1, ph: '6XX XXX XXX', up: 1, pos: 'l' },
    { n: 2, sel: '#login-password', up: 1, pos: 'l' },
    { n: 3, role: 'button', name: 'Se connecter', pos: 'l' },
    { n: 4, text: "L'accès se fait sur invitation. Contactez un administrateur pour obtenir votre lien d'inscription.", up: 'card', pos: 'l' },
  ], { clip: { x: 0, y: 0, width: W, height: 800 } })
})

fig('02-repères', async () => {
  await open('/investor-dashboard', { h: 800 })
  await snap('02-reperes', [
    { n: 1, rect: [8, 72, 240, 310], pos: 'br' },
    { n: 2, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 3, rect: [312, 14, 270, 30], pos: 'b', pad: 2 },
    { n: 4, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 5, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
    { n: 6, rect: [8, 800 - 100, 240, 92], pos: 'tr' },
    { n: 7, rect: [272, 160, W - 296, 620], pos: 'tl', pad: 0 },
  ], { clip: { x: 0, y: 0, width: W, height: 800 } })
})

fig('03-cloche', async () => {
  await open('/investor-dashboard', { h: 700 })
  await p.locator('header button').nth(1).click(); await sleep(900)
  await snap('03-cloche', [
    { n: 1, sel: 'header button', nth: 1, pos: 'l' },
    { n: 2, text: 'Tout lire', pad: 8, pos: 'tl' },
    { n: 3, text: 'Versement reçu', nth: 0, up: 3, pos: 'tl', pad: 0 },
  ], { clip: { x: 900, y: 0, width: 540, height: 560 } })
})

// ═══ 2. Tableau de bord ════════════════════════════════════════════════════
fig('04-dashboard', async () => {
  await open('/investor-dashboard', { h: 1780 })
  await snap('04-dashboard', [
    { n: 1, role: 'button', name: /Télécharger Relevé PDF/, pos: 'l' },
    { n: 2, text: 'TOTAL INVESTI', exact: false, up: 'card', pos: 'tl' },
    { n: 3, text: 'TOTAL RÉCUPÉRÉ', exact: false, up: 'card', pos: 'tl' },
    { n: 4, text: 'SOLDE NET', exact: false, up: 'card', pos: 'tl' },
    { n: 5, text: 'À REVERSER MAINTENANT', exact: false, up: 'card', pos: 'tl' },
    { n: 6, text: 'À surveiller', exact: false, nth: 0, up: 'card', pos: 'tl' },
    { n: 7, text: 'Performance des Revenus Hebdomadaires', up: 'card', pos: 'tl' },
    { n: 8, text: 'Votre Portefeuille de Flotte', pos: 'tl', pad: 8 },
  ], { h: 1700 })
})

fig('05-releve', async () => {
  await open('/investor-dashboard', { h: 700 })
  await p.getByRole('button', { name: /Télécharger Relevé PDF/ }).click(); await sleep(900)
  await snap('05-releve', [
    { n: 1, role: 'button', name: /Télécharger Relevé PDF/, pos: 'l' },
    { n: 2, text: 'Période du relevé', up: 1, pos: 'l', dh: 36 },
    { n: 3, role: 'button', name: 'Télécharger le PDF', pos: 'bl' },
  ], { clip: { x: 1000, y: 70, width: 420, height: 270 } })
})

fig('06-surveiller', async () => {
  await open('/investor-dashboard', { h: 1000 })
  await p.getByRole('button', { name: 'Détails' }).nth(1).click(); await sleep(1000)
  await snap('06-surveiller', [
    { n: 1, text: 'Remboursement par le conducteur', exact: false, ...DLG, up: 1, pos: 'tl' },
    { n: 2, text: 'semaines de retard', exact: false, ...DLG, nth: 0, pos: 'tl' },
    { n: 3, text: 'Investi ici', ...DLG, up: 1, pos: 'tl' },
    { n: 4, text: 'Vos parts', ...DLG, pos: 'tl' },
  ], { of: dlgOf, y1: 760 })
})

// ═══ 3. Mon parc ═══════════════════════════════════════════════════════════
fig('07-parc', async () => {
  await open('/investor-fleet', { h: 1300 })
  await snap('07-parc', [
    { n: 1, text: 'VÉHICULES TOTAL', exact: false, up: 'card', pos: 'tl' },
    { n: 2, text: 'EN CIRCULATION', exact: false, nth: 0, up: 'card', pos: 'tl' },
    { n: 3, text: 'EN MAINTENANCE', exact: false, up: 'card', pos: 'tl' },
    { n: 4, text: 'Tous les statuts', up: 'card', pos: 'tl' },
    { n: 5, text: 'Plus récents', up: 'card', pos: 'tl' },
    { n: 6, text: 'Zone géographique', up: 'card', pos: 'tl' },
    { n: 7, ph: 'Plaque, chauffeur…', up: 1, pos: 'tr' },
    { n: 8, text: 'REMBOURSEMENT', exact: false, nth: 1, up: 'card', pos: 'tr', pad: 0 },
  ], { h: 1000 })
})

fig('08-parc-detail', async () => {
  await open('/investor-fleet', { h: 1500 })
  await p.getByText('Détails').nth(1).click(); await sleep(1200)
  await snap('08-parc-detail-a', [
    { n: 1, text: 'Remboursement par le conducteur', exact: false, ...DLG, up: 1, pos: 'tl' },
    { n: 2, text: 'Conducteur à jour', ...DLG, up: 1, pos: 'tl' },
    { n: 3, text: 'Investi ici', ...DLG, up: 1, pos: 'tl' },
    { n: 4, text: 'Perçu', exact: true, ...DLG, up: 1, pos: 'tl' },
    { n: 5, text: 'Par semaine', exact: true, ...DLG, up: 1, pos: 'tr' },
  ], { of: dlgOf, y1: 560 })
  await snap('08-parc-detail-b', [
    { n: 6, text: 'Vos parts', exact: true, ...DLG, pos: 'tl', pad: 6 },
    { n: 7, text: 'Part du prix d\'achat', ...DLG, nth: 0, up: 2, pos: 'tr', pad: 0 },
    { n: 8, role: 'button', name: /^Contrat/, ...DLG, nth: 0, pos: 'bl' },
    { n: 9, text: 'Dernières sommes perçues', ...DLG, pos: 'tl', pad: 6 },
  ], { of: dlgOf, y0: 400, y1: 1240 })
})

// ═══ 4. Marché des parts ═══════════════════════════════════════════════════
fig('09-marche', async () => {
  await open('/investor-market', { h: 1300 })
  await snap('09-marche', [
    { n: 1, text: 'Investissement à risque', exact: false, nth: 0, up: 'card', pos: 'tl' },
    { n: 2, ph: 'Plaque, marque, modèle…', up: 1, pos: 'tl' },
    { n: 3, text: 'Ajoutés récemment', up: 1, pos: 'tr' },
    { n: 4, role: 'button', name: 'Toutes les zones', pos: 'bl' },
    { n: 5, text: 'Prix d\'achat à financer', nth: 1, up: 'card', pos: 'tl', pad: 0 },
    { n: 6, role: 'button', name: 'Investir dans ce véhicule', nth: 0, pos: 'tl' },
    { n: 7, text: 'Demande en attente', exact: false, nth: 0, pos: 'tl', pad: 5 },
  ], { h: 1000 })
})

fig('10-marche-bas', async () => {
  await open('/investor-market', { h: 2400 })
  await snap('10-marche-demandes', [
    { n: 1, text: 'Mes demandes', up: 'card', pos: 'tl' },
    { n: 2, text: 'En attente', exact: true, nth: 0, pos: 'tl', pad: 6 },
    { n: 3, role: 'button', name: 'Annuler', nth: 3, pos: 'tr' },
    { n: 4, text: 'Acceptée', exact: true, pos: 'tl', pad: 6 },
    { n: 5, text: 'Refusée', exact: true, pos: 'tl', pad: 6 },
  ], { of: { text: 'Mes demandes', up: 'card' }, pad: 14 })
})

fig('11-investir', async () => {
  await open('/investor-market', { h: 1100 })
  await p.getByRole('button', { name: 'Investir dans ce véhicule' }).first().click(); await sleep(900)
  await p.getByLabel('Montant de votre apport (XAF)').fill('100000')
  await p.locator('[data-testid=invest-risk] input').check(); await sleep(500)
  await snap('11-investir', [
    { n: 1, text: 'Montant de votre apport (XAF)', ...DLG, up: 1, pos: 'l', dh: 0 },
    { n: 2, role: 'button', name: 'Minimum', ...DLG, pos: 'bl' },
    { n: 3, role: 'button', name: 'Maximum', ...DLG, pos: 'tr' },
    { n: 4, sel: '[data-testid=invest-summary]', pos: 'tr' },
    { n: 5, sel: '[data-testid=invest-risk]', pos: 'tl' },
    { n: 6, role: 'button', name: 'Envoyer la demande', ...DLG, pos: 'b' },
  ], { of: dlgOf })
})

// ═══ 5. Historique des revenus ═════════════════════════════════════════════
fig('12-revenus', async () => {
  await open('/investor-revenues', { h: 1380 })
  await snap('12-revenus', [
    { n: 1, role: 'button', name: /Télécharger Relevé PDF/, pos: 'l' },
    { n: 2, text: 'REVENU DU MOIS', exact: false, up: 'card', pos: 'tl' },
    { n: 3, text: 'DERNIER VERSEMENT', exact: false, up: 'card', pos: 'tl' },
    { n: 4, text: 'VERSEMENT HEBDOMADAIRE', exact: false, up: 'card', pos: 'tl' },
    { n: 5, ph: 'Chauffeur ou plaque…', up: 1, pos: 'tl' },
    { n: 6, text: 'Tous les statuts', up: 1, pos: 'tl' },
    { n: 7, text: "Tout l'historique", up: 1, pos: 'tr' },
    { n: 8, text: 'À recevoir', exact: true, nth: 0, pos: 'tl', pad: 5 },
    { n: 9, role: 'button', name: /Voir le véhicule/, nth: 0, pos: 'tr' },
  ], { h: 1300 })
})

fig('13-revenus-filtres', async () => {
  await open('/investor-revenues', { h: 900 })
  await p.getByText('Tous les statuts').click(); await sleep(700)
  await snap('13-revenus-statuts', [
    { n: 1, text: 'À recevoir', exact: true, nth: 0, ...{ within: '[role=listbox]' }, pad: 6, pos: 'tr' },
    { n: 2, text: 'Déjà versées', exact: true, ...{ within: '[role=listbox]' }, pad: 6, pos: 'tr' },
  ], { clip: { x: 900, y: 500, width: 540, height: 220 } })
})

// ═══ 6. Rapports ═══════════════════════════════════════════════════════════
fig('14-rapports', async () => {
  await open('/investor-reports', { h: 2200 })
  await snap('14-rapports-a', [
    { n: 1, role: 'button', name: /Télécharger le rapport/, pos: 'l' },
    { n: 2, text: 'Filtre de période', up: 'card', pos: 'tl' },
    { n: 3, text: 'REVENUS DE LA PÉRIODE', exact: false, up: 'card', pos: 'tl' },
    { n: 4, text: 'ROI DE LA PÉRIODE', exact: false, up: 'card', pos: 'tl' },
    { n: 5, text: 'CAPITAL RÉCUPÉRÉ', exact: false, nth: 0, up: 'card', pos: 'tl' },
    { n: 6, text: 'SOLDE NET', exact: false, nth: 0, up: 'card', pos: 'tl' },
    { n: 7, text: 'Revenus perçus', exact: true, up: 'card', pos: 'tl' },
    { n: 8, text: 'Prévisions du mois prochain', up: 'card', pos: 'tr' },
  ], { clip: { x: 256, y: 0, width: W - 256, height: 1030 } })
  await snap('14-rapports-b', [
    { n: 9, text: 'Rentabilité par véhicule', up: 'card', pos: 'tl' },
    { n: 10, text: 'Répartition des revenus', up: 'card', pos: 'tl' },
  ], { clip: { x: 256, y: 1030, width: W - 256, height: 1100 } })
})

fig('15-rapports-perso', async () => {
  await open('/investor-reports', { h: 900 })
  await p.getByRole('button', { name: 'Personnalisé' }).click(); await sleep(900)
  await snap('15-rapports-perso', [
    { n: 1, role: 'button', name: 'Mois', exact: true, pos: 'tl' },
    { n: 2, role: 'button', name: 'Personnalisé', pos: 'tr' },
    { n: 3, text: 'Du', exact: true, up: 1, pos: 'bl' },
    { n: 4, text: 'Au', exact: true, up: 1, pos: 'br' },
  ], { clip: { x: 300, y: 180, width: 900, height: 250 } })
})

fig('16-previsions', async () => {
  await open('/investor-reports', { h: 1100 })
  await p.getByRole('button', { name: 'Prudent' }).click(); await sleep(800)
  await snap('16-previsions', [
    { n: 1, role: 'button', name: 'Contractuel', pos: 'tl' },
    { n: 2, role: 'button', name: 'Rythme observé', pos: 'tl' },
    { n: 3, role: 'button', name: 'Prudent', pos: 'tr' },
    { n: 4, text: 'ESTIMATION DES REVENUS', exact: false, up: 1, pos: 'tl' },
    { n: 5, text: 'RENDEMENT SUR 30 JOURS', exact: false, up: 1, pos: 'bl' },
    { n: 6, text: 'CAPITAL RÉCUPÉRÉ DANS', exact: false, up: 1, pos: 'br' },
  ], { of: { text: 'Prévisions du mois prochain', up: 'card' }, pad: 14 })
})

// ═══ 7. Paramètres ═════════════════════════════════════════════════════════
fig('17-parametres', async () => {
  await open('/investor-settings', { h: 700 })
  await snap('17-parametres-profil', [
    { n: 1, role: 'tab', name: 'Profil', pos: 'tl' },
    { n: 2, text: 'Prendre une photo', up: 1, pos: 'l' },
    { n: 3, text: 'Nom complet', up: 1, pos: 'tr' },
    { n: 4, text: 'Numéro de téléphone', up: 1, pos: 'tr' },
    { n: 5, text: 'Adresse e-mail', up: 1, pos: 'tr' },
    { n: 6, role: 'button', name: 'Modifier', pos: 'tr' },
    { n: 7, role: 'button', name: 'Enregistrer les modifications', pos: 't' },
  ], { h: 700 })

  await p.getByRole('tab', { name: 'Notifications' }).click(); await sleep(900)
  await snap('18-parametres-notifications', [
    { n: 1, text: 'Rapport hebdomadaire par e-mail', up: 'card', pos: 'tl', pad: 0 },
    { n: 2, text: 'Revenus et reversements', up: 'card', pos: 'tl', pad: 0 },
    { n: 3, text: 'État des véhicules', up: 'card', pos: 'tl', pad: 0 },
    { n: 4, text: 'Les décisions sur vos demandes de parts', exact: false, pos: 'tl' },
    { n: 5, role: 'button', name: 'Envoyer le rapport maintenant', pos: 'b' },
  ], { clip: { x: 256, y: 0, width: W - 256, height: 600 } })

  await p.getByRole('tab', { name: 'Compte' }).click(); await sleep(900)
  await snap('19-parametres-compte', [
    { n: 1, text: 'Mon compte investisseur', up: 'card', pos: 'tl' },
    { n: 2, text: 'Thème sombre', up: 2, pos: 'tl' },
    { n: 3, role: 'button', name: 'Déconnexion', nth: 1, pos: 'tl' },
  ], { clip: { x: 256, y: 0, width: W - 256, height: 800 } })
})

// ═══ 8. Téléphone et installation ══════════════════════════════════════════
fig('20-mobile', async () => {
  await open('/investor-dashboard', { w: 390, h: 844, mobile: true })
  const full = { x: 0, y: 0, width: 390, height: 844 }
  await snap('20-mobile-a', [
    { n: 1, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 2, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 3, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
  ], { clip: full })
  await p.locator('header button').first().click(); await sleep(900)
  await snap('20-mobile-b', [
    { n: 4, rect: [8, 70, 276, 400], pos: 'tr', pad: 0 },
    { n: 5, rect: [8, 756, 276, 84], pos: 'tr', pad: 0 },
    { n: 6, rect: [296, 4, 90, 836], pos: 'b', pad: 0 },
  ], { clip: full })
})

const fireInstall = () => p.evaluate(() => {
  const e = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(e, { prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }) })
  window.dispatchEvent(e)
})

fig('21-installation', async () => {
  await open('/investor-dashboard', { h: 800 })
  await fireInstall()
  await p.waitForSelector('[data-testid="install-app"]', { timeout: 6000 })
  await snap('21-installation-bureau', [
    { n: 1, sel: '[data-testid="install-app"]', pos: 'r', pad: 6 },
    { n: 2, text: 'Déconnexion', pos: 'r', pad: 6 },
  ], { clip: { x: 0, y: 620, width: 420, height: 180 } })
})

// ═══ Exécution ═════════════════════════════════════════════════════════════
let failed = 0
for (const [name, fn] of Object.entries(figures)) {
  if (ONLY.length && !ONLY.some((o) => name.startsWith(o))) continue
  try { await fn() } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]) }
}
await browser.close()
console.log(failed ? `${failed} figure(s) en échec` : 'terminé')

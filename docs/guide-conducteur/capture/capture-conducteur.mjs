// Captures annotées du guide de l'espace conducteur (Playwright).
//
// Prérequis : API et frontend lancés sur une base de DÉMONSTRATION (jamais la base de production), par exemple :
//   - base vide + « npx prisma migrate deploy » + « npx prisma db seed » (le seed efface la base ciblée)
//   - API : DATABASE_URL=… PORT=3001 node dist/src/main
//   - Frontend : VITE_API_PROXY_TARGET=http://localhost:3001 npx vite --host 127.0.0.1 --port 5174
// Usage : node capture.mjs <dossier-images> [figure ...]    (sans figure : toutes)
//   BASE=http://127.0.0.1:5174  DRIVER_PHONE=690000011  DRIVER_PASSWORD=password123  LATE_DRIVER_PHONE=690000012  CHROME=<chemin chrome.exe>
import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.argv[2] ?? 'images'
const ONLY = process.argv.slice(3)
const BASE = process.env.BASE ?? 'http://127.0.0.1:5174'
const PHONE = process.env.DRIVER_PHONE ?? '690000011'
const LATE_PHONE = process.env.LATE_DRIVER_PHONE ?? '690000012'
const PASSWORD = process.env.DRIVER_PASSWORD ?? 'password123'
const CHROME = process.env.CHROME ?? process.env.USERPROFILE + '/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe'
fs.mkdirSync(OUT, { recursive: true })

const ORANGE = '#E8590C'
const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
const W = 1440
const newCtx = (extra = {}) => browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1.5, locale: 'fr-FR', timezoneId: 'Africa/Douala', ...extra })

// ── Connexion : une session par conducteur, réutilisée par les figures ─────
const sessions = {}
const sessionOf = async (phone) => {
  if (sessions[phone]) return sessions[phone]
  const c = await newCtx()
  const lp = await c.newPage()
  await lp.goto(BASE + '/connexion')
  await lp.waitForSelector('#login-phone')
  await lp.fill('#login-phone', phone)
  await lp.fill('#login-password', PASSWORD)
  await lp.keyboard.press('Enter')
  await lp.waitForURL('**/driver-dashboard')
  sessions[phone] = await c.storageState()
  await c.close()
  return sessions[phone]
}

let ctx, p
const open = async (path, { h = 900, w = W, mobile = false, auth = true, phone = PHONE } = {}) => {
  const state = auth ? await sessionOf(phone) : null
  if (ctx) await ctx.close()
  ctx = await newCtx({
    viewport: { width: w, height: h },
    ...(auth ? { storageState: state } : {}),
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
  await open('/driver-dashboard', { h: 800 })
  await snap('02-reperes', [
    { n: 1, rect: [8, 72, 240, 210], pos: 'br' },
    { n: 2, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 3, rect: [312, 14, 270, 30], pos: 'b', pad: 2 },
    { n: 4, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 5, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
    { n: 6, rect: [8, 800 - 100, 240, 92], pos: 'tr' },
    { n: 7, rect: [272, 160, W - 296, 620], pos: 'tl', pad: 0 },
  ], { clip: { x: 0, y: 0, width: W, height: 800 } })
})

fig('03-cloche', async () => {
  await open('/driver-dashboard', { h: 700 })
  await p.locator('header button').nth(1).click(); await sleep(900)
  await snap('03-cloche', [
    { n: 1, sel: 'header button', nth: 1, pos: 'l' },
    { n: 2, text: 'Tout lire', pad: 8, pos: 'tl' },
    { n: 3, text: 'Paiement enregistré', nth: 0, up: 3, pos: 'tl', pad: 0 },
  ], { clip: { x: 900, y: 0, width: 540, height: 520 } })
})

// ═══ 2. Tableau de bord ════════════════════════════════════════════════════
fig('04-dashboard', async () => {
  await open('/driver-dashboard', { h: 1800 })
  await snap('04-dashboard', [
    { n: 1, text: 'Progression', up: 'card', pos: 'tl' },
    { n: 2, text: 'Reste à payer', exact: true, up: 'card', pos: 'tl' },
    { n: 3, text: 'Mon contrat', up: 'card', pos: 'tl' },
    { n: 4, text: 'Statut', exact: true, up: 'card', pos: 'tl' },
    { n: 5, text: 'Mes retards', up: 'card', pos: 'tr' },
    { n: 6, text: 'Paiements Récents', up: 'card', pos: 'tl' },
  ], { h: 1450 })
})

fig('05-statut-retard', async () => {
  await open('/driver-dashboard', { h: 1350, phone: LATE_PHONE })
  await snap('05-statut-retard', [
    { n: 1, text: 'Statut', exact: true, up: 'card', pos: 'tl' },
    { n: 2, text: 'En retard', exact: true, pos: 'tl', pad: 6 },
    { n: 3, text: '3 semaines de retard', exact: false, pos: 'tl', pad: 4 },
    { n: 4, text: 'Mes retards', up: 'card', pos: 'tr' },
    { n: 5, text: 'À régulariser', exact: true, nth: 0, pos: 'tl', pad: 6 },
    { n: 6, text: 'Régularisé', exact: true, nth: 0, pos: 'tl', pad: 6 },
  ], { h: 1300 })
})

fig('06-retards-filtre', async () => {
  await open('/driver-dashboard', { h: 900 })
  await p.getByText('Tous les retards').click(); await sleep(800)
  await snap('06-retards-filtre', [], { clip: { x: 800, y: 180, width: 640, height: 300 } })
})

fig('07-contrat-signaler', async () => {
  await open('/driver-dashboard', { h: 1300 })
  await snap('07-contrat-signaler', [
    { n: 1, role: 'button', name: /Télécharger mon contrat/, pos: 'tl' },
    { n: 2, role: 'button', name: 'Signaler un problème', pos: 'tl' },
  ], { clip: { x: 256, y: 760, width: 560, height: 400 } })
})

fig('08-signaler-modale', async () => {
  await open('/driver-dashboard', { h: 1000 })
  await p.getByRole('button', { name: 'Signaler un problème' }).click(); await sleep(900)
  await p.locator('[role=dialog] textarea').fill('Le moteur ne démarre plus depuis ce matin.')
  await snap('08-signaler-modale', [
    { n: 1, sel: '[role=dialog] textarea', pos: 'tl' },
    { n: 2, role: 'button', name: 'Annuler', ...DLG, pos: 'tl' },
    { n: 3, sel: '[role=dialog] button[type=submit], [role=dialog] button:has-text("Envoyer")', nth: 0, pos: 'tr' },
  ], { of: dlgOf })
})

// ═══ 3. Mes paiements ══════════════════════════════════════════════════════
fig('09-paiements', async () => {
  await open('/driver-payments', { h: 1300 })
  await snap('09-paiements', [
    { n: 1, role: 'button', name: 'Déclarer un paiement', pos: 'l' },
    { n: 2, text: 'Total Payé', up: 'card', pos: 'tl' },
    { n: 3, text: 'Reste à payer', exact: true, up: 'card', pos: 'tl' },
    { n: 4, text: 'Dernier Versement', up: 'card', pos: 'tl' },
    { n: 5, ph: 'Montant exact…', up: 1, pos: 'tl' },
    { n: 6, text: 'Tous les statuts', up: 1, pos: 'tl' },
    { n: 7, text: 'Tous les moyens', up: 1, pos: 'tr' },
    { n: 8, text: 'Voir', exact: true, nth: 0, pos: 'tl', pad: 6 },
    { n: 9, text: 'En attente', exact: true, nth: 0, pos: 'tl', pad: 6 },
    { n: 10, sel: 'button:has(svg.lucide-trash-2)', nth: 0, pos: 'tr', pad: 6 },
  ], { h: 1230 })
})

fig('10-declarer', async () => {
  await open('/driver-payments', { h: 1000 })
  await p.getByRole('button', { name: 'Déclarer un paiement' }).click(); await sleep(900)
  await p.getByLabel('Montant (FCFA)').fill('27500')
  await p.getByText('Choisir un moyen de paiement').click(); await sleep(500)
  await p.getByRole('option', { name: /MTN Money/ }).click(); await sleep(500)
  await snap('10-declarer', [
    { n: 1, text: 'Montant (FCFA)', ...DLG, up: 1, pos: 'l' },
    { n: 2, text: 'Moyen de paiement', exact: true, ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Preuve de paiement', exact: false, ...DLG, up: 1, pos: 'l' },
    { n: 4, role: 'button', name: 'Envoyer', exact: true, ...DLG, pos: 'tr' },
  ], { of: dlgOf })
})

fig('11-filtres', async () => {
  await open('/driver-payments', { h: 900 })
  await p.getByText('Tous les statuts').click(); await sleep(700)
  await snap('11-statuts', [
    { n: 1, text: 'Validés', exact: true, within: '[role=listbox]', pos: 'tr', pad: 6 },
    { n: 2, text: 'En attente', exact: true, within: '[role=listbox]', pos: 'tr', pad: 6 },
    { n: 3, text: 'Refusés', exact: true, within: '[role=listbox]', pos: 'tr', pad: 6 },
  ], { clip: { x: 900, y: 440, width: 540, height: 280 } })
})

fig('12-retirer', async () => {
  await open('/driver-payments', { h: 900 })
  await p.locator('button:has(svg.lucide-trash-2)').first().click(); await sleep(800)
  await snap('12-retirer', [
    { n: 1, role: 'button', name: 'Annuler', within: '[role=alertdialog]', pos: 'tl' },
    { n: 2, role: 'button', name: /Retirer/, within: '[role=alertdialog]', pos: 'tr' },
  ], { of: { sel: '[role=alertdialog]', nth: 0 } })
})

// ═══ 4. Support ════════════════════════════════════════════════════════════
fig('13-support', async () => {
  await open('/driver-support', { h: 1180 })
  await snap('13-support', [
    { n: 1, text: 'Foire Aux Questions', up: 'card', pos: 'tl' },
    { n: 2, text: 'Contact Direct', up: 'card', pos: 'tl' },
    { n: 3, text: 'Signaler un problème', exact: true, nth: 0, up: 'card', pos: 'tr' },
    { n: 4, text: 'Mes signalements', up: 'card', pos: 'tr' },
  ], { h: 1120 })
})

fig('14-faq', async () => {
  await open('/driver-support', { h: 1000 })
  await p.getByText('Que se passe-t-il si je suis en retard ?').click(); await sleep(900)
  await snap('14-faq', [
    { n: 1, ph: 'Rechercher une question…', up: 1, pos: 'tl' },
    { n: 2, text: 'Que se passe-t-il si je suis en retard ?', pos: 'tl' },
  ], { clip: { x: 300, y: 170, width: 560, height: 520 } })
})

fig('15-signalement', async () => {
  await open('/driver-support', { h: 1000 })
  await p.getByText('Sélectionnez une catégorie').click(); await sleep(700)
  await p.getByRole('option', { name: 'Panne mécanique' }).click(); await sleep(400)
  await p.getByPlaceholder(/Décrivez votre problème/).fill('Le moteur ne démarre plus depuis ce matin.')
  await snap('15-signalement', [
    { n: 1, text: 'Catégorie', exact: false, nth: 0, up: 1, pos: 'tl' },
    { n: 2, text: 'Description', exact: false, nth: 0, up: 1, pos: 'tl' },
    { n: 3, text: 'Photo (optionnel)', exact: false, nth: 0, up: 1, pos: 'tl' },
    { n: 4, role: 'button', name: 'Envoyer le signalement', pos: 'tr' },
  ], { of: { text: 'Signaler un problème', exact: true, nth: 0, up: 'card' }, pad: 14 })
})

fig('16-categories', async () => {
  await open('/driver-support', { h: 900 })
  await p.getByText('Sélectionnez une catégorie').click(); await sleep(700)
  await snap('16-categories', [], { clip: { x: 850, y: 300, width: 580, height: 300 } })
})

fig('17-signalements', async () => {
  await open('/driver-support', { h: 1180 })
  await snap('17-signalements', [
    { n: 1, text: 'En cours de traitement', exact: true, nth: 0, pos: 'tl', pad: 6 },
    { n: 2, text: 'Photo jointe', exact: true, pos: 'tl', pad: 4 },
    { n: 3, text: 'Résolu', exact: true, nth: 0, pos: 'tl', pad: 6 },
  ], { of: { text: 'Mes signalements', exact: true, up: 'card' }, pad: 14 })
})

// ═══ 5. Paramètres ═════════════════════════════════════════════════════════
fig('18-parametres', async () => {
  await open('/driver-settings', { h: 700 })
  await snap('18-parametres-profil', [
    { n: 1, role: 'tab', name: 'Profil', pos: 'tl' },
    { n: 2, text: 'Prendre une photo', up: 1, pos: 'l' },
    { n: 3, text: 'Nom complet', up: 1, pos: 'tr' },
    { n: 4, text: 'Numéro de téléphone', up: 1, pos: 'tr' },
    { n: 5, text: 'Adresse e-mail', up: 1, pos: 'tr' },
    { n: 6, role: 'button', name: 'Modifier', pos: 'tr' },
    { n: 7, role: 'button', name: 'Enregistrer les modifications', pos: 't' },
  ], { h: 700 })

  await p.getByRole('tab', { name: 'Notifications' }).click(); await sleep(900)
  await snap('19-parametres-notifications', [
    { n: 1, text: 'Suivi de mes paiements', up: 'card', pos: 'tl', pad: 0 },
    { n: 2, text: 'Rappel de versement', up: 'card', pos: 'tl', pad: 0 },
    { n: 3, text: 'Les notifications qui engagent votre contrat', exact: false, pos: 'tl' },
  ], { clip: { x: 256, y: 0, width: W - 256, height: 520 } })

  await p.getByRole('tab', { name: 'Compte' }).click(); await sleep(900)
  await snap('20-parametres-compte', [
    { n: 1, text: 'Mon compte conducteur', up: 'card', pos: 'tl' },
    { n: 2, text: 'Thème sombre', up: 2, pos: 'tl' },
    { n: 3, role: 'button', name: 'Se déconnecter', pos: 'tl' },
  ], { clip: { x: 256, y: 0, width: W - 256, height: 520 } })
})

// ═══ 6. Téléphone et installation ══════════════════════════════════════════
fig('21-mobile', async () => {
  await open('/driver-dashboard', { w: 390, h: 844, mobile: true })
  const full = { x: 0, y: 0, width: 390, height: 844 }
  await snap('21-mobile-a', [
    { n: 1, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 2, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 3, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
  ], { clip: full })
  await p.locator('header button').first().click(); await sleep(900)
  await snap('21-mobile-b', [
    { n: 4, rect: [8, 70, 276, 230], pos: 'tr', pad: 0 },
    { n: 5, rect: [8, 756, 276, 84], pos: 'tr', pad: 0 },
    { n: 6, rect: [296, 4, 90, 836], pos: 'b', pad: 0 },
  ], { clip: full })
})

fig('22-mobile-paiement', async () => {
  await open('/driver-payments', { w: 390, h: 844, mobile: true })
  await p.getByRole('button', { name: 'Déclarer un paiement' }).click(); await sleep(900)
  const full = { x: 0, y: 0, width: 390, height: 844 }
  await snap('22-mobile-paiement', [
    { n: 1, text: 'Montant (FCFA)', ...DLG, up: 1, pos: 'tl' },
    { n: 2, text: 'Preuve de paiement', exact: false, ...DLG, up: 1, pos: 'tl' },
    { n: 3, role: 'button', name: 'Prendre une photo', ...DLG, pos: 'bl' },
  ], { clip: full })
})

const fireInstall = () => p.evaluate(() => {
  const e = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(e, { prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }) })
  window.dispatchEvent(e)
})

fig('23-installation', async () => {
  await open('/driver-dashboard', { h: 800 })
  await fireInstall()
  await p.waitForSelector('[data-testid="install-app"]', { timeout: 6000 })
  await snap('23-installation-bureau', [
    { n: 1, sel: '[data-testid="install-app"]', pos: 'r', pad: 6 },
    { n: 2, text: 'Déconnexion', pos: 'r', pad: 6 },
  ], { clip: { x: 0, y: 650, width: 330, height: 150 } })
})

// ═══ Exécution ═════════════════════════════════════════════════════════════
let failed = 0
for (const [name, fn] of Object.entries(figures)) {
  if (ONLY.length && !ONLY.some((o) => name.startsWith(o))) continue
  try { await fn() } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]) }
}
await browser.close()
console.log(failed ? `${failed} figure(s) en échec` : 'terminé')

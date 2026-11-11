// Captures annotées du guide de l'espace administrateur (Playwright).
//
// Prérequis : API et frontend lancés sur une base de DÉMONSTRATION (jamais la base de production), par exemple :
//   - base vide + « npx prisma migrate deploy » + « npx prisma db seed » (le seed efface la base ciblée)
//   - API : DATABASE_URL=… PORT=3001 node dist/src/main
//   - Frontend : VITE_API_PROXY_TARGET=http://localhost:3001 npx vite --host 127.0.0.1 --port 5174
// Usage : node capture.mjs <dossier-images> [figure ...]    (sans figure : toutes)
//   BASE=http://127.0.0.1:5174  ADMIN_PHONE=692100263  ADMIN_PASSWORD=password123  CHROME=<chemin chrome.exe>
import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.argv[2] ?? 'images'
const ONLY = process.argv.slice(3)
const BASE = process.env.BASE ?? 'http://127.0.0.1:5174'
const PHONE = process.env.ADMIN_PHONE ?? '692100263'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'password123'
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
  await lp.waitForURL('**/dashboard')
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
  ], { clip: { x: 0, y: 0, width: 1280, height: 800 } })
})

fig('02-repères', async () => {
  await open('/dashboard', { h: 800 })
  await snap('02-reperes', [
    { n: 1, rect: [8, 72, 240, 470], pos: 'br' },
    { n: 2, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 3, rect: [312, 14, 270, 30], pos: 'b', pad: 2 },
    { n: 4, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 5, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
    { n: 6, rect: [8, 800 - 100, 240, 92], pos: 'tr' },
    { n: 7, rect: [272, 160, W - 296, 620], pos: 'tl', pad: 0 },
  ], { clip: { x: 0, y: 0, width: W, height: 800 } })
})

// ═══ 2. Tableau de bord ════════════════════════════════════════════════════
fig('03-dashboard', async () => {
  await open('/dashboard', { h: 1800 })
  await snap('03-dashboard', [
    { n: 1, union: [{ text: 'Parc total', up: 'card' }, { text: 'Revenu mensuel', up: 'card' }], pos: 'tl' },
    { n: 2, text: 'État du parc', up: 'card', pos: 'tl' },
    { n: 3, text: 'Trésorerie hebdomadaire', up: 'card', pos: 'tr' },
    { n: 4, text: 'Alertes critiques', up: 'card', pos: 'tr' },
    { n: 5, union: [{ role: 'button', name: 'Saisir un paiement' }, { role: 'button', name: 'Ajouter un utilisateur' }], pos: 'tl' },
    { n: 6, text: 'Transactions récentes', up: 'card', pos: 'tl' },
  ], { h: 1780 })
})

fig('04-incident-détail', async () => {
  await open('/dashboard', { h: 1100 })
  await p.getByText('Détails').first().click(); await sleep(800)
  await snap('04-incident-detail', [
    { n: 1, text: 'Véhicule concerné', up: 1, pos: 'tl' },
    { n: 2, text: 'Description', up: 1, pos: 'tl' },
    { n: 3, role: 'button', name: 'Marquer comme résolu', ...DLG, pos: 'tl' },
    { n: 4, role: 'button', name: 'Voir dans le parc', ...DLG, pos: 'tr' },
  ], { of: dlgOf })
})

fig('05-cloche', async () => {
  await open('/dashboard', { h: 700 })
  await p.locator('header button').nth(1).click(); await sleep(900)
  await snap('05-cloche', [
    { n: 1, sel: 'header button', nth: 1, pos: 'l' },
    { n: 2, text: 'Tout lire', pad: 8, pos: 'tl' },
    { n: 3, text: 'Nouvel incident', nth: 0, up: 3, pos: 'l', pad: 0 },
    { n: 4, text: 'Paiements en attente', nth: 0, up: 3, pos: 'l', pad: 0 },
  ], { clip: { x: 900, y: 0, width: 540, height: 520 } })
})

// ═══ 3. Actions rapides ════════════════════════════════════════════════════
fig('06-saisir-paiement', async () => {
  await open('/dashboard', { h: 1000 })
  await p.getByRole('button', { name: 'Saisir un paiement' }).first().click(); await sleep(700)
  await p.getByRole('combobox').first().click(); await sleep(700)
  await p.locator('[role=option]').first().click(); await sleep(500)
  await p.getByPlaceholder('Ex : 15000').fill('27500')
  await p.getByRole('combobox', { name: /moyen/i }).click().catch(async () => { await p.getByText('Choisir un moyen de paiement').click() })
  await sleep(500)
  await p.getByRole('option', { name: /Orange Money/ }).click(); await sleep(500)
  await snap('06-saisir-paiement', [
    { n: 1, text: 'Chauffeur', ...DLG, up: 1, pos: 'l' },
    { n: 2, role: 'button', name: 'Paiement', exact: true, ...DLG, up: 1, pos: 'l' },
    { n: 3, ph: 'Ex : 15000', pos: 'l' },
    { n: 4, text: 'Moyen de paiement', ...DLG, up: 1, pos: 'l' },
    { n: 5, role: 'button', name: 'Valider le paiement', pos: 'b' },
  ], { of: dlgOf })
})

fig('07-signaler-incident', async () => {
  await open('/dashboard', { h: 1000 })
  await p.getByRole('button', { name: 'Signaler un incident' }).click(); await sleep(700)
  await p.getByRole('combobox').first().click(); await sleep(700)
  await p.locator('[role=option]').first().click(); await sleep(400)
  await p.getByPlaceholder(/Accident, Vol, Panne/).fill('Panne mécanique')
  await p.getByPlaceholder(/Décrivez l'incident/).fill('Le moteur ne démarre plus depuis ce matin.')
  await snap('07-signaler-incident', [
    { n: 1, text: 'Chauffeur', ...DLG, up: 1, pos: 'l' },
    { n: 2, text: "Type d'incident", ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Description', ...DLG, up: 1, pos: 'l' },
    { n: 4, role: 'button', name: "Signaler l'incident", pos: 'b' },
  ], { of: dlgOf })
})

fig('08-ajouter-utilisateur', async () => {
  await open('/dashboard', { h: 1000 })
  await p.getByRole('button', { name: 'Ajouter un utilisateur' }).click(); await sleep(700)
  await snap('08-ajouter-utilisateur-a', [
    { n: 1, union: [{ text: 'Inviter par email' }, { text: 'Créer le compte' }], pos: 'l' },
    { n: 2, text: 'Rôle', ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Adresse email', ...DLG, up: 1, pos: 'l' },
    { n: 4, role: 'button', name: "Envoyer l'invitation", pos: 'b' },
  ], { of: dlgOf })
  await p.getByText('Créer le compte', { exact: true }).click(); await sleep(700)
  await snap('08-ajouter-utilisateur-b', [], { of: dlgOf })
})

// ═══ 4. Parc ═══════════════════════════════════════════════════════════════
fig('09-parc', async () => {
  await open('/parc', { h: 1100 })
  await snap('09-parc', [
    { n: 1, role: 'button', name: 'Ajouter un véhicule', pos: 'b' },
    { n: 2, union: [{ text: 'Total véhicules', up: 'card' }, { text: 'Incidents', up: 'card' }], pos: 'tl' },
    { n: 3, ph: /Immatriculation, marque/, up: 1, pos: 'bl' },
    { n: 4, union: [{ text: 'Statut : tous', up: 1 }, { text: 'Chauffeur : tous', up: 1 }], pos: 'tr' },
    { n: 5, text: 'Détails', nth: 0, up: 'card', pos: 'tl' },
  ], { h: 760 })
})

fig('10-parc-ajout', async () => {
  await open('/parc', { h: 1800 })
  await p.getByRole('button', { name: 'Ajouter un véhicule' }).click(); await sleep(800)
  await snap('10-parc-ajout', [
    { n: 1, text: 'Immatriculation', ...DLG, up: 1, pos: 'l' },
    { n: 2, text: 'Type de véhicule', ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Ville', ...DLG, up: 1, pos: 'l' },
    { n: 4, text: 'Montant cible (XAF)', exact: false, ...DLG, up: 1, pos: 'l' },
    { n: 5, text: 'Versement par semaine (XAF)', exact: false, ...DLG, up: 1, pos: 'l' },
    { n: 6, text: 'Parts des investisseurs', ...DLG, up: 3, pos: 'l' },
  ], { of: dlgOf, y1: 1000 })
})

fig('11-parc-detail', async () => {
  await open('/parc', { h: 1300 })
  await p.getByPlaceholder(/Immatriculation, marque/).fill('LT 1001'); await sleep(1500)
  await p.getByText('Détails').first().click(); await sleep(1200)
  await snap('11-parc-detail-a', [
    { n: 1, text: 'Progression propriété', ...DLG, up: 1, pos: 'tl' },
    { n: 2, text: 'Calendrier', ...DLG, up: 1, pos: 'tl' },
    { n: 3, text: 'Chauffeur', ...DLG, nth: 0, up: 1, pos: 'tl' },
    { n: 4, text: 'Incidents ouverts', ...DLG, up: 1, pos: 'tl' },
  ], { of: dlgOf })
  await scrollDialog('end'); await sleep(500)
  await snap('11-parc-detail-b', [
    { n: 5, text: 'Statut', ...DLG, nth: 0, up: 1, pos: 'tl' },
    { n: 6, text: 'Contrats et tournée', ...DLG, up: 1, pos: 'tl' },
    { n: 7, text: 'Parts des investisseurs', ...DLG, up: 2, pos: 'tl' },
    { n: 8, role: 'button', name: 'Retirer du parc', ...DLG, pos: 'tl' },
  ], { of: dlgOf })
})

// ═══ 5. Paiements ══════════════════════════════════════════════════════════
fig('12-paiements', async () => {
  await open('/paiements', { h: 1100 })
  await snap('12-paiements', [
    { n: 1, role: 'button', name: 'Saisir un paiement', pos: 'b' },
    { n: 2, union: [{ text: 'Total collecté (mois)', up: 'card' }, { text: 'Taux de recouvrement', up: 'card' }], pos: 'tl' },
    { n: 3, ph: 'Conducteur ou montant…', up: 1, pos: 'bl' },
    { n: 4, union: [{ text: 'Tous les statuts', up: 1 }, { text: 'Tous les moyens', up: 1 }], pos: 'tr' },
    { n: 5, text: 'En attente', nth: 0, pos: 'tl', pad: 6 },
    { n: 6, text: 'Détails', nth: 0, pos: 'tr', pad: 6 },
  ], { h: 760 })
})

fig('13-paiement-preuve', async () => {
  await open('/paiements', { h: 1300 })
  await p.getByText('Détails').nth(1).click(); await sleep(1200)
  await snap('13-paiement-preuve', [
    { n: 1, text: 'Montant', ...DLG, up: 2, pos: 'tl' },
    { n: 2, text: 'Preuve de paiement jointe par le chauffeur', ...DLG, up: 1, pos: 'tl' },
    { n: 3, role: 'button', name: 'Refuser', ...DLG, pos: 'tl' },
    { n: 4, role: 'button', name: 'Valider', exact: true, ...DLG, pos: 'tr' },
  ], { of: dlgOf })
})

fig('14-paiement-refus', async () => {
  await open('/paiements', { h: 1300 })
  await p.getByText('Détails').first().click(); await sleep(900)
  await p.getByRole('button', { name: 'Refuser' }).click(); await sleep(500)
  await p.locator('[role=dialog] textarea').fill('Preuve illisible : merci de renvoyer une photo plus nette.')
  await snap('14-paiement-refus', [
    { n: 1, text: 'Motif du refus', exact: false, ...DLG, up: 1, pos: 'l' },
    { n: 2, role: 'button', name: 'Confirmer le refus', pos: 'b' },
  ], { of: dlgOf })
})

// ═══ 6. Investisseurs ══════════════════════════════════════════════════════
fig('15-investisseurs', async () => {
  await open('/investisseurs', { h: 1100 })
  await snap('15-investisseurs', [
    { n: 1, role: 'button', name: 'Ajouter un utilisateur', pos: 'b' },
    { n: 2, union: [{ text: 'Capital total investi', up: 'card' }, { text: 'Véhicules financés', up: 'card' }], pos: 'tl' },
    { n: 3, ph: 'Rechercher par nom…', up: 1, pos: 'bl' },
    { n: 4, text: 'Tous les statuts', up: 1, pos: 'tr' },
    { n: 5, sel: 'thead th', nth: 2, pos: 'tl', pad: 2 },
    { n: 6, text: 'Voir profil', nth: 1, pos: 'tl', pad: 6 },
  ], { h: 800 })
})

fig('16-investisseur-profil', async () => {
  await open('/investisseurs', { h: 1500 })
  await p.getByText('Voir profil').nth(1).click(); await sleep(1200)
  await snap('16-investisseur-profil', [
    { n: 1, text: 'Capital investi', ...DLG, up: 1, pos: 'tl' },
    { n: 2, text: 'Reste à reverser', ...DLG, up: 1, pos: 'tr' },
    { n: 3, text: 'Parts détenues', ...DLG, pos: 'l' },
    { n: 4, role: 'button', name: /Contrat de cette part/, nth: 0, ...DLG, pos: 'tl' },
    { n: 5, role: 'button', name: /Résilier ce contrat/, nth: 0, ...DLG, pos: 'tr' },
  ], { of: dlgOf, y1: 800 })
})

fig('17-part-resilier', async () => {
  await open('/investisseurs', { h: 1500 })
  await p.getByText('Voir profil').nth(1).click(); await sleep(1000)
  await p.getByRole('button', { name: /Résilier ce contrat/ }).first().click(); await sleep(900)
  await snap('17-part-resilier', [
    { n: 1, text: 'Motif', ...DLG, exact: true, up: 1, pos: 'l' },
    { n: 2, text: "Capital remboursé à l'investisseur (XAF)", ...DLG, up: 1, pos: 'l' },
    { n: 3, role: 'button', name: 'Non récupéré', ...DLG, pos: 'r' },
    { n: 4, text: "Affecter l'investisseur à un autre véhicule", ...DLG, up: 1, pos: 'l' },
    { n: 5, role: 'button', name: 'Résilier le contrat', ...DLG, pos: 'b' },
  ], { of: { sel: '[role=dialog]', nth: 1 } })
})

// ═══ 7. Demandes de parts ══════════════════════════════════════════════════
fig('18-demandes', async () => {
  await open('/demandes-parts', { h: 900 })
  await snap('18-demandes', [
    { n: 1, ph: 'Rechercher un investisseur ou une moto…', up: 1, pos: 'bl' },
    { n: 2, text: 'En attente', exact: true, nth: 0, up: 1, pos: 'tr' },
    { n: 3, text: 'Entrée tardive · semaine 20 · rattrapage 104 500 XAF', exact: false, nth: 0, pos: 'br', pad: 3 },
    { n: 4, role: 'button', name: 'Accepter', nth: 0, pos: 'tl' },
    { n: 5, role: 'button', name: 'Refuser', nth: 0, pos: 'tr' },
  ], { h: 700 })
})

fig('19-demande-accepter', async () => {
  await open('/demandes-parts', { h: 1100 })
  await p.getByRole('button', { name: 'Accepter' }).first().click(); await sleep(900)
  await snap('19-demande-accepter', [
    { n: 1, text: 'La moto a déjà', exact: false, ...DLG, up: 'card', pos: 'tl' },
    { n: 2, text: 'Retour contractuel (160 %)', ...DLG, up: 'card', pos: 'tl' },
    { n: 3, role: 'button', name: "Accepter l'entrée", pos: 'tr' },
  ], { of: dlgOf })
})

// ═══ 8. Reversements ═══════════════════════════════════════════════════════
fig('20-reversements', async () => {
  await open('/reversements', { h: 1000 })
  await p.getByText('À verser uniquement').click(); await sleep(1000)
  await snap('20-reversements', [
    { n: 1, text: 'Total exigible :', exact: false, pos: 'l' },
    { n: 2, ph: 'Rechercher un investisseur…', up: 1, pos: 'bl' },
    { n: 3, text: 'Tous les modes', up: 1, pos: 'tr' },
    { n: 4, text: 'À verser uniquement', up: 1, pos: 'tr' },
    { n: 5, sel: 'tbody tr:first-child select, tbody tr:first-child [role=combobox]', pos: 'l' },
    { n: 6, role: 'button', name: 'Verser', nth: 0, pos: 'l' },
    { n: 7, text: 'Historique des reversements', up: 'card', pos: 'tl' },
  ], { h: 1000 })
})

fig('21-verser', async () => {
  await open('/reversements', { h: 1000 })
  await p.getByText('À verser uniquement').click(); await sleep(900)
  await p.getByRole('button', { name: 'Verser' }).first().click(); await sleep(900)
  await snap('21-verser', [
    { n: 1, text: 'Exigible (périodes terminées)', ...DLG, up: 2, pos: 'tl' },
    { n: 2, text: 'Inclure la période en cours (versement anticipé)', ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Montant à verser', ...DLG, up: 1, pos: 'l' },
    { n: 4, role: 'button', name: 'Confirmer le versement', pos: 'b' },
  ], { of: dlgOf })
})

// ═══ 9. Calendrier ═════════════════════════════════════════════════════════
fig('22-calendrier', async () => {
  await open('/calendrier', { h: 1300 })
  await p.getByText('Jean Nguélé').first().click(); await sleep(900)
  await snap('22-calendrier', [
    { n: 1, union: [{ text: 'En retard', up: 'card', nth: 0 }, { text: 'Payées', up: 'card' }], pos: 'tl' },
    { n: 2, union: [{ role: 'button', name: "Aujourd'hui" }, { text: 'Novembre 2026' }], pos: 'tl', pad: 8 },
    { n: 3, union: [{ ph: 'Nom ou matricule…', up: 1 }, { text: 'Tous les statuts', up: 1 }], pos: 'bl' },
    { n: 4, fn: "() => { let e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&x.textContent.trim().toLowerCase()==='lun'); while(e&&e.getBoundingClientRect().height<400) e=e.parentElement; return e }", pos: 'bl', pad: 0 },
    { n: 5, text: 'Dimanche 1 novembre', up: 'card', pos: 'tr' },
  ], { h: 1220 })
})

// ═══ 10. Retards et créances ═══════════════════════════════════════════════
fig('23-retards', async () => {
  await open('/retards', { h: 1100 })
  await snap('23-retards', [
    { n: 1, union: [{ text: 'À régulariser', up: 'card', nth: 0 }, { text: 'Régularisés', up: 'card' }], pos: 'tl' },
    { n: 2, ph: 'Nom ou matricule…', up: 1, nth: 0, pos: 'tl' },
    { n: 3, text: 'Tous les retards', up: 1, pos: 'tr' },
    { n: 4, text: 'Landry Ebogo', nth: 0, up: 3, pos: 'tr', pad: 0 },
    { n: 5, text: 'À régulariser', exact: true, nth: 1, pos: 'b', pad: 6 },
  ], { h: 700 })
})

fig('24-créances', async () => {
  await open('/retards', { h: 1800 })
  await snap('24-creances', [
    { n: 1, text: 'À recouvrer', exact: false, nth: 0, pos: 'l' },
    { n: 2, text: 'Ibrahim Sali', up: 3, pos: 'tl', pad: 0 },
    { n: 3, role: 'button', name: 'Remboursement', nth: 0, pos: 'tl' },
    { n: 4, role: 'button', name: 'Passer en perte', nth: 0, pos: 'tr' },
  ], { of: { text: 'Créances sur les conducteurs résiliés', up: 'card' }, pad: 10 })
  await p.getByRole('button', { name: 'Remboursement' }).first().click(); await sleep(800)
  await snap('25-remboursement', [
    { n: 1, text: 'Montant reçu (XAF)', ...DLG, up: 1, pos: 'l' },
    { n: 2, text: 'Précision (facultatif)', ...DLG, up: 1, pos: 'l' },
    { n: 3, role: 'button', name: 'Enregistrer', ...DLG, pos: 'b' },
  ], { of: dlgOf })
})

// ═══ 11. Paramètres ════════════════════════════════════════════════════════
fig('26-parametres', async () => {
  await open('/parametres', { h: 700 })
  await snap('26-parametres-profil', [
    { n: 1, union: [{ text: 'Profil admin', up: 1 }, { text: 'Notifications & alertes', up: 1 }], pos: 'tl' },
    { n: 2, text: 'Prendre une photo', up: 1, pos: 'l' },
    { n: 3, text: 'Nom complet', up: 1, nth: 0, pos: 'tr' },
    { n: 4, text: 'Numéro de téléphone', up: 1, nth: 0, pos: 'tr' },
    { n: 5, text: 'Adresse e-mail', up: 1, nth: 0, pos: 'tr' },
    { n: 6, role: 'button', name: 'Modifier', pos: 'tr' },
    { n: 7, role: 'button', name: 'Enregistrer les modifications', pos: 't' },
  ], { h: 700 })

  await view(1500)
  await p.getByRole('tab', { name: 'Configuration plateforme' }).click(); await sleep(900)
  await snap('27-parametres-plateforme', [
    { n: 1, text: 'Versement hebdo. par défaut (XAF)', up: 1, pos: 'tl' },
    { n: 2, text: 'Société et contrats', up: 'card', pos: 'tl' },
    { n: 3, text: 'Support des conducteurs', up: 'card', pos: 'tl' },
    { n: 4, text: "Commission de l'admin", up: 'card', pos: 'tl' },
  ], { h: 1430 })

  await view(700)
  await p.getByRole('tab', { name: 'Gestion des accès' }).click(); await sleep(900)
  await p.locator('button[aria-haspopup=menu]').first().click(); await sleep(600)
  await snap('28-parametres-acces', [
    { n: 1, text: 'Ajouter un admin', pos: 'b' },
    { n: 2, text: 'Nadine Ewane (adjointe)', up: 3, pos: 'tl', pad: 0 },
    { n: 3, text: 'DÉSACTIVÉ', exact: false, pos: 'tr', pad: 4 },
    { n: 4, text: "Désactiver l'accès", up: 0, pad: 6, pos: 'l' },
    { n: 5, text: 'Réinitialiser le mot de passe', up: 0, pad: 6, pos: 'l' },
  ], { h: 600 })
  await p.keyboard.press('Escape')

  await p.getByRole('tab', { name: 'Notifications & alertes' }).click(); await sleep(900)
  await snap('29-parametres-notifications', [
    { n: 1, text: "Seuil d'alerte de retard (jours)", up: 1, pos: 'tl' },
    { n: 2, text: "Seuil d'alerte critique (jours)", up: 1, pos: 'tl' },
    { n: 3, text: 'Rapport hebdomadaire par e-mail', up: 'card', pos: 'tl' },
    { n: 4, text: 'Alertes de maintenance', up: 'card', pos: 'tr' },
    { n: 5, role: 'button', name: 'Envoyer le rapport maintenant', pos: 'b' },
  ], { h: 700 })
})

fig('30-ajouter-admin', async () => {
  await open('/parametres', { h: 1000 })
  await p.getByRole('tab', { name: 'Gestion des accès' }).click(); await sleep(700)
  await p.getByRole('button', { name: 'Ajouter un admin' }).click(); await sleep(800)
  await snap('30-ajouter-admin', [
    { n: 1, text: 'Nom complet', ...DLG, up: 1, pos: 'l' },
    { n: 2, text: 'Numéro de téléphone', ...DLG, up: 1, pos: 'l' },
    { n: 3, text: 'Adresse e-mail (optionnel)', ...DLG, up: 1, pos: 'l' },
    { n: 4, text: 'Mot de passe', ...DLG, up: 1, pos: 'l' },
    { n: 5, role: 'button', name: 'Ajouter', exact: true, ...DLG, pos: 'b' },
  ], { of: dlgOf })
})

// ═══ 12. Téléphone et installation ═════════════════════════════════════════
fig('31-mobile', async () => {
  await open('/dashboard', { w: 390, h: 844, mobile: true })
  const full = { x: 0, y: 0, width: 390, height: 844 }
  await snap('31-mobile-a', [
    { n: 1, sel: 'header button', nth: 0, pos: 'b', pad: 2 },
    { n: 2, sel: 'header button', nth: 1, pos: 'b', pad: 2 },
    { n: 3, sel: 'header button', nth: 2, pos: 'b', pad: 2 },
  ], { clip: full })
  await p.locator('header button').first().click(); await sleep(900)
  await snap('31-mobile-b', [
    { n: 4, rect: [8, 70, 276, 470], pos: 'tr', pad: 0 },
    { n: 5, rect: [8, 756, 276, 84], pos: 'tr', pad: 0 },
    { n: 6, rect: [296, 4, 90, 836], pos: 'b', pad: 0 },
  ], { clip: full })
})

const fireInstall = () => p.evaluate(() => {
  const e = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(e, { prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }) })
  window.dispatchEvent(e)
})

fig('32-installation', async () => {
  // ordinateur / Android : bouton « Installer l'application » de la barre latérale
  await open('/dashboard', { h: 800 })
  await fireInstall()
  await p.waitForSelector('[data-testid="install-app"]', { timeout: 6000 })
  await snap('32-installation-bureau', [
    { n: 1, sel: '[data-testid="install-app"]', pos: 'r', pad: 6 },
    { n: 2, text: 'Déconnexion', pos: 'r', pad: 6 },
  ], { clip: { x: 0, y: 620, width: 420, height: 180 } })
  // iPhone : la fenêtre d'explication
  if (ctx) await ctx.close()
  ctx = await newCtx({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  })
  p = await ctx.newPage()
  await p.goto(BASE + '/connexion'); await p.waitForSelector('#login-phone'); await sleep(1000)
  await p.waitForSelector('[data-testid="install-app"]', { timeout: 6000 })
  await p.getByTestId('install-app').click(); await sleep(800)
  await p.screenshot({ path: `${OUT}/32-installation-iphone.png` })
  console.log('ok   32-installation-iphone')
})

// ═══ Exécution ═════════════════════════════════════════════════════════════
let failed = 0
for (const [name, fn] of Object.entries(figures)) {
  if (ONLY.length && !ONLY.some((o) => name.startsWith(o))) continue
  try { await fn() } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]) }
}
await browser.close()
console.log(failed ? `${failed} figure(s) en échec` : 'terminé')

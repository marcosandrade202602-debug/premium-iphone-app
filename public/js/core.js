/* ================================================================
   MEU MÊS — núcleo: estado, persistência e cálculos
   Valores monetários sempre em centavos (inteiros).
   ================================================================ */
'use strict'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))
const nz = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) {} }

// ---------- dinheiro ----------
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const R = (c) => BRL.format((c || 0) / 100)
const Rk = (c) => { const v = Math.abs(c) / 100; const s = c < 0 ? '−' : ''; return v >= 1e6 ? s + 'R$' + (v / 1e6).toFixed(1).replace('.', ',') + 'mi' : v >= 1e3 ? s + 'R$' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace('.', ',') + 'k' : s + 'R$' + Math.round(v) }
const cents = (v) => {
  let s = String(v ?? '').replace(/[^\d,.-]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  return Math.round(parseFloat(s) * 100) || 0
}

// ---------- datas ----------
const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = () => iso(new Date())
const ym = () => today().slice(0, 7)
const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1) }
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d) }
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5)
const daysIn = (y, m) => new Date(y, m, 0).getDate() // m: 1-12
const addMonths = (m, n) => { const [y, mo] = m.split('-').map(Number); const t = y * 12 + mo - 1 + n; return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}` }
const D = (s) => s.split('-').reverse().join('/')
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MES3 = MES.map((m) => m.slice(0, 3))
const SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const fmtMonth = (m) => { const [y, mo] = m.split('-'); return MES3[mo - 1] + '/' + y }
const fmtMonthLong = (m) => { const [y, mo] = m.split('-'); return MES[mo - 1] + (y == new Date().getFullYear() ? '' : ' ' + y) }
const fmtDay = (s) => { const d = parseD(s); return `${d.getDate()} ${MES3[d.getMonth()]}` }
const relDay = (s) => {
  const n = diffDays(today(), s)
  if (n === 0) return 'Hoje'
  if (n === -1) return 'Ontem'
  if (n === 1) return 'Amanhã'
  const d = parseD(s)
  return `${SEM[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MES3[d.getMonth()]}`
}
const dueLabel = (s) => { const n = diffDays(today(), s); return n < 0 ? `atrasada ${-n}d` : n === 0 ? 'vence hoje' : n === 1 ? 'amanhã' : `em ${n} dias` }

// ---------- categorias ----------
const CAT = {
  Salário: { e: '💼', c: '#34c759', t: 'in' },
  Freelance: { e: '💻', c: '#30b0c7', t: 'in' },
  Extra: { e: '✨', c: '#ffcc00', t: 'in' },
  Benefício: { e: '🎁', c: '#ff9500', t: 'in' },
  Alimentação: { e: '🍽️', c: '#ff9500', t: 'out' },
  Mercado: { e: '🛒', c: '#34c759', t: 'out' },
  Transporte: { e: '🚗', c: '#007aff', t: 'out' },
  Moradia: { e: '🏠', c: '#5856d6', t: 'out' },
  Contas: { e: '💡', c: '#ffcc00', t: 'out' },
  Assinaturas: { e: '📺', c: '#ff2d55', t: 'out' },
  Saúde: { e: '💊', c: '#ff3b30', t: 'out' },
  Lazer: { e: '🎉', c: '#af52de', t: 'out' },
  Compras: { e: '🛍️', c: '#ff2d55', t: 'out' },
  Educação: { e: '📚', c: '#30b0c7', t: 'out' },
  Pets: { e: '🐾', c: '#a2845e', t: 'out' },
  Outros: { e: '•••', c: '#8e8e93', t: 'both' },
}
const catOf = (k) => CAT[k] || CAT.Outros
const catsFor = (type) => Object.keys(CAT).filter((k) => CAT[k].t === type || CAT[k].t === 'both')
const catIcon = (k, size = '') => { const c = catOf(k); return `<span class="ic ${size}" style="background:${c.c}22;color:${c.c}">${k === 'Outros' ? '<b style="font-size:13px">•••</b>' : c.e}</span>` }

const CARD_COLORS = ['violet', 'black', 'orange', 'blue', 'green', 'pink', 'gold']
const GOAL_EMOJI = ['🎯', '✈️', '🏠', '🚗', '🛟', '🎓', '💍', '📱', '🏖️', '💰', '🎮', '👶']

// ---------- estado ----------
const blank = () => ({ v: 2, name: '', init: 0, tx: [], cards: [], bills: [], goals: [], pays: [], budgets: {}, pin: '', ai: false, onboarded: false })
let S = blank()
let mem = false

function migrate(o) {
  const s = { ...blank(), ...o }
  s.v = 2
  s.budgets = s.budgets || {}
  s.cards.forEach((c, i) => { c.color = c.color || CARD_COLORS[i % CARD_COLORS.length] })
  s.bills.forEach((b) => { b.cat = b.cat || 'Contas'; b.day = b.day || +b.due.slice(8) })
  s.goals.forEach((g) => { g.emoji = g.emoji || '🎯' })
  s.tx.forEach((t) => { if (t.cardId && !t.n) t.n = (t.inst || []).length || 1 })
  if (o && (o.tx?.length || o.name)) s.onboarded = true
  return s
}

// ---------- persistência (IndexedDB, compatível com a versão anterior) ----------
let dbp
const idb = () => (dbp ||= new Promise((ok, no) => {
  const r = indexedDB.open('meumes', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('kv')
  r.onsuccess = () => ok(r.result)
  r.onerror = () => no(r.error)
}))
async function load() {
  try {
    const d = await idb()
    return await new Promise((ok) => { const q = d.transaction('kv').objectStore('kv').get('s'); q.onsuccess = () => ok(q.result); q.onerror = () => ok() })
  } catch (e) { mem = true }
}
async function persist() {
  try { if (!mem) { const d = await idb(); d.transaction('kv', 'readwrite').objectStore('kv').put(JSON.parse(JSON.stringify(S)), 's') } } catch (e) { mem = true }
}
function save(opts = {}) { persist(); if (!opts.silent) render() }

// ---------- cálculos ----------
const calc = {
  // distribui uma compra em parcelas pelas faturas, respeitando fechamento/vencimento
  inst(c, date, total, n) {
    const [y, mo, d] = date.split('-').map(Number)
    let cm = d > c.close ? mo + 1 : mo
    if (c.due <= c.close) cm++
    const b = y * 12 + cm - 1, q = Math.floor(total / n)
    return Array.from({ length: n }, (_, i) => { const t = b + i; return { m: `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`, a: q + (i ? 0 : total - q * n) } })
  },
  curInvoice: (c) => calc.inst(c, today(), 1, 1)[0].m,
  paid: (c, m) => S.pays.filter((p) => p.cardId == c.id && p.m == m).reduce((s, p) => s + p.a, 0),
  invoice: (c, m) => S.tx.filter((t) => t.cardId == c.id).flatMap((t) => t.inst).filter((i) => i.m == m).reduce((s, i) => s + i.a, 0),
  open: (c, m) => Math.max(0, calc.invoice(c, m) - calc.paid(c, m)),
  used(c) {
    const all = S.tx.filter((t) => t.cardId == c.id).flatMap((t) => t.inst).reduce((s, i) => s + i.a, 0)
    return all - S.pays.filter((p) => p.cardId == c.id).reduce((s, p) => s + p.a, 0)
  },
  invoiceMonths: (c) => [...new Set(S.tx.filter((t) => t.cardId == c.id).flatMap((t) => t.inst).map((i) => i.m))].sort(),
  balance() {
    const n = S.tx.filter((t) => !t.cardId && t.status == 'done').reduce((s, t) => s + (t.type == 'in' ? t.amt : -t.amt), 0)
    return S.init + n - S.pays.reduce((s, p) => s + p.a, 0)
  },
  months(n, from = ym()) { return Array.from({ length: n }, (_, i) => addMonths(from, i)) },
  commitments() {
    const e = ym()
    const b = S.bills.filter((x) => !x.paid && x.due.slice(0, 7) <= e).reduce((s, x) => s + x.amt, 0)
    const p = S.tx.filter((t) => !t.cardId && t.type == 'out' && t.status == 'pending' && t.date.slice(0, 7) <= e).reduce((s, t) => s + t.amt, 0)
    let f = 0
    S.cards.forEach((c) => calc.invoiceMonths(c).filter((m) => m <= e).forEach((m) => (f += calc.open(c, m))))
    return { b, p, f, tot: b + p + f }
  },
  pendingIn() { const e = ym(); return S.tx.filter((t) => t.type == 'in' && t.status == 'pending' && t.date.slice(0, 7) <= e).reduce((s, t) => s + t.amt, 0) },
  reserved: () => S.goals.reduce((s, g) => s + g.saved, 0),
  available: () => calc.balance() - calc.commitments().tot - calc.reserved(),
  daysLeft() { const d = new Date(); return daysIn(d.getFullYear(), d.getMonth() + 1) - d.getDate() + 1 },
  daily: () => Math.max(0, Math.floor(calc.available() / calc.daysLeft())),
  // consumo do mês: compra no cartão conta 1x (na data da compra); pagamento de fatura não entra
  monthOf(m = ym()) {
    const inc = S.tx.filter((t) => t.type == 'in' && t.status == 'done' && t.date.startsWith(m)).reduce((s, t) => s + t.amt, 0)
    const out = S.tx.filter((t) => t.type == 'out' && t.date.startsWith(m) && (t.cardId || t.status == 'done')).reduce((s, t) => s + t.amt, 0)
    return { inc, out, net: inc - out }
  },
  catSpend(m = ym(), uptoDay = 31) {
    const r = {}
    S.tx.filter((t) => t.type == 'out' && t.date.startsWith(m) && (t.cardId || t.status == 'done') && +t.date.slice(8) <= uptoDay).forEach((t) => (r[t.cat] = (r[t.cat] || 0) + t.amt))
    return r
  },
  outUpTo(m, day) { return Object.values(calc.catSpend(m, day)).reduce((a, b) => a + b, 0) },
  need(g) {
    if (!g.date) return 0
    const [y, m] = ym().split('-').map(Number), [gy, gm] = g.date.split('-').map(Number), n = Math.max(1, (gy - y) * 12 + gm - m)
    return Math.max(0, Math.ceil((g.target - g.saved) / n))
  },
  // projeção de gastos até o fim do mês com base no ritmo diário
  projection() {
    const d = new Date(), day = d.getDate(), dim = daysIn(d.getFullYear(), d.getMonth() + 1)
    const spent = calc.monthOf().out
    const last = calc.monthOf(addMonths(ym(), -1)).out
    const lastSame = calc.outUpTo(addMonths(ym(), -1), day)
    const proj = day >= 3 ? Math.round((spent / day) * dim) : Math.max(spent, last)
    return { spent, proj, last, lastSame, day, dim }
  },
  // assinaturas/recorrências: mesma descrição em 2+ meses diferentes com valor parecido
  recurring() {
    const g = {}
    S.tx.filter((t) => t.type == 'out' && !t.cardId).forEach((t) => { const k = nz(t.desc).trim(); (g[k] ||= []).push(t) })
    return Object.values(g).map((l) => {
      const ms = new Set(l.map((t) => t.date.slice(0, 7)))
      const amts = l.map((t) => t.amt), avg = Math.round(amts.reduce((a, b) => a + b, 0) / amts.length)
      const stable = amts.every((a) => Math.abs(a - avg) <= avg * 0.15)
      const lastT = l.sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      return ms.size >= 2 && stable ? { desc: lastT.desc, cat: lastT.cat, avg, months: ms.size, last: lastT.date } : null
    }).filter(Boolean).sort((a, b) => b.avg - a.avg)
  },
  // nota de 0 a 100 da saúde financeira do mês
  health() {
    const mo = calc.monthOf(), a = calc.available(), overdue = S.bills.filter((b) => !b.paid && b.due < today()).length
    const inc = mo.inc || calc.monthOf(addMonths(ym(), -1)).inc
    let s = 50
    if (inc > 0) { const r = mo.out / inc; s += r <= 0.5 ? 25 : r <= 0.7 ? 15 : r <= 0.9 ? 5 : r <= 1 ? -5 : -20 }
    s += a > 0 ? Math.min(15, Math.round((a / Math.max(1, inc || a)) * 40)) : -20
    s -= overdue * 8
    const bs = Object.entries(S.budgets).filter(([, v]) => v > 0), cs = calc.catSpend()
    if (bs.length) s += Math.round((bs.filter(([k, v]) => (cs[k] || 0) <= v).length / bs.length) * 10 - 4)
    if (calc.reserved() > 0) s += 6
    s = Math.max(0, Math.min(100, s))
    const lbl = s >= 80 ? 'Excelente' : s >= 65 ? 'Boa' : s >= 45 ? 'Atenção' : 'Crítica'
    const col = s >= 80 ? 'var(--green)' : s >= 65 ? 'var(--teal)' : s >= 45 ? 'var(--orange)' : 'var(--red)'
    return { s, lbl, col }
  },
}

// ---------- mutações ----------
function nextDue(b) {
  const [y, m] = b.due.split('-').map(Number), t = y * 12 + m // próximo mês
  const ny = Math.floor(t / 12), nm = (t % 12) + 1
  return `${ny}-${pad(nm)}-${pad(Math.min(b.day || 28, daysIn(ny, nm)))}`
}
let undoSnap = null
const snap = () => (undoSnap = JSON.stringify(S))
const undo = () => { if (undoSnap) { S = JSON.parse(undoSnap); undoSnap = null; save(); haptic() } }

// aprendizado: guarda a última categoria escolhida para cada descrição
function learn(desc, cat) { const k = nz(desc).trim(); if (k) { S.learn = S.learn || {}; S.learn[k] = cat } }

// ---------- dados de exemplo ----------
function demoData() {
  const s = blank(), t0 = today(), m0 = ym()
  s.name = 'Marina'; s.init = 320000; s.onboarded = true
  const nub = { id: uid(), name: 'Nubank', limit: 800000, close: 3, due: 10, color: 'violet' }
  const inter = { id: uid(), name: 'Inter Black', limit: 1200000, close: 25, due: 5, color: 'black' }
  s.cards = [nub, inter]
  const day = +t0.slice(8)
  const tx = (desc, v, cat, date, type = 'out', status = 'done') => s.tx.push({ id: uid(), desc, amt: Math.round(v * 100), type, cat, date, status })
  const buy = (c, desc, v, n, cat, date) => s.tx.push({ id: uid(), desc, amt: Math.round(v * 100), type: 'out', cat, date, status: 'done', cardId: c.id, n, inst: calc.inst(c, date, Math.round(v * 100), n) })
  for (let k = 3; k >= 0; k--) {
    const m = addMonths(m0, -k), lim = k === 0 ? day : 28, d = (n) => `${m}-${pad(Math.min(n, lim))}`
    const j = 1 + (k % 3) * 0.08
    tx('Salário', 6800, 'Salário', d(5), 'in', k === 0 && day < 5 ? 'pending' : 'done')
    if (k !== 1) tx('Freela design', 1200 * j, 'Freelance', d(18), 'in')
    tx('Netflix', 55.9, 'Assinaturas', d(8)); tx('Spotify', 21.9, 'Assinaturas', d(12)); tx('Academia', 119.9, 'Saúde', d(6))
    tx('Supermercado', 412.3 * j, 'Mercado', d(7)); tx('Feira', 86 * j, 'Mercado', d(14)); tx('Supermercado', 298.5 * j, 'Mercado', d(21))
    tx('iFood', 58.9 * j, 'Alimentação', d(3)); tx('Almoço', 42 * j, 'Alimentação', d(10)); tx('Padaria', 23.5, 'Alimentação', d(16)); tx('iFood', 72.4 * j, 'Alimentação', d(24))
    tx('Uber', 27.8 * j, 'Transporte', d(4)); tx('Gasolina', 230 * j, 'Transporte', d(15)); tx('Uber', 19.9, 'Transporte', d(22))
    if (k % 2 === 0) tx('Cinema', 64, 'Lazer', d(13))
    if (k !== 0) { tx('Aluguel', 1850, 'Moradia', d(10)); tx('Energia', 182 * j, 'Contas', d(15)); tx('Internet', 109.9, 'Contas', d(20)) }
    buy(nub, k % 2 ? 'Amazon' : 'Shopee', 139.9 * j, 1, 'Compras', d(9))
    buy(inter, 'Restaurante', 186 * j, 1, 'Alimentação', d(19))
  }
  buy(nub, 'iPhone 16', 6999, 10, 'Compras', addDays(t0, -48))
  buy(inter, 'Passagens Floripa', 1480, 4, 'Lazer', addDays(t0, -20))
  tx('Farmácia', 74.5, 'Saúde', t0, 'out', 'pending')
  // faturas antigas pagas
  ;[nub, inter].forEach((c) => {
    const ms = [...new Set(s.tx.filter((t) => t.cardId == c.id).flatMap((t) => t.inst).map((i) => i.m))].filter((m) => m < m0)
    ms.forEach((m) => { const a = s.tx.filter((t) => t.cardId == c.id).flatMap((t) => t.inst).filter((i) => i.m == m).reduce((x, i) => x + i.a, 0); s.pays.push({ id: uid(), cardId: c.id, m, a, date: `${m}-${pad(c.due)}` }) })
  })
  const bill = (name, v, d, cat) => s.bills.push({ id: uid(), name, amt: Math.round(v * 100), due: `${m0}-${pad(d)}`, day: d, rec: true, paid: false, cat })
  bill('Aluguel', 1850, 10, 'Moradia'); bill('Energia', 196.4, 15, 'Contas'); bill('Internet', 109.9, 20, 'Contas'); bill('Condomínio', 420, 8, 'Moradia')
  s.goals = [
    { id: uid(), name: 'Viagem para o Japão', emoji: '✈️', target: 1800000, saved: 640000, date: addMonths(m0, 10) + '-01' },
    { id: uid(), name: 'Reserva de emergência', emoji: '🛟', target: 2000000, saved: 350000, date: addMonths(m0, 18) + '-01' },
  ]
  s.budgets = { Alimentação: 90000, Mercado: 90000, Transporte: 35000, Lazer: 30000 }
  return s
}

/* ================================================================
   MEU MÊS — componentes de interface (ícones, sheets, toasts, gráficos)
   ================================================================ */
'use strict'

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
}
const I = (n, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`

// ---------- sheets (modal estilo iOS) ----------
let sheetCount = 0
function openSheet({ title = '', html = '', done = 'Salvar', cancel = 'Cancelar', tall = false, onDone, onMount, onClose } = {}) {
  const shell = $('#shell')
  const w = document.createElement('div')
  w.className = 'sheet-wrap'
  w.innerHTML = `<div class="backdrop"></div><div class="sheet ${tall ? 'tall' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="grab"></div>
    <div class="sheet-head"><button type="button" class="cancel">${cancel || ''}</button><h3>${esc(title)}</h3><button type="button" class="done">${done || ''}</button></div>
    <div class="sheet-body">${html}</div></div>`
  shell.appendChild(w)
  sheetCount++
  shell.classList.add('sheet-open')
  setThemeColor()
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('in')))
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    w.classList.remove('in')
    if (--sheetCount <= 0) { sheetCount = 0; shell.classList.remove('sheet-open') }
    setThemeColor()
    setTimeout(() => w.remove(), 420)
    onClose && onClose()
  }
  const api = { el: w, close, body: $('.sheet-body', w) }
  $('.backdrop', w).onclick = close
  $('.cancel', w).onclick = close
  const dn = $('.done', w)
  if (!done) dn.style.visibility = 'hidden'
  dn.onclick = async () => { haptic(); if (!onDone || (await onDone(api)) !== false) close() }
  // arrastar para fechar
  const sh = $('.sheet', w), head = $('.sheet-head', w)
  let y0 = null, dy = 0
  const start = (e) => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; sh.classList.add('dragging'); head.setPointerCapture(e.pointerId) }
  head.addEventListener('pointerdown', start)
  head.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)` })
  const end = () => { if (y0 == null) return; y0 = null; sh.classList.remove('dragging'); sh.style.transform = ''; if (dy > 110) close() }
  head.addEventListener('pointerup', end)
  head.addEventListener('pointercancel', end)
  w.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
  onMount && onMount(api)
  return api
}

// ---------- toast ----------
let toastT
function toast(msg, action) {
  $$('.toast').forEach((t) => t.remove())
  const t = document.createElement('div')
  t.className = 'toast'
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action[0])}</button>` : ''}`
  $('#shell').appendChild(t)
  if (action) $('button', t).onclick = () => { action[1](); t.classList.remove('in'); setTimeout(() => t.remove(), 300) }
  requestAnimationFrame(() => t.classList.add('in'))
  clearTimeout(toastT)
  toastT = setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400) }, action ? 4500 : 2200)
}

// ---------- confirmação estilo action sheet ----------
function confirmSheet(title, msg, okLabel = 'Confirmar', danger = true) {
  return new Promise((res) => {
    let r = false
    const s = openSheet({
      title, done: null, cancel: 'Cancelar',
      html: `<p class="mut" style="text-align:center;margin:4px 8px 18px;font-size:15px">${esc(msg)}</p><button class="btn block ${danger ? 'danger' : ''}" id="cfOk">${esc(okLabel)}</button>`,
      onMount: (a) => { $('#cfOk', a.el).onclick = () => { r = true; haptic(15); a.close() } },
      onClose: () => res(r),
    })
    return s
  })
}

// ---------- campos ----------
function amountField(name, c = 0, type = 'out', hint = '') {
  return `<div class="amount-in ${type === 'in' ? 'in' : ''}"><input name="${name}" inputmode="numeric" autocomplete="off" data-c="${c}" value="${R(c)}" aria-label="Valor">${hint ? `<div class="hint">${hint}</div>` : ''}</div>`
}
function bindAmount(root) {
  $$('.amount-in input', root).forEach((inp) => {
    const set = (c) => { inp.dataset.c = c; inp.value = R(c) }
    inp.addEventListener('input', () => { const d = inp.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11); set(+d || 0) })
    inp.addEventListener('focus', () => setTimeout(() => inp.setSelectionRange(inp.value.length, inp.value.length), 0))
  })
}
const getAmt = (root, name) => +($(`[name="${name}"]`, root)?.dataset.c || 0)
const row = (label, input) => `<div class="fr"><label>${label}</label>${input}</div>`
const inText = (name, v = '', ph = '', extra = '') => `<input name="${name}" value="${esc(v)}" placeholder="${esc(ph)}" autocomplete="off" ${extra}>`
const inSelect = (name, opts, v) => `<select name="${name}">${opts.map((o) => `<option value="${esc(o[0])}" ${o[0] == v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
const inSwitch = (name, on) => `<span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span></span></span>`
const val = (root, name) => { const e = $(`[name="${name}"]`, root); return e ? (e.type === 'checkbox' ? e.checked : e.value) : '' }

function catGrid(type, sel, sug) {
  return `<div class="cat-grid" data-cat="${esc(sel || '')}">${catsFor(type).map((k) => `<button type="button" data-k="${esc(k)}" class="${k === sel ? 'on' : ''} ${k === sug ? 'sug' : ''}"><span class="ic" style="background:${catOf(k).c}1f">${k === 'Outros' ? '<b style="font-size:13px;color:var(--tx2)">•••</b>' : catOf(k).e}</span>${esc(k)}</button>`).join('')}</div>`
}
function bindCatGrid(root, onPick) {
  const g = $('.cat-grid', root)
  if (!g) return
  g.onclick = (e) => {
    const b = e.target.closest('button[data-k]')
    if (!b) return
    haptic(); g.dataset.cat = b.dataset.k; g.dataset.manual = '1'
    $$('button', g).forEach((x) => x.classList.toggle('on', x === b)); onPick && onPick(b.dataset.k)
  }
}
function setCatGrid(root, k, sug = true) {
  const g = $('.cat-grid', root)
  if (!g || g.dataset.manual) return
  g.dataset.cat = k
  $$('button', g).forEach((x) => { x.classList.toggle('on', x.dataset.k === k); x.classList.toggle('sug', sug && x.dataset.k === k) })
}

// ---------- gráficos ----------
function ring(pct, size = 64, sw = 8, color = 'var(--accent)', label = '', sub = '') {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct))
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle class="c-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/><circle class="c-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - p)}"/></svg>${label !== '' ? `<div class="lbl"><div>${label}${sub ? `<small>${sub}</small>` : ''}</div></div>` : ''}</div>`
}
function animateRings(root) { requestAnimationFrame(() => requestAnimationFrame(() => $$('.c-fg[data-off]', root).forEach((c) => (c.style.strokeDashoffset = c.dataset.off)))) }

function donut(entries, size = 136) {
  const tot = entries.reduce((s, e) => s + e[1], 0) || 1, r = size / 2 - 12, C = 2 * Math.PI * r
  let acc = 0
  const segs = entries.map(([k, v]) => { const len = (v / tot) * C, gap = entries.length > 1 ? 2.5 : 0, s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${catOf(k).c}" stroke-width="18" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-acc}"/>`; acc += len; return s }).join('')
  return `<svg width="${size}" height="${size}" style="transform:rotate(-90deg);flex:0 0 auto"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--fill)" stroke-width="18"/>${segs}</svg>`
}

function barsChart(data, h = 150) {
  // data: [{l, a, b}] → barras lado a lado (receita/despesa)
  const W = 340, pb = 20, mx = Math.max(1, ...data.flatMap((d) => [d.a, d.b])), cw = W / data.length, bw = Math.min(14, cw / 3.2)
  const y = (v) => h - pb - (v / mx) * (h - pb - 8)
  const grid = [0.5, 1].map((f) => `<line x1="0" x2="${W}" y1="${y(mx * f)}" y2="${y(mx * f)}" stroke="var(--sep)" stroke-dasharray="3 4"/><text x="${W}" y="${y(mx * f) - 4}" text-anchor="end">${Rk(mx * f)}</text>`).join('')
  const bars = data.map((d, i) => { const cx = cw * i + cw / 2; return `<rect x="${cx - bw - 1.5}" y="${y(d.a)}" width="${bw}" height="${Math.max(0, h - pb - y(d.a))}" rx="4" fill="var(--green)"/><rect x="${cx + 1.5}" y="${y(d.b)}" width="${bw}" height="${Math.max(0, h - pb - y(d.b))}" rx="4" fill="var(--accent)"/><text x="${cx}" y="${h - 4}" text-anchor="middle" ${d.cur ? 'style="fill:var(--tx);font-weight:700"' : ''}>${d.l}</text>` }).join('')
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${grid}${bars}</svg>`
}

function paceChart(cur, prev, dim, today, budget, h = 150) {
  // cur/prev: gasto acumulado por dia (índice 0 = dia 1)
  const W = 340, pb = 18, mx = Math.max(1, budget || 0, ...cur, ...prev)
  const x = (i) => (i / Math.max(1, dim - 1)) * (W - 6) + 3, y = (v) => h - pb - (v / mx) * (h - pb - 10)
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const area = cur.length ? `${path(cur)}L${x(cur.length - 1)},${h - pb}L${x(0)},${h - pb}Z` : ''
  const last = cur.length - 1
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" style="height:${h}px">
    <defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${budget ? `<line x1="0" x2="${W}" y1="${y(budget)}" y2="${y(budget)}" stroke="var(--orange)" stroke-dasharray="4 4"/><text x="4" y="${y(budget) - 4}" style="fill:var(--orange)">renda ${Rk(budget)}</text>` : ''}
    <path d="${path(prev)}" fill="none" stroke="var(--tx3)" stroke-width="2" stroke-dasharray="1 0"/>
    <path d="${area}" fill="url(#pg)"/><path d="${path(cur)}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round"/>
    ${last >= 0 ? `<circle cx="${x(last)}" cy="${y(cur[last])}" r="4.5" fill="var(--accent)" stroke="var(--card)" stroke-width="2"/>` : ''}
    <text x="3" y="${h - 3}">dia 1</text><text x="${x(today - 1)}" y="${h - 3}" text-anchor="middle" style="fill:var(--tx);font-weight:700">hoje</text><text x="${W - 3}" y="${h - 3}" text-anchor="end">${dim}</text>
  </svg>`
}

// ---------- números animados ----------
const lastVals = {}
function countUp(root) {
  $$('[data-count]', root).forEach((el) => {
    const key = el.dataset.key || '', to = +el.dataset.count, from = lastVals[key] ?? (key ? to * 0.7 : to)
    lastVals[key] = to
    const fmt = el.dataset.fmt === 'big' ? bigMoney : R
    if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.innerHTML = fmt(to); return }
    const t0 = performance.now(), dur = 900
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.innerHTML = fmt(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  })
}
const bigMoney = (c) => { const s = R(c), i = s.lastIndexOf(','); return i > 0 ? `${s.slice(0, i)}<span class="cents">${s.slice(i)}</span>` : s }

// ---------- linhas deslizáveis (swipe para ações) ----------
function bindSwipe(root) {
  $$('.li-wrap', root).forEach((w) => {
    const li = $('.li', w), acts = $('.li-acts', w)
    if (!acts) return
    const max = acts.children.length * 76
    let x0 = null, y0 = 0, dx = 0, open = false, horiz = null
    li.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button) return; x0 = e.clientX; y0 = e.clientY; horiz = null; dx = 0 })
    li.addEventListener('pointermove', (e) => {
      if (x0 == null) return
      const mx = e.clientX - x0, my = e.clientY - y0
      if (horiz == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) { horiz = Math.abs(mx) > Math.abs(my); if (horiz) { li.setPointerCapture(e.pointerId); li.style.transition = 'none' } }
      if (!horiz) return
      dx = Math.min(0, Math.max(-max - 30, (open ? -max : 0) + mx))
      li.style.transform = `translateX(${dx}px)`
    })
    const end = () => {
      if (x0 == null) return
      x0 = null; li.style.transition = ''
      if (horiz) { open = dx < -max / 2; li.style.transform = open ? `translateX(${-max}px)` : ''; li.dataset.swiped = '1'; setTimeout(() => delete li.dataset.swiped, 50); if (open) { haptic(); closeOthers(w) } }
    }
    li.addEventListener('pointerup', end); li.addEventListener('pointercancel', end)
    li.addEventListener('click', (e) => { if (li.dataset.swiped || open) { e.stopImmediatePropagation(); e.preventDefault(); if (open && !li.dataset.swiped) { open = false; li.style.transform = '' } } }, true)
    w._close = () => { open = false; li.style.transform = '' }
  })
  const closeOthers = (keep) => $$('.li-wrap', root).forEach((w) => w !== keep && w._close && w._close())
}

function setThemeColor() {
  const dark = document.documentElement.dataset.theme === 'dark'
  const m = $('#themeColor'); if (m) m.content = sheetCount ? '#000000' : dark ? '#000000' : '#f2f2f7'
}

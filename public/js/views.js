/* ================================================================
   MEU MÊS — telas
   ================================================================ */
'use strict'

const UI = { tab: 'home', sub: 'cards', txMonth: null, txFilter: 'all', q: '', statsMonth: null, card: null, calDay: null }

// ---------- peças reutilizáveis ----------
function txRow(t) {
  const c = t.cardId && S.cards.find((x) => x.id == t.cardId)
  const sub = [t.cat, c ? `${c.name}${t.n > 1 ? ` · ${t.n}x` : ''}` : '', t.status == 'pending' ? (t.type == 'in' ? 'a receber' : 'pendente') : ''].filter(Boolean).join(' · ')
  return `<div class="li-wrap"><div class="li-acts"><button class="edit" onclick="txForm(null,'${t.id}')">${I('edit')}Editar</button><button class="del" onclick="delTx('${t.id}')">${I('trash')}Apagar</button></div>
  <button class="li" onclick="txForm(null,'${t.id}')">${catIcon(t.cat)}<div class="mid"><div class="t">${esc(t.desc)}</div><div class="s">${esc(sub)}</div></div>
  <div class="end"><div class="amt ${t.type == 'in' ? 'pos' : ''}" ${t.status == 'pending' ? 'style="opacity:.55"' : ''}>${t.type == 'in' ? '+' : '−'}${R(t.amt)}</div></div></button></div>`
}
function emptyBox(e, title, text, btn) { return `<div class="empty"><div class="em">${e}</div><b>${title}</b>${text}${btn ? `<div><button class="btn sm tint" onclick="${btn[1]}">${btn[0]}</button></div>` : ''}</div>` }
function monthSwitch(key, m) {
  return `<div class="month-sw"><button onclick="shiftMonth('${key}',-1)" aria-label="Mês anterior">${I('chevL')}</button><span>${fmtMonthLong(m)}</span><button onclick="shiftMonth('${key}',1)" ${m >= ym() ? 'disabled' : ''} aria-label="Próximo mês">${I('chevR')}</button></div>`
}
function shiftMonth(key, n) { const m = addMonths(UI[key] || ym(), n); if (m > ym()) return; UI[key] = m; haptic(); render() }
function go(tab, sub) { closeAllSheets(); UI.tab = tab; if (sub) UI.sub = sub; haptic(); render(true) }
function closeAllSheets() { $$('.sheet-wrap').forEach((w) => w.querySelector('.backdrop')?.click()) }

// ================================================================
const V = {
  // ---------------- INÍCIO ----------------
  home() {
    const d = new Date(), a = calc.available(), c = calc.commitments(), mo = calc.monthOf(), pj = calc.projection(), h = calc.health()
    const dim = pj.dim, pct = pj.day / dim, ins = insights()
    const spentPct = mo.inc ? Math.min(1, mo.out / mo.inc) : 0
    const dlt = pj.lastSame ? Math.round(((pj.spent - pj.lastSame) / pj.lastSame) * 100) : null
    const up = [
      ...S.bills.filter((b) => !b.paid && diffDays(today(), b.due) <= 20).map((b) => ({ k: 'b', id: b.id, n: b.name, d: b.due, a: b.amt, cat: b.cat })),
      ...S.cards.map((x) => { const m = calc.curInvoice(x), [yy, mm] = m.split('-').map(Number); return { k: 'c', id: x.id, n: 'Fatura ' + x.name, d: `${m}-${pad(Math.min(x.due, daysIn(yy, mm)))}`, a: calc.open(x, m), m } }).filter((x) => x.a > 0),
    ].sort((x, y) => (x.d > y.d ? 1 : -1)).slice(0, 4)
    const recent = S.tx.slice().sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0)).slice(0, 5)
    const bud = Object.entries(S.budgets).filter(([, v]) => v > 0).map(([k, v]) => [k, v, calc.catSpend()[k] || 0]).sort((x, y) => y[2] / y[1] - x[2] / x[1]).slice(0, 4)
    return {
      title: 'Início',
      html: `
      <div class="lt"><div class="eyebrow">${SEM[d.getDay()]}, ${d.getDate()} de ${MES[d.getMonth()]}</div><h1>Olá${S.name ? ', ' + esc(S.name.split(' ')[0]) : ''}</h1></div>
      <div class="hero">
        <div class="lbl">Disponível para gastar</div>
        <div class="big" data-count="${a}" data-key="avail" data-fmt="big">${bigMoney(a)}</div>
        <span class="pill">${I('spark')} ${R(calc.daily())}/dia · ${calc.daysLeft()} dias restantes</span>
        <div class="month-track"><div class="bar"><i style="width:${spentPct * 100}%"></i><u style="left:${pct * 100}%"></u></div>
          <div class="row"><span>${mo.inc ? `${Math.round(spentPct * 100)}% da renda gasta` : 'Gasto do mês: ' + R(mo.out)}</span><span>dia ${pj.day} de ${dim}</span></div></div>
        <div class="split"><div><small>Saldo</small><b>${Rk(calc.balance())}</b></div><div><small>Comprometido</small><b>${Rk(c.tot)}</b></div><div><small>Em metas</small><b>${Rk(calc.reserved())}</b></div></div>
      </div>
      <div class="qa">
        <button onclick="txForm('out')"><span class="c" style="color:var(--red)">${I('down', 2.4)}</span>Despesa</button>
        <button onclick="txForm('in')"><span class="c" style="color:var(--green)">${I('up', 2.4)}</span>Receita</button>
        <button onclick="txForm('card')"><span class="c" style="color:var(--indigo)">${I('card')}</span>Cartão</button>
        <button onclick="billForm()"><span class="c" style="color:var(--orange)">${I('cal')}</span>Conta</button>
        <button onclick="openAssistant()"><span class="c" style="color:var(--accent)">${I('spark')}</span>Perguntar</button>
      </div>
      ${ins.length ? `<div class="sec-h"><h2>Para você</h2><span class="mut" style="font-size:13px">${ins.length} insight${ins.length > 1 ? 's' : ''}</span></div>
      <div class="hscroll">${ins.map((i) => `<div class="insight"><div class="top"><span class="dot" style="background:color-mix(in srgb, ${i.c} 16%, transparent)">${i.e}</span><span style="color:${i.c}">${esc(i.h)}</span></div><b>${esc(i.b)}</b><p>${esc(i.p)}</p>${i.go ? `<button class="go" onclick="${i.go[1]}">${esc(i.go[0])} ›</button>` : ''}</div>`).join('')}</div>` : ''}
      <div class="sec-h"><h2>Este mês</h2><button class="link" onclick="go('stats')">Análise</button></div>
      <div class="stats">
        <div class="stat"><small><span style="color:var(--green)">●</span>Receitas</small><b data-count="${mo.inc}" data-key="inc">${R(mo.inc)}</b>${calc.pendingIn() ? `<div class="delta mut">+${R(calc.pendingIn())} a receber</div>` : ''}</div>
        <div class="stat"><small><span style="color:var(--accent)">●</span>Gastos</small><b data-count="${mo.out}" data-key="out">${R(mo.out)}</b>${dlt != null ? `<div class="delta" style="color:${dlt > 0 ? 'var(--red)' : 'var(--green)'}">${dlt > 0 ? '▲' : '▼'} ${Math.abs(dlt)}% vs mês passado</div>` : ''}</div>
      </div>
      <button class="card pad ring-row" style="width:100%;text-align:left" onclick="go('stats')">
        ${ring(h.s / 100, 72, 9, h.col, h.s, 'de 100')}
        <div style="flex:1"><div class="mut" style="font-size:13px;font-weight:600">SAÚDE FINANCEIRA</div><div style="font-size:22px;font-weight:700;letter-spacing:-.02em;color:${h.col}">${h.lbl}</div>
        <div class="mut" style="font-size:14px">Previsão de gastos no mês: <b style="color:var(--tx)">${R(pj.proj)}</b></div></div>
      </button>
      ${bud.length ? `<div class="sec-h"><h2>Orçamentos</h2><button class="link" onclick="editBudget()">Editar</button></div>
      <div class="card pad" style="display:grid;grid-template-columns:repeat(${bud.length},1fr);gap:8px;text-align:center">${bud.map(([k, v, u]) => `<div>${ring(u / v, 58, 7, u > v ? 'var(--red)' : u / v > 0.8 ? 'var(--orange)' : catOf(k).c, `<span style="font-size:20px">${catOf(k).e}</span>`)}<div style="font-size:12px;font-weight:600;margin-top:6px">${esc(k)}</div><div class="mut" style="font-size:11px">${u > v ? 'passou ' + Rk(u - v) : 'restam ' + Rk(v - u)}</div></div>`).join('')}</div>` : ''}
      <div class="sec-h"><h2>Próximos vencimentos</h2><button class="link" onclick="go('wallet','bills')">Contas</button></div>
      <div class="list">${up.map((x) => { const n = diffDays(today(), x.d); return `<button class="li" onclick="${x.k == 'b' ? `billForm('${x.id}')` : `UI.card='${x.id}';go('wallet','cards')`}">${x.k == 'b' ? catIcon(x.cat) : `<span class="ic g-${(S.cards.find((c) => c.id == x.id) || {}).color}">${I('card')}</span>`}<div class="mid"><div class="t">${esc(x.n)}</div><div class="s">${fmtDay(x.d)}</div></div><div class="end"><span class="badge ${n < 0 ? 'red' : n <= 3 ? 'orange' : ''}">${dueLabel(x.d)}</span><span class="amt">${R(x.a)}</span></div></button>` }).join('') || emptyBox('🌤️', 'Tudo em dia', 'Nenhum vencimento nos próximos dias.')}</div>
      <div class="sec-h"><h2>Recentes</h2><button class="link" onclick="go('tx')">Ver tudo</button></div>
      <div class="list">${recent.map(txRow).join('') || emptyBox('🪄', 'Nada por aqui ainda', 'Toque em + e digite algo como “mercado 120”.', ['Lançar agora', 'quickAdd()'])}</div>`,
    }
  },

  // ---------------- EXTRATO ----------------
  tx() {
    const m = UI.txMonth || ym(), q = nz(UI.q), f = UI.txFilter
    let l = S.tx.filter((t) => (q ? nz(t.desc + ' ' + t.cat).includes(q) || String(t.amt / 100).includes(q) : t.date.startsWith(m)))
    if (f == 'out') l = l.filter((t) => t.type == 'out'); else if (f == 'in') l = l.filter((t) => t.type == 'in'); else if (f == 'pend') l = l.filter((t) => t.status == 'pending'); else if (f == 'card') l = l.filter((t) => t.cardId)
    l.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))
    const inc = l.filter((t) => t.type == 'in').reduce((s, t) => s + t.amt, 0), out = l.filter((t) => t.type == 'out').reduce((s, t) => s + t.amt, 0)
    const groups = {}
    l.forEach((t) => (groups[t.date] ||= []).push(t))
    const chips = [['all', 'Tudo'], ['out', 'Saídas'], ['in', 'Entradas'], ['card', 'Cartão'], ['pend', 'Pendentes']]
    return {
      title: 'Extrato',
      html: `<div class="lt"><h1>Extrato</h1></div>
      <label class="search">${I('search')}<input id="q" type="search" placeholder="Buscar lançamentos" value="${esc(UI.q)}" oninput="UI.q=this.value;render(false,true)"></label>
      ${q ? `<div class="footnote" style="margin:0 0 10px;padding:0 4px">Buscando em todos os meses</div>` : monthSwitch('txMonth', m)}
      <div class="chips">${chips.map(([k, n]) => `<button class="chip ${f == k ? 'on' : ''}" onclick="UI.txFilter='${k}';haptic();render(false,true)">${n}</button>`).join('')}</div>
      <div class="stats"><div class="stat"><small><span style="color:var(--green)">●</span>Entradas</small><b>${R(inc)}</b></div><div class="stat"><small><span style="color:var(--accent)">●</span>Saídas</small><b>${R(out)}</b></div></div>
      ${Object.entries(groups).map(([d, ts]) => { const net = ts.reduce((s, t) => s + (t.type == 'in' ? t.amt : -t.amt), 0); return `<div class="group-label"><span>${relDay(d)}</span><span class="num">${net >= 0 ? '+' : '−'}${R(Math.abs(net))}</span></div><div class="list">${ts.map(txRow).join('')}</div>` }).join('') || `<div class="list">${emptyBox('🔍', q ? 'Nada encontrado' : 'Sem lançamentos', q ? 'Tente outra palavra.' : 'Nenhuma movimentação neste filtro.', q ? null : ['Adicionar', 'quickAdd()'])}</div>`}
      ${l.length ? `<p class="footnote" style="text-align:center;margin-top:8px">Deslize um item para a esquerda para editar ou apagar.</p>` : ''}`,
    }
  },

  // ---------------- CARTEIRA ----------------
  wallet() {
    const seg = [['cards', 'Cartões'], ['bills', 'Contas'], ['goals', 'Metas']]
    const body = UI.sub == 'bills' ? walletBills() : UI.sub == 'goals' ? walletGoals() : walletCards()
    return {
      title: 'Carteira',
      html: `<div class="lt"><h1>Carteira</h1></div><div class="seg">${seg.map(([k, n]) => `<button class="${UI.sub == k ? 'on' : ''}" onclick="UI.sub='${k}';haptic();render()">${n}</button>`).join('')}</div>${body}`,
    }
  },

  // ---------------- ANÁLISE ----------------
  stats() {
    const m = UI.statsMonth || ym(), isCur = m == ym(), mo = calc.monthOf(m), cs = Object.entries(calc.catSpend(m)).sort((a, b) => b[1] - a[1]), tot = cs.reduce((s, x) => s + x[1], 0)
    const [y, mm] = m.split('-').map(Number), dim = daysIn(y, mm), td = isCur ? new Date().getDate() : dim
    const cum = (mon, n) => { const out = [], ds = {}; S.tx.filter((t) => t.type == 'out' && t.date.startsWith(mon) && (t.cardId || t.status == 'done')).forEach((t) => (ds[+t.date.slice(8)] = (ds[+t.date.slice(8)] || 0) + t.amt)); let a = 0; for (let i = 1; i <= n; i++) { a += ds[i] || 0; out.push(a) } return out }
    const pm = addMonths(m, -1), [py, pmm] = pm.split('-').map(Number)
    const cur = cum(m, td), prev = cum(pm, Math.min(dim, daysIn(py, pmm)))
    const six = [...Array(6)].map((_, i) => { const mon = addMonths(m, i - 5), x = calc.monthOf(mon); return { l: MES3[+mon.slice(5) - 1], a: x.inc, b: x.out, cur: mon == m } })
    const avg6 = Math.round(six.slice(0, 5).reduce((s, x) => s + x.b, 0) / Math.max(1, six.slice(0, 5).filter((x) => x.b).length))
    const h = calc.health(), rec = calc.recurring(), fut = calc.months(6, addMonths(ym(), 1)).map((x) => ({ m: x, v: S.cards.reduce((s, c) => s + calc.open(c, x), 0) }))
    const buds = Object.entries(S.budgets).filter(([, v]) => v > 0)
    const csMap = Object.fromEntries(cs)
    const rate = mo.inc ? Math.round(((mo.inc - mo.out) / mo.inc) * 100) : null
    return {
      title: 'Análise',
      html: `<div class="lt"><h1>Análise</h1></div>${monthSwitch('statsMonth', m)}
      <div class="stats">
        <div class="stat"><small>Saldo do mês</small><b class="${mo.net >= 0 ? 'pos' : 'red'}">${mo.net >= 0 ? '+' : '−'}${R(Math.abs(mo.net))}</b><div class="delta mut">${rate != null ? `Taxa de poupança: ${rate}%` : 'Sem receitas'}</div></div>
        <div class="stat"><small>Média de gastos</small><b>${R(avg6 || 0)}</b><div class="delta mut">últimos 5 meses</div></div>
      </div>
      ${isCur ? `<div class="card pad ring-row">${ring(h.s / 100, 84, 10, h.col, h.s, 'de 100')}<div style="flex:1"><div style="font-weight:700;font-size:18px">Saúde ${h.lbl.toLowerCase()}</div><div class="mut" style="font-size:14px;line-height:1.4">Considera quanto da renda você gasta, saldo livre, contas atrasadas, orçamentos e reservas.</div></div></div>` : ''}
      <div class="sec-h"><h2>Para onde foi</h2><span class="mut num" style="font-size:15px">${R(tot)}</span></div>
      <div class="card pad">${cs.length ? `<div class="donut-wrap">${donut(cs.slice(0, 7))}<div class="donut-legend">${cs.slice(0, 6).map(([k, v]) => `<div><i style="background:${catOf(k).c}"></i><span>${esc(k)}</span><b class="num">${Math.round((v / tot) * 100)}%</b></div>`).join('')}</div></div>
        <div class="list plain" style="box-shadow:none;margin:14px -16px -16px;border-radius:0">${cs.map(([k, v]) => `<div class="li">${catIcon(k)}<div class="mid"><div class="t">${esc(k)}</div><div class="pbar" style="margin-top:6px"><i style="width:${(v / cs[0][1]) * 100}%;background:${catOf(k).c}"></i></div></div><div class="end"><span class="amt">${R(v)}</span></div></div>`).join('')}</div>` : emptyBox('📊', 'Sem gastos', 'Nenhuma despesa neste mês.')}</div>
      <div class="sec-h"><h2>Orçamentos</h2><button class="link" onclick="editBudget()">${buds.length ? 'Editar' : 'Criar'}</button></div>
      <div class="list">${buds.map(([k, v]) => { const u = csMap[k] || 0, r = u / v; return `<button class="li" onclick="editBudget('${k}')">${catIcon(k)}<div class="mid"><div class="t">${esc(k)}</div><div class="pbar" style="margin:6px 0 3px"><i style="width:${Math.min(100, r * 100)}%;background:${r > 1 ? 'var(--red)' : r > 0.8 ? 'var(--orange)' : 'var(--green)'}"></i></div><div class="s">${R(u)} de ${R(v)}</div></div><div class="end"><span class="badge ${r > 1 ? 'red' : r > 0.8 ? 'orange' : 'green'}">${r > 1 ? '+' + R(u - v) : Math.round(r * 100) + '%'}</span></div></button>` }).join('') || emptyBox('🎯', 'Defina limites', 'Crie orçamentos por categoria e eu aviso quando estiver perto do limite.', ['Criar orçamento', 'editBudget()'])}</div>
      <div class="sec-h"><h2>Ritmo de gastos</h2></div>
      <div class="card pad">${paceChart(cur, prev, dim, td, mo.inc || 0)}<div class="legend"><span><i style="background:var(--accent)"></i>${fmtMonthLong(m)}</span><span><i style="background:var(--tx3)"></i>${fmtMonthLong(pm)}</span>${mo.inc ? '<span><i style="background:var(--orange)"></i>renda</span>' : ''}</div></div>
      <div class="sec-h"><h2>Receitas × gastos</h2></div>
      <div class="card pad">${barsChart(six)}<div class="legend"><span><i style="background:var(--green)"></i>receitas</span><span><i style="background:var(--accent)"></i>gastos</span></div></div>
      ${rec.length ? `<div class="sec-h"><h2>Recorrentes</h2><span class="mut num" style="font-size:15px">${R(rec.reduce((s, r) => s + r.avg, 0))}/mês</span></div>
      <div class="list">${rec.slice(0, 8).map((r) => `<div class="li">${catIcon(r.cat)}<div class="mid"><div class="t">${esc(r.desc)}</div><div class="s">${r.months} meses · ${R(r.avg * 12)}/ano</div></div><div class="end"><span class="amt">${R(r.avg)}</span></div></div>`).join('')}</div>
      <p class="footnote">Detectados automaticamente pelo histórico.</p>` : ''}
      ${S.cards.length ? `<div class="sec-h"><h2>Parcelas futuras</h2></div><div class="list plain">${fut.map((x) => `<div class="li"><div class="mid"><div class="t" style="text-transform:capitalize">${fmtMonthLong(x.m)}</div></div><div class="end"><span class="amt">${R(x.v)}</span></div></div>`).join('')}</div>` : ''}
      <div class="sec-h"><h2>Exportar</h2></div>
      <div class="list"><button class="li" onclick="exportCSV()"><span class="ic" style="background:var(--green)">${I('dl')}</span><div class="mid"><div class="t">Planilha CSV</div><div class="s">Abre no Excel, Numbers e Google Sheets</div></div>${I('chevR')}</button></div>`,
    }
  },
}

// ---------- carteira: cartões ----------
function walletCards() {
  if (!S.cards.length) return `<div class="list">${emptyBox('💳', 'Nenhum cartão', 'Cadastre seus cartões para acompanhar faturas, limite e parcelas.', ['Adicionar cartão', 'cardForm()'])}</div>`
  const c = S.cards.find((x) => x.id == UI.card) || S.cards[0]
  UI.card = c.id
  const u = calc.used(c), cur = calc.curInvoice(c), open = calc.open(c, cur), fut = calc.invoiceMonths(c).filter((m) => calc.open(c, m) > 0)
  const buys = S.tx.filter((t) => t.cardId == c.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8)
  const best = c.close >= 28 ? 1 : c.close + 1, [yy, mm] = cur.split('-').map(Number)
  return `<div class="hscroll" style="padding-bottom:16px">${S.cards.map((x) => `<button class="cc g-${x.color} ${x.id == c.id ? '' : 'dim'}" onclick="UI.card='${x.id}';haptic();render()"><div class="row"><span class="nm">${esc(x.name)}</span><span class="chip-i"></span></div><div class="lim"><small>Limite disponível</small><b>${R(x.limit - calc.used(x))}</b></div><div class="row"><span class="dots">•••• ${String(x.id).replace(/\D/g, '').slice(0, 4).padEnd(4, '0')}</span><span style="font-size:12px;opacity:.8">vence dia ${x.due}</span></div></button>`).join('')}<button class="cc add" onclick="cardForm()">${I('plus')}Novo cartão</button></div>
  <div class="card pad">
    <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="mut" style="font-size:13px;font-weight:600">FATURA DE ${MES[+cur.slice(5) - 1].toUpperCase()}</div><div style="font-size:30px;font-weight:800;letter-spacing:-.03em" class="num">${R(open)}</div><div class="mut" style="font-size:14px">vence ${pad(Math.min(c.due, daysIn(yy, mm)))}/${cur.slice(5)} · ${dueLabel(`${cur}-${pad(Math.min(c.due, daysIn(yy, mm)))}`)}</div></div>
    ${open ? `<button class="btn sm" onclick="payInv('${c.id}','${cur}')">Pagar</button>` : '<span class="badge green">paga</span>'}</div>
    <div class="pbar" style="margin:14px 0 6px"><i style="width:${Math.min(100, (u / c.limit) * 100 || 0)}%;background:${u / c.limit > 0.8 ? 'var(--red)' : 'var(--indigo)'}"></i></div>
    <div style="display:flex;justify-content:space-between;font-size:13px" class="mut"><span>Usado ${R(u)}</span><span>Limite ${R(c.limit)}</span></div>
  </div>
  <div class="list plain">
    <div class="li"><span class="ic" style="background:var(--green)">${I('spark')}</span><div class="mid"><div class="t">Melhor dia de compra</div><div class="s">Compras a partir desse dia vão para a fatura seguinte</div></div><div class="end"><b>dia ${best}</b></div></div>
    <div class="li"><span class="ic" style="background:var(--indigo)">${I('cal')}</span><div class="mid"><div class="t">Fechamento e vencimento</div></div><div class="end"><span class="mut">dia ${c.close} · dia ${c.due}</span></div></div>
  </div>
  <div class="sec-h"><h2>Próximas faturas</h2></div>
  <div class="list">${fut.filter((m) => m != cur).slice(0, 8).map((m) => `<div class="li"><div class="mid"><div class="t" style="text-transform:capitalize">${fmtMonthLong(m)}</div><div class="s">${S.tx.filter((t) => t.cardId == c.id && t.inst.some((i) => i.m == m)).length} lançamentos</div></div><div class="end"><span class="amt">${R(calc.open(c, m))}</span><button class="btn sm gray" onclick="payInv('${c.id}','${m}')">Pagar</button></div></div>`).join('') || emptyBox('✨', 'Sem parcelas futuras', 'Nada lançado para os próximos meses.')}</div>
  <div class="sec-h"><h2>Compras</h2><button class="link" onclick="txForm('card',null,{cardId:'${c.id}'})">+ Nova</button></div>
  <div class="list">${buys.map(txRow).join('') || emptyBox('🛍️', 'Sem compras', 'Lance uma compra à vista ou parcelada.', ['Nova compra', `txForm('card',null,{cardId:'${c.id}'})`])}</div>
  <div style="display:flex;gap:10px"><button class="btn gray" style="flex:1" onclick="cardForm('${c.id}')">${I('edit')}Editar</button><button class="btn danger" style="flex:1" onclick="delCard('${c.id}')">${I('trash')}Excluir</button></div>`
}

// ---------- carteira: contas ----------
function walletBills() {
  const p = ym(), [y, m] = p.split('-').map(Number), first = new Date(y, m - 1, 1).getDay(), n = daysIn(y, m), td = new Date().getDate(), ev = {}
  const add = (d, col) => ((ev[+d.slice(8)] ||= new Set()).add(col))
  S.bills.filter((b) => !b.paid && b.due.startsWith(p)).forEach((b) => add(b.due, b.due < today() ? 'var(--red)' : 'var(--orange)'))
  S.tx.filter((t) => !t.cardId && t.status == 'pending' && t.date.startsWith(p)).forEach((t) => add(t.date, t.type == 'in' ? 'var(--green)' : 'var(--orange)'))
  S.cards.forEach((c) => add(`${p}-${pad(Math.min(c.due, n))}`, 'var(--indigo)'))
  let cal = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<div class="wd">${x}</div>`).join('') + '<div></div>'.repeat(first)
  for (let d = 1; d <= n; d++) cal += `<button class="d ${d == td ? 'today' : ''} ${d == UI.calDay ? 'sel' : ''}" onclick="UI.calDay=${d == UI.calDay ? 'null' : d};haptic();render()">${d}<span class="ev">${[...(ev[d] || [])].slice(0, 3).map((c) => `<i style="background:${c}"></i>`).join('')}</span></button>`
  let list = S.bills.filter((b) => !b.paid).sort((a, b) => (a.due > b.due ? 1 : -1))
  if (UI.calDay) list = list.filter((b) => b.due == `${p}-${pad(UI.calDay)}`)
  const late = list.filter((b) => b.due < today()), month = list.filter((b) => b.due >= today() && b.due.startsWith(p)), next = list.filter((b) => b.due.slice(0, 7) > p)
  const paid = S.bills.filter((b) => b.paid).slice(-5)
  const billRow = (b) => `<div class="li-wrap"><div class="li-acts"><button class="ok" onclick="payBill('${b.id}')">${I('check')}Pagar</button><button class="del" onclick="delBill('${b.id}')">${I('trash')}Apagar</button></div>
    <button class="li" onclick="billForm('${b.id}')">${catIcon(b.cat)}<div class="mid"><div class="t">${esc(b.name)}</div><div class="s">${fmtDay(b.due)}${b.rec ? ' · mensal' : ''}</div></div><div class="end"><div style="text-align:right"><div class="amt">${R(b.amt)}</div><span class="badge ${b.due < today() ? 'red' : diffDays(today(), b.due) <= 3 ? 'orange' : ''}" style="margin-top:2px">${dueLabel(b.due)}</span></div></div></button></div>`
  const tot = S.bills.filter((b) => !b.paid && b.due.slice(0, 7) <= p).reduce((s, b) => s + b.amt, 0)
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 0"><b style="text-transform:capitalize;font-size:17px">${MES[m - 1]} ${y}</b><span class="mut num" style="font-size:14px">a pagar: <b style="color:var(--tx)">${R(tot)}</b></span></div><div class="cal">${cal}</div>
  <div class="legend" style="padding:0 16px 14px;margin:0"><span><i style="background:var(--orange)"></i>a vencer</span><span><i style="background:var(--red)"></i>atrasada</span><span><i style="background:var(--indigo)"></i>cartão</span><span><i style="background:var(--green)"></i>a receber</span></div></div>
  <button class="btn block tint" style="margin-bottom:6px" onclick="billForm()">${I('plus')}Nova conta</button>
  ${UI.calDay ? `<div class="group-label"><span>Dia ${UI.calDay}</span><button style="color:var(--accent);text-transform:none" onclick="UI.calDay=null;render()">Ver todas</button></div><div class="list">${list.map(billRow).join('') || emptyBox('☀️', 'Dia livre', 'Nenhuma conta para este dia.')}</div>` : `
  ${late.length ? `<div class="group-label"><span style="color:var(--red)">Atrasadas</span></div><div class="list">${late.map(billRow).join('')}</div>` : ''}
  <div class="group-label"><span>Este mês</span></div><div class="list">${month.map(billRow).join('') || emptyBox('🎉', 'Tudo pago', 'Nenhuma conta pendente neste mês.')}</div>
  ${next.length ? `<div class="group-label"><span>Próximos meses</span></div><div class="list">${next.map(billRow).join('')}</div>` : ''}
  ${paid.length ? `<div class="group-label"><span>Pagas</span></div><div class="list">${paid.map((b) => `<div class="li">${catIcon(b.cat)}<div class="mid"><div class="t">${esc(b.name)}</div><div class="s">${fmtDay(b.due)}</div></div><div class="end"><span class="badge green">${I('check')}</span><button class="icon-btn" style="width:30px;height:30px;color:var(--red)" onclick="delBill('${b.id}')" aria-label="Apagar">${I('x')}</button></div></div>`).join('')}</div>` : ''}
  <p class="footnote">Contas mensais são renovadas automaticamente para o mês seguinte quando você paga.</p>`}`
}

// ---------- carteira: metas ----------
function walletGoals() {
  const tot = calc.reserved(), tgt = S.goals.reduce((s, g) => s + g.target, 0)
  return `${S.goals.length ? `<div class="card pad ring-row">${ring(tgt ? tot / tgt : 0, 70, 9, 'var(--accent)', Math.round(tgt ? (tot / tgt) * 100 : 0) + '%')}<div><div class="mut" style="font-size:13px;font-weight:600">TOTAL GUARDADO</div><div style="font-size:26px;font-weight:800;letter-spacing:-.03em" class="num">${R(tot)}</div><div class="mut" style="font-size:14px">de ${R(tgt)} em ${S.goals.length} meta${S.goals.length > 1 ? 's' : ''}</div></div></div>` : ''}
  ${S.goals.map((g) => {
    const p = g.target ? g.saved / g.target : 0, need = calc.need(g), done = g.saved >= g.target
    const months = g.date ? Math.max(0, diffDays(today(), g.date)) : null
    return `<div class="card pad"><button style="display:flex;gap:14px;align-items:center;width:100%;text-align:left" onclick="goalForm('${g.id}')">${ring(p, 62, 7, done ? 'var(--green)' : 'var(--accent)', `<span style="font-size:24px">${g.emoji}</span>`)}
      <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.name)}</div><div class="num" style="font-size:15px"><b>${R(g.saved)}</b> <span class="mut">de ${R(g.target)}</span></div>
      <div class="mut" style="font-size:13px">${done ? '🏆 Meta atingida!' : g.date ? `${Math.round(p * 100)}% · guarde <b style="color:var(--accent)">${R(need)}/mês</b> até ${fmtMonth(g.date.slice(0, 7))}` : `${Math.round(p * 100)}% · sem data definida`}${months != null && months < 31 && !done ? ' · ⏳' : ''}</div></div></button>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn sm tint" style="flex:1" onclick="depGoal('${g.id}')">${I('plus')}Guardar</button><button class="btn sm gray" style="flex:1" onclick="depGoal('${g.id}',0,true)">Retirar</button></div></div>`
  }).join('') || `<div class="list">${emptyBox('🎯', 'Crie sua primeira meta', 'Viagem, reserva de emergência, carro novo… eu calculo quanto guardar por mês.', ['Nova meta', 'goalForm()'])}</div>`}
  ${S.goals.length ? `<button class="btn block tint" onclick="goalForm()">${I('plus')}Nova meta</button><p class="footnote" style="margin-top:10px">O valor guardado em metas é separado do seu disponível para gastar.</p>` : ''}`
}

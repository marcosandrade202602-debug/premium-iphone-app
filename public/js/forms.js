/* ================================================================
   MEU MÊS — formulários e ações
   ================================================================ */
'use strict'

// ---------- lançamento (despesa / receita / compra no cartão) ----------
function txForm(mode, id, preset = {}) {
  const t = id ? S.tx.find((x) => x.id == id) : null
  if (id && !t) return
  let m = t ? (t.cardId ? 'card' : t.type) : mode || 'out'
  const st = {
    amt: t ? t.amt : preset.amt || 0, desc: t ? t.desc : preset.desc || '', date: t ? t.date : preset.date || today(),
    cat: t ? t.cat : preset.cat || null, status: t ? t.status : preset.status || 'done',
    cardId: t?.cardId || preset.cardId || S.cards[0]?.id, n: t?.n || preset.n || 1,
  }
  const body = () => {
    const type = m == 'in' ? 'in' : 'out'
    if (st.cat && !catsFor(type).includes(st.cat)) st.cat = null
    const sug = st.desc ? suggestCat(st.desc, type) : null
    const cat = st.cat || sug || (type == 'in' ? 'Salário' : 'Alimentação')
    const segs = [['out', 'Despesa'], ['in', 'Receita'], ['card', 'Cartão']]
    const noCard = m == 'card' && !S.cards.length
    return `${!t ? `<div class="seg">${segs.map(([k, n]) => `<button type="button" data-m="${k}" class="${m == k ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
      ${noCard ? emptyBox('💳', 'Cadastre um cartão', 'Para lançar compras no crédito e parcelas, primeiro adicione um cartão.', ['Adicionar cartão', 'closeAllSheets();setTimeout(cardForm,350)']) : `
      ${amountField('amt', st.amt, type, m == 'card' ? '<span id="instPrev"></span>' : '')}
      <div class="form">
        ${row('Descrição', inText('desc', st.desc, type == 'in' ? 'Ex.: salário' : 'Ex.: mercado', 'class="left" enterkeyhint="done"'))}
        ${row('Data', `<input type="date" name="date" value="${st.date}">`)}
        ${m == 'card' ? row('Cartão', inSelect('cardId', S.cards.map((c) => [c.id, c.name]), st.cardId)) + row('Parcelas', `<div class="stepper" style="margin-left:auto"><button type="button" data-st="-1">−</button><span id="nVal">${st.n}x</span><button type="button" data-st="1">+</button></div>`)
        : row(type == 'in' ? 'Já recebido' : 'Já pago', `<span style="margin-left:auto">${inSwitch('done', st.status == 'done')}</span>`)}
      </div>
      <div class="form-label">Categoria ${sug ? '<span style="color:var(--accent);text-transform:none">· ✦ sugerida</span>' : ''}</div>
      ${catGrid(type, cat, st.cat ? null : sug)}
      ${t ? `<button type="button" class="btn block danger" id="txDel">${I('trash')}Apagar lançamento</button>` : ''}`}`
  }
  const sync = (root) => {
    if ($('[name=amt]', root)) st.amt = getAmt(root, 'amt')
    if ($('[name=desc]', root)) st.desc = val(root, 'desc')
    st.date = val(root, 'date') || st.date
    if ($('[name=done]', root)) st.status = val(root, 'done') ? 'done' : 'pending'
    if ($('[name=cardId]', root)) st.cardId = val(root, 'cardId')
    const g = $('.cat-grid', root); if (g && g.dataset.manual) st.cat = g.dataset.cat
  }
  const mount = (a) => {
    const root = a.body
    root.innerHTML = body()
    bindAmount(root); bindCatGrid(root, (k) => (st.cat = k))
    if (t || st.cat) { const g = $('.cat-grid', root); if (g) g.dataset.manual = '1' }
    $$('.seg button', root).forEach((b) => (b.onclick = () => { sync(root); m = b.dataset.m; haptic(); mount(a) }))
    const di = $('[name=desc]', root)
    if (di) di.addEventListener('input', () => { const s = suggestCat(di.value, m == 'in' ? 'in' : 'out'); if (s) setCatGrid(root, s) })
    const prev = () => {
      const p = $('#instPrev', root); if (!p) return
      const c = S.cards.find((x) => x.id == val(root, 'cardId')), amt = getAmt(root, 'amt'), d = val(root, 'date') || today()
      if (!c) return
      const inst = calc.inst(c, d, amt || 100, st.n)
      p.innerHTML = `${st.n > 1 ? `${st.n}x de ${R(Math.round((amt || 0) / st.n))} · ` : ''}1ª fatura em ${fmtMonth(inst[0].m)}`
    }
    $$('[data-st]', root).forEach((b) => (b.onclick = () => { st.n = Math.max(1, Math.min(48, st.n + +b.dataset.st)); $('#nVal', root).textContent = st.n + 'x'; haptic(); prev() }))
    root.addEventListener('input', prev); root.addEventListener('change', prev); prev()
    const del = $('#txDel', root); if (del) del.onclick = () => { a.close(); delTx(t.id) }
    if (!t && !$('.empty', root)) setTimeout(() => $('[name=amt]', root)?.focus(), 380)
  }
  openSheet({
    title: t ? 'Editar lançamento' : 'Novo lançamento',
    onMount: mount,
    onDone: (a) => {
      const root = a.body
      if (m == 'card' && !S.cards.length) return
      const amt = getAmt(root, 'amt')
      if (!amt) { toast('Informe o valor'); $('.amount-in', root).animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], 300); return false }
      const type = m == 'in' ? 'in' : 'out', cat = $('.cat-grid', root).dataset.cat || 'Outros'
      let desc = val(root, 'desc').trim() || cat
      const date = val(root, 'date') || today()
      const o = { desc, amt, type, cat, date, status: 'done' }
      if (m == 'card') {
        const c = S.cards.find((x) => x.id == val(root, 'cardId'))
        Object.assign(o, { cardId: c.id, n: st.n, inst: calc.inst(c, date, amt, st.n) })
      } else o.status = val(root, 'done') ? 'done' : 'pending'
      if (t) { delete t.cardId; delete t.inst; delete t.n; Object.assign(t, o) } else S.tx.push({ id: uid(), ...o })
      learn(desc, cat)
      save(); toast(t ? 'Lançamento atualizado' : type == 'in' ? 'Receita adicionada' : 'Despesa adicionada'); haptic(12)
    },
  })
}
function delTx(id) { const t = S.tx.find((x) => x.id == id); if (!t) return; snap(); S.tx = S.tx.filter((x) => x.id != id); save(); toast(`“${t.desc}” apagado`, ['Desfazer', undo]); haptic(15) }

// ---------- lançamento inteligente por texto ----------
function quickAdd() {
  const ex = ['almoço 32,90 ontem', 'recebi 3.500 salário', 'tv 2400 em 10x ' + (S.cards[0] ? nz(S.cards[0].name).split(' ')[0] : 'no cartão'), 'luz 180 pendente dia 15', 'uber 18', 'mercado 245,30']
  let pq = null
  openSheet({
    title: 'Adicionar', done: null, cancel: 'Fechar',
    html: `<div class="smart"><div class="head">${I('spark')} Digite como você fala</div>
      <input id="qa" placeholder="${esc(ex[0])}" autocomplete="off" enterkeyhint="done">
      <div class="prev" id="qaPrev"><span class="ex">Ex.: “${esc(ex[Math.floor(Math.random() * ex.length)])}”</span></div>
      <button class="btn block" id="qaGo" disabled style="opacity:.4">Adicionar</button></div>
      <div class="form-label">Ou escolha</div>
      <div class="action-grid">
        <button onclick="closeAllSheets();setTimeout(()=>txForm('out'),300)"><span class="ic" style="background:var(--red)">${I('down', 2.4)}</span><div><b>Despesa</b><small>Pix, débito, dinheiro</small></div></button>
        <button onclick="closeAllSheets();setTimeout(()=>txForm('in'),300)"><span class="ic" style="background:var(--green)">${I('up', 2.4)}</span><div><b>Receita</b><small>Salário, extra, vendas</small></div></button>
        <button onclick="closeAllSheets();setTimeout(()=>txForm('card'),300)"><span class="ic" style="background:var(--indigo)">${I('card')}</span><div><b>Cartão</b><small>À vista ou parcelado</small></div></button>
        <button onclick="closeAllSheets();setTimeout(()=>billForm(),300)"><span class="ic" style="background:var(--orange)">${I('cal')}</span><div><b>Conta</b><small>Boleto, aluguel, luz</small></div></button>
        <button onclick="closeAllSheets();setTimeout(()=>goalForm(),300)"><span class="ic" style="background:var(--accent)">${I('target')}</span><div><b>Meta</b><small>Junte para um sonho</small></div></button>
        <button onclick="closeAllSheets();setTimeout(()=>cardForm(),300)"><span class="ic" style="background:#1c1c1e">${I('wallet')}</span><div><b>Novo cartão</b><small>Limite e fechamento</small></div></button>
      </div>`,
    onMount: (a) => {
      const inp = $('#qa', a.el), pv = $('#qaPrev', a.el), go = $('#qaGo', a.el)
      const upd = () => {
        const v = inp.value.trim()
        if (!v) { pq = null; pv.innerHTML = `<span class="ex">Ex.: “${esc(ex[1])}”</span>`; go.disabled = true; go.style.opacity = 0.4; return }
        pq = parseQuick(v)
        const c = pq.cardId && S.cards.find((x) => x.id == pq.cardId)
        pv.innerHTML = [
          `<span class="badge ${pq.type == 'in' ? 'green' : 'red'}">${pq.type == 'in' ? '↑ Receita' : '↓ Despesa'}</span>`,
          `<span class="badge accent">${pq.amt ? R(pq.amt) : 'valor?'}</span>`,
          `<span class="badge">${catOf(pq.cat).e} ${esc(pq.cat)}</span>`,
          `<span class="badge">${relDay(pq.date)}</span>`,
          c ? `<span class="badge">💳 ${esc(c.name)}${pq.n > 1 ? ` · ${pq.n}x` : ''}</span>` : '',
          pq.status == 'pending' ? '<span class="badge orange">pendente</span>' : '',
          `<span class="badge" style="background:none;padding-left:2px">“${esc(pq.desc)}”</span>`,
        ].join('')
        go.disabled = !pq.amt; go.style.opacity = pq.amt ? 1 : 0.4
      }
      inp.addEventListener('input', upd)
      const add = () => {
        if (!pq || !pq.amt) return
        const o = { id: uid(), desc: pq.desc, amt: pq.amt, type: pq.type, cat: pq.cat, date: pq.date, status: pq.status }
        if (pq.cardId) { const c = S.cards.find((x) => x.id == pq.cardId); Object.assign(o, { cardId: c.id, n: pq.n, inst: calc.inst(c, pq.date, pq.amt, pq.n), status: 'done' }) }
        S.tx.push(o); learn(o.desc, o.cat)
        const id = o.id
        save(); haptic(12)
        toast(`${o.type == 'in' ? '+' : '−'}${R(o.amt)} · ${o.desc}`, ['Editar', () => txForm(null, id)])
        inp.value = ''; upd(); inp.focus()
      }
      go.onclick = add
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add() } })
      setTimeout(() => inp.focus(), 380)
    },
  })
}

// ---------- contas ----------
function billForm(id) {
  const b = id ? S.bills.find((x) => x.id == id) : null
  openSheet({
    title: b ? 'Editar conta' : 'Nova conta',
    html: `${amountField('amt', b?.amt || 0)}
      <div class="form">${row('Nome', inText('name', b?.name || '', 'Aluguel, luz, internet…', 'class="left"'))}${row('Vencimento', `<input type="date" name="due" value="${b?.due || today()}">`)}
      ${row('Categoria', inSelect('cat', catsFor('out').map((k) => [k, catOf(k).e + ' ' + k]), b?.cat || 'Contas'))}${row('Repete todo mês', `<span style="margin-left:auto">${inSwitch('rec', b ? b.rec : true)}</span>`)}</div>
      ${b && !b.paid ? `<button type="button" class="btn block" id="bPay" style="margin-bottom:10px">${I('check')}Marcar como paga</button>` : ''}
      ${b ? `<button type="button" class="btn block danger" id="bDel">${I('trash')}Apagar conta</button>` : '<p class="form-note">Eu aviso quando estiver perto do vencimento e desconto do seu disponível.</p>'}`,
    onMount: (a) => {
      bindAmount(a.body)
      const n = $('[name=name]', a.body)
      n.addEventListener('input', () => { const s = suggestCat(n.value, 'out'); if (s) $('[name=cat]', a.body).value = s })
      if (b) { $('#bDel', a.body).onclick = () => { a.close(); delBill(b.id) }; const p = $('#bPay', a.body); if (p) p.onclick = () => { a.close(); payBill(b.id) } }
      else setTimeout(() => n.focus(), 380)
    },
    onDone: (a) => {
      const amt = getAmt(a.body, 'amt'), name = val(a.body, 'name').trim(), due = val(a.body, 'due')
      if (!amt || !name || !due) { toast(!amt ? 'Informe o valor' : !name ? 'Dê um nome para a conta' : 'Escolha o vencimento'); return false }
      const o = { name, amt, due, day: +due.slice(8), rec: val(a.body, 'rec'), cat: val(a.body, 'cat') }
      if (b) Object.assign(b, o); else S.bills.push({ id: uid(), paid: false, ...o })
      save(); toast(b ? 'Conta atualizada' : 'Conta adicionada')
    },
  })
}
function payBill(id) {
  const b = S.bills.find((x) => x.id == id); if (!b) return
  snap()
  S.tx.push({ id: uid(), desc: b.name, amt: b.amt, type: 'out', cat: b.cat || 'Contas', date: today(), status: 'done', billId: b.id })
  if (b.rec) b.due = nextDue(b); else b.paid = true
  save(); haptic(20); toast(`${b.name} paga ✓`, ['Desfazer', undo])
}
function delBill(id) { const b = S.bills.find((x) => x.id == id); if (!b) return; snap(); S.bills = S.bills.filter((x) => x.id != id); save(); toast(`“${b.name}” apagada`, ['Desfazer', undo]) }

// ---------- cartões ----------
function cardForm(id) {
  const c = id ? S.cards.find((x) => x.id == id) : null
  let color = c?.color || CARD_COLORS[S.cards.length % CARD_COLORS.length]
  openSheet({
    title: c ? 'Editar cartão' : 'Novo cartão',
    html: `<div style="display:flex;justify-content:center;margin:4px 0 18px"><div class="cc g-${color}" id="ccPrev" style="width:280px;height:174px"><div class="row"><span class="nm" id="ccName">${esc(c?.name || 'Meu cartão')}</span><span class="chip-i"></span></div><div class="lim"><small>Limite</small><b id="ccLim">${R(c?.limit || 0)}</b></div><div class="row"><span class="dots">•••• ••••</span></div></div></div>
      <div class="form">${row('Nome', inText('name', c?.name || '', 'Nubank, Inter, Itaú…', 'class="left"'))}${row('Limite', `<input name="limit" inputmode="decimal" value="${c ? (c.limit / 100).toFixed(2).replace('.', ',') : ''}" placeholder="R$ 0,00">`)}
      ${row('Dia do fechamento', `<input name="close" type="number" min="1" max="31" value="${c?.close || 5}">`)}${row('Dia do vencimento', `<input name="due" type="number" min="1" max="31" value="${c?.due || 12}">`)}</div>
      <div class="form-label">Cor</div><div class="swatches" style="margin:0 4px 18px">${CARD_COLORS.map((k) => `<button type="button" class="g-${k} ${k == color ? 'on' : ''}" data-c="${k}" aria-label="${k}"></button>`).join('')}</div>`,
    onMount: (a) => {
      const pv = $('#ccPrev', a.body)
      $$('.swatches button', a.body).forEach((b) => (b.onclick = () => { color = b.dataset.c; pv.className = 'cc g-' + color; $$('.swatches button', a.body).forEach((x) => x.classList.toggle('on', x === b)); haptic() }))
      $('[name=name]', a.body).oninput = (e) => ($('#ccName', a.body).textContent = e.target.value || 'Meu cartão')
      $('[name=limit]', a.body).oninput = (e) => ($('#ccLim', a.body).textContent = R(cents(e.target.value)))
    },
    onDone: (a) => {
      const name = val(a.body, 'name').trim(), limit = cents(val(a.body, 'limit')), close = Math.min(31, Math.max(1, +val(a.body, 'close') || 1)), due = Math.min(31, Math.max(1, +val(a.body, 'due') || 1))
      if (!name || !limit) { toast(!name ? 'Dê um nome ao cartão' : 'Informe o limite'); return false }
      if (c) Object.assign(c, { name, limit, close, due, color }); else { const n = { id: uid(), name, limit, close, due, color }; S.cards.push(n); UI.card = n.id }
      save(); toast(c ? 'Cartão atualizado' : 'Cartão adicionado')
    },
  })
}
async function delCard(id) {
  const c = S.cards.find((x) => x.id == id)
  if (!(await confirmSheet('Excluir cartão', `Apagar “${c.name}” e todas as compras e pagamentos dele?`, 'Excluir cartão'))) return
  snap(); S.cards = S.cards.filter((x) => x.id != id); S.tx = S.tx.filter((t) => t.cardId != id); S.pays = S.pays.filter((p) => p.cardId != id); UI.card = null
  save(); toast('Cartão excluído', ['Desfazer', undo])
}
async function payInv(cid, m) {
  const c = S.cards.find((x) => x.id == cid), a = calc.open(c, m)
  if (!a) return
  if (!(await confirmSheet('Pagar fatura', `Pagar ${R(a)} da fatura de ${fmtMonthLong(m)} do ${c.name}? O valor sai do seu saldo.`, `Pagar ${R(a)}`, false))) return
  snap(); S.pays.push({ id: uid(), cardId: cid, m, a, date: today() }); save(); haptic(20); toast('Fatura paga ✓', ['Desfazer', undo])
}

// ---------- metas ----------
function goalForm(id) {
  const g = id ? S.goals.find((x) => x.id == id) : null
  let emoji = g?.emoji || '🎯'
  openSheet({
    title: g ? 'Editar meta' : 'Nova meta',
    html: `<div style="text-align:center;font-size:54px;margin:2px 0 6px" id="gEm">${emoji}</div>
      <div class="chips" style="justify-content:center;flex-wrap:wrap;margin:0 0 16px">${GOAL_EMOJI.map((e) => `<button type="button" class="chip ${e == emoji ? 'on' : ''}" data-e="${e}" style="font-size:20px;padding:5px 9px">${e}</button>`).join('')}</div>
      <div class="form">${row('Nome', inText('name', g?.name || '', 'Viagem, reserva, carro…', 'class="left"'))}${row('Valor da meta', `<input name="target" inputmode="decimal" value="${g ? (g.target / 100).toFixed(2).replace('.', ',') : ''}" placeholder="R$ 0,00">`)}
      ${row('Já guardado', `<input name="saved" inputmode="decimal" value="${g ? (g.saved / 100).toFixed(2).replace('.', ',') : ''}" placeholder="R$ 0,00">`)}${row('Quero até', `<input type="date" name="date" value="${g?.date || ''}">`)}</div>
      <p class="form-note" id="gNeed"></p>
      ${g ? `<button type="button" class="btn block danger" id="gDel">${I('trash')}Apagar meta</button>` : ''}`,
    onMount: (a) => {
      $$('[data-e]', a.body).forEach((b) => (b.onclick = () => { emoji = b.dataset.e; $('#gEm', a.body).textContent = emoji; $$('[data-e]', a.body).forEach((x) => x.classList.toggle('on', x === b)); haptic() }))
      const upd = () => { const t = cents(val(a.body, 'target')), s = cents(val(a.body, 'saved')), d = val(a.body, 'date'); $('#gNeed', a.body).innerHTML = t && d ? `✦ Para chegar lá, guarde <b style="color:var(--accent)">${R(calc.need({ target: t, saved: s, date: d }))}</b> por mês.` : 'Defina valor e data e eu calculo quanto guardar por mês.' }
      a.body.addEventListener('input', upd); upd()
      if (g) $('#gDel', a.body).onclick = () => { a.close(); snap(); S.goals = S.goals.filter((x) => x.id != g.id); save(); toast('Meta apagada', ['Desfazer', undo]) }
    },
    onDone: (a) => {
      const name = val(a.body, 'name').trim(), target = cents(val(a.body, 'target'))
      if (!name || !target) { toast(!name ? 'Dê um nome à meta' : 'Informe o valor'); return false }
      const o = { name, target, saved: cents(val(a.body, 'saved')), date: val(a.body, 'date'), emoji }
      if (g) Object.assign(g, o); else S.goals.push({ id: uid(), ...o })
      save(); toast(g ? 'Meta atualizada' : 'Meta criada 🎯')
    },
  })
}
function depGoal(id, preset = 0, withdraw = false) {
  const g = S.goals.find((x) => x.id == id); if (!g) return
  closeAllSheets()
  setTimeout(() => openSheet({
    title: (withdraw ? 'Retirar de ' : 'Guardar em ') + g.name, done: withdraw ? 'Retirar' : 'Guardar',
    html: `${amountField('a', preset, withdraw ? 'out' : 'in', withdraw ? `Guardado: ${R(g.saved)}` : `Disponível para gastar: ${R(calc.available())}`)}
      ${!withdraw && calc.need(g) ? `<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">${[calc.need(g), 5000, 10000, 50000].map((v) => `<button type="button" class="chip" data-v="${v}">${R(v)}</button>`).join('')}</div>` : ''}`,
    onMount: (a) => { bindAmount(a.body); $$('[data-v]', a.body).forEach((b) => (b.onclick = () => { const i = $('[name=a]', a.body); i.dataset.c = b.dataset.v; i.value = R(+b.dataset.v); haptic() })); setTimeout(() => $('[name=a]', a.body).focus(), 380) },
    onDone: (a) => {
      const v = getAmt(a.body, 'a'); if (!v) { toast('Informe o valor'); return false }
      const before = g.saved
      g.saved = withdraw ? Math.max(0, g.saved - v) : g.saved + v
      save(); haptic(20)
      if (!withdraw && before < g.target && g.saved >= g.target) toast(`🏆 Meta “${g.name}” atingida!`); else toast(withdraw ? 'Valor retirado' : `${R(v)} guardados em ${g.name}`)
    },
  }), $$('.sheet-wrap').length ? 380 : 0)
}

// ---------- orçamentos ----------
function editBudget(focus) {
  const cs = calc.catSpend(), prev = calc.catSpend(addMonths(ym(), -1)), prev2 = calc.catSpend(addMonths(ym(), -2))
  const cats = catsFor('out').filter((k) => k !== 'Outros' || cs[k])
  openSheet({
    title: 'Orçamentos do mês', tall: true,
    html: `<p class="form-note" style="margin:0 4px 14px">Defina um limite mensal por categoria. ✦ Sugestão com base na média dos últimos meses.</p>
      <div class="form">${cats.map((k) => { const avg = Math.round(((prev[k] || 0) + (prev2[k] || 0)) / ((prev[k] ? 1 : 0) + (prev2[k] ? 1 : 0) || 1)); const sug = avg ? Math.ceil(avg / 5000) * 5000 : 0; return `<div class="fr"><span style="font-size:20px">${catOf(k).e}</span><label style="flex:1">${esc(k)}<div class="mut" style="font-size:12px">gasto: ${R(cs[k] || 0)}${sug ? ` · <button type="button" style="color:var(--accent)" data-sug="${k}" data-v="${sug}">✦ ${Rk(sug)}</button>` : ''}</div></label><input name="b_${esc(k)}" inputmode="decimal" placeholder="sem limite" value="${S.budgets[k] ? (S.budgets[k] / 100).toFixed(2).replace('.', ',') : ''}" style="max-width:120px"></div>` }).join('')}</div>`,
    onMount: (a) => {
      $$('[data-sug]', a.body).forEach((b) => (b.onclick = () => { $(`[name="b_${b.dataset.sug}"]`, a.body).value = (+b.dataset.v / 100).toFixed(2).replace('.', ','); haptic() }))
      if (focus) setTimeout(() => { const i = $(`[name="b_${focus}"]`, a.body); i && (i.scrollIntoView({ block: 'center' }), i.focus()) }, 400)
    },
    onDone: (a) => {
      const b = {}
      cats.forEach((k) => { const v = cents(val(a.body, 'b_' + k)); if (v > 0) b[k] = v })
      S.budgets = b; save(); toast('Orçamentos salvos')
    },
  })
}

// ---------- exportar ----------
function download(name, text, type) {
  const blob = new Blob([text], { type }), file = new File([blob], name, { type })
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iphone|ipad|android/i.test(navigator.userAgent)) return navigator.share({ files: [file], title: name }).catch(() => {})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500)
}
function exportCSV() {
  const cardName = (id) => (S.cards.find((c) => c.id == id) || {}).name || ''
  const csv = '﻿data;descricao;categoria;tipo;valor;status;cartao;parcelas\n' + S.tx.slice().sort((a, b) => (a.date > b.date ? 1 : -1)).map((x) => [x.date, '"' + x.desc.replace(/"/g, '""') + '"', x.cat, x.type == 'in' ? 'receita' : 'despesa', (x.amt / 100).toFixed(2).replace('.', ','), x.cardId ? 'cartao' : x.status == 'done' ? 'pago' : 'pendente', cardName(x.cardId), x.n || ''].join(';')).join('\n')
  download(`meu-mes-${today()}.csv`, csv, 'text/csv'); toast('CSV gerado')
}

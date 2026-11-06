/* ================================================================
   MEU MÊS — inteligência local: categorização, lançamento por texto,
   insights e assistente (sem enviar nada a servidores)
   ================================================================ */
'use strict'

const RULES = [
  ['Assinaturas', /netflix|spotify|prime video|amazon prime|disney|hbo|max\b|youtube premium|deezer|icloud|apple (one|music|tv)|google one|globoplay|paramount|chatgpt|assinatura/],
  ['Mercado', /mercado|supermerc|atacad|assai|carrefour|feira|hortifruti|sacolao|pao de acucar|extra hiper|compras do mes/],
  ['Alimentação', /ifood|rappi|restaurante|almoco|jantar|lanche|pizza|hamburg|burger|padaria|cafe|cafeteria|sushi|acai|sorvete|bar e|marmita|delivery|mcdonald|bk\b|starbucks|comida/],
  ['Transporte', /uber|\b99\b|taxi|gasolina|combustivel|etanol|posto|onibus|metro|trem|estacionamento|pedagio|ipva|oficina|mecanico|bilhete unico|passagem de onibus/],
  ['Moradia', /aluguel|condominio|iptu|financiamento casa|reforma|moveis|faxina|diarista/],
  ['Contas', /luz|energia|enel|cemig|copel|light\b|agua|sabesp|internet|vivo|claro|tim\b|oi\b|celular|telefone|gas\b|conta de/],
  ['Saúde', /farmacia|drogaria|remedio|medic|consulta|dentista|exame|hospital|plano de saude|academia|smartfit|psicolog|terapia|unimed/],
  ['Lazer', /cinema|show|ingresso|teatro|viagem|hotel|airbnb|passagens|balada|festa|parque|jogo|steam|playstation|xbox|bar\b|cerveja/],
  ['Educação', /curso|escola|faculdade|mensalidade|livro|udemy|alura|material escolar|idioma|ingles/],
  ['Pets', /pet|racao|veterin|petshop|banho e tosa/],
  ['Compras', /amazon|shopee|mercado livre|magalu|shein|aliexpress|roupa|tenis|sapato|loja|presente|eletron|iphone|celular novo|notebook|renner|zara/],
  ['Salário', /salario|holerite|pagamento empresa|adiantamento|13o|decimo terceiro|ferias/],
  ['Freelance', /freela|freelance|cliente|projeto|job\b|consultoria|servico prestado/],
  ['Benefício', /vale refeicao|vale alimentacao|\bvr\b|\bva\b|beneficio|auxilio|bolsa/],
  ['Extra', /reembolso|cashback|vendi|venda|presente recebido|pix recebido|rendimento|juros/],
]

function suggestCat(desc, type = 'out') {
  const k = nz(desc).trim()
  if (!k) return null
  if (S.learn && S.learn[k] && (catOf(S.learn[k]).t === type || catOf(S.learn[k]).t === 'both')) return S.learn[k]
  const hist = S.tx.filter((t) => t.type === type && nz(t.desc).trim() === k).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  if (hist) return hist.cat
  for (const [cat, re] of RULES) if (re.test(k) && (CAT[cat].t === type || CAT[cat].t === 'both')) return cat
  const w = k.split(/\s+/)[0]
  if (w.length > 3) { const h = S.tx.find((t) => t.type === type && nz(t.desc).startsWith(w)); if (h) return h.cat }
  return null
}

// "almoço 32,50 ontem", "recebi 3.000 salário", "tv 2400 em 10x nubank", "luz 180 pendente dia 15"
function parseQuick(text) {
  let s = ' ' + nz(text) + ' '
  const out = { type: 'out', status: 'done', date: today(), n: 1, cardId: null, amt: 0, desc: '', cat: null }
  if (/^\s*\+/.test(text) || /\b(recebi|ganhei|entrou|entrada|receita|reembolso|vendi|caiu)\b/.test(s)) out.type = 'in'
  if (/\b(pendente|a pagar|vou pagar|a receber|agendad[oa])\b/.test(s)) out.status = 'pending'
  const nx = s.match(/\b(\d{1,2})\s?x\b/)
  if (nx) { out.n = Math.max(1, Math.min(48, +nx[1])); s = s.replace(nx[0], ' ') }
  if (/\banteontem\b/.test(s)) out.date = addDays(today(), -2)
  else if (/\bontem\b/.test(s)) out.date = addDays(today(), -1)
  else if (/\bamanha\b/.test(s)) out.date = addDays(today(), 1)
  const dm = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (dm) {
    let y = dm[3] ? +dm[3] : new Date().getFullYear(); if (y < 100) y += 2000
    const mo = Math.min(12, Math.max(1, +dm[2])), d = Math.min(daysIn(y, mo), Math.max(1, +dm[1]))
    out.date = `${y}-${pad(mo)}-${pad(d)}`; s = s.replace(dm[0], ' ')
  }
  const dd = s.match(/\bdia (\d{1,2})\b/)
  if (dd) { const [y, m] = ym().split('-').map(Number); out.date = `${ym()}-${pad(Math.min(daysIn(y, m), Math.max(1, +dd[1])))}`; s = s.replace(dd[0], ' ') }
  for (const c of S.cards) {
    const cn = nz(c.name).split(/\s+/)[0]
    if (cn.length >= 2 && new RegExp('\\b' + cn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(s)) { out.cardId = c.id; s = s.replace(new RegExp('\\b' + nz(c.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b|\\b' + cn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'), ' '); break }
  }
  if (!out.cardId && /\b(cartao|credito|no credito)\b/.test(s) && S.cards.length) out.cardId = S.cards[0].id
  if (out.n > 1 && !out.cardId && S.cards.length) out.cardId = S.cards[0].id
  const am = s.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(\s?(mil|k)\b)?/)
  if (am) { out.amt = cents(am[1]) * (am[3] ? 1000 : 1); s = s.replace(am[0], ' ') }
  // descrição: o texto original sem as palavras de comando
  const stop = /\b(r\$|reais|real|gastei|paguei|comprei|recebi|ganhei|entrou|entrada|receita|caiu|hoje|ontem|anteontem|amanha|pendente|a pagar|vou pagar|a receber|agendad[oa]|no cartao|cartao|credito|no credito|em|com|no|na|de|do|da|pra|para|um|uma|parcelad[oa]|vezes)\b/g
  let d = s.replace(stop, ' ').replace(/[+\-]/g, ' ').replace(/\s+/g, ' ').trim()
  // recupera acentos/maiúsculas do texto original quando possível
  const orig = text.split(/\s+/).filter((w) => d.split(' ').includes(nz(w).replace(/[^\w]/g, '')))
  d = (orig.length ? orig.join(' ') : d).replace(/[,.;]+$/, '')
  out.desc = d ? d[0].toUpperCase() + d.slice(1) : ''
  if (out.cardId) { out.type = 'out'; out.status = 'done' }
  out.cat = suggestCat(out.desc, out.type) || (out.type === 'in' ? 'Extra' : 'Outros')
  if (!out.desc) out.desc = out.cat
  return out
}

// ---------- insights proativos ----------
function insights() {
  const L = [], t = today(), mo = calc.monthOf(), pj = calc.projection(), cs = calc.catSpend(), prev = calc.catSpend(addMonths(ym(), -1))
  const a = calc.available()
  // vencimentos
  const soon = S.bills.filter((b) => !b.paid && diffDays(t, b.due) <= 3).sort((x, y) => (x.due > y.due ? 1 : -1))
  const late = soon.filter((b) => b.due < t)
  if (late.length) L.push({ e: '⏰', c: 'var(--red)', h: 'Atenção', b: `${late.length > 1 ? late.length + ' contas atrasadas' : late[0].name + ' está atrasada'}`, p: `Total de ${R(late.reduce((s, b) => s + b.amt, 0))}. Pague para evitar juros.`, go: ['Ver contas', "go('wallet','bills')"], w: 10 })
  else if (soon.length) L.push({ e: '📅', c: 'var(--orange)', h: 'Vencimentos', b: `${soon[0].name} ${dueLabel(soon[0].due)}`, p: soon.length > 1 ? `E mais ${soon.length - 1} nos próximos 3 dias · ${R(soon.reduce((s, b) => s + b.amt, 0))}` : `Valor: ${R(soon[0].amt)}`, go: ['Pagar agora', `payBill('${soon[0].id}')`], w: 9 })
  // ritmo do mês
  if (pj.day >= 5 && (mo.inc || pj.last)) {
    const base = mo.inc || calc.monthOf(addMonths(ym(), -1)).inc
    if (base && pj.proj > base) L.push({ e: '📈', c: 'var(--red)', h: 'Ritmo de gastos', b: `No ritmo atual você gasta ${R(pj.proj)} no mês`, p: `Isso passa sua renda em ${R(pj.proj - base)}. Reduza para ${R(calc.daily())}/dia.`, w: 8 })
    else if (pj.lastSame > 0) {
      const d = Math.round(((pj.spent - pj.lastSame) / pj.lastSame) * 100)
      if (d <= -8) L.push({ e: '👏', c: 'var(--green)', h: 'Mandou bem', b: `Gastando ${-d}% menos que no mês passado`, p: `Até hoje: ${R(pj.spent)} contra ${R(pj.lastSame)} no mesmo período.`, w: 5 })
      else if (d >= 15) L.push({ e: '🔥', c: 'var(--orange)', h: 'Ritmo de gastos', b: `${d}% acima do mês passado`, p: `Até hoje: ${R(pj.spent)} contra ${R(pj.lastSame)} no mesmo período.`, go: ['Ver análise', "go('stats')"], w: 7 })
    }
  }
  // orçamentos
  Object.entries(S.budgets).filter(([, v]) => v > 0).forEach(([k, v]) => {
    const u = cs[k] || 0, r = u / v
    if (r >= 1) L.push({ e: catOf(k).e, c: 'var(--red)', h: 'Orçamento estourado', b: `${k}: ${R(u)} de ${R(v)}`, p: `Passou ${R(u - v)} do limite deste mês.`, go: ['Ajustar', `editBudget('${k}')`], w: 8 })
    else if (r >= 0.8) L.push({ e: catOf(k).e, c: 'var(--orange)', h: 'Orçamento', b: `${k} em ${Math.round(r * 100)}% do limite`, p: `Restam ${R(v - u)} para ${calc.daysLeft()} dias.`, w: 6 })
  })
  // categoria acima do mês anterior
  const spike = Object.entries(cs).map(([k, v]) => [k, v, prev[k] || 0]).filter(([, v, p]) => p > 5000 && v > p * 1.2).sort((x, y) => y[1] - y[2] - (x[1] - x[2]))[0]
  if (spike) L.push({ e: catOf(spike[0]).e, c: 'var(--orange)', h: 'Comparativo', b: `${spike[0]} já superou o mês passado`, p: `${R(spike[1])} agora vs ${R(spike[2])} no mês todo anterior.`, w: 6 })
  // cartão: fechamento próximo / melhor dia
  S.cards.forEach((c) => {
    const [y, m] = ym().split('-').map(Number), dd = new Date().getDate()
    const close = dd <= c.close ? `${ym()}-${pad(Math.min(c.close, daysIn(y, m)))}` : nextDue({ due: `${ym()}-01`, day: c.close })
    const n = diffDays(t, close)
    if (n >= 0 && n <= 3) L.push({ e: '💳', c: 'var(--indigo)', h: c.name, b: n === 0 ? 'Fatura fecha hoje' : `Fatura fecha em ${n} dia${n > 1 ? 's' : ''}`, p: `Compras a partir do dia ${(c.close % 28) + 1} só entram na próxima fatura.`, w: 4 })
  })
  // metas
  S.goals.forEach((g) => {
    const need = calc.need(g)
    if (g.saved >= g.target) L.push({ e: '🏆', c: 'var(--green)', h: 'Meta concluída', b: g.name, p: `Você juntou ${R(g.saved)}. Que tal uma nova meta?`, w: 5 })
    else if (need && a > need * 1.5 && pj.day >= 20) L.push({ e: g.emoji, c: 'var(--accent)', h: 'Sobrou dinheiro', b: `Guarde ${R(need)} em ${g.name}`, p: `Você tem ${R(a)} livres e o mês está acabando.`, go: ['Guardar', `depGoal('${g.id}',${need})`], w: 6 })
  })
  // assinaturas
  const rec = calc.recurring().filter((r) => r.cat === 'Assinaturas' || /netflix|spotify|prime|disney|hbo|icloud|youtube/.test(nz(r.desc)))
  if (rec.length >= 2) L.push({ e: '📺', c: 'var(--pink)', h: 'Assinaturas', b: `${rec.length} assinaturas somam ${R(rec.reduce((s, r) => s + r.avg, 0))}/mês`, p: `Por ano: ${R(rec.reduce((s, r) => s + r.avg, 0) * 12)}. Ainda usa todas?`, go: ['Ver lista', "go('stats')"], w: 3 })
  if (a < 0) L.push({ e: '⚠️', c: 'var(--red)', h: 'Saldo comprometido', b: `Faltam ${R(-a)} para cobrir o mês`, p: 'Seus compromissos e metas superam o saldo atual.', w: 10 })
  if (!S.tx.length) L.push({ e: '✨', c: 'var(--accent)', h: 'Comece por aqui', b: 'Digite como fala: “almoço 32 ontem”', p: 'Eu entendo valor, data, categoria e até parcelas no cartão.', go: ['Lançar agora', 'quickAdd()'], w: 10 })
  if (!Object.keys(S.budgets).length && S.tx.length > 5) L.push({ e: '🎯', c: 'var(--teal)', h: 'Dica', b: 'Crie limites por categoria', p: 'Eu aviso quando você chegar perto do limite.', go: ['Criar orçamento', "go('stats')"], w: 2 })
  return L.sort((x, y) => y.w - x.w).slice(0, 6)
}

// ---------- assistente local ----------
function answerLocal(q) {
  const s = nz(q), a = calc.available(), c = calc.commitments(), mo = calc.monthOf(), cs = calc.catSpend()
  const top = Object.entries(cs).sort((x, y) => y[1] - x[1])
  const isPrev = /mes passado|ultimo mes|mes anterior/.test(s)
  const mRef = isPrev ? addMonths(ym(), -1) : ym(), mName = isPrev ? 'no mês passado' : 'neste mês'
  const hit = Object.keys(CAT).find((k) => s.includes(nz(k)))
  const num = s.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(mil|k)?/)
  const val = num ? cents(num[1]) * (num[2] ? 1000 : 1) : 0

  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(s)) return `Oi${S.name ? ', ' + S.name : ''}! 👋 Posso te dizer quanto dá para gastar, analisar categorias, prever o fim do mês ou simular uma compra. Tente "como estou este mês?"`
  if (/ajuda|o que voce faz|comandos/.test(s)) return 'Posso responder coisas como:\n• Quanto posso gastar hoje?\n• Quanto gastei com mercado?\n• Consigo comprar algo de R$ 800?\n• Como termino o mês?\n• Quais contas vencem esta semana?\n• Quanto falta para minhas metas?\n• Quais são minhas assinaturas?'
  if (val && /(economiz|guardar|poupar|consigo|posso comprar|da pra|cabe|comprar|gastar)/.test(s) && !/hoje/.test(s)) {
    const nx = s.match(/(\d{1,2})\s?x\b/), n = nx ? +nx[1] : 1, parc = Math.round(val / n)
    if (n > 1) {
      const fut = calc.months(n, addMonths(ym(), 1)).map((m) => S.cards.reduce((t, x) => t + calc.open(x, m), 0))
      const maxF = Math.max(...fut), inc = mo.inc || calc.monthOf(addMonths(ym(), -1)).inc
      return `Em ${n}x ficam ${R(parc)} por mês.\n• Suas faturas futuras já têm até ${R(maxF)} comprometidos\n• Somando, chegaria a ${R(maxF + parc)}${inc ? ` (${Math.round(((maxF + parc) / inc) * 100)}% da sua renda)` : ''}\n${inc && (maxF + parc) / inc > 0.35 ? 'Eu esperaria: passaria de 35% da renda em cartão. 🤔' : 'Parece caber com tranquilidade. ✅'}`
    }
    return a >= val ? `Sim ✅ Você tem ${R(a)} livres; ${R(val)} cabem e ainda sobram ${R(a - val)} (${R(Math.floor((a - val) / calc.daysLeft()))}/dia até o fim do mês).` : `Hoje não 😕 Só ${R(Math.max(0, a))} estão livres; faltariam ${R(val - Math.max(0, a))}. Que tal parcelar ou esperar o próximo mês?`
  }
  if (/hoje|posso gastar|disponivel|livre|quanto tenho|saldo/.test(s)) return `Você tem ${R(a)} disponíveis para gastar.\n• Limite diário: ${R(calc.daily())} pelos próximos ${calc.daysLeft()} dias\n• Saldo em conta: ${R(calc.balance())}\n• Já comprometido: ${R(c.tot)} · Guardado em metas: ${R(calc.reserved())}`
  if (/assinatura|recorrent|mensalidade/.test(s)) { const r = calc.recurring(); return r.length ? `Encontrei ${r.length} gastos recorrentes:\n${r.slice(0, 6).map((x) => `• ${x.desc}: ~${R(x.avg)}/mês`).join('\n')}\nTotal: ${R(r.reduce((t, x) => t + x.avg, 0))}/mês.` : 'Ainda não encontrei gastos recorrentes. Preciso de pelo menos 2 meses de histórico.' }
  if (/fim do mes|termin|previs|projec|ritmo|vai sobrar|sobrar/.test(s)) {
    const pj = calc.projection(), inc = mo.inc + calc.pendingIn(), sobra = inc - pj.proj
    return `No ritmo atual (${R(Math.round(pj.spent / Math.max(1, pj.day)))}/dia) você deve fechar o mês com ${R(pj.proj)} em gastos.\n${inc ? (sobra >= 0 ? `• Sobrariam cerca de ${R(sobra)} da renda do mês 🎉` : `• Faltariam cerca de ${R(-sobra)} em relação à renda ⚠️`) : '• Cadastre suas receitas para eu comparar com a renda.'}\n• Mês passado: ${R(pj.last)}`
  }
  if (/como estou|resumo|saude|situacao|balanco/.test(s)) {
    const h = calc.health()
    return `Saúde financeira: ${h.s}/100 (${h.lbl}).\n• Receitas ${mName}: ${R(mo.inc)}\n• Gastos: ${R(mo.out)}${top[0] ? ` (maior: ${top[0][0]}, ${R(top[0][1])})` : ''}\n• Disponível: ${R(a)}\n${insights().slice(0, 2).map((i) => '• ' + i.b).join('\n')}`
  }
  if (hit && /gast|quanto/.test(s)) {
    const v = calc.catSpend(mRef)[hit] || 0, b = S.budgets[hit]
    return `Em ${hit} você gastou ${R(v)} ${mName}.${b && !isPrev ? `\n• Orçamento: ${R(b)} (${Math.round((v / b) * 100)}% usado, restam ${R(Math.max(0, b - v))})` : ''}${!isPrev ? `\n• Mês passado: ${R(calc.catSpend(addMonths(ym(), -1))[hit] || 0)}` : ''}`
  }
  if (/gastei (com|no|na|em) /.test(s) || /quanto (gastei|paguei) (com|no|na|em) /.test(s)) {
    const term = s.split(/(?:com|no|na|em) /).pop().replace(/[?!.]/g, '').replace(/\b(este|esse|neste|nesse|mes|passado|ultimo|anterior)\b/g, '').trim()
    if (term) {
      const l = S.tx.filter((t) => t.type == 'out' && t.date.startsWith(mRef) && nz(t.desc).includes(term))
      return l.length ? `Com "${term}" foram ${R(l.reduce((t, x) => t + x.amt, 0))} ${mName}, em ${l.length} lançamento${l.length > 1 ? 's' : ''}.` : `Não encontrei gastos com "${term}" ${mName}.`
    }
  }
  if (/quanto gastei|gastos|despesas/.test(s)) { const m = calc.monthOf(mRef); return `Você gastou ${R(m.out)} ${mName} e recebeu ${R(m.inc)}.${top.length && !isPrev ? `\nTop categorias:\n${top.slice(0, 3).map(([k, v]) => `• ${catOf(k).e} ${k}: ${R(v)}`).join('\n')}` : ''}` }
  if (/vence|pendente|contas|boleto|pagar/.test(s)) {
    const l = S.bills.filter((b) => !b.paid && diffDays(today(), b.due) <= (/semana/.test(s) ? 7 : 31)).sort((x, y) => (x.due > y.due ? 1 : -1))
    return l.length ? `Contas a pagar${/semana/.test(s) ? ' nesta semana' : ''}:\n${l.slice(0, 6).map((b) => `• ${b.name}: ${R(b.amt)} (${dueLabel(b.due)})`).join('\n')}\nTotal: ${R(l.reduce((t, b) => t + b.amt, 0))}` : 'Nenhuma conta pendente nesse período. 🙌'
  }
  if (/parcela/.test(s)) { const tot = calc.months(48).reduce((t, m) => t + S.cards.reduce((u, x) => u + calc.open(x, m), 0), 0); const nx = calc.months(4, addMonths(ym(), 1)); return `Parcelas futuras em aberto: ${R(tot)}.\n${nx.map((m) => `• ${fmtMonth(m)}: ${R(S.cards.reduce((u, x) => u + calc.open(x, m), 0))}`).join('\n')}` }
  if (/cartao|fatura|proximo mes/.test(s)) { const lines = S.cards.map((x) => { const m = calc.curInvoice(x); return `• ${x.name}: fatura de ${fmtMonth(m)} ${R(calc.open(x, m))} · limite livre ${R(x.limit - calc.used(x))} · melhor dia de compra: ${(x.close % 28) + 1}` }); return lines.length ? 'Seus cartões:\n' + lines.join('\n') : 'Você ainda não cadastrou cartões.' }
  if (/meta|objetivo|sonho/.test(s)) return S.goals.length ? S.goals.map((g) => `${g.emoji} ${g.name}: ${Math.round((g.saved / g.target) * 100)}% (${R(g.saved)} de ${R(g.target)})${g.date && g.saved < g.target ? ` → guarde ${R(calc.need(g))}/mês` : ''}`).join('\n') : 'Você ainda não tem metas. Crie uma em Carteira → Metas.'
  if (/mais|maior|categoria|onde/.test(s)) return top.length ? `Seu maior gasto ${mName} é ${top[0][0]} (${R(top[0][1])}, ${Math.round((top[0][1] / Math.max(1, mo.out)) * 100)}% do total).${top[1] ? `\nDepois: ${top[1][0]} (${R(top[1][1])})` : ''}` : 'Ainda não há despesas neste mês.'
  if (/orcamento|organizar|dividir|50 30 20|planej/.test(s)) { const i = mo.inc || calc.monthOf(addMonths(ym(), -1)).inc || S.init; return i > 0 ? `Sugestão 50/30/20 com base em ${R(i)}:\n• ${R(i * 0.5)} para essenciais (moradia, mercado, contas)\n• ${R(i * 0.3)} para desejos (lazer, compras)\n• ${R(i * 0.2)} para metas e reserva\nNeste mês você já gastou ${R(mo.out)}.` : 'Cadastre suas receitas para eu sugerir uma divisão.' }
  if (/dica|economizar|reduzir|cortar/.test(s)) {
    const tips = []
    if (top[0]) tips.push(`Corte 15% em ${top[0][0]} e economize ~${R(Math.round(top[0][1] * 0.15))}/mês`)
    const r = calc.recurring(); if (r.length) tips.push(`Revise assinaturas: ${R(r.reduce((t, x) => t + x.avg, 0))}/mês em recorrentes`)
    tips.push(`Use o limite diário de ${R(calc.daily())} como guia`)
    tips.push('Compre no cartão logo após o fechamento para ganhar prazo')
    return 'Algumas ideias:\n' + tips.map((t) => '• ' + t).join('\n')
  }
  return null
}

// resumo agregado enviado ao assistente com IA (apenas quando o usuário ativa)
function aiSummary() {
  const mo = calc.monthOf(), c = calc.commitments(), pj = calc.projection(), r2 = (c) => Math.round(c) / 100
  return {
    hoje: today(), nome: S.name || undefined,
    disponivel_para_gastar: r2(calc.available()), limite_diario: r2(calc.daily()), dias_restantes_no_mes: calc.daysLeft(),
    saldo_em_conta: r2(calc.balance()), compromissos: { contas: r2(c.b + c.p), faturas: r2(c.f) }, reservado_metas: r2(calc.reserved()),
    mes_atual: { receitas: r2(mo.inc), gastos: r2(mo.out), projecao_gastos: r2(pj.proj), gastos_mesmo_periodo_mes_passado: r2(pj.lastSame) },
    meses_anteriores: [1, 2, 3].map((k) => { const m = addMonths(ym(), -k), x = calc.monthOf(m); return { mes: m, receitas: r2(x.inc), gastos: r2(x.out) } }),
    gastos_por_categoria_mes: Object.fromEntries(Object.entries(calc.catSpend()).map(([k, v]) => [k, r2(v)])),
    orcamentos: Object.fromEntries(Object.entries(S.budgets).map(([k, v]) => [k, r2(v)])),
    contas_pendentes: S.bills.filter((b) => !b.paid).map((b) => ({ nome: b.name, valor: r2(b.amt), vencimento: b.due })),
    cartoes: S.cards.map((x) => ({ nome: x.name, limite: r2(x.limit), usado: r2(calc.used(x)), fecha_dia: x.close, vence_dia: x.due, fatura_atual: r2(calc.open(x, calc.curInvoice(x))) })),
    metas: S.goals.map((g) => ({ nome: g.name, alvo: r2(g.target), guardado: r2(g.saved), data: g.date || null, guardar_por_mes: r2(calc.need(g)) })),
    recorrentes: calc.recurring().slice(0, 8).map((x) => ({ desc: x.desc, media: r2(x.avg) })),
    ultimos_lancamentos: S.tx.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40).map((t) => ({ d: t.date, desc: t.desc, cat: t.cat, v: r2(t.type == 'in' ? t.amt : -t.amt), cartao: !!t.cardId, pendente: t.status == 'pending' })),
    saude_financeira: calc.health().s,
  }
}

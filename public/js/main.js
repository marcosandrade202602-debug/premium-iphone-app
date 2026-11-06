/* ================================================================
   MEU MÊS — app: render, navegação, assistente, ajustes, segurança
   ================================================================ */
'use strict'

const TABS = [['home', 'Início', 'home'], ['tx', 'Extrato', 'list'], ['+'], ['wallet', 'Carteira', 'wallet'], ['stats', 'Análise', 'chart']]

function render(reset, keepFocus) {
  const v = V[UI.tab](), view = $('#view'), sc = $('#scroller')
  $('#tabbar').innerHTML = TABS.map((t) => t[0] == '+' ? `<button class="plus" onclick="haptic();quickAdd()" aria-label="Adicionar">${I('plus', 2.6)}</button>` : `<button class="${UI.tab == t[0] ? 'on' : ''}" onclick="${UI.tab == t[0] ? "$('#scroller').scrollTo({top:0,behavior:'smooth'})" : `go('${t[0]}')`}">${I(t[2], UI.tab == t[0] ? 2.3 : 1.8)}<span>${t[1]}</span></button>`).join('')
  if (reset) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '' }
  view.innerHTML = v.html
  $('#navT').textContent = v.title
  const ini = (S.name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  $('#navR').innerHTML = `<button class="icon-btn ai" onclick="openAssistant()" aria-label="Assistente">${I('spark')}</button><button class="avatar" onclick="openSettings()" aria-label="Ajustes">${esc(ini)}</button>`
  if (reset) sc.scrollTop = 0
  countUp(view); animateRings(view); bindSwipe(view)
  if (keepFocus) { const q = $('#q'); if (q && document.activeElement !== q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length) } }
  onScroll()
}
const onScroll = () => $('#navbar').classList.toggle('solid', $('#scroller').scrollTop > 34)

// ---------- tema ----------
function applyTheme(t) {
  try { localStorage.setItem('meumes-theme', t) } catch (e) {}
  document.documentElement.dataset.theme = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t
  setThemeColor()
}
const curTheme = () => { try { return localStorage.getItem('meumes-theme') || 'auto' } catch (e) { return 'auto' } }

// ================================================================
// Assistente
// ================================================================
let chat = [], busy = false
const SUGG = ['Quanto posso gastar hoje?', 'Como termino o mês?', 'Onde estou gastando mais?', 'Consigo comprar algo de R$ 800?', 'Quais contas vencem esta semana?', 'Me dá dicas para economizar']
function openAssistant(prefill) {
  openSheet({
    title: 'Assistente', done: null, cancel: 'Fechar', tall: true,
    html: `<div id="aiTop"></div><div class="chat" id="chat"></div><div id="aiSug"></div>
      <div class="composer"><input id="aiQ" placeholder="Pergunte sobre seu dinheiro…" autocomplete="off" enterkeyhint="send"><button id="aiSend" aria-label="Enviar">${I('send', 2.6)}</button></div>`,
    onMount: (a) => {
      const draw = () => {
        $('#aiTop', a.body).innerHTML = `${chat.length ? '' : `<div class="ai-orb"></div><div class="ai-intro"><b>Como posso ajudar${S.name ? ', ' + esc(S.name.split(' ')[0]) : ''}?</b>Analiso seus lançamentos, contas, cartões e metas para responder.</div>`}
          <div class="card pad" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:14px"><span style="font-size:22px">${S.ai ? '🧠' : '🔒'}</span><div style="flex:1;font-size:13px;line-height:1.35"><b style="font-size:15px">${S.ai ? 'IA avançada ligada' : 'Modo privado'}</b><div class="mut">${S.ai ? 'Um resumo dos seus números é enviado para gerar respostas mais completas.' : 'Respostas calculadas no seu aparelho. Ative a IA para conversas livres.'}</div></div>${inSwitch('aiOn', S.ai)}</div>`
        $('[name=aiOn]', a.body).onchange = (e) => { S.ai = e.target.checked; save({ silent: true }); haptic(); draw() }
        $('#chat', a.body).innerHTML = chat.map((m) => `<div class="bub ${m.u ? 'u' : 'a'}">${esc(m.t)}${m.src ? `<span class="src">${m.src}</span>` : ''}</div>`).join('') + (busy ? '<div class="bub a typing"><i></i><i></i><i></i></div>' : '')
        $('#aiSug', a.body).innerHTML = busy ? '' : `<div class="chips" style="margin-top:6px">${(chat.length ? SUGG.slice(0, 4).filter((s) => !chat.some((m) => m.t == s)) : SUGG).map((s) => `<button class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>`
        $$('[data-s]', a.body).forEach((b) => (b.onclick = () => send(b.dataset.s)))
        a.body.scrollTop = a.body.scrollHeight
      }
      const send = async (q) => {
        q = (q || '').trim(); if (!q || busy) return
        haptic(); chat.push({ u: 1, t: q }); $('#aiQ', a.body).value = ''
        const local = answerLocal(q)
        if (!S.ai) { busy = true; draw(); await new Promise((r) => setTimeout(r, 450)); busy = false; chat.push({ t: local || 'Ainda não sei responder isso no modo privado. 🤔\nTente: "quanto posso gastar hoje?", "quanto gastei com mercado?" ou "como termino o mês?". Para perguntas livres, ative a IA avançada acima.', src: 'calculado no aparelho' }); draw(); return }
        busy = true; draw()
        try {
          const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, summary: aiSummary(), history: chat.slice(0, -1).slice(-8).map((m) => ({ role: m.u ? 'user' : 'assistant', content: m.t })) }) })
          const j = await r.json().catch(() => ({}))
          if (!r.ok || !j.answer) throw new Error(j.error || 'erro')
          chat.push({ t: j.answer, src: '✦ IA' })
        } catch (e) {
          chat.push({ t: local || 'Não consegui falar com a IA agora. Tente de novo em instantes.', src: local ? 'calculado no aparelho (IA indisponível)' : '' })
        }
        busy = false; draw()
      }
      $('#aiSend', a.body).onclick = () => send($('#aiQ', a.body).value)
      $('#aiQ', a.body).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(e.target.value) } })
      draw()
      if (prefill) send(prefill)
    },
  })
}

// ================================================================
// Ajustes
// ================================================================
function openSettings() {
  const t = curTheme()
  const item = (ic, bg, title, sub, act, end = I('chevR')) => `<button class="li" ${act ? `onclick="${act}"` : ''}><span class="ic" style="background:${bg}">${ic}</span><div class="mid"><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div><div class="end mut">${end}</div></button>`
  openSheet({
    title: 'Ajustes', done: 'OK', cancel: '', tall: true,
    html: `<button class="list" style="display:flex;align-items:center;gap:14px;padding:14px 16px;width:100%;text-align:left" onclick="profileForm()"><span class="avatar" style="width:58px;height:58px;font-size:22px">${esc((S.name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</span><div style="flex:1"><div style="font-size:20px;font-weight:600">${esc(S.name || 'Seu nome')}</div><div class="mut" style="font-size:14px">Saldo inicial ${R(S.init)} · editar perfil</div></div><span class="mut">${I('chevR')}</span></button>
      <div class="form-label">Aparência</div>
      <div class="seg" id="thSeg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([k, n]) => `<button data-t="${k}" class="${t == k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="form-label">Inteligência</div>
      <div class="list">${item(I('spark'), 'linear-gradient(135deg,#6e3ff3,#ff5ea8)', 'Assistente com IA', 'Envia um resumo dos seus números ao perguntar', '', inSwitch('setAi', S.ai))}
        ${item(I('target'), 'var(--teal)', 'Orçamentos por categoria', Object.keys(S.budgets).length ? Object.keys(S.budgets).length + ' ativos' : 'Nenhum definido', 'closeAllSheets();setTimeout(editBudget,380)')}</div>
      <div class="form-label">Segurança e lembretes</div>
      <div class="list">${item(I('lock'), 'var(--indigo)', 'Código de acesso', S.pin ? 'Ativado' : 'Desativado', 'pinForm()')}
        ${item(I('bell'), 'var(--red)', 'Lembretes de vencimento', 'Notifica contas que vencem em até 2 dias', 'enableNotif()')}</div>
      <div class="form-label">Seus dados</div>
      <div class="list">${item(I('dl'), 'var(--blue)', 'Exportar backup', 'Arquivo .json com tudo', 'exportBackup()')}
        ${item(I('lock'), '#1c1c1e', 'Backup criptografado', 'Protegido por senha (AES-256)', 'exportEnc()')}
        ${item(I('share'), 'var(--green)', 'Importar backup', 'Restaura de um arquivo .json', "$('#impFile').click()")}
        ${item(I('box'), 'var(--orange)', 'Carregar dados de exemplo', 'Para explorar o app', 'loadDemo()')}
        ${item(I('trash'), 'var(--red)', '<span style="color:var(--red)">Apagar tudo</span>', '', 'wipe()', '')}</div>
      <input type="file" id="impFile" accept="application/json,.json,.txt" hidden>
      <p class="footnote" style="margin-top:4px">🔒 Seus dados ficam apenas neste aparelho. Faça backups regularmente.${mem ? ' <b style="color:var(--red)">Armazenamento indisponível: dados só em memória.</b>' : ''}</p>
      <div class="card pad" style="display:flex;gap:12px;align-items:center"><img src="/.netlify/images?url=/img/icon.png&w=96&h=96&fm=webp" width="48" height="48" style="border-radius:12px" alt=""><div style="font-size:13px" class="mut"><b style="color:var(--tx);font-size:15px">Instale no iPhone</b><br>No Safari, toque em Compartilhar → <b>Adicionar à Tela de Início</b>.</div></div>
      <p class="footnote" style="text-align:center">MEU MÊS · versão 2.0</p>`,
    onMount: (a) => {
      $$('#thSeg button', a.body).forEach((b) => (b.onclick = () => { applyTheme(b.dataset.t); $$('#thSeg button', a.body).forEach((x) => x.classList.toggle('on', x === b)); haptic() }))
      $('[name=setAi]', a.body).onchange = (e) => { S.ai = e.target.checked; save({ silent: true }); toast(S.ai ? 'IA avançada ativada' : 'Modo privado ativado') }
      $('#impFile', a.body).onchange = (e) => { const f = e.target.files[0]; if (f) f.text().then(importBackup) }
    },
  })
}
function profileForm() {
  openSheet({
    title: 'Perfil',
    html: `<div class="form">${row('Nome', inText('name', S.name, 'Como quer ser chamado?', 'class="left"'))}${row('Saldo inicial', `<input name="init" inputmode="decimal" value="${(S.init / 100).toFixed(2).replace('.', ',')}">`)}</div>
      <p class="form-note">O saldo inicial é quanto você tinha em conta quando começou a usar o app.</p>`,
    onDone: (a) => { S.name = val(a.body, 'name').trim(); S.init = cents(val(a.body, 'init')); S.onboarded = true; save(); toast('Perfil salvo') },
  })
}

// ---------- backup ----------
const b64 = (b) => { let s = ''; new Uint8Array(b).forEach((x) => (s += String.fromCharCode(x))); return btoa(s) }, ub = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
async function dkey(pw, salt) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) }
async function encB(pw) { const s = crypto.getRandomValues(new Uint8Array(16)), i = crypto.getRandomValues(new Uint8Array(12)), d = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: i }, await dkey(pw, s), new TextEncoder().encode(JSON.stringify(S))); return JSON.stringify({ enc: 1, s: b64(s), i: b64(i), d: b64(d) }) }
async function decB(o, pw) { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub(o.i) }, await dkey(pw, ub(o.s)), ub(o.d)))) }
const askPw = (title, note) => new Promise((res) => { let v = null; openSheet({ title, done: 'OK', html: `<div class="form">${row('Senha', '<input name="pw" type="password" class="left" autocomplete="new-password">')}</div>${note ? `<p class="form-note">${note}</p>` : ''}`, onMount: (a) => setTimeout(() => $('[name=pw]', a.body).focus(), 380), onDone: (a) => { v = val(a.body, 'pw'); if (!v) return false }, onClose: () => res(v) }) })
function exportBackup() { download(`meu-mes-backup-${today()}.json`, JSON.stringify(S), 'application/json'); toast('Backup exportado') }
async function exportEnc() { const pw = await askPw('Backup criptografado', 'Escolha uma senha. Ela não pode ser recuperada.'); if (!pw) return; download(`meu-mes-backup-seguro-${today()}.json`, await encB(pw), 'application/json'); toast('Backup criptografado exportado') }
async function importBackup(txt) {
  try {
    let o = JSON.parse(txt)
    if (o && o.enc) { const pw = await askPw('Senha do backup'); if (!pw) return; o = await decB(o, pw) }
    if (!o || o.v > 2 || !Array.isArray(o.tx) || !Array.isArray(o.cards) || !Array.isArray(o.bills) || !Array.isArray(o.goals)) throw 0
    if (!(await confirmSheet('Importar backup', `Substituir todos os dados atuais por este backup (${o.tx.length} lançamentos)?`, 'Substituir'))) return
    S = migrate(o); save(); closeAllSheets(); toast('Backup restaurado ✓')
  } catch (e) { toast('Backup inválido ou senha incorreta') }
}
async function loadDemo() { if (S.tx.length && !(await confirmSheet('Dados de exemplo', 'Isso substitui seus dados atuais. Faça um backup antes, se precisar.', 'Carregar exemplo'))) return; snap(); S = demoData(); save(); closeAllSheets(); hideOnb(); toast('Exemplo carregado', ['Desfazer', undo]) }
async function wipe() { if (!(await confirmSheet('Apagar tudo', 'Todos os lançamentos, cartões, contas e metas deste aparelho serão apagados.', 'Apagar tudo'))) return; snap(); S = blank(); S.onboarded = true; save(); closeAllSheets(); toast('Dados apagados', ['Desfazer', undo]) }

// ---------- lembretes ----------
function checkNotif() {
  if (!('Notification' in window) || Notification.permission != 'granted') return
  const lim = addDays(today(), 2), key = 'meumes-notif-' + today()
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1') } catch (e) {}
  S.bills.filter((b) => !b.paid && b.due <= lim).forEach((b) => new Notification('MEU MÊS', { body: `${b.name} ${dueLabel(b.due)} · ${R(b.amt)}`, icon: '/.netlify/images?url=/img/icon.png&w=192&h=192&fm=png' }))
}
async function enableNotif() {
  if (!('Notification' in window)) return toast('Notificações indisponíveis neste navegador. No iPhone, instale o app na Tela de Início.')
  if ((await Notification.requestPermission()) == 'granted') { try { localStorage.removeItem('meumes-notif-' + today()) } catch (e) {} checkNotif(); toast('Lembretes ativados 🔔') } else toast('Permissão negada')
}

// ---------- código de acesso ----------
const sha = async (s) => b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('meumes:' + s)))
function pinForm() {
  openSheet({
    title: S.pin ? 'Código de acesso' : 'Criar código', done: 'Salvar',
    html: `<div class="form">${row('Novo código', '<input name="p1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="4 a 8 dígitos">')}${row('Confirmar', '<input name="p2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8">')}</div>
      <p class="form-note">O código é pedido sempre que o app é aberto.</p>${S.pin ? '<button type="button" class="btn block danger" id="pOff">Desativar código</button>' : ''}`,
    onMount: (a) => { const o = $('#pOff', a.body); if (o) o.onclick = () => { S.pin = ''; delete S.pinLen; save(); a.close(); toast('Código desativado') }; setTimeout(() => $('[name=p1]', a.body).focus(), 380) },
    onDone: async (a) => {
      const p1 = val(a.body, 'p1'), p2 = val(a.body, 'p2')
      if (!/^\d{4,8}$/.test(p1)) { toast('Use de 4 a 8 números'); return false }
      if (p1 !== p2) { toast('Os códigos não conferem'); return false }
      S.pin = await sha(p1); S.pinLen = p1.length; save(); toast('Código ativado 🔒')
    },
  })
}
function lock() {
  if (!S.pin) return
  const o = document.createElement('div')
  o.className = 'overlay lock'
  let v = ''
  const L = S.pinLen || 0
  const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']]
  o.innerHTML = `<img class="app-i" src="/.netlify/images?url=/img/icon.png&w=128&h=128&fm=webp" alt=""><h2>Digite seu código</h2><div class="pin-dots" id="pd"></div>
    <div class="keypad">${keys.map(([n, s]) => `<button data-k="${n}">${n}<small>${s}</small></button>`).join('')}<button class="txt" data-k="ok" style="${L ? 'visibility:hidden' : ''}">OK</button><button data-k="0">0</button><button class="txt" data-k="del">Apagar</button></div>`
  $('#shell').appendChild(o)
  const dots = () => ($('#pd', o).innerHTML = Array.from({ length: L || Math.max(4, v.length) }, (_, i) => `<i class="${i < v.length ? 'f' : ''}"></i>`).join(''))
  const fail = () => { const d = $('#pd', o); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); haptic(60); v = ''; setTimeout(dots, 300) }
  const check = async (final) => {
    if (v.length >= 4 && (await sha(v)) === S.pin) { haptic(15); o.style.transition = 'opacity .35s, transform .35s'; o.style.opacity = 0; o.style.transform = 'scale(1.08)'; setTimeout(() => o.remove(), 350); return }
    if (final || (L && v.length >= L) || v.length >= 8) fail()
  }
  o.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]')?.dataset.k; if (!k) return
    haptic(5)
    if (k == 'del') v = v.slice(0, -1); else if (k == 'ok') return check(true); else if (v.length < 8) v += k
    dots(); if (k != 'del') check(false)
  })
  document.addEventListener('keydown', function kd(e) { if (!o.isConnected) return document.removeEventListener('keydown', kd); if (/^\d$/.test(e.key) && v.length < 8) { v += e.key; dots(); check(false) } else if (e.key == 'Backspace') { v = v.slice(0, -1); dots() } else if (e.key == 'Enter') check(true) })
  dots()
}

// ---------- boas-vindas ----------
function onboarding() {
  const o = document.createElement('div')
  o.className = 'overlay onb'; o.id = 'onb'
  o.innerHTML = `<div class="top"><img src="/.netlify/images?url=/img/icon.png&w=256&h=256&fm=webp" alt="Meu Mês"><h1>Meu Mês</h1><p class="lead">Saiba exatamente quanto você pode gastar hoje — sem planilhas.</p>
    <div class="feat"><div><span class="e">✨</span><p style="margin:0"><b>Lançamento inteligente</b><span>Digite “almoço 32 ontem” e pronto.</span></p></div>
    <div><span class="e">💳</span><p style="margin:0"><b>Cartões e parcelas</b><span>Faturas futuras e melhor dia de compra.</span></p></div>
    <div><span class="e">🧠</span><p style="margin:0"><b>Assistente e insights</b><span>Previsões, alertas e respostas na hora.</span></p></div>
    <div><span class="e">🔒</span><p style="margin:0"><b>Privado de verdade</b><span>Seus dados ficam no seu aparelho.</span></p></div></div></div>
    <div class="bottom"><button class="btn block" id="onGo">Começar</button><button class="btn block gray" id="onDemo">Explorar com dados de exemplo</button></div>`
  $('#shell').appendChild(o)
  $('#onGo', o).onclick = () => { haptic(); hideOnb(); S.onboarded = true; save({ silent: true }); setTimeout(profileForm, 250) }
  $('#onDemo', o).onclick = () => { haptic(); S = demoData(); save(); hideOnb(); toast('Exemplo carregado · apague em Ajustes') }
}
function hideOnb() { const o = $('#onb'); if (o) { o.style.transition = 'opacity .4s, transform .4s'; o.style.opacity = 0; o.style.transform = 'translateY(-20px)'; setTimeout(() => o.remove(), 400) } }

// ================================================================
// início
// ================================================================
;(async () => {
  $('#scroller').addEventListener('scroll', onScroll, { passive: true })
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => curTheme() == 'auto' && applyTheme('auto'))
  setThemeColor()
  const o = await load()
  if (o) S = migrate(o)
  render(true)
  if (!S.onboarded && !S.tx.length) onboarding()
  lock()
  checkNotif()
  document.addEventListener('keydown', (e) => { if (e.target.closest('input,textarea,select') || $('.overlay') || $('.sheet-wrap')) return; if (e.key == 'n') { e.preventDefault(); quickAdd() } else if (e.key == '/') { e.preventDefault(); openAssistant() } })
  // re-renderiza ao virar o dia / voltar ao app
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkNotif() } })
  if ('serviceWorker' in navigator && location.protocol == 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {})
})()

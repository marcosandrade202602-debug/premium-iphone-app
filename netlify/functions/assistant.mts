import Anthropic from '@anthropic-ai/sdk'

type Msg = { role: 'user' | 'assistant'; content: string }

const SYSTEM = `Você é o assistente financeiro do app "MEU MÊS", um app pessoal de controle do mês.
Responda SEMPRE em português do Brasil, de forma curta, calorosa e prática (no máximo ~120 palavras).
Use apenas os dados do RESUMO fornecido; se faltar informação, diga o que o usuário pode cadastrar.
Valores estão em reais (R$). Dê números concretos, sugira uma ação clara quando fizer sentido.
Não invente transações. Não dê recomendações de investimento específicas (ações, criptomoedas).
Formate com frases curtas; pode usar listas com "•". Sem markdown pesado (sem tabelas, sem títulos).`

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: { question?: unknown; summary?: unknown; history?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 600) : ''
  if (!question) return Response.json({ error: 'Pergunta vazia' }, { status: 400 })

  const summary = JSON.stringify(body.summary ?? {}).slice(0, 12000)
  const history: Msg[] = Array.isArray(body.history)
    ? (body.history as Msg[])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))
    : []
  // Anthropic exige que a conversa comece com o usuário
  while (history.length && history[0].role !== 'user') history.shift()

  try {
    const anthropic = new Anthropic()
    const res = await anthropic.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 600,
      system: `${SYSTEM}\n\nRESUMO FINANCEIRO ATUAL (JSON, valores em reais):\n${summary}`,
      messages: [...history, { role: 'user', content: question }],
    })
    const answer = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    return Response.json({ answer })
  } catch (e) {
    console.error('assistant error', e)
    return Response.json({ error: 'Assistente indisponível no momento' }, { status: 502 })
  }
}

export const config = { path: '/api/assistant' }

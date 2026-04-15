import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { briefing, pains, context, userId } = req.body;
  if (!briefing?.description || !briefing?.city) {
    return res.status(400).json({ error: "Descrição e cidade são obrigatórios." });
  }

  const PAIN_LABELS = {
    pa: "Faturamento não cresce",
    pb: "Tráfego pago não converte",
    pc: "Concorrência me vencendo",
    pd: "Não sei quem é meu cliente ideal",
    pe: "Margem comprimida",
    pf: "Quero entrar em mercado novo",
    pg: "Meu cliente não volta a comprar",
    ph: "Quero renovar meu produto / solução",
  };

  const painLabels = (pains || []).map(p => PAIN_LABELS[p] || p).join(", ");
  const filledComps = (briefing.competitors || []).filter(c => c.trim());

  const prompt = `Você é um especialista em inteligência competitiva e gestão de produtos digitais.
Faça uma análise competitiva completa para o seguinte negócio:

NEGÓCIO: ${briefing.description}
OBJETIVO: ${briefing.objective || "Diagnóstico geral de mercado"}
CIDADE/REGIÃO: ${briefing.city}
PROBLEMAS DECLARADOS: ${painLabels || "Não informado"}
CONTEXTO ADICIONAL: ${context || "Não fornecido"}
CONCORRENTES INFORMADOS: ${filledComps.length > 0 ? filledComps.join(", ") : "Nenhum — descubra os principais players"}
SITE/INSTAGRAM: ${briefing.url || "Não informado"}

INSTRUÇÕES:
1. Se concorrentes foram informados, pesquise cada um deles. Se não, descubra os 3-5 principais players do setor na região indicada.
2. Para cada concorrente: presença digital, tráfego estimado, se anunciam no Google/Meta, pontos fortes, e uma oportunidade específica para o negócio analisado.
3. Identifique a trava principal baseada nos problemas declarados E no que a análise revela — conecte os dois.
4. Gere um resumo estratégico objetivo do mercado.
5. Calcule um score de ameaça de 1-100 para cada concorrente.

RESPONDA APENAS EM JSON VÁLIDO com esta estrutura exata:
{
  "summary": "Resumo de 2-3 frases sobre o mercado",
  "trava": {
    "type": "nome curto da trava",
    "description": "2-3 frases conectando o problema declarado com o que a análise revelou",
    "actions": ["ação prioritária 1", "ação 2", "ação 3", "ação 4"]
  },
  "competitors": [
    {
      "name": "Nome da empresa",
      "url": "site.com.br",
      "hasGoogleAds": true,
      "hasMetaAds": false,
      "traffic": "estimativa ex: 20k-40k visitas/mês",
      "score": 75,
      "strengths": ["ponto forte 1", "ponto forte 2"],
      "opportunity": "oportunidade específica diante deste concorrente"
    }
  ]
}`;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key não configurada." });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    let jsonText = "";
    for (const block of data.content || []) {
      if (block.type === "text") { jsonText = block.text; break; }
    }
    if (!jsonText) throw new Error("Resposta vazia da API");

    const clean = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(clean);

    // Track diagnostic completion
    if (userId) {
      await db.trackEvent(userId, { type: "diagnostic_complete" });
      await db.upsertUser({
        id: userId,
        city: briefing.city,
        url: briefing.url || "",
        lastActiveAt: new Date().toISOString(),
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Erro ao processar diagnóstico: " + err.message });
  }
}

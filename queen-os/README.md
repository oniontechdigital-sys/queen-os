# 👑 Queen OS — Deploy no Vercel (5 minutos)

## Pré-requisitos
- Conta gratuita no [Vercel](https://vercel.com) (login com GitHub/Google)
- Chave da API Anthropic (a mesma que você usa no Claude)

---

## Passo 1 — Colocar o projeto no GitHub

1. Acesse [github.com](https://github.com) e crie um repositório novo (ex: `queen-os`)
2. Faça upload de todos os arquivos desta pasta para o repositório
3. (Alternativa: use o GitHub Desktop para arrastar e soltar)

---

## Passo 2 — Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Selecione o repositório `queen-os`
3. Vercel detecta automaticamente que é Next.js — clique **Deploy**

---

## Passo 3 — Configurar as variáveis de ambiente

No Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `ANTHROPIC_API_KEY` | sua chave da API Anthropic |
| `ADMIN_PASSWORD` | senha de acesso ao admin (ex: queen2026) |
| `NEXT_PUBLIC_APP_URL` | URL do seu projeto (ex: https://queen-os.vercel.app) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | mesma senha acima |

Depois clique em **Redeploy** para aplicar as variáveis.

---

## Passo 4 — Acessar

- **MVP**: `https://seu-projeto.vercel.app`
- **Admin**: `https://seu-projeto.vercel.app/admin`
- **Senha do admin**: a que você configurou (padrão: `queen2026`)

---

## Gerar links de convite

1. Acesse `/admin` com sua senha
2. Aba **Convites** → preencha uma observação → **Gerar link**
3. Copie o link gerado e envie para quem quiser convidar

---

## Observações importantes sobre esta versão MVP

- **Dados dos usuários ficam em memória**: cada vez que o servidor reiniciar (Vercel reinicia após ~15min sem uso), os dados somem. Para persistência real, adicione Vercel KV ou Supabase (posso ajudar quando chegar a hora).
- **Sem paywall**: todos os usuários têm acesso completo ao diagnóstico nesta fase de testes.
- **API Key**: a chave Anthropic fica no servidor (segura), nunca exposta no frontend.
- **Custo de uso**: cada diagnóstico faz ~1 chamada à API com web search. Custo estimado: USD 0.05–0.15 por diagnóstico.

---

## Próximos passos (quando quiser)

- [ ] Adicionar Vercel KV para persistência real dos dados
- [ ] Ativar módulo SWOT
- [ ] Reativar paywall com Stripe
- [ ] Adicionar domínio personalizado (queenos.com.br)

---

*Queen OS · by Onion Tech · Kleber · v0.1 MVP*

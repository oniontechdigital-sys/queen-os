import { useState, useCallback, useEffect, useRef } from "react";
import Head from "next/head";

const G = "#00e334", A = "#E5A100", R = "#E24B4A";

const PAINS = [
  { id:"pa", t:"Faturamento não cresce", d:"Estagnei. O que funcionava antes não funciona mais da mesma forma." },
  { id:"pb", t:"Tráfego pago não converte", d:"Gasto em anúncios mas o retorno caiu. Não sei se é a campanha ou o produto." },
  { id:"pc", t:"Concorrência me vencendo", d:"Perco clientes para concorrentes e não sei exatamente por quê." },
  { id:"pd", t:"Não sei quem é meu cliente ideal", d:"Atendo todo tipo de cliente e não consigo escalar." },
  { id:"pe", t:"Margem comprimida", d:"Não consigo cobrar mais. Preço baixou ou custo subiu." },
  { id:"pf", t:"Quero entrar em mercado novo", d:"Já tenho um bom produto / solução e quero expandir para novo nicho ou região." },
  { id:"pg", t:"Meu cliente não volta a comprar", d:"Consigo atrair clientes, mas eles compram uma vez e somem." },
  { id:"ph", t:"Quero renovar meu produto / solução", d:"Meu produto está desatualizado ou perdendo relevância no mercado." },
];

const PAIN_MAP = {
  pa: ["Ciclo de vida do produto","North Star Metric","Análise de crescimento"],
  pb: ["Inteligência competitiva","Análise de conversão","Benchmarking de anúncios","Posicionamento e PUV"],
  pc: ["Inteligência competitiva","Benchmarking de mercado","Análise de posicionamento"],
  pd: ["Persona completa","Posicionamento e PUV","TAM / SAM / SOM"],
  pe: ["Precificação e valor percebido","Posicionamento e PUV","CSD"],
  pf: ["TAM / SAM / SOM","Inteligência competitiva","Benchmarking"],
  pg: ["Retenção e NPS","Ciclo de vida do produto","Pesquisa com usuários"],
  ph: ["SWOT","CSD","Benchmarking","Ciclo de vida do produto"],
};

function Logo({ size=18 }) {
  return (
    <svg width={size} height={size*1.1} viewBox="0 0 88 100" fill="none">
      <polygon points="18,36 27,15 36,27 44,8 52,27 61,15 70,36" fill={A} stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="27" cy="17" r="3.5" fill="#FFF3CC" stroke="#BA7517" strokeWidth="1"/>
      <circle cx="44" cy="10" r="3.5" fill="#FFF3CC" stroke="#BA7517" strokeWidth="1"/>
      <circle cx="61" cy="17" r="3.5" fill="#FFF3CC" stroke="#BA7517" strokeWidth="1"/>
      <rect x="14" y="35" width="60" height="8" rx="3" fill="#BA7517"/>
      <ellipse cx="44" cy="74" rx="28" ry="30" fill={G} stroke="#00b828" strokeWidth="1.5"/>
      <path d="M22,58 Q16,70 20,81 Q25,93 44,97 Q63,93 68,81 Q72,70 66,58" fill="#00c82e"/>
      <path d="M32,52 Q30,65 30,74 Q30,84 44,88 Q58,84 58,74 Q58,65 56,52" fill={G}/>
    </svg>
  );
}

const inp = { width:"100%", border:"1px solid #e8e7e0", borderRadius:8, padding:"8px 10px", fontSize:12, color:"#1a1a18", fontFamily:"inherit", outline:"none", background:"#fff" };
const btn = (bg, full) => ({ fontSize:12, color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:600, background:bg, width: full?"100%":"auto" });

export default function Home() {
  const [step, setStep] = useState(0);
  const [pains, setPains] = useState([]);
  const [context, setContext] = useState("");
  const [briefing, setBriefing] = useState({ url:"", description:"", objective:"", city:"", competitors:[""] });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const startTime = useRef(null);

  const LOAD_TEXTS = [
    "Analisando o briefing e identificando o setor",
    "Buscando concorrentes no mercado",
    "Verificando presença digital e anúncios",
    "Calculando score de ameaça por concorrente",
    "Identificando trava principal e oportunidades",
  ];

  useEffect(() => {
    // Restore userId from localStorage
    const id = localStorage.getItem("qos_uid") || ("user_" + Math.random().toString(36).slice(2, 10));
    localStorage.setItem("qos_uid", id);
    setUserId(id);
    startTime.current = Date.now();
  }, []);

  const registerUser = async () => {
    if (!name.trim()) return;
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ action:"upsert", id:userId, name, email, plan:"free", source:"direct" })
      });
    } catch {}
  };

  const trackTime = async () => {
    if (!startTime.current || !userId) return;
    const secs = Math.round((Date.now() - startTime.current) / 1000);
    try {
      await fetch("/api/users", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"event", userId, event:{ type:"session_time", seconds:secs } })
      });
    } catch {}
  };

  const setComp = (i,v) => {
    const c = [...briefing.competitors]; c[i]=v;
    setBriefing(b=>({...b,competitors:c}));
  };

  const modules = [...new Set(pains.flatMap(p=>PAIN_MAP[p]||[]))];

  const runAnalysis = useCallback(async () => {
    setStep(3); setLoading(true); setLoadStep(0);
    await registerUser();

    let ls = 0;
    const tick = setInterval(() => { ls = Math.min(ls+1, 4); setLoadStep(ls); }, 3000);

    try {
      const r = await fetch("/api/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ briefing, pains, context, userId })
      });
      clearInterval(tick);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error||"Erro na análise");
      setLoadStep(4);
      await new Promise(r=>setTimeout(r,600));
      setResults(data);
      await trackTime();
      setStep(4);
    } catch(e) {
      clearInterval(tick);
      setError(e.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }, [briefing, pains, context, userId, name, email]);

  const restart = () => {
    setStep(0); setPains([]); setContext("");
    setBriefing({ url:"", description:"", objective:"", city:"", competitors:[""] });
    setResults(null); setError(null); setName(""); setEmail("");
    startTime.current = Date.now();
  };

  const card = { background:"#fff", border:"1px solid #e8e7e0", borderRadius:12, overflow:"hidden" };

  const Topbar = ({stepNum, total}) => (
    <div style={{ background:"#f5f5f3", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e8e7e0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, color:"#1a1a18" }}>
        <Logo size={16}/> Queen OS
      </div>
      {total && (
        <div style={{display:"flex",gap:3}}>
          {Array.from({length:total}).map((_,i)=>(
            <div key={i} style={{ width:16,height:16,borderRadius:"50%",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
              background: i<stepNum ? G : i===stepNum ? A : "#f1efe8",
              color: i<stepNum ? "#003d0e" : i===stepNum ? "#fff" : "#888780",
              border: i>=stepNum ? "1px solid #D3D1C7" : "none"
            }}>{i<stepNum ? "✓" : i+1}</div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Queen OS — Diagnóstico de Mercado</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f3; }
          textarea:focus, input:focus { border-color: ${G} !important; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </Head>

      <div style={{ minHeight:"100vh", padding:"16px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Logo size={28}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a18" }}>Queen OS</div>
                <div style={{ fontSize:11, color:"#888780" }}>by Onion Tech</div>
              </div>
            </div>
            <span style={{ fontSize:11, background:"#FFF3CC", color:"#854F0B", padding:"3px 10px", borderRadius:20, border:"1px solid #E5A100", fontWeight:500 }}>
              MVP · Testes
            </span>
          </div>

          {error && (
            <div style={{ background:"#FCEBEB", border:"1px solid #E24B4A", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#791F1F" }}>
              {error} <button onClick={()=>setError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#791F1F", fontWeight:600, marginLeft:8 }}>✕</button>
            </div>
          )}

          {/* STEP 0: Identificação + Bifurcação */}
          {step === 0 && (
            <div style={card}>
              <Topbar/>
              <div style={{ padding:18 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#1a1a18", marginBottom:4 }}>Bem-vindo à Queen OS</div>
                <div style={{ fontSize:12, color:"#5F5E5A", marginBottom:16, lineHeight:1.5 }}>Vamos começar com uma breve identificação para personalizar sua experiência.</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#5F5E5A", marginBottom:4 }}>Seu nome</div>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Como você se chama?" style={inp}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#5F5E5A", marginBottom:4 }}>E-mail <span style={{ fontSize:10, fontWeight:400, color:"#B4B2A9" }}>(opcional)</span></div>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com.br" type="email" style={inp}/>
                  </div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:"#1a1a18", marginBottom:10 }}>Qual é o seu momento agora?</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div onClick={()=>{ if(name.trim()) setStep(1); else alert("Informe seu nome para continuar."); }} style={{ border:"2px solid #00b828", borderRadius:12, padding:14, cursor:"pointer", background:"#f0fdf4" }}>
                    <svg style={{ marginBottom:8 }} width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="#006b18" strokeWidth="1.5"><rect x="3" y="5" width="22" height="18" rx="3"/><path d="M9 12h10M9 17h7"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:"#006b18", marginBottom:3 }}>Já tenho empresa ou negócio</div>
                    <div style={{ fontSize:11, color:"#1a7a30", lineHeight:1.4 }}>Quero entender os detalhes da minha concorrência, ter clareza dos meus pontos fracos e posicionar melhor meu produto / serviço.</div>
                    <span style={{ display:"inline-block", fontSize:10, padding:"2px 8px", borderRadius:20, marginTop:6, fontWeight:600, background:G, color:"#003d0e" }}>Disponível agora</span>
                  </div>
                  <div onClick={()=>alert("Em breve! Vamos notificar você quando lançar.")} style={{ border:"2px solid #e8e7e0", borderRadius:12, padding:14, cursor:"pointer" }}>
                    <svg style={{ marginBottom:8 }} width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="#888780" strokeWidth="1.5"><path d="M14 4v6M14 18v6M4 14h6M18 14h6"/><circle cx="14" cy="14" r="4"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1a18", marginBottom:3 }}>Quero criar algo novo</div>
                    <div style={{ fontSize:11, color:"#5F5E5A", lineHeight:1.4 }}>Tenho uma ideia de produto ou serviço e quero entender se ela tem mercado.</div>
                    <span style={{ display:"inline-block", fontSize:10, padding:"2px 8px", borderRadius:20, marginTop:6, fontWeight:600, background:"#f1efe8", color:"#888780", border:"1px dashed #D3D1C7" }}>Em breve · fase 2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Problema declarado */}
          {step === 1 && (
            <div style={card}>
              <Topbar stepNum={1} total={4}/>
              <div style={{ padding:18 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#1a1a18", marginBottom:4 }}>Qual você considera seu maior problema hoje?</div>
                <div style={{ fontSize:12, color:"#5F5E5A", marginBottom:14, lineHeight:1.5 }}>Selecione até 3 situações. Quanto mais contexto, mais preciso o diagnóstico.</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                  {PAINS.map(p => (
                    <div key={p.id} onClick={()=>{ if(pains.includes(p.id)) setPains(pains.filter(x=>x!==p.id)); else if(pains.length<3) setPains([...pains,p.id]); }} style={{ border:`2px solid ${pains.includes(p.id)?A:"#e8e7e0"}`, borderRadius:10, padding:10, cursor:"pointer", background:pains.includes(p.id)?"#fffbf0":"#fff" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:pains.includes(p.id)?"#5a3d00":"#1a1a18", marginBottom:3 }}>{p.t}</div>
                      <div style={{ fontSize:10, color:pains.includes(p.id)?"#7a5500":"#5F5E5A", lineHeight:1.35 }}>{p.d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1a1a18", marginBottom:3 }}>Complementar com mais contexto <span style={{ fontSize:10, fontWeight:400, color:"#888780" }}>(recomendado)</span></div>
                  <div style={{ fontSize:10, color:"#888780", marginBottom:6 }}>Descreva a situação com suas próprias palavras para aumentar a precisão do diagnóstico.</div>
                  <textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Ex: Meu tráfego pago custa R$ 8.000/mês mas gerou apenas 3 vendas. Já troquei o criativo 2 vezes..." style={{ ...inp, resize:"vertical", minHeight:70, lineHeight:1.5 }}/>
                </div>
                {modules.length > 0 && (
                  <div style={{ background:"#fffbf0", border:"1px solid #E5A100", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:"#854F0B", marginBottom:6, fontWeight:600 }}>Módulos priorizados no seu diagnóstico</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {modules.map(m => <span key={m} style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#FFF3CC", color:"#5a3d00", border:"1px solid #E5A100" }}>{m}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding:"10px 16px", borderTop:"1px solid #e8e7e0", display:"flex", justifyContent:"space-between", background:"#f9f9f7" }}>
                <button onClick={()=>setStep(0)} style={{ fontSize:11, color:"#5F5E5A", border:"1px solid #D3D1C7", background:"#fff", borderRadius:7, padding:"6px 12px", cursor:"pointer" }}>← Voltar</button>
                <button onClick={()=>setStep(2)} disabled={pains.length===0} style={{ ...btn(A), opacity:pains.length===0?0.5:1, cursor:pains.length===0?"not-allowed":"pointer" }}>Continuar para o briefing →</button>
              </div>
            </div>
          )}

          {/* STEP 2: Briefing */}
          {step === 2 && (
            <div style={card}>
              <Topbar stepNum={2} total={4}/>
              <div style={{ padding:18 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#1a1a18", marginBottom:4 }}>Conte sobre o seu negócio</div>
                <div style={{ fontSize:12, color:"#5F5E5A", marginBottom:16, lineHeight:1.5 }}>Passo 3 de 4 — quanto mais detalhes, melhor o diagnóstico.</div>
                {[
                  { k:"url", l:"Site ou Instagram da sua empresa", ph:"https://seusite.com.br  ou  instagram.com/suaempresa" },
                  { k:"description", l:"Descrição do produto / serviço", ph:"O que você oferece, para quem, como funciona...", ta:true },
                  { k:"objective", l:"Qual problema você quer resolver com a Queen OS?", ph:"Ex: Entender por que meu tráfego não converte e mapear a concorrência...", ta:true },
                  { k:"city", l:"Cidade / Estado", ph:"São Paulo – SP" },
                ].map(f => (
                  <div key={f.k} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#5F5E5A", marginBottom:4 }}>{f.l}</div>
                    {f.ta ? (
                      <textarea value={briefing[f.k]} onChange={e=>setBriefing(b=>({...b,[f.k]:e.target.value}))} placeholder={f.ph} style={{ ...inp, resize:"vertical", minHeight:f.k==="description"?60:48, lineHeight:1.5 }}/>
                    ) : (
                      <input value={briefing[f.k]} onChange={e=>setBriefing(b=>({...b,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
                    )}
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#5F5E5A", marginBottom:4 }}>Concorrentes conhecidos <span style={{ fontWeight:400, color:"#B4B2A9", fontSize:10 }}>(opcional — até 4 sites)</span></div>
                  {briefing.competitors.map((c,i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"22px 1fr", gap:6, alignItems:"center", marginBottom:5 }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", background:c?G:"#f1efe8", color:c?"#003d0e":"#888780", border:c?"none":"1px dashed #D3D1C7" }}>{i+1}</div>
                      <input value={c} onChange={e=>setComp(i,e.target.value)} placeholder="site.com.br" style={inp}/>
                    </div>
                  ))}
                  {briefing.competitors.length < 4 && (
                    <button onClick={()=>setBriefing(b=>({...b,competitors:[...b.competitors,""]}))} style={{ fontSize:10, color:"#888780", border:"1px dashed #D3D1C7", background:"none", borderRadius:7, padding:"4px 10px", cursor:"pointer", marginTop:2 }}>+ Adicionar concorrente</button>
                  )}
                </div>
              </div>
              <div style={{ padding:"10px 16px", borderTop:"1px solid #e8e7e0", display:"flex", justifyContent:"space-between", background:"#f9f9f7" }}>
                <button onClick={()=>setStep(1)} style={{ fontSize:11, color:"#5F5E5A", border:"1px solid #D3D1C7", background:"#fff", borderRadius:7, padding:"6px 12px", cursor:"pointer" }}>← Voltar</button>
                <button onClick={runAnalysis} disabled={!briefing.description.trim()||!briefing.city.trim()} style={{ ...btn(G), opacity:(!briefing.description.trim()||!briefing.city.trim())?0.5:1 }}>Iniciar pesquisa de mercado →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Loading */}
          {step === 3 && (
            <div style={card}>
              <div style={{ background:"#f5f5f3", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e8e7e0" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, color:"#1a1a18" }}><Logo size={16}/> Queen OS</div>
                <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:500, background:"#f0fdf4", color:"#006b18", border:"1px solid #00b828" }}>IA pesquisando...</span>
              </div>
              <div style={{ padding:28, textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"2.5px solid #e8e7e0", borderTopColor:G, margin:"0 auto 14px", animation:"spin 1s linear infinite" }}></div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a1a18", marginBottom:12 }}>Pesquisando seu mercado com IA</div>
                <div style={{ textAlign:"left", display:"inline-block" }}>
                  {LOAD_TEXTS.map((t,i) => (
                    <div key={i} style={{ fontSize:11, display:"flex", alignItems:"center", gap:7, marginBottom:7, color: i<loadStep?"#006b18":i===loadStep?"#BA7517":"#B4B2A9" }}>
                      {i < loadStep ? (
                        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill={G}/><polyline points="3,6 5,8 9,4" stroke="#003d0e" strokeWidth="1.3" fill="none"/></svg>
                      ) : i === loadStep ? (
                        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="none" stroke="#BA7517" strokeWidth="1.5"/><circle cx="6" cy="6" r="2.5" fill="#BA7517"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="none" stroke="#D3D1C7" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
                      )}
                      {t}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, color:"#888780", fontSize:11 }}>Isso pode levar até 60 segundos</div>
              </div>
            </div>
          )}

          {/* STEP 4: Results */}
          {step === 4 && results && (
            <div style={card}>
              <div style={{ background:"#f5f5f3", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e8e7e0" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, color:"#1a1a18" }}><Logo size={16}/> Queen OS · Diagnóstico</div>
                {results.trava && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:500, background:"#FCEBEB", color:"#A32D2D", border:"1px solid #E24B4A" }}>Trava: {results.trava.type}</span>}
              </div>
              <div style={{ padding:18 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a1a18", marginBottom:2 }}>
                  {briefing.description.length>60 ? briefing.description.slice(0,58)+"..." : briefing.description}
                </div>
                <div style={{ fontSize:11, color:"#5F5E5A", marginBottom:14 }}>{briefing.city} · {new Date().toLocaleDateString("pt-BR")} · {results.competitors?.length||0} concorrentes mapeados</div>

                {results.summary && (
                  <div style={{ background:"#f5f5f3", border:"1px solid #e8e7e0", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#1a1a18", marginBottom:6 }}>Visão geral do mercado</div>
                    <div style={{ fontSize:12, color:"#3d3d3a", lineHeight:1.6 }}>{results.summary}</div>
                  </div>
                )}

                {results.trava && (
                  <div style={{ border:"2px solid #E24B4A", borderRadius:10, padding:"12px 14px", background:"#fffafa", marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"#E24B4A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M3 13L5 8l3 2 3-5 2 2"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#791F1F" }}>Trava principal: {results.trava.type}</div>
                        <div style={{ fontSize:10, color:"#A32D2D", marginTop:1 }}>Baseado na sua dor declarada e no mapeamento competitivo</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#501313", lineHeight:1.6, marginBottom:8 }}>{results.trava.description}</div>
                    {results.trava.actions && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {results.trava.actions.map((a,i) => <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#FCEBEB", color:"#791F1F", border:"1px solid #E24B4A" }}>{a}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {results.competitors && results.competitors.length > 0 && (
                  <>
                    <div style={{ fontSize:12, fontWeight:700, color:"#1a1a18", marginBottom:8 }}>Mapeamento de concorrentes</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                      {results.competitors.map((c,i) => (
                        <div key={i} style={{ border:"1px solid #e8e7e0", borderRadius:10, padding:12 }}>
                          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a18" }}>{c.name}</div>
                              <div style={{ fontSize:10, color:"#888780" }}>{c.url}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:18, fontWeight:700, color: c.score>=70?"#A32D2D":c.score>=40?"#BA7517":"#3B6D11" }}>{c.score}</div>
                              <div style={{ fontSize:9, color:"#888780" }}>score ameaça</div>
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                            {c.hasGoogleAds && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:20, background:"#E6F1FB", color:"#0C447C" }}>Google Ads</span>}
                            {c.hasMetaAds && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:20, background:"#EEEDFE", color:"#3C3489" }}>Meta Ads</span>}
                            {!c.hasGoogleAds && !c.hasMetaAds && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:20, background:"#f1efe8", color:"#888780" }}>Sem ads identificados</span>}
                            {c.traffic && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:20, background:"#f1efe8", color:"#888780" }}>{c.traffic}</span>}
                          </div>
                          {c.strengths && c.strengths.length>0 && (
                            <div style={{ marginBottom:5 }}>
                              <div style={{ fontSize:10, fontWeight:600, color:"#5F5E5A", marginBottom:2 }}>Pontos fortes</div>
                              <div style={{ fontSize:11, color:"#3d3d3a", lineHeight:1.5 }}>{c.strengths.join(" · ")}</div>
                            </div>
                          )}
                          {c.opportunity && (
                            <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#5F5E5A", marginBottom:2 }}>Oportunidade para você</div>
                              <span style={{ fontSize:10, background:"#f0fdf4", color:"#006b18", padding:"2px 8px", borderRadius:20, border:"1px solid #00b828" }}>{c.opportunity}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ background:"#f0fdf4", border:"1px solid #00b828", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#006b18", marginBottom:2 }}>Próximo módulo: SWOT do negócio</div>
                    <div style={{ fontSize:10, color:"#3B6D11" }}>Usa os dados do mapeamento para identificar forças, fraquezas e oportunidades reais.</div>
                  </div>
                  <button onClick={()=>alert("Módulo SWOT em desenvolvimento — em breve!")} style={{ ...btn("#00b828"), whiteSpace:"nowrap", fontSize:11 }}>Iniciar SWOT →</button>
                </div>

                <button onClick={restart} style={{ width:"100%", background:"#f5f5f3", color:"#5F5E5A", border:"1px solid #D3D1C7", borderRadius:8, padding:"8px 0", fontSize:12, cursor:"pointer", fontWeight:500 }}>← Novo diagnóstico</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

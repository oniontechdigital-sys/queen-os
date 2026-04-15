import { useState, useEffect } from "react";
import Head from "next/head";

const G = "#00e334", A = "#E5A100";

function Logo({ size=16 }) {
  return (
    <svg width={size} height={size*1.1} viewBox="0 0 88 100" fill="none">
      <polygon points="18,36 27,15 36,27 44,8 52,27 61,15 70,36" fill={A} stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="14" y="35" width="60" height="8" rx="3" fill="#BA7517"/>
      <ellipse cx="44" cy="74" rx="28" ry="30" fill={G} stroke="#00b828" strokeWidth="1.5"/>
    </svg>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" });
}

function fmtTime(secs) {
  if (!secs || secs === 0) return "—";
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs/60)}min`;
  return `${Math.round(secs/3600)}h`;
}

const PLAN_COLORS = { free: ["#f1efe8","#5F5E5A"], start: ["#FFF3CC","#854F0B"], pro: ["#f0fdf4","#006b18"] };

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteNote, setInviteNote] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/users");
      const d = await r.json();
      setUsers(d.users || []);
      setInvites(d.invites || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  const login = async () => {
    const r = await fetch("/api/users", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"admin_login", password:pw }) });
    const d = await r.json();
    if (d.ok || pw === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "queen2026")) {
      setAuthed(true); setPwError(false);
    } else {
      // simple client-side check for MVP
      if (pw === "queen2026") { setAuthed(true); return; }
      setPwError(true);
    }
  };

  const createInvite = async () => {
    const r = await fetch("/api/invites", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"create", note:inviteNote }) });
    const d = await r.json();
    setInvites(prev => [d, ...prev]);
    setInviteNote("");
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedToken(key); setTimeout(()=>setCopiedToken(null), 2000); });
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt)) < 7*24*3600*1000).length,
    diagnostics: users.reduce((s,u) => s + (u.diagnosticsRun||0), 0),
    avgTime: users.length ? Math.round(users.reduce((s,u)=>s+(u.totalTimeSeconds||0),0) / users.length) : 0,
  };

  const filteredUsers = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  if (!authed) {
    return (
      <>
        <Head><title>Queen OS · Admin</title><style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3}`}</style></Head>
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", border:"1px solid #e8e7e0", borderRadius:12, padding:28, width:"100%", maxWidth:360, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:20 }}>
              <Logo size={24}/><div style={{ fontSize:18, fontWeight:700 }}>Queen OS</div>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1a1a18", marginBottom:4 }}>Painel Admin</div>
            <div style={{ fontSize:12, color:"#888780", marginBottom:18 }}>Acesso restrito</div>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Senha de acesso" style={{ width:"100%", border:`1px solid ${pwError?"#E24B4A":"#e8e7e0"}`, borderRadius:8, padding:"9px 11px", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10 }}/>
            {pwError && <div style={{ fontSize:11, color:"#E24B4A", marginBottom:8 }}>Senha incorreta</div>}
            <button onClick={login} style={{ width:"100%", background:"#1a1a18", color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer" }}>Entrar</button>
            <div style={{ fontSize:10, color:"#B4B2A9", marginTop:12 }}>Senha padrão: queen2026</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Queen OS · Admin</title><style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3}table{border-collapse:collapse}th,td{text-align:left}`}</style></Head>
      <div style={{ minHeight:"100vh", padding:"16px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Logo size={24}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a18" }}>Queen OS · Admin</div>
                <div style={{ fontSize:11, color:"#888780" }}>Painel de gestão · by Onion Tech</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={fetchData} style={{ fontSize:11, border:"1px solid #D3D1C7", background:"#fff", borderRadius:7, padding:"6px 12px", cursor:"pointer", color:"#5F5E5A" }}>↻ Atualizar</button>
              <button onClick={()=>setAuthed(false)} style={{ fontSize:11, border:"1px solid #D3D1C7", background:"#fff", borderRadius:7, padding:"6px 12px", cursor:"pointer", color:"#5F5E5A" }}>Sair</button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
            {[
              { label:"Total de usuários", val:stats.total, color:"#1a1a18" },
              { label:"Ativos (7 dias)", val:stats.active, color:"#006b18" },
              { label:"Diagnósticos gerados", val:stats.diagnostics, color:"#854F0B" },
              { label:"Tempo médio de uso", val:fmtTime(stats.avgTime), color:"#185FA5" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid #e8e7e0", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:"#888780", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:14, borderBottom:"1px solid #e8e7e0" }}>
            {["users","invites"].map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} style={{ fontSize:12, padding:"8px 16px", border:"none", background:"none", cursor:"pointer", fontWeight:600, color:activeTab===t?"#006b18":"#888780", borderBottom:`2px solid ${activeTab===t?G:"transparent"}` }}>
                {t==="users" ? `Usuários (${users.length})` : `Convites (${invites.length})`}
              </button>
            ))}
          </div>

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div style={{ background:"#fff", border:"1px solid #e8e7e0", borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid #e8e7e0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a18" }}>Usuários cadastrados</div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..." style={{ border:"1px solid #e8e7e0", borderRadius:7, padding:"5px 10px", fontSize:11, fontFamily:"inherit", outline:"none", width:200 }}/>
              </div>
              {loading ? (
                <div style={{ padding:24, textAlign:"center", color:"#888780", fontSize:12 }}>Carregando...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding:24, textAlign:"center" }}>
                  <div style={{ fontSize:13, color:"#888780", marginBottom:6 }}>Nenhum usuário ainda.</div>
                  <div style={{ fontSize:11, color:"#B4B2A9" }}>Os usuários aparecerão aqui quando se registrarem na plataforma.</div>
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", fontSize:11 }}>
                    <thead>
                      <tr style={{ background:"#f9f9f7" }}>
                        {["Nome","E-mail","Plano","Cadastro","Último acesso","Diagnósticos","Tempo uso","Cidade","Fonte"].map(h => (
                          <th key={h} style={{ padding:"8px 12px", color:"#888780", fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:".04em", whiteSpace:"nowrap", borderBottom:"1px solid #e8e7e0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u,i) => (
                        <tr key={u.id} style={{ borderBottom:"1px solid #f1efe8" }}>
                          <td style={{ padding:"9px 12px", fontWeight:600, color:"#1a1a18" }}>{u.name||"—"}</td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A" }}>{u.email||"—"}</td>
                          <td style={{ padding:"9px 12px" }}>
                            <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:(PLAN_COLORS[u.plan]||PLAN_COLORS.free)[0], color:(PLAN_COLORS[u.plan]||PLAN_COLORS.free)[1], fontWeight:600 }}>
                              {u.plan||"free"}
                            </span>
                          </td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A", whiteSpace:"nowrap" }}>{fmt(u.createdAt)}</td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A", whiteSpace:"nowrap" }}>{fmt(u.lastActiveAt)}</td>
                          <td style={{ padding:"9px 12px", color:"#1a1a18", fontWeight:600, textAlign:"center" }}>{u.diagnosticsRun||0}</td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A" }}>{fmtTime(u.totalTimeSeconds)}</td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A" }}>{u.city||"—"}</td>
                          <td style={{ padding:"9px 12px", color:"#5F5E5A" }}>{u.source||"direct"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVITES TAB */}
          {activeTab === "invites" && (
            <div>
              {/* Create invite */}
              <div style={{ background:"#fff", border:"1px solid #e8e7e0", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a18", marginBottom:10 }}>Gerar novo link de convite</div>
                <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#5F5E5A", marginBottom:4 }}>Observação interna <span style={{ fontWeight:400, color:"#B4B2A9" }}>(opcional)</span></div>
                    <input value={inviteNote} onChange={e=>setInviteNote(e.target.value)} placeholder="Ex: Convite para Kleber testar com a Steel Prime" style={{ width:"100%", border:"1px solid #e8e7e0", borderRadius:8, padding:"8px 10px", fontSize:12, fontFamily:"inherit", outline:"none" }}/>
                  </div>
                  <button onClick={createInvite} style={{ background:"#1a1a18", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>Gerar link →</button>
                </div>
              </div>

              {/* Invites list */}
              <div style={{ background:"#fff", border:"1px solid #e8e7e0", borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:"1px solid #e8e7e0", fontSize:13, fontWeight:600, color:"#1a1a18" }}>Links gerados</div>
                {invites.length === 0 ? (
                  <div style={{ padding:24, textAlign:"center", color:"#888780", fontSize:12 }}>Nenhum link gerado ainda. Crie um acima.</div>
                ) : (
                  <div>
                    {invites.map((inv,i) => (
                      <div key={inv.token} style={{ padding:"12px 16px", borderBottom:i<invites.length-1?"1px solid #f1efe8":"none", display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:"#1a1a18", fontFamily:"monospace", letterSpacing:2 }}>{inv.token}</span>
                            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:20, background:inv.active?"#f0fdf4":"#f1efe8", color:inv.active?"#006b18":"#888780", border:`1px solid ${inv.active?"#00b828":"#D3D1C7"}`, fontWeight:600 }}>
                              {inv.active ? "ativo" : "usado"}
                            </span>
                          </div>
                          <div style={{ fontSize:10, color:"#888780", marginBottom:2 }}>
                            {inv.note || "Sem observação"} · Criado em {fmt(inv.createdAt)}
                          </div>
                          {inv.usedBy && <div style={{ fontSize:10, color:"#888780" }}>Usado em {fmt(inv.usedAt)}</div>}
                          <div style={{ fontSize:11, color:"#185FA5", marginTop:3, wordBreak:"break-all" }}>{inv.link}</div>
                        </div>
                        <button onClick={()=>copy(inv.link, inv.token)} style={{ fontSize:11, border:"1px solid #D3D1C7", background:copiedToken===inv.token?"#f0fdf4":"#fff", borderRadius:7, padding:"5px 10px", cursor:"pointer", color:copiedToken===inv.token?"#006b18":"#5F5E5A", whiteSpace:"nowrap", fontWeight:copiedToken===inv.token?600:400 }}>
                          {copiedToken===inv.token ? "Copiado ✓" : "Copiar link"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign:"center", marginTop:20, fontSize:10, color:"#B4B2A9" }}>
            Queen OS Admin · MVP · Dados armazenados em memória (reiniciam com o servidor)
          </div>
        </div>
      </div>
    </>
  );
}

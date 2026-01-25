"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PLAYERS_DB } from './players';

// --- CONFIGURACIÓN Y CONSTANTES ---
const VALID_TACTICS = ["1-5-3-2", "1-4-4-2", "1-4-5-1", "1-4-3-3", "1-3-4-3", "1-3-5-2"];
const GROUPS = {
  "GRUPO A": ["Alemania", "Escocia", "Hungría", "Suiza"],
  "GRUPO B": ["España", "Croacia", "Italia", "Albania"],
  "GRUPO C": ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"],
  "GRUPO D": ["Polonia", "Países Bajos", "Austria", "Francia"],
  "GRUPO E": ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"],
  "GRUPO F": ["Turquía", "Georgia", "Portugal", "República Checa"]
};
const POS_COLORS = { POR: '#fbbf24', DEF: '#3b82f6', MED: '#10b981', DEL: '#ef4444' };
const REWARDS_LEFT = [ { a: 12, r: "25 M", c: "#ea580c" }, { a: 11, r: "20 M", c: "#f59e0b" }, { a: 10, r: "15 M", c: "#eab308" }, { a: 9, r: "12 M", c: "#84cc16" } ];
const REWARDS_RIGHT = [ { a: 8, r: "10 M", c: "#10b981" }, { a: 7, r: "8 M", c: "#06b6d4" }, { a: 6, r: "6 M", c: "#3b82f6" }, { a: 5, r: "5 M", c: "#6b7280" } ];

export default function EuroFantasyApp() {
  const [screen, setScreen] = useState("field");
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [sortOrder, setSortOrder] = useState('team');
  const [marketPosFilter, setMarketPosFilter] = useState('ALL');
  const [quiniela, setQuiniela] = useState({});
  const [displayedText, setDisplayedText] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // --- LÓGICA DE DATOS ---
  const budget = 300;
  const playersInTeam = Object.values(selectedPlayers);
  const spent = playersInTeam.reduce((acc, p) => acc + (p.precio || 0), 0);
  const teamCounts = useMemo(() => playersInTeam.reduce((acc, p) => { acc[p.equipo] = (acc[p.equipo] || 0) + 1; return acc; }, {}), [selectedPlayers]);

  const startersKeys = Object.keys(selectedPlayers).filter(k => !k.startsWith("SUP") && !k.startsWith("NC"));
  const startersCount = startersKeys.length;
  const subsCount = Object.keys(selectedPlayers).filter(k => k.startsWith("SUP")).length;
  const ncCount = Object.keys(selectedPlayers).filter(k => k.startsWith("NC")).length;

  const tacticCounts = useMemo(() => {
    const c = { DEF: 0, MED: 0, DEL: 0 };
    startersKeys.forEach(key => {
      const role = key.split('-')[0];
      if (c[role] !== undefined) c[role]++;
    });
    return c;
  }, [startersKeys, selectedPlayers]);

  const currentTactic = `1-${tacticCounts.DEF}-${tacticCounts.MED}-${tacticCounts.DEL}`;
  const isTacticValid = VALID_TACTICS.includes(currentTactic);

  const phase = useMemo(() => {
    if (!teamName) return 'name';
    if (startersCount < 11) return 'starters';
    if (!captainId) return 'captain';
    if (subsCount < 6) return 'subs';
    if (ncCount < 3) return 'nc';
    if (!isTacticValid) return 'invalid';
    return 'complete';
  }, [teamName, startersCount, subsCount, ncCount, isTacticValid, captainId]);

  const assistantMsg = useMemo(() => {
    if (phase === 'name') return "Bienvenido a la Eurocopa Fantástica 2024, voy a guiarte paso a paso a crear tu equipo para que puedas participar en este emocionante juego. Para empezar dale un nombre a tu equipo arriba.";
    if (phase === 'starters') return `Perfecto, ${teamName}, ahora ficha a tus 11 titulares. Recuerda: máximo 300M, límite de 7 por selección y usa una táctica válida.`;
    if (phase === 'captain') return "Ahora escoge a tu capitán marcando la tecla C en la esquina superior derecha de uno de tus 11 jugadores iniciales.";
    if (phase === 'subs') return "Excelente. Ahora escoge a tus 6 suplentes, recuerda que estos se intercambiarán automáticamente por los titulares en el caso de que estos no jueguen.";
    if (phase === 'nc') return "Y por último escoge a tus no convocados, recuerda que pueden ser entre 0 y 3 jugadores.";
    if (phase === 'invalid') return `Atención: la formación ${currentTactic} no es válida. Las permitidas son: ${VALID_TACTICS.join(", ")}.`;
    return "¡Enhorabuena! Ya tienes tu equipo para la Eurocopa 2024. Ahora pincha abajo y vamos a rellenar la Euroquiniela.";
  }, [phase, teamName, currentTactic]);

  useEffect(() => {
    if (assistantMsg !== lastMessage) {
      setLastMessage(assistantMsg); setDisplayedText(""); let i = 0; setIsTyping(true);
      const interval = setInterval(() => {
        setDisplayedText(assistantMsg.slice(0, i + 1)); i++;
        if (i >= assistantMsg.length) { clearInterval(interval); setIsTyping(false); }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [assistantMsg]);

  const handleSlotClick = (slot) => {
    if (!teamName) { alert("Ponle un nombre a tu equipo antes."); return; }
    setActiveSlot(slot);
  };

  const selectPlayer = (player) => {
    const current = selectedPlayers[activeSlot.id];
    if ((teamCounts[player.equipo] || 0) >= 7 && current?.equipo !== player.equipo) {
      alert(`Límite alcanzado: Máximo 7 de ${player.equipo}.`); return;
    }
    if (spent - (current?.precio || 0) + player.precio > budget) { alert("¡Sin presupuesto!"); return; }
    setSelectedPlayers(prev => ({ ...prev, [activeSlot.id]: player }));
    setActiveSlot(null); setMarketPosFilter('ALL');
  };

  const sortedList = useMemo(() => {
    const sIds = playersInTeam.map(p => p.id);
    let list = PLAYERS_DB.filter(p => {
      const posMatch = (activeSlot?.role === 'CUALQUIERA') ? (marketPosFilter === 'ALL' || p.posicion === marketPosFilter) : (p.posicion === activeSlot?.role);
      return posMatch && !sIds.includes(p.id);
    });
    if (sortOrder === 'price-asc') list.sort((a,b) => a.precio - b.precio);
    else if (sortOrder === 'price-desc') list.sort((a,b) => b.precio - a.precio);
    else if (sortOrder === 'name-az') list.sort((a,b) => a.nombre.localeCompare(b.nombre));
    else list.sort((a,b) => a.equipo.localeCompare(b.equipo) || a.nombre.localeCompare(b.nombre));
    return list;
  }, [activeSlot, sortOrder, selectedPlayers, marketPosFilter]);

  const toggleQuiniela = (g, t) => {
    const curr = quiniela[g] || [];
    if (curr.includes(t)) setQuiniela({...quiniela, [g]: curr.filter(x => x !== t)});
    else if (curr.length < 2) setQuiniela({...quiniela, [g]: [...curr, t]});
  };

  const isQuinielaComplete = Object.keys(GROUPS).every(group => quiniela[group]?.length === 2);

  // --- COMPONENTES AUXILIARES ---
  const SofaCell = ({ title, text, bg }) => (
    <div style={{ backgroundColor: bg, padding: '10px', borderRadius: '12px', textAlign: 'center', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>
      <p style={{ fontSize: '9px', fontWeight: '900', color: '#fff', marginBottom:'5px' }}>{title}</p>
      {text.split('\n').map((line, idx) => (
        <p key={idx} style={{ fontSize: '10px', margin: 0, opacity: 0.9, fontWeight:'500' }}>{line}</p>
      ))}
    </div>
  );

  return (
    <div style={{ backgroundColor: '#05080f', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* PANTALLA REGLAS */}
        {screen === "rules" && (
          <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <button onClick={() => setScreen("field")} style={{ background: '#10b981', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px', cursor:'pointer' }}>⬅ VOLVER AL JUEGO</button>
            <div style={{ position: 'relative', borderRadius: '25px', overflow: 'hidden', height: '240px', marginBottom: '25px' }}>
              <img src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Estadio Espectacular" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, #05080f)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Eurocopa Fantástica 2024</h1>
              </div>
            </div>

            <p style={{fontStyle:'italic', fontSize:'13px', opacity:0.8, marginBottom:'20px', lineHeight:'1.5'}}>
              <strong>Objetivo del juego:</strong> ¡Hacer morder el polvo a nuestros amigos demostrando que sabemos más de fútbol que Xavi de poner excusas! La satisfacción personal por saber que eres el más mejor del universo en esto del fútbol y que el resto de los participantes son un atajo de patanes y recibir las alabanzas de cada uno de ellos.
            </p>

            <RuleBox title="1. PLANTILLA INICIAL" color="#10b981">La plantilla se compondrá de 11 titulares, 6 suplentes y el resto se quedarán sin convocar. Los suplentes entrarán en juego si alguno de los 11 titulares no juega el partido (orden S1-S6). <br/><br/><strong>Capitán:</strong> Puntos valen el DOBLE (también negativos). <br/><br/><strong>Límite:</strong> Cada lugar vacío resta -1 punto por jornada.</RuleBox>
            <RuleBox title="2. ESQUEMA DE JUEGO" color="#3b82f6">Válidos: 1-5-3-2, 1-4-4-2, 1-4-5-1, 1-4-3-3, 1-3-4-3 y 1-3-5-2.</RuleBox>
            <RuleBox title="3. MERCADO DE FICHAJES" color="#ec4899">Entre jornada 3 y octavos podrás cambiar hasta 7 jugadores. El límite por selección sube a 8.</RuleBox>

            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px', marginBottom: '15px' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '18px', marginTop: 0 }}>4. PUNTUACIONES COMPLETAS</h2>
              <div style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                <span style={{gridColumn:'1/-1', fontWeight:'bold', borderBottom:'1px solid #334155', color:'#94a3b8'}}>GOLES Y ASISTENCIAS</span>
                <span>Gol marcado</span><strong>+5</strong> | <span>Gol en propia meta</span><strong style={{color:'#ef4444'}}>-1</strong> | <span>Asistencia</span><strong>+1</strong>
                <span style={{gridColumn:'1/-1', fontWeight:'bold', borderBottom:'1px solid #334155', color:'#94a3b8', marginTop:'5px'}}>PORTERO Y DEFENSA</span>
                <span>POR Imbatido (min 60')</span><strong>+4</strong> | <span>DEF Imbatido (min 45')</span><strong>+2</strong>
                <span>Goles encajados POR: 0 | 2 | 3...</span><strong>0 | -2 | -3...</strong>
                <span style={{gridColumn:'1/-1', fontWeight:'bold', borderBottom:'1px solid #334155', color:'#94a3b8', marginTop:'5px'}}>RESULTADO Y DISCIPLINA</span>
                <span>Victoria | Derrota | Jugado</span><strong>+1 | -1 | +1</strong>
                <span>Roja directa | Doble Amarilla</span><strong>-5 | -3</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #fbbf24', marginBottom: '15px' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '18px', marginTop: 0 }}>5. VALORACIONES SOFASCORE</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                <SofaCell title="EXCELENTE" text={"9.5 - 10: +14\n9.0 - 9.4: +13"} bg="#14532d" />
                <SofaCell title="MUY BUENO" text={"8.6 - 8.9: +12\n8.2 - 8.5: +11\n8.0 - 8.1: +10"} bg="#166534" />
                <SofaCell title="BUENO" text={"7.8 - 7.9: +9\n7.6 - 7.7: +8\n7.4 - 7.5: +7\n7.2 - 7.3: +6\n7.0 - 7.1: +5"} bg="#15803d" />
                <SofaCell title="MEDIO" text={"6.8 - 6.9: +4\n6.6 - 6.7: +3\n6.4 - 6.5: +2\n6.2 - 6.3: +1\n6.0 - 6.1: 0"} bg="#4b5563" />
                <SofaCell title="MALO" text={"5.8 - 5.9: -1\n5.6 - 5.7: -2\n5.4 - 5.5: -3\n5.2 - 5.3: -4"} bg="#92400e" />
                <SofaCell title="MUY MALO" text={"5.0 - 5.1: -5\n0.0 - 4.9: -6"} bg="#7c2d12" />
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px', marginBottom: '15px' }}>
              <h2 style={{ color: '#10b981', fontSize: '18px', marginTop: 0 }}>6. EUROQUINIELA</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>{REWARDS_LEFT.map(r => <div key={r.a} style={{display:'flex', justifyContent:'space-between', padding:'6px 10px', background:r.c, borderRadius:'5px', marginBottom:'3px', fontSize:'11px', color:(r.a>=9?'#000':'#fff'), fontWeight:'bold'}}><span>{r.a} aciertos</span><span>{r.r}</span></div>)}</div>
                <div>{REWARDS_RIGHT.map(r => <div key={r.a} style={{display:'flex', justifyContent:'space-between', padding:'6px 10px', background:r.c, borderRadius:'5px', marginBottom:'3px', fontSize:'11px', color:'#fff', fontWeight:'bold'}}><span>{r.a} aciertos</span><span>{r.r}</span></div>)}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#fbbf24', color: '#000', padding: '20px', borderRadius: '25px', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', marginTop: 0 }}>7. PREMIO</h2>
              <p style={{fontSize:'12px', fontWeight:'bold'}}>Prestigio eterno y satisfacción personal.</p>
              <p style={{fontSize:'12px'}}>OPCIONAL: Apuesta de 5€. Reparto: 🥇 1º (60%), 🥈 2º (30%), 🥉 3º (10%).</p>
            </div>
          </div>
        )}

        {/* --- PANTALLA CAMPO --- */}
        {screen === "field" && (
          <>
            <button onClick={() => setScreen("rules")} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #fbbf24', color: '#fbbf24', padding: '8px 15px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', display:'flex', alignItems:'center', gap:'8px' }}>
              ⚽ CONSULTA LAS REGLAS
            </button>

            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '20px', border: phase === 'name' ? '3px solid #fff' : '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', transition:'0.3s' }}>
              <div style={{width:'60%'}}><input placeholder="PON EL NOMBRE AQUÍ" value={teamName} onChange={(e) => setTeamName(e.target.value)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '18px', fontWeight: '900', outline: 'none', width: '100%' }} />
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: (startersCount === 11 && !isTacticValid) ? '#ef4444' : '#94a3b8' }}>TÁCTICA: {startersCount === 11 ? currentTactic : `${startersCount}/11 TITULARES`}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: spent > budget ? '#ef4444' : '#10b981' }}>{(budget - spent).toFixed(1)}M</div></div>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#064e3b', borderRadius: '30px 30px 0 0', border: (phase === 'starters' || phase === 'captain' || phase === 'invalid') ? '4px solid #fff' : '6px solid #1e293b', borderBottom: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '25px 0 25px 50px', overflow: 'hidden', transition:'0.3s' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%) translateY(50%)', width: '25%', aspectRatio: '1/1', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%', clipPath: 'inset(0 0 50% 0)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '64%', height: '18%', border: '2px solid rgba(255,255,255,0.1)', borderBottom: 0 }}></div>
              
              <RowWithMarker label="DEL" c={POS_COLORS.DEL} count={3} r="DEL" onSlotClick={handleSlotClick} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} phase={phase} startersCount={startersCount} />
              <RowWithMarker label="MED" c={POS_COLORS.MED} count={5} r="MED" onSlotClick={handleSlotClick} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} phase={phase} startersCount={startersCount} />
              <RowWithMarker label="DEF" c={POS_COLORS.DEF} count={5} r="DEF" onSlotClick={handleSlotClick} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} phase={phase} startersCount={startersCount} />
              <RowWithMarker label="POR" c={POS_COLORS.POR} count={1} r="POR" onSlotClick={handleSlotClick} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} phase={phase} startersCount={startersCount} />
            </div>

            <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '0 0 25px 25px', border: phase === 'subs' ? '4px solid #fff' : '6px solid #1e293b', borderTop: 'none', transition:'0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1,2,3,4,5,6].map(i => <BenchSlot key={i} id={`SUP-${i}`} label={`S${i}`} onSlotClick={handleSlotClick} selected={selectedPlayers} isBench={true} startersCount={startersCount} phase={phase} />)}
              </div>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '12px', padding: '10px', borderRadius: '15px', border: phase === 'nc' ? '2px solid #fff' : 'none', transition:'0.3s' }}>
              {[1,2,3].map(i => <BenchSlot key={i} id={`NC-${i}`} label="NC" onSlotClick={handleSlotClick} selected={selectedPlayers} isBench={false} startersCount={startersCount} phase={phase} />)}
            </div>

            <div style={{ marginTop: '15px', backgroundColor: '#1e293b', padding: '15px', borderRadius: '20px', borderLeft: '5px solid #10b981', minHeight: '85px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', display: 'block', marginBottom: '5px' }}>ASISTENTE FANTÁSTICO</span>
              <p style={{ fontSize: '13px', lineHeight: '1.4', margin: 0 }}>{displayedText}{isTyping && " |"}</p>
              {phase === 'complete' && <button onClick={() => setScreen("quiniela")} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#05080f', border: 'none', borderRadius: '12px', fontWeight: '900', marginTop: '15px', cursor: 'pointer' }}>RELLENAR QUINIELA ➜</button>}
            </div>

            {activeSlot && (
              <div style={{ marginTop: '15px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '25px', border: '2px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}>FICHANDO {activeSlot.role}</span><span onClick={() => setActiveSlot(null)} style={{ cursor: 'pointer', padding: '5px' }}>✕</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                  <button onClick={() => setSortOrder('team')} style={{ background: sortOrder==='team'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='team'?'#000':'#fff' }}>Selección</button>
                  <button onClick={() => setSortOrder('price-desc')} style={{ background: sortOrder==='price-desc'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='price-desc'?'#000':'#fff' }}>€ Máx</button>
                  <button onClick={() => setSortOrder('price-asc')} style={{ background: sortOrder==='price-asc'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='price-asc'?'#000':'#fff' }}>€ Mín</button>
                  <button onClick={() => setSortOrder('name-az')} style={{ background: sortOrder==='name-az'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='name-az'?'#000':'#fff' }}>A-Z</button>
                </div>
                {activeSlot.role === 'CUALQUIERA' && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                    {['ALL', 'POR', 'DEF', 'MED', 'DEL'].map(pos => <button key={pos} onClick={() => setMarketPosFilter(pos)} style={{ flex:1, border:'none', background: marketPosFilter===pos?'#3b82f6':'#1e293b', color:'#fff', borderRadius:'4px', fontSize:'9px', padding:'4px 0' }}>{pos}</button>)}
                  </div>
                )}
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {sortedList.map(p => <div key={p.id} onClick={() => selectPlayer(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '6px', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src={`https://flagcdn.com/w40/${p.iso}.png`} style={{ width: '20px' }} /><span style={{ fontSize: '13px' }}>{p.nombre} <small style={{opacity:0.6}}>{p.equipo} ({teamCounts[p.equipo] || 0}/7)</small></span></div><span style={{ color: '#10b981', fontWeight: 'bold' }}>{p.precio}M</span></div>)}
                </div>
              </div>
            )}
          </>
        )}

        {screen === "quiniela" && (
          <div style={{ animation: 'slideIn 0.3s ease-out', paddingBottom: '40px' }}>
            <button onClick={() => setScreen("field")} style={{ background: '#10b981', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '20px' }}>⬅ VOLVER</button>
            <h2 style={{ textAlign: 'center', color: '#10b981', fontSize: '24px', fontWeight: '900' }}>EUROQUINIELA</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Object.entries(GROUPS).map(([g, teams]) => (
                <div key={g} style={{ background: 'rgba(30,41,59,0.5)', padding: '12px', borderRadius: '15px' }}><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{g}</p>{teams.map(t => <button key={t} onClick={() => toggleQuiniela(g, t)} style={{ width: '100%', padding: '8px', margin: '3px 0', border: 'none', borderRadius: '8px', fontSize: '11px', background: quiniela[g]?.includes(t) ? '#10b981' : 'rgba(255,255,255,0.05)', color: quiniela[g]?.includes(t) ? '#000' : '#fff' }}>{t} {quiniela[g]?.includes(t) && '✓'}</button>)}</div>
              ))}
            </div>
            {isQuinielaComplete && <div style={{ marginTop: '20px', backgroundColor: '#064e3b', padding: '25px', borderRadius: '25px', textAlign: 'center', border: '2px solid #10b981' }}><p style={{ fontWeight: '900', fontSize: '18px' }}>🏆 ¡TODO LISTO!</p><p style={{ fontSize: '12px' }}>Haz una captura de tu equipo y otra de la quiniela y envíaselas a Niebloska por WhatsApp. ¡Suerte!</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

// --- AYUDANTES ---
function RowWithMarker({ label, c, count, r, onSlotClick, selected, captainId, setCaptainId, phase, startersCount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '-45px', backgroundColor: c, color: (c==='#ffffff' || c==='#fbbf24')?'#000':'#fff', height: '44px', width: '38px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', display:'flex', alignItems:'center', justifyContent:'center' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {Array.from({ length: count }).map((_, i) => {
          const id = `${r}-${i}`; const p = selected[id]; const isCap = captainId === id; const startersReady = startersCount === 11; const showCap = startersReady && p && (phase === 'captain' || captainId);
          return (
            <div key={id} style={{ textAlign: 'center', position: 'relative' }}>
              {(showCap || (p && isCap)) && <div onClick={(e) => { e.stopPropagation(); if(startersReady) setCaptainId(id); }} style={{ position: 'absolute', top: '-8px', right: '-8px', zIndex: 30, backgroundColor: isCap?'#fbbf24':'#1e293b', color: isCap?'#000':'#fff', width: '22px', height: '22px', borderRadius: '50%', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', cursor: startersReady ? 'pointer' : 'default', animation: (phase === 'captain' && !isCap) ? 'pulse 1s infinite' : 'none' }}>C</div>}
              <div onClick={() => onSlotClick({ id, role: r })} style={{ width: '44px', height: '44px', backgroundColor: p ? '#fff' : 'rgba(0,0,0,0.5)', borderRadius: '12px', border: p ? '2px solid #fff' : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>{p ? <span style={{ color: '#064e3b', fontSize: '6px', fontWeight: '900', textTransform: 'uppercase', textAlign:'center' }}>{p.nombre.split(' ').pop()}</span> : <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '16px' }}>+</span>}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RuleBox({ title, children, color }) {
  return (<div style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '20px', marginBottom: '15px', borderLeft: `6px solid ${color}` }}><h2 style={{ color, fontSize: '16px', marginTop: 0 }}>{title}</h2><p style={{ fontSize: '13px', lineHeight: '1.5', opacity: 0.9 }}>{children}</p></div>);
}

function BenchSlot({ id, label, onSlotClick, selected, isBench, startersCount, phase }) {
  const p = selected[id];
  const handleClick = () => { 
    if(startersCount < 11) { alert("Primero completa el 11 titular."); return; } 
    if(phase === 'captain') { alert("Primero elige a tu capitán."); return; }
    onSlotClick({id, role:'CUALQUIERA'}); 
  };
  return (<div onClick={handleClick} style={{ textAlign: 'center', cursor: 'pointer' }}><div style={{ width: '40px', height: '40px', backgroundColor: p ? '#fff' : 'rgba(255,255,255,0.05)', borderRadius: isBench ? '10px 10px 4px 4px' : '8px', border: p ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p ? <span style={{ color: '#064e3b', fontSize: '6px', fontWeight: '900', textTransform: 'uppercase' }}>{p.nombre.split(' ').pop().slice(0,5)}</span> : <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight:'900' }}>{label}</span>}</div>{p && <div style={{ marginTop: '2px', fontSize: '7px', fontWeight: 'bold', backgroundColor: POS_COLORS[p.posicion] || '#334155', color: (p.posicion === 'DEF' || p.posicion === 'POR') ? '#000' : '#fff', borderRadius: '2px', padding: '1px' }}>{p.posicion}</div>}</div>);
}
// FIN DEL CÓDIGO
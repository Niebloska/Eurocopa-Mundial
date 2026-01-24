"use client";

import React, { useState, useMemo } from 'react';
import { PLAYERS_DB } from './players';

const VALID_TACTICS = ["1-5-3-2", "1-4-4-2", "1-4-5-1", "1-4-3-3", "1-3-4-3", "1-3-5-2"];

const GROUPS = {
  "GRUPO A": ["Alemania", "Escocia", "Hungría", "Suiza"],
  "GRUPO B": ["España", "Croacia", "Italia", "Albania"],
  "GRUPO C": ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"],
  "GRUPO D": ["Polonia", "Países Bajos", "Austria", "Francia"],
  "GRUPO E": ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"],
  "GRUPO F": ["Turquía", "Georgia", "Portugal", "República Checa"]
};

export default function Page() {
  const [screen, setScreen] = useState("field"); // "field", "quiniela", "rules"
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [sortOrder, setSortOrder] = useState('team');
  const [quiniela, setQuiniela] = useState({});

  const budget = 300;
  const playersInTeam = Object.values(selectedPlayers);
  const spent = playersInTeam.reduce((acc, p) => acc + (p.precio || 0), 0);

  // --- LÓGICA DE TÁCTICA ---
  const counts = useMemo(() => {
    const c = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
    Object.keys(selectedPlayers).forEach(key => {
      const role = key.split('-')[0];
      c[role]++;
    });
    return c;
  }, [selectedPlayers]);

  const currentTactic = `1-${counts.DEF}-${counts.MED}-${counts.DEL}`;
  const isTacticValid = VALID_TACTICS.includes(currentTactic);
  const totalPlayers = playersInTeam.length;
  const isTeamComplete = totalPlayers === 11 && isTacticValid && captainId;
  const isQuinielaComplete = Object.keys(GROUPS).every(group => quiniela[group]?.length === 2);

  const getAssistantMessage = () => {
    if (!teamName) return "¡Hola! Empieza por darle un nombre a tu equipo arriba.";
    if (totalPlayers < 11) return `Vas bien, ${teamName}. Llevas ${totalPlayers}/11 jugadores. Toca un (+) para fichar.`;
    if (!isTacticValid) return <span>Alineación <strong style={{color: '#ef4444'}}>{currentTactic}</strong> no válida. Consulta las reglas para ver las permitidas.</span>;
    if (!captainId) return "¡Equipo listo! Recuerda elegir capitán marcando la tecla C en el jugador escogido.";
    return "¡Perfecto! Todo correcto. Ahora vamos a la Euroquiniela.";
  };

  const selectPlayer = (player) => {
    if (!activeSlot) return;
    const teamCount = playersInTeam.filter(p => p.equipo === player.equipo).length;
    const isReplacingSameTeam = selectedPlayers[activeSlot.id]?.equipo === player.equipo;
    if (teamCount >= 7 && !isReplacingSameTeam) {
      alert(`Límite de 7 jugadores de ${player.equipo} alcanzado.`); return;
    }
    const slotPrice = selectedPlayers[activeSlot.id]?.precio || 0;
    if (spent - slotPrice + player.precio > budget) {
      alert("¡Sin presupuesto!"); return;
    }
    setSelectedPlayers(prev => ({ ...prev, [activeSlot.id]: player }));
    setActiveSlot(null);
  };

  return (
    <div style={{ backgroundColor: '#05080f', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* PANTALLA REGLAS */}
        {screen === "rules" && (
          <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <button onClick={() => setScreen("field")} style={{ background: '#10b981', border: 'none', color: '#05080f', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer' }}>⬅ VOLVER AL JUEGO</button>
            
            <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=600" style={{ width: '100%', borderRadius: '20px', marginBottom: '20px' }} alt="Estadio" />
            
            <h1 style={{ color: '#10b981', fontSize: '28px', fontWeight: '900', textAlign: 'center', marginBottom: '10px' }}>REGLAMENTO 2024</h1>
            
            <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '18px', marginTop: 0 }}>1. Plantilla y Presupuesto</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>
                Dispones de <strong>300 Millones</strong> para fichar. Tu equipo debe tener entre 17 y 20 jugadores totales. 
                En el campo solo pueden jugar 11. <br/><br/>
                <strong>Límite por selección:</strong> Máximo 7 jugadores del mismo país en la 1ª fase (8 en eliminatorias).
              </p>
            </section>

            <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '18px', marginTop: 0 }}>2. Puntuaciones</h2>
              <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <span>Gol marcado (cualquier jugador)</span><strong style={{color:'#10b981'}}>+5</strong>
                <span>Asistencia</span><strong style={{color:'#10b981'}}>+1</strong>
                <span>Portería a cero (Portero)</span><strong style={{color:'#10b981'}}>+4</strong>
                <span>Portería a cero (Defensa)</span><strong style={{color:'#10b981'}}>+2</strong>
                <span>Penalti parado</span><strong style={{color:'#10b981'}}>+3</strong>
                <span>Tarjeta Roja directa</span><strong style={{color:'#ef4444'}}>-5</strong>
                <span>Gol en propia meta</span><strong style={{color:'#ef4444'}}>-1</strong>
              </div>
            </section>

            <section style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '20px', border: '2px solid #fbbf24', marginBottom: '20px' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '18px', textAlign: 'center', marginTop: 0 }}>Equivalencias SofaScore</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px' }}>VALORACIÓN</th>
                    <th style={{ padding: '10px' }}>PUNTOS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: 'rgba(16,185,129,0.2)' }}><td>9.5 – 10</td><td><strong>+14</strong></td></tr>
                  <tr style={{ background: 'rgba(16,185,129,0.1)' }}><td>9.0 – 9.4</td><td><strong>+13</strong></td></tr>
                  <tr><td>8.0 – 8.1</td><td><strong>+10</strong></td></tr>
                  <tr><td>7.0 – 7.1</td><td><strong>+5</strong></td></tr>
                  <tr style={{ background: 'rgba(239,68,68,0.1)' }}><td>5.0 – 5.1</td><td><strong>-5</strong></td></tr>
                  <tr style={{ background: 'rgba(239,68,68,0.2)' }}><td>0 – 4.9</td><td><strong>-6</strong></td></tr>
                </tbody>
              </table>
            </section>

            <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600" style={{ width: '100%', borderRadius: '20px', marginBottom: '20px', opacity: 0.6 }} alt="Balón" />
          </div>
        )}

        {/* PANTALLA CAMPO */}
        {screen === "field" && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <button onClick={() => setScreen("rules")} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #fbbf24', color: '#fbbf24', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>📖 CONSULTA LAS REGLAS</button>
            </div>

            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '20px', border: teamName === "" ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ width: '60%' }}>
                <input placeholder="NOMBRE DEL EQUIPO" value={teamName} onChange={(e) => setTeamName(e.target.value)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '18px', fontWeight: '900', outline: 'none', width: '100%' }} />
                <div style={{ marginTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>TÁCTICA: {isTacticValid ? currentTactic : '---'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: spent > budget ? '#ef4444' : '#10b981' }}>{(budget - spent).toFixed(1)}M</div>
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#064e3b', borderRadius: '30px', border: '6px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '25px 0', overflow: 'visible' }}>
              <div style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%) translateY(50%)', width: '25%', aspectRatio: '1 / 1', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%', clipPath: 'inset(0 0 50% 0)' }}></div>
              <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '64%', height: '18%', border: '2px solid rgba(255,255,255,0.1)', borderBottom: '0' }}></div>
              <Row role="DEL" count={3} onSlotClick={setActiveSlot} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} />
              <Row role="MED" count={5} onSlotClick={setActiveSlot} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} />
              <Row role="DEF" count={5} onSlotClick={setActiveSlot} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} />
              <div style={{ zIndex: 10 }}><Row role="POR" count={1} onSlotClick={setActiveSlot} selected={selectedPlayers} captainId={captainId} setCaptainId={setCaptainId} /></div>
            </div>

            <div style={{ marginTop: '15px', backgroundColor: '#1e293b', padding: '15px', borderRadius: '20px', borderLeft: '5px solid #10b981' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', display: 'block', marginBottom: '5px' }}>ASISTENTE</span>
              <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: isTeamComplete ? '10px' : '0' }}>{getAssistantMessage()}</p>
              {isTeamComplete && (
                <button onClick={() => setScreen("quiniela")} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#05080f', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>IR A LA EUROQUINIELA ➜</button>
              )}
            </div>

            {activeSlot && (
              <div style={{ marginTop: '15px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '20px', border: '2px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}>FICHANDO {activeSlot.role}</span>
                  <span onClick={() => setActiveSlot(null)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>✕</span>
                </div>
                {selectedPlayers[activeSlot.id] && <button onClick={() => {const n={...selectedPlayers}; delete n[activeSlot.id]; if(captainId===activeSlot.id)setCaptainId(null); setSelectedPlayers(n); setActiveSlot(null);}} style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>🗑️ VACIAR CASILLA</button>}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', overflowX: 'auto' }}>
                  <button onClick={() => setSortOrder('team')} style={{ backgroundColor: sortOrder==='team'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='team'?'#000':'#fff' }}>🌍 Selección</button>
                  <button onClick={() => setSortOrder('price-desc')} style={{ backgroundColor: sortOrder==='price-desc'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='price-desc'?'#000':'#fff' }}>€ Máx</button>
                  <button onClick={() => setSortOrder('name-az')} style={{ backgroundColor: sortOrder==='name-az'?'#10b981':'#1e293b', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', color:sortOrder==='name-az'?'#000':'#fff' }}>A-Z</button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {PLAYERS_DB.filter(p => (activeSlot ? p.posicion === activeSlot.role : true) && !Object.values(selectedPlayers).some(sp => sp.id === p.id)).sort((a,b) => sortOrder === 'price-desc' ? b.precio - a.precio : a.equipo.localeCompare(b.equipo)).map(p => (
                    <div key={p.id} onClick={() => selectPlayer(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '5px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={`https://flagcdn.com/w40/${p.iso}.png`} style={{ width: '18px' }} alt="f" />
                        <span style={{ fontSize: '13px' }}>{p.nombre} <small style={{color:'#64748b'}}>{p.equipo}</small></span>
                      </div>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{p.precio}M</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* PANTALLA QUINIELA */}
        {screen === "quiniela" && (
          <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setScreen("field")} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>⬅ VOLVER AL CAMPO</button>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', margin: 0 }}>EUROQUINIELA</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Object.entries(GROUPS).map(([groupName, teams]) => (
                <div key={groupName} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>{groupName}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {teams.map(team => {
                      const isSelected = quiniela[groupName]?.includes(team);
                      return (
                        <button key={team} onClick={() => toggleQuiniela(groupName, team)} style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', backgroundColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.05)', color: isSelected ? '#05080f' : 'white' }}>{team} {isSelected && '✓'}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {isQuinielaComplete && (
              <div style={{ marginTop: '20px', backgroundColor: '#064e3b', padding: '20px', borderRadius: '25px', textAlign: 'center', border: '2px solid #10b981' }}>
                <p style={{ fontSize: '16px', fontWeight: '900', marginBottom: '10px', color: '#fff' }}>🏆 ¡TODO LISTO!</p>
                <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>Enhorabuena, ya tienes tu equipo y tu quiniela. Ahora haz una captura de pantalla de ambas pantallas y enviáselas a Niebloska por WhatsApp. ¡Suerte!</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function Row({ role, count, onSlotClick, selected, captainId, setCaptainId }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
      {Array.from({ length: count }).map((_, i) => {
        const id = `${role}-${i}`;
        const player = selected[id];
        const isCaptain = captainId === id;
        return (
          <div key={id} style={{ textAlign: 'center', position: 'relative' }}>
            {player && (
              <div onClick={(e) => { e.stopPropagation(); setCaptainId(id); }} style={{ position: 'absolute', top: '-6px', right: '-6px', zIndex: 30, backgroundColor: isCaptain ? '#fbbf24' : '#1e293b', color: isCaptain ? '#000' : '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>C</div>
            )}
            <div onClick={() => onSlotClick({ id, role })} style={{ width: '45px', height: '45px', backgroundColor: player ? '#fff' : 'rgba(0,0,0,0.5)', borderRadius: '12px', border: player ? '2px solid #fff' : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {player ? <span style={{ color: '#064e3b', fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>{player.nombre.split(' ').pop()}</span> : <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '16px' }}>+</span>}
            </div>
            <div style={{ fontSize: '6px', marginTop: '3px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>{player ? `${player.precio}M` : role}</div>
          </div>
        );
      })}
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { PLAYERS_DB } from './players';

// --- CONFIGURACIÓN DE TÁCTICAS ---
const TACTICS = {
  "1-4-3-3": { DEF: 4, MED: 3, DEL: 3 },
  "1-4-4-2": { DEF: 4, MED: 4, DEL: 2 },
  "1-3-5-2": { DEF: 3, MED: 5, DEL: 2 },
};

export default function Page() {
  const [tactic, setTactic] = useState("1-4-3-3");
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [teamName, setTeamName] = useState("MI EQUIPO FANTÁSTICO");

  const budget = 300;
  // Calculamos el gasto sumando los precios de los jugadores seleccionados
  const spent = Object.values(selectedPlayers).reduce((acc, p) => acc + (p.precio || 0), 0);

  const selectPlayer = (player) => {
    if (activeSlot) {
      if (spent + player.precio > budget) { 
        alert("¡Atención! Te has quedado sin presupuesto."); 
        return; 
      }
      setSelectedPlayers(prev => ({ ...prev, [activeSlot.id]: player }));
      setActiveSlot(null);
    }
  };

  return (
    <div style={{ backgroundColor: '#05080f', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* CABECERA */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ width: '65%' }}>
            <input 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '18px', fontWeight: '900', outline: 'none', width: '100%' }}
            />
            <select 
              value={tactic} 
              onChange={(e) => {setTactic(e.target.value); setSelectedPlayers({});}}
              style={{ background: '#1e293b', color: 'white', fontSize: '10px', border: 'none', borderRadius: '5px', marginTop: '5px', padding: '2px 5px' }}
            >
              {Object.keys(TACTICS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>PRESUPUESTO</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{(budget - spent).toFixed(1)}M</div>
          </div>
        </div>

        {/* EL CAMPO */}
        <div style={{ 
          position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#064e3b', borderRadius: '30px', border: '6px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px 0', overflow: 'hidden'
        }}>
          {/* Líneas del campo */}
          <div style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%) translateY(50%)', width: '25%', aspectRatio: '1 / 1', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', clipPath: 'inset(0 0 50% 0)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '64%', height: '18%', border: '2px solid rgba(255,255,255,0.2)', borderBottom: '0', zIndex: 2 }}></div>
          <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '32%', height: '7%', border: '2px solid rgba(255,255,255,0.2)', borderBottom: '0', backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 2 }}></div>
          <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

          <Row role="DEL" count={TACTICS[tactic].DEL} onSlotClick={setActiveSlot} selected={selectedPlayers} />
          <Row role="MED" count={TACTICS[tactic].MED} onSlotClick={setActiveSlot} selected={selectedPlayers} />
          <Row role="DEF" count={TACTICS[tactic].DEF} onSlotClick={setActiveSlot} selected={selectedPlayers} />
          <div style={{ marginBottom: '2px', zIndex: 10 }}>
            <Row role="POR" count={1} onSlotClick={setActiveSlot} selected={selectedPlayers} />
          </div>
        </div>

        {/* MERCADO */}
        {activeSlot && (
          <div style={{ marginTop: '20px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '20px', border: '2px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>MERCADO: {activeSlot.role}</span>
              <span onClick={() => setActiveSlot(null)} style={{ cursor: 'pointer', color: '#64748b', fontSize: '11px' }}>✕ CERRAR</span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {PLAYERS_DB.filter(p => p.posicion === activeSlot.role).map(p => (
                <div key={p.id} onClick={() => selectPlayer(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '5px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={`https://flagcdn.com/w40/${p.iso}.png`} style={{ width: '18px', borderRadius: '2px' }} alt="flag" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.nombre} <span style={{fontSize: '9px', color: '#64748b'}}>{p.equipo}</span></span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>{p.precio}M</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ role, count, onSlotClick, selected }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', zIndex: 10 }}>
      {Array.from({ length: count }).map((_, i) => {
        const id = `${role}-${i}`;
        const player = selected[id];
        return (
          <div key={id} onClick={() => onSlotClick({ id, role })} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ 
              width: '52px', height: '52px', backgroundColor: player ? '#fff' : 'rgba(0,0,0,0.5)', borderRadius: '14px', border: player ? '2px solid #fff' : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {player ? (
                <span style={{ color: '#064e3b', fontSize: '8px', fontStyle: 'italic', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>{player.nombre}</span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '18px' }}>+</span>
              )}
            </div>
            <div style={{ fontSize: '7px', marginTop: '4px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>{player ? `${player.precio}M` : role}</div>
          </div>
        );
      })}
    </div>
  );
}
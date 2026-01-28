"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Ticket, ChevronLeft, LockOpen, Timer, Search, ArrowUpDown, Check } from 'lucide-react';
import { PLAYERS_DB } from './players'; 

const POS_COLORS = { POR: 'bg-yellow-500', DEF: 'bg-blue-600', MED: 'bg-emerald-500', DEL: 'bg-red-600' };
const BUDGET_LIMIT = 300;

const FIELD_POSITIONS = {
  "DEL-1": {t:"22%", l:"30%", r:"DEL"}, "DEL-2": {t:"22%", l:"50%", r:"DEL"}, "DEL-3": {t:"22%", l:"70%", r:"DEL"},
  "MED-1": {t:"45%", l:"20%", r:"MED"}, "MED-2": {t:"45%", l:"35%", r:"MED"}, "MED-3": {t:"45%", l:"50%", r:"MED"}, "MED-4": {t:"45%", l:"65%", r:"MED"}, "MED-5": {t:"45%", l:"80%", r:"MED"},
  "DEF-1": {t:"70%", l:"20%", r:"DEF"}, "DEF-2": {t:"70%", l:"35%", r:"DEF"}, "DEF-3": {t:"70%", l:"50%", r:"DEF"}, "DEF-4": {t:"70%", l:"65%", r:"DEF"}, "DEF-5": {t:"70%", l:"80%", r:"DEF"},
  "POR-1": {t:"88%", l:"50%", r:"POR"}
};

export default function EuroApp() {
  const [view, setView] = useState("FANTASY"); 
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [captainId, setCaptainId] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ d: 14, h: 23, m: 59, s: 59 });
  const [marketFilters, setMarketFilters] = useState({ search: "", team: "TODOS", sort: "PRECIO_DESC", pos: "CUALQUIERA" });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev.s > 0 ? { ...prev, s: prev.s - 1 } : { ...prev, m: prev.m - 1, s: 59 });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const spent = useMemo(() => 
    Object.values(selectedPlayers).reduce((acc, p) => acc + (Number(p.precio) || 0), 0)
  , [selectedPlayers]);

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans selection:bg-emerald-500/20">
      {view === "QUINIELA" ? (
        <EuroQuiniela teamName={teamName} onBack={() => setView("FANTASY")} />
      ) : (
        <EuroFantasy 
          teamName={teamName} setTeamName={setTeamName} 
          selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers} 
          captainId={captainId} setCaptainId={setCaptainId} 
          spent={spent} timeLeft={timeLeft}
          marketFilters={marketFilters} setMarketFilters={setMarketFilters}
          onGoQuiniela={() => setView("QUINIELA")} 
        />
      )}
    </div>
  );
}

function EuroFantasy({ teamName, setTeamName, selectedPlayers, setSelectedPlayers, captainId, setCaptainId, spent, timeLeft, marketFilters, setMarketFilters, onGoQuiniela }) {
  const [activeSlot, setActiveSlot] = useState(null);
  const [skipNC, setSkipNC] = useState(false);
  const [displayText, setDisplayText] = useState("");

  const starters = Object.entries(selectedPlayers).filter(([k]) => !k.startsWith("SUP") && !k.startsWith("NC"));
  const startersCount = starters.length;
  const isBroke = spent > BUDGET_LIMIT;

  const formation = useMemo(() => {
    if (startersCount < 11) return null;
    const defs = starters.filter(([_, p]) => p.posicion === 'DEF').length;
    const meds = starters.filter(([_, p]) => p.posicion === 'MED').length;
    const dels = starters.filter(([_, p]) => p.posicion === 'DEL').length;
    return { str: `1-${defs}-${meds}-${dels}`, isValid: (defs+meds+dels) === 10 };
  }, [starters]);

  const assistData = useMemo(() => {
    if (!teamName.trim()) return { step: "1/7", msg: "Identidad del club:\nEscribe el nombre de tu equipo arriba." };
    if (startersCount < 11) return { step: "2/7", msg: `Convocatoria (${startersCount}/11):\nSelecciona tus titulares en el campo.` };
    if (isBroke) return { step: "ALERTA", msg: `¡Presupuesto excedido (${spent}M)!\nNo puedes avanzar hasta que ajustes el dinero.` };
    if (formation && !formation.isValid) return { step: "2/7", msg: `Táctica ${formation.str} no permitida.\nSolo puedes tener 11 jugadores en el campo.` };
    if (!captainId) return { step: "3/7", msg: `Táctica ${formation?.str} CORRECTA.\nNombra un capitán pulsando (C).` };
    
    const subsCount = Object.keys(selectedPlayers).filter(k => k.startsWith("SUP")).length;
    if (subsCount < 6) return { step: "4/7", msg: `Banquillo (${subsCount}/6):\nCompleta tus suplentes con libertad total.` };
    
    const ncCount = Object.keys(selectedPlayers).filter(k => k.startsWith("NC")).length;
    if (ncCount < 3 && !skipNC) return { step: "5/7", msg: "No Convocados:\nElige 3 reservas o pulsa el botón rojo." };
    
    return { step: "7/7", msg: "¡Plantilla validada!\nHaz click abajo para entrar en la Euroquiniela." };
  }, [teamName, startersCount, formation, captainId, selectedPlayers, skipNC, spent, isBroke]);

  useEffect(() => {
    let i = 0; setDisplayText("");
    const interval = setInterval(() => {
      setDisplayText(assistData.msg.slice(0, i));
      i++;
      if (i > assistData.msg.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [assistData.msg]);

  return (
    <div className="p-4 flex flex-col items-center w-full max-w-md mx-auto pb-32">
      <div className="w-full flex justify-between items-center mb-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm tabular-nums">
            <Timer size={18} /> {timeLeft.d}D {timeLeft.h}H {timeLeft.m}M {timeLeft.s}S
          </div>
          <span className="text-[10px] uppercase font-black text-emerald-400/60 mt-1 italic leading-none">Tiempo para editar</span>
        </div>
        <div className="p-2.5 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
          <LockOpen size={22} className="text-black" strokeWidth={3} />
        </div>
      </div>

      <div className={`w-full p-4 rounded-2xl border-l-4 mb-4 bg-slate-800 shadow-xl min-h-[85px] transition-colors ${isBroke ? 'border-red-500' : 'border-emerald-500'}`}>
        <p className={`text-[10px] font-black uppercase mb-1 ${isBroke ? 'text-red-500' : 'text-emerald-400'}`}>Asistente — Paso {assistData.step}</p>
        <p className="text-xs italic leading-tight text-slate-100 whitespace-pre-line">{displayText}<span>|</span></p>
      </div>

      <input 
        type="text" placeholder="Nombre de tu equipo..." value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        className={`w-full mb-3 bg-white/5 p-4 rounded-2xl text-center font-black text-emerald-400 border-2 outline-none transition-all ${!teamName ? 'border-white animate-pulse' : 'border-white/10 focus:border-emerald-500'}`}
      />

      <div className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 mb-6">
        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
          <span className="text-slate-400 tracking-widest">Presupuesto</span>
          <span className={isBroke ? 'text-red-500 animate-bounce' : 'text-emerald-400'}>{spent}M / 300M</span>
        </div>
        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${isBroke ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500'}`} style={{ width: `${Math.min((spent/300)*100, 100)}%` }} />
        </div>
      </div>

      {/* CAMPO REGLAMENTARIO */}
      <div className="relative w-full aspect-[3/4] rounded-[3.5rem] border-4 border-slate-800 overflow-hidden mb-6 bg-[#2e9d4a] shadow-inner">
        <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-4 border-[3px] border-white" />
            <div className="absolute top-1/2 w-full h-[3px] bg-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-[3px] border-white rounded-full" />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-64 h-28 border-[3px] border-white border-b-0" />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-32 h-10 border-[3px] border-white border-b-0" />
            <div className="absolute left-1/2 bottom-[112px] -translate-x-1/2 w-24 h-12 border-t-[3px] border-white rounded-t-full" />
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-64 h-28 border-[3px] border-white border-t-0" />
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-32 h-10 border-[3px] border-white border-t-0" />
            <div className="absolute left-1/2 top-[112px] -translate-x-1/2 w-24 h-12 border-b-[3px] border-white rounded-b-full" />
        </div>

        <div className="absolute left-1 top-0 bottom-0 w-12 z-20 pointer-events-none">
            <div style={{ top: "22%" }} className="absolute -translate-y-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded border-2 border-white uppercase shadow-lg">DEL</div>
            <div style={{ top: "45%" }} className="absolute -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded border-2 border-white uppercase shadow-lg">MED</div>
            <div style={{ top: "70%" }} className="absolute -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded border-2 border-white uppercase shadow-lg">DEF</div>
            <div style={{ top: "88%" }} className="absolute -translate-y-1/2 bg-yellow-500 text-white text-[10px] font-black px-2 py-1 rounded border-2 border-white uppercase shadow-lg">POR</div>
        </div>

        {Object.entries(FIELD_POSITIONS).map(([id, pos]) => (
          <div key={id} style={{ top: pos.t, left: pos.l }} className="absolute -translate-x-1/2 -translate-y-1/2 z-30">
            <PlayerCircle id={id} pos={pos} sel={selectedPlayers} set={setActiveSlot} count={startersCount} capId={captainId} setCap={setCaptainId} />
          </div>
        ))}
      </div>

      {/* BANQUILLO Y NC - ACCESO CONDICIONADO AL PRESUPUESTO */}
      <div className={`w-full space-y-4 transition-all ${isBroke ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="p-4 rounded-3xl bg-slate-800/80 border border-white/20">
          <p className="text-[10px] font-black text-center mb-3 text-white/60 uppercase">Banquillo</p>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(i => <BenchSlot key={i} id={`SUP-${i}`} label={`S${i}`} sel={selectedPlayers} set={setActiveSlot} active={startersCount === 11 && !isBroke} />)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-800/80 border border-white/20">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-black text-white/40 uppercase">No Convocados</p>
            <button onClick={() => setSkipNC(true)} className="bg-red-600 text-[8px] font-black px-3 py-1.5 rounded-lg border border-red-400 uppercase">NO QUIERO NO CONVOCADOS</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <BenchSlot key={i} id={`NC-${i}`} label={`NC${i}`} sel={selectedPlayers} set={setActiveSlot} active={startersCount === 11 && !isBroke} />)}
          </div>
        </div>
      </div>

      {assistData.step === "7/7" && !isBroke && (
        <button onClick={onGoQuiniela} className="fixed bottom-6 w-full max-w-xs bg-emerald-500 text-black p-5 rounded-3xl font-black shadow-2xl animate-bounce border-b-4 border-emerald-700 z-50">
          IR A EUROQUINIELA
        </button>
      )}

      {activeSlot && (
        <MarketModal 
          activeSlot={activeSlot} setActiveSlot={setActiveSlot} 
          selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
          captainId={captainId} setCaptainId={setCaptainId}
          filters={marketFilters} setFilters={setMarketFilters}
        />
      )}
    </div>
  );
}

function MarketModal({ activeSlot, setActiveSlot, selectedPlayers, setSelectedPlayers, captainId, setCaptainId, filters, setFilters }) {
  const selectedIds = Object.values(selectedPlayers).map(p => p.id);
  const teams = useMemo(() => ["TODOS", ...new Set(PLAYERS_DB.map(p => p.seleccion).sort())], []);

  const filtered = useMemo(() => {
    let list = PLAYERS_DB.filter(p => 
      (filters.pos === 'CUALQUIERA' || p.posicion === filters.pos) && 
      !selectedIds.includes(p.id) &&
      (filters.team === "TODOS" || p.seleccion === filters.team) &&
      p.nombre.toLowerCase().includes(filters.search.toLowerCase())
    );

    return list.sort((a, b) => {
      if (filters.sort === "PRECIO_DESC") return b.precio - a.precio;
      if (filters.sort === "PRECIO_ASC") return a.precio - b.precio;
      if (filters.sort === "ALFA_ASC") return a.nombre.localeCompare(b.nombre);
      if (filters.sort === "ALFA_DESC") return b.nombre.localeCompare(a.nombre);
      return 0;
    });
  }, [filters, selectedIds]);

  // Al abrir el modal por primera vez o cambiar de slot, ajustamos el filtro de posición inicial
  useEffect(() => {
    setFilters(prev => ({ ...prev, pos: activeSlot.role }));
  }, [activeSlot.id]);

  return (
    <div className="fixed inset-0 bg-[#0a0f1a] z-[100] flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-2xl font-black text-emerald-400 italic">ESCOGE JUGADOR</h2>
        <button onClick={() => setActiveSlot(null)} className="text-4xl text-white/20">&times;</button>
      </div>

      <div className="space-y-4 mb-6 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-emerald-500 font-bold" placeholder="Nombre..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        </div>

        <div className="flex gap-1">
            {['CUALQUIERA','POR','DEF','MED','DEL'].map(pos => (
                <button key={pos} onClick={() => setFilters({...filters, pos})} className={`flex-1 py-2 rounded-lg text-[8px] font-black border transition-all ${filters.pos === pos ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-white/40 border-white/10'}`}>{pos === 'CUALQUIERA' ? 'TODOS' : pos}</button>
            ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {teams.map(t => (
                <button key={t} onClick={() => setFilters({...filters, team: t})} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap border ${filters.team === t ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-white/40 border-white/10'}`}>{t}</button>
            ))}
        </div>

        <div className="flex gap-1">
            {[{id:'PRECIO_DESC', l:'+ $'}, {id:'PRECIO_ASC', l:'- $'}, {id:'ALFA_ASC', l:'A-Z'}, {id:'ALFA_DESC', l:'Z-A'}].map(opt => (
                <button key={opt.id} onClick={() => setFilters({...filters, sort: opt.id})} className={`flex-1 py-2 rounded-lg text-[9px] font-black border ${filters.sort === opt.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/20 border-white/5'}`}>{opt.l}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map(p => (
          <div key={p.id} onClick={() => { setSelectedPlayers({...selectedPlayers, [activeSlot.id]: p}); setActiveSlot(null); }} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center border border-white/5 active:bg-white/10">
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase">{p.nombre}</span>
              <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{p.seleccion}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white ${POS_COLORS[p.posicion]}`}>{p.posicion}</span>
              <span className="text-emerald-400 font-black text-xl">{p.precio}M</span>
            </div>
          </div>
        ))}
      </div>

      {selectedPlayers[activeSlot.id] && (
        <button onClick={() => {
          const n = {...selectedPlayers}; delete n[activeSlot.id]; setSelectedPlayers(n);
          if(captainId === activeSlot.id) setCaptainId(null); setActiveSlot(null);
        }} className="mt-4 w-full bg-red-600/20 text-red-500 border-2 border-red-500/30 p-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
          <Trash2 size={20} /> ELIMINAR JUGADOR ACTUAL
        </button>
      )}
    </div>
  );
}

function PlayerCircle({ id, pos, sel, set, count, capId, setCap }) {
  const p = sel[id];
  return (
    <div className="flex flex-col items-center">
      <div onClick={() => (count < 11 || p) && set({id, role: pos.r})}
        className={`w-11 h-11 rounded-full border-[3px] flex items-center justify-center transition-all ${p ? 'bg-white border-emerald-500 scale-110 shadow-xl' : 'bg-black/30 border-white/40 hover:border-white'}`}>
        {p ? <span className="text-[8px] font-black text-emerald-900 text-center uppercase leading-none px-1">{p.nombre.split(' ').pop()}</span> : <Plus size={16} className="text-white/20" />}
      </div>
      {p && (
        <button onClick={(e) => { e.stopPropagation(); setCap(id); }} className={`mt-1 w-6 h-6 rounded-full border-2 font-black text-[10px] flex items-center justify-center ${capId === id ? 'bg-yellow-500 text-black border-white shadow-[0_0_10px_yellow]' : 'bg-slate-900 text-white border-white/50'}`}>C</button>
      )}
    </div>
  );
}

function BenchSlot({ id, label, sel, set, active }) {
  const p = sel[id];
  return (
    <div onClick={() => active && set({ id, role: 'CUALQUIERA' })} className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${p ? 'bg-white border-white' : active ? 'bg-slate-700 border-white/40 shadow-inner' : 'bg-slate-900/40 border-white/5 opacity-30'}`}>
      <span className={`font-black uppercase text-center leading-tight ${p ? 'text-[9px] text-slate-900' : 'text-xs text-white/60'}`}>{p ? p.nombre : label}</span>
      {p && <div className={`mt-1 w-full text-[7px] font-black text-center py-0.5 rounded ${POS_COLORS[p.posicion]} text-white uppercase`}>{p.posicion}</div>}
    </div>
  );
}

function EuroQuiniela({ teamName, onBack }) {
  const [picks, setPicks] = useState({});
  const GRUPOS = [
    { n: 'A', teams: ['ALEMANIA', 'ESCOCIA', 'HUNGRÍA', 'SUIZA'] },
    { n: 'B', teams: ['ESPAÑA', 'CROACIA', 'ITALIA', 'ALBANIA'] },
    { n: 'C', teams: ['ESLOVENIA', 'DINAMARCA', 'SERBIA', 'INGLATERRA'] },
    { n: 'D', teams: ['POLONIA', 'PAÍSES BAJOS', 'AUSTRIA', 'FRANCIA'] },
    { n: 'E', teams: ['BÉLGICA', 'ESLOVAQUIA', 'RUMANÍA', 'UCRANIA'] },
    { n: 'F', teams: ['TURQUÍA', 'GEORGIA', 'PORTUGAL', 'REPÚBLICA CHECA'] },
  ];

  const handlePick = (grupo, team) => {
    const current = picks[grupo] || [];
    if (current.includes(team)) setPicks({ ...picks, [grupo]: current.filter(t => t !== team) });
    else if (current.length < 2) setPicks({ ...picks, [grupo]: [...current, team] });
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto min-h-screen bg-[#05080f] pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-emerald-400 font-bold mb-6 uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver</button>
      <div className="bg-emerald-500 text-black p-5 rounded-3xl mb-8 flex justify-between items-center shadow-xl">
        <h1 className="text-2xl font-black italic uppercase">Euroquiniela</h1>
        <div className="text-[10px] font-black text-right uppercase opacity-60">Pronósticos</div>
      </div>
      <div className="space-y-6">
        {GRUPOS.map(g => (
          <div key={g.n} className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-6">
            <h3 className="text-emerald-400 font-black italic mb-4 tracking-wider">GRUPO {g.n}</h3>
            <div className="grid grid-cols-1 gap-2">
              {g.teams.map(t => {
                const isSelected = picks[g.n]?.includes(t);
                return (
                  <button key={t} onClick={() => handlePick(g.n, t)} className={`p-4 rounded-2xl flex justify-between items-center border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-white/5 border-white/5 text-white/50'}`}>
                    <span className="font-black text-xs uppercase italic">{t}</span>
                    {isSelected && <Check size={16} strokeWidth={4} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
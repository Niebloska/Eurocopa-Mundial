"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, XCircle, LockOpen, Timer, CheckCircle2, AlertCircle, ArrowUpDown, Trash2, SortAsc, SortDesc } from 'lucide-react';
import { PLAYERS_DB } from './players'; 

const POS_COLORS = { POR: 'bg-yellow-500', DEF: 'bg-blue-600', MED: 'bg-emerald-500', DEL: 'bg-red-600' };
const MAX_PER_COUNTRY = 7;
const TOTAL_BUDGET = 300;

// Diccionario robusto: Todo en MAYÚSCULAS para evitar fallos de coincidencia
const COUNTRY_FLAGS: Record<string, string> = {
  "ESPAÑA": "🇪🇸", "ALEMANIA": "🇩🇪", "FRANCIA": "🇫🇷", "PORTUGAL": "🇵🇹", 
  "INGLATERRA": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "ITALIA": "🇮🇹", "BÉLGICA": "🇧🇪", "PAÍSES BAJOS": "🇳🇱",
  "ESCOCIA": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "CROACIA": "🇭🇷", "TURQUÍA": "🇹🇷", "SUIZA": "🇨🇭", "AUSTRIA": "🇦🇹",
  "GEORGIA": "🇬🇪", "DINAMARCA": "🇩🇰", "SERBIA": "🇷🇸", "HUNGRÍA": "🇭🇺", "POLONIA": "🇵🇱"
};

const FIELD_POSITIONS = {
  "DEL-1": {t:"22%", l:"30%", r:"DEL"}, "DEL-2": {t:"22%", l:"50%", r:"DEL"}, "DEL-3": {t:"22%", l:"70%", r:"DEL"},
  "MED-1": {t:"45%", l:"20%", r:"MED"}, "MED-2": {t:"45%", l:"35%", r:"MED"}, "MED-3": {t:"45%", l:"50%", r:"MED"}, "MED-4": {t:"45%", l:"65%", r:"MED"}, "MED-5": {t:"45%", l:"80%", r:"MED"},
  "DEF-1": {t:"70%", l:"20%", r:"DEF"}, "DEF-2": {t:"70%", l:"35%", r:"DEF"}, "DEF-3": {t:"70%", l:"50%", r:"DEF"}, "DEF-4": {t:"70%", l:"65%", r:"DEF"}, "DEF-5": {t:"70%", l:"80%", r:"DEF"},
  "POR-1": {t:"88%", l:"50%", r:"POR"}
};

const TypewriterText = ({ text, step }: { text: string, step: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0; setDisplayedText("");
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayedText(text.substring(0, i + 1)); i++; }
      else clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [step]); 
  return <span>{displayedText}</span>;
};

export default function EuroApp() {
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, any>>({});
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);

  const startersCount = useMemo(() => 
    Object.keys(selectedPlayers).filter(k => !k.startsWith("SUP")).length
  , [selectedPlayers]);

  const totalSpent = useMemo(() => 
    Object.values(selectedPlayers).reduce((acc, p) => acc + (p?.precio || 0), 0)
  , [selectedPlayers]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(selectedPlayers).forEach(p => { 
        const c = p?.seleccion?.toUpperCase().trim();
        if(c) counts[c] = (counts[c] || 0) + 1; 
    });
    return counts;
  }, [selectedPlayers]);

  const step = useMemo(() => {
    if (teamName.length < 3) return 1;
    if (startersCount < 11) return 2;
    if (!captainId) return 3;
    return 4;
  }, [teamName, startersCount, captainId]);

  return (
    <div className="min-h-screen bg-[#05080f] text-white p-4 flex flex-col items-center w-full max-w-md mx-auto pb-10">
      
      {/* CABECERA (RECUPERADA) */}
      <div className="w-full bg-[#0d1526] border border-white/5 rounded-3xl p-5 mb-3 flex justify-between items-center shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[#22c55e]">
            <Timer size={18} strokeWidth={3} />
            <span className="font-black italic text-base tracking-tight">14D 23H 59M 27S</span>
          </div>
          <span className="text-[10px] font-black uppercase text-[#22c55e]/80 italic">TIEMPO PARA EDITAR</span>
        </div>
        <div className="w-12 h-12 bg-[#facc15] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
          <LockOpen className="text-black" size={24} strokeWidth={2.5} />
        </div>
      </div>

      {/* ASISTENTE */}
      <div className="w-full p-5 rounded-2xl border-l-4 mb-3 bg-[#162136] border-[#22c55e] shadow-xl min-h-[90px]">
        <p className="text-[10px] font-black uppercase mb-1 text-[#22c55e] italic">PASO {step} DE 7</p>
        <p className="text-xs italic text-white font-medium tracking-tight">
            <TypewriterText text={step === 1 ? "Escribe el nombre de tu equipo arriba." : step === 2 ? "Toca en los huecos del campo para fichar." : "Configura tu capitán y banquillo."} step={step} />
        </p>
      </div>

      <input type="text" placeholder="Nombre de tu equipo..." value={teamName} onChange={(e) => setTeamName(e.target.value)}
        className="w-full mb-3 bg-[#0d1526] p-4 rounded-2xl text-center font-black outline-none text-xl border-2 border-white/10 text-[#22c55e]"
      />

      {/* TÁCTICA CONDICIONAL */}
      <div className="w-full mb-4 px-2 flex items-center justify-between font-black italic uppercase text-[10px]">
        <div className={`flex items-center gap-2 ${startersCount === 11 ? 'text-[#22c55e]' : 'text-white/40'}`}>
            {startersCount === 11 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{startersCount === 11 ? 'TÁCTICA: 1-5-5' : `SELECCIONADOS: ${startersCount}/11`}</span>
        </div>
      </div>

      {/* PRESUPUESTO */}
      <div className="w-full bg-[#0d1526] border border-white/5 rounded-2xl p-4 mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-2 text-[10px] font-black italic uppercase">
            <span className="text-white/40">PRESUPUESTO</span>
            <span className="text-[#22c55e]">{totalSpent}M / {TOTAL_BUDGET}M</span>
        </div>
        <div className="w-full h-2 bg-black rounded-full overflow-hidden">
            <div className="h-full bg-[#22c55e] transition-all duration-700" style={{ width: `${(totalSpent / TOTAL_BUDGET) * 100}%` }} />
        </div>
      </div>

      {/* CAMPO DE JUEGO */}
      <div className="relative w-full aspect-[3/4] rounded-[3rem] border-4 border-slate-800 overflow-hidden mb-8 bg-[#2e9d4a] shadow-2xl">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute inset-4 border-[2px] border-white" />
            <div className="absolute top-1/2 w-full h-[2px] bg-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-[2px] border-white rounded-full" />
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-60 h-24 border-[2px] border-white border-t-0" />
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-28 h-8 border-[2px] border-white border-t-0" />
            <div className="absolute left-1/2 top-[112px] -translate-x-1/2 w-20 h-10 border-[2px] border-white border-t-0 rounded-b-full" />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-60 h-24 border-[2px] border-white border-b-0" />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-28 h-8 border-[2px] border-white border-b-0" />
            <div className="absolute left-1/2 bottom-[112px] -translate-x-1/2 w-20 h-10 border-[2px] border-white border-b-0 rounded-t-full" />
        </div>
        {Object.entries(POS_COLORS).map(([pos, color]) => (
            <div key={pos} className="absolute left-2 z-50" style={{ top: pos === 'DEL' ? '22%' : pos === 'MED' ? '45%' : pos === 'DEF' ? '70%' : '88%' }}>
                <div className={`${color} text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-md -translate-y-1/2 border border-white/20`}>{pos}</div>
            </div>
        ))}
        {Object.entries(FIELD_POSITIONS).map(([id, pos]) => (
          <div key={id} style={{ top: pos.t, left: pos.l }} className="absolute -translate-x-1/2 -translate-y-1/2 z-30">
            <PlayerCircle id={id} pos={pos} sel={selectedPlayers} set={setActiveSlot} count={startersCount} capId={captainId} setCap={setCaptainId} isActive={activeSlot?.id === id} isActionRequired={step === 2 && !selectedPlayers[id]} />
          </div>
        ))}
      </div>

      {/* BANQUILLO */}
      <div className={`w-full bg-[#111827] p-5 rounded-3xl border mb-6 shadow-xl ${step === 4 ? 'border-white' : 'border-white/10'}`}>
        <p className="text-[11px] font-black text-center mb-4 text-white/40 uppercase italic tracking-widest">BANQUILLO</p>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <BenchSlot key={i} id={`SUP-${i}`} label={`S${i}`} sel={selectedPlayers} set={setActiveSlot} active={startersCount === 11} isActive={activeSlot?.id === `SUP-${i}`} isActionRequired={step === 4 && !selectedPlayers[`SUP-${i}`]} />
          ))}
        </div>
      </div>

      {activeSlot && <SelectionModal activeSlot={activeSlot} setActiveSlot={setActiveSlot} selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers} countryCounts={countryCounts} />}
    </div>
  );
}

function SelectionModal({ activeSlot, setActiveSlot, selectedPlayers, setSelectedPlayers, countryCounts }: any) {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("TODOS");
  const [sortMode, setSortMode] = useState<'PRECIO_DESC' | 'PRECIO_ASC' | 'ALPHA_ASC' | 'ALPHA_DESC'>('PRECIO_DESC');

  const countriesList = useMemo(() => {
    return Array.from(new Set(PLAYERS_DB.map(p => p.seleccion?.toUpperCase().trim()).filter(Boolean))).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = PLAYERS_DB.filter(p => {
      const pCountry = p.seleccion?.toUpperCase().trim();
      const matchPos = activeSlot.role === 'CUALQUIERA' ? true : p.posicion === activeSlot.role;
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCountry = selectedCountry === "TODOS" || pCountry === selectedCountry;
      const notInTeam = !Object.values(selectedPlayers).some((sel: any) => sel.id === p.id);
      return matchPos && matchSearch && matchCountry && notInTeam;
    });
    list.sort((a, b) => sortMode === 'PRECIO_DESC' ? b.precio - a.precio : sortMode === 'PRECIO_ASC' ? a.precio - b.precio : sortMode === 'ALPHA_ASC' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre));
    return list;
  }, [search, selectedCountry, sortMode, activeSlot.role, selectedPlayers]);

  return (
    <div className="fixed inset-0 bg-[#05080f] z-[100] flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter italic">FICHAR {activeSlot.role}</h2>
        <button onClick={() => setActiveSlot(null)} className="p-2 bg-white/10 rounded-full"><XCircle size={24} /></button>
      </div>

      <div className="space-y-4 mb-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input className="w-full bg-[#162136] border border-white/5 p-4 pl-10 rounded-xl outline-none text-sm font-bold" 
                   placeholder="BUSCAR JUGADOR..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* BARRA DE PAÍSES */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setSelectedCountry("TODOS")}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all
                    ${selectedCountry === "TODOS" ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-[#111827] border-white/5 text-white/40'}`}>
                🌍 TODOS
            </button>
            {countriesList.map(c => (
                <button key={c} onClick={() => setSelectedCountry(c)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all flex items-center gap-2
                        ${selectedCountry === c ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-[#111827] border-white/5 text-white/40'}`}>
                    <span>{COUNTRY_FLAGS[c] || "🚩"}</span> {c}
                </button>
            ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSortMode(sortMode === 'PRECIO_DESC' ? 'PRECIO_ASC' : 'PRECIO_DESC')} 
                    className="bg-[#111827] border border-white/5 p-3 rounded-xl text-[10px] font-black uppercase text-white flex justify-center gap-2">
                <ArrowUpDown size={12} className="text-[#22c55e]" /> {sortMode.includes('PRECIO') ? (sortMode === 'PRECIO_DESC' ? '€ MÁX' : '€ MÍN') : 'ORDEN €'}
            </button>
            <button onClick={() => setSortMode(sortMode === 'ALPHA_ASC' ? 'ALPHA_DESC' : 'ALPHA_ASC')} 
                    className="bg-[#111827] border border-white/5 p-3 rounded-xl text-[10px] font-black uppercase text-white flex justify-center gap-2">
                <SortAsc size={14} className="text-[#22c55e]" /> A-Z
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {filtered.map(p => {
          const pCountry = p.seleccion?.toUpperCase().trim();
          return (
            <div key={p.id} onClick={() => {
              if ((countryCounts[pCountry] || 0) >= MAX_PER_COUNTRY) return alert(`Límite 7 de ${pCountry}`);
              setSelectedPlayers({...selectedPlayers, [activeSlot.id]: p});
              setActiveSlot(null);
            }} className="p-4 bg-[#111827] rounded-2xl flex justify-between items-center border border-white/5 hover:border-[#22c55e]/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{COUNTRY_FLAGS[pCountry] || "🚩"}</span>
                <div className="flex flex-col">
                  <span className="font-black text-xs uppercase tracking-tighter">{p.nombre}</span>
                  <span className="text-[9px] text-white/30 font-bold uppercase">{p.seleccion}</span>
                </div>
              </div>
              <span className="text-[#22c55e] font-black text-base">{p.precio}M</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerCircle({ id, pos, sel, set, count, capId, setCap, isActive, isActionRequired }: any) {
    const p = sel[id];
    return (
      <div className="flex flex-col items-center">
        <div onClick={() => set({id, role: pos.r})}
          className={`w-11 h-11 rounded-full border-[3px] flex items-center justify-center transition-all cursor-pointer
            ${isActive ? 'border-white scale-110 shadow-[0_0_15px_#fff] bg-slate-700' : 
              p ? 'bg-white border-emerald-500 shadow-lg' : 
              isActionRequired ? 'bg-black/60 border-white animate-pulse shadow-[0_0_10px_#fff]' : 
              'bg-black/40 border-white/20'}`}>
          {p ? <span className="text-[8px] font-black text-emerald-900 text-center uppercase leading-tight px-1">{p.nombre.split(' ').pop()}</span> : <Plus size={16} className={isActionRequired ? 'text-white' : 'text-white/20'} />}
        </div>
        {p && count === 11 && (
          <button onClick={(e) => { e.stopPropagation(); setCap(id); }} 
            className={`mt-1 w-5 h-5 rounded-full border-2 text-[8px] font-black flex items-center justify-center ${capId === id ? 'bg-yellow-500 text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-slate-800 border-white/30 text-white/50'}`}>C</button>
        )}
      </div>
    );
  }
  
  function BenchSlot({ id, label, sel, set, active, isActive, isActionRequired }: any) {
    const p = sel[id];
    return (
      <div onClick={() => active && set({ id, role: 'CUALQUIERA' })} 
        className={`h-16 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer
          ${isActive ? 'border-white bg-[#1f2937]' : p ? 'bg-white border-[#22c55e]' : isActionRequired ? 'bg-[#1f2937] border-white' : 'bg-[#1f2937] border-white/5 opacity-50'}`}>
        <span className={`font-black uppercase text-xs tracking-tighter ${p ? 'text-slate-900' : isActionRequired ? 'text-white' : 'text-white/20'}`}>
          {p ? p.nombre.split(' ').pop() : label}
        </span>
      </div>
    );
  }
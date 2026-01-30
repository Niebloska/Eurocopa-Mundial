"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Timer, Check, X, Lock, ArrowUpDown, ArrowDownUp, Trash2, Ban, 
  ArrowRight, Trophy, Edit3, Save, Volume2, VolumeX, 
  Users, LogOut, Eye, ChevronDown, ChevronUp, User, UserCheck, 
  FileText, CalendarDays, Shield
} from 'lucide-react';
import { PLAYERS_DB } from './players';

// --- HELPERS Y DATOS ---

export const EURO_GROUPS = [
  { name: "GRUPO A", teams: ["Alemania", "Escocia", "Hungría", "Suiza"] },
  { name: "GRUPO B", teams: ["España", "Croacia", "Italia", "Albania"] },
  { name: "GRUPO C", teams: ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"] },
  { name: "GRUPO D", teams: ["Polonia", "Países Bajos", "Austria", "Francia"] },
  { name: "GRUPO E", teams: ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"] },
  { name: "GRUPO F", teams: ["Turquía", "Georgia", "Portugal", "República Checa"] },
];

export const getFlag = (country: string) => {
  const flags: Record<string, string> = {
    "España": "🇪🇸", "Alemania": "🇩🇪", "Francia": "🇫🇷", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 
    "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Turquía": "🇹🇷", "Georgia": "🇬🇪", "Portugal": "🇵🇹", "Países Bajos": "🇳🇱",
    "Italia": "🇮🇹", "Albania": "🇦🇱", "Hungría": "🇭🇺", "Suiza": "🇨🇭", "Croacia": "🇭🇷",
    "Eslovenia": "🇸🇮", "Dinamarca": "🇩🇰", "Serbia": "🇷🇸", "Polonia": "🇵🇱", "Austria": "🇦🇹",
    "Bélgica": "🇧🇪", "Eslovaquia": "🇸🇰", "Rumanía": "🇷🇴", "Ucrania": "🇺🇦", "República Checa": "🇨🇿"
  };
  return flags[country] || "🏳️";
};

export const posColors: Record<string, string> = {
  "POR": "bg-[#facc15] text-black", "DEF": "bg-[#3b82f6] text-white",
  "MED": "bg-[#10b981] text-white", "DEL": "bg-[#ef4444] text-white"
};

export const generateFixture = () => {
  return EURO_GROUPS.map(group => ({
    group: group.name,
    matches: [
      { team1: group.teams[0], team2: group.teams[1], date: "Jornada 1", result: "- : -" },
      { team1: group.teams[2], team2: group.teams[3], date: "Jornada 1", result: "- : -" },
      { team1: group.teams[0], team2: group.teams[2], date: "Jornada 2", result: "- : -" },
      { team1: group.teams[1], team2: group.teams[3], date: "Jornada 2", result: "- : -" },
      { team1: group.teams[3], team2: group.teams[0], date: "Jornada 3", result: "- : -" },
      { team1: group.teams[2], team2: group.teams[1], date: "Jornada 3", result: "- : -" },
    ]
  }));
};

export const getMockSquad = (offset: number) => {
  const safePlayers = PLAYERS_DB.length > 0 ? PLAYERS_DB : [];
  if (safePlayers.length === 0) return { titulares: [], banquillo: [], extras: [] };
  const start = offset * 11; 
  return {
    titulares: safePlayers.slice(start, start + 11),
    banquillo: safePlayers.slice(start + 11, start + 17),
    extras: safePlayers.slice(start + 17, start + 20)
  };
};

export const MOCK_TEAMS_DB = [
  { id: 101, name: "Los Galácticos", user: "CarlosCR7", points: 120, value: 295, squadIndex: 1 },
  { id: 102, name: "La Furia Roja", user: "Ana_Futbol", points: 115, value: 299, squadIndex: 2 },
  { id: 103, name: "Catenaccio FC", user: "Luigi_99", points: 98, value: 280, squadIndex: 3 },
];

// --- COMPONENTES VISUALES ---

export const Typewriter = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0; setDisplayedText(""); 
    const startTyping = () => {
      const intervalId = setInterval(() => {
        setDisplayedText((prev) => text.substring(0, i + 1));
        i++; if (i === text.length) clearInterval(intervalId);
      }, 15);
      return intervalId;
    };
    const timeoutId = setTimeout(() => { const interval = startTyping(); return () => clearInterval(interval); }, delay);
    return () => clearTimeout(timeoutId);
  }, [text, delay]);
  return <span>{displayedText}</span>;
};

export const Countdown = ({ onTick }: { onTick?: (timeLeft: number) => void }) => {
  const [timeLeft, setTimeLeft] = useState(136 * 24 * 60 * 60); 
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newVal = prev > 0 ? prev - 1 : 0;
        if (onTick) onTick(newVal);
        return newVal;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTick]);
  const formatTime = (s: number) => {
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${d}D ${h}H ${m}M ${sec}S`;
  };
  return <span className="text-xl font-black italic uppercase tracking-tighter w-44 inline-block text-[#facc15]">{formatTime(timeLeft)}</span>;
};

export const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio("/Banda sonora EF 2024.mp3"); 
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
    }
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.play().catch(e => console.log("Audio block", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [playing]);

  return (
    <button onClick={() => setPlaying(!playing)} className="p-3 bg-[#1c2a45] rounded-full border border-white/10 hover:bg-white/10 transition-all text-[#22c55e]">
      {playing ? <Volume2 size={20} className="animate-pulse"/> : <VolumeX size={20} className="text-white/50"/>}
    </button>
  );
};

export const AuthScreen = ({ onLogin }: { onLogin: (email: string, username: string, teamName?: string) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState(""); 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return alert("Rellena todos los campos");
    onLogin(email, username, isRegister ? teamName : undefined);
  };
  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#162136] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#22c55e] to-[#facc15]" />
        <div className="text-center mb-8">
           <Trophy size={48} className="mx-auto text-[#facc15] mb-4 animate-bounce" />
           <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#22c55e] mb-2">EUROCOPA<br/><span className="text-white">FANTÁSTICA 2024</span></h1>
           <p className="text-white/50 text-xs uppercase tracking-widest font-bold">{isRegister ? "CREA TU EQUIPO Y GANA" : "ACCEDE A TU VESTUARIO"}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">USUARIO</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" /></div>
          {isRegister && <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">NOMBRE EQUIPO</label><input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" /></div>}
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">EMAIL</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">CONTRASEÑA</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" /></div>
          <button type="submit" className="w-full py-4 mt-6 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-black italic uppercase rounded-xl shadow-lg">{isRegister ? "CREAR CUENTA" : "ENTRAR"}</button>
        </form>
        <div className="mt-6 text-center"><button onClick={() => setIsRegister(!isRegister)} className="text-xs text-white/50 hover:text-white font-bold underline uppercase">{isRegister ? "¿Ya tienes cuenta? Entra" : "Regístrate aquí"}</button></div>
      </div>
    </div>
  );
};

export const MiniPlayer = ({ p, small }: any) => {
  if (!p) return null;
  return (
    <div className={`flex flex-col items-center ${small ? 'gap-0.5' : 'gap-1'}`}>
      <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 bg-white flex items-center justify-center border-[#22c55e] relative shadow-md`}><span className="text-[8px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop().substring(0, 8)}</span></div>
      <span className={`text-[7px] font-black uppercase px-1 rounded ${posColors[p.posicion]}`}>{p.posicion}</span>
    </div>
  );
}

export const TeamCard = ({ team, rank, isMyTeam }: any) => {
  const [expanded, setExpanded] = useState(false);
  const squadData = team.squad || getMockSquad(team.squadIndex);
  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${isMyTeam ? 'bg-[#1c2a45] border-[#22c55e]' : 'bg-[#1c2a45] border-white/5'}`}>
       <div onClick={() => setExpanded(!expanded)} className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors`}>
          <div className="flex items-center gap-4"><span className={`text-2xl font-black italic w-8 text-center ${rank === 1 ? 'text-[#facc15]' : 'text-white/30'}`}>#{rank}</span><div><h3 className={`font-black text-sm uppercase italic ${isMyTeam ? 'text-[#22c55e]' : 'text-white'}`}>{team.name}</h3><div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold"><User size={10} /> {team.user}</div></div></div>
          <div className="flex items-center gap-4"><div className="text-right"><span className="block font-black text-[#22c55e] text-lg">{team.points} PTS</span><span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span></div>{expanded ? <ChevronUp size={20} className="text-white/30"/> : <ChevronDown size={20} className="text-white/30"/>}</div>
       </div>
       {expanded && (
         <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4">
            <div className="border border-[#22c55e]/20 rounded-2xl bg-[#2e9d4a]/10 p-4 relative overflow-hidden">
              <p className="text-[9px] font-black uppercase text-[#22c55e] mb-3 text-center">ONCE INICIAL</p>
              <div className="flex flex-wrap justify-center gap-2">
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">{squadData.titulares.filter((p:any) => p.posicion === 'DEL').map((p:any) => <MiniPlayer key={p.id} p={p} />)}</div>
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">{squadData.titulares.filter((p:any) => p.posicion === 'MED').map((p:any) => <MiniPlayer key={p.id} p={p} />)}</div>
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">{squadData.titulares.filter((p:any) => p.posicion === 'DEF').map((p:any) => <MiniPlayer key={p.id} p={p} />)}</div>
                 <div className="w-full flex justify-center pt-1">{squadData.titulares.filter((p:any) => p.posicion === 'POR').map((p:any) => <MiniPlayer key={p.id} p={p} />)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="border border-sky-500/20 rounded-2xl bg-sky-900/10 p-3"><p className="text-[9px] font-black uppercase text-sky-400 mb-3 text-center">BANQUILLO</p><div className="grid grid-cols-3 gap-1">{squadData.banquillo.map((p:any) => <MiniPlayer key={p.id} p={p} small />)}</div></div>
               <div className="border border-white/10 rounded-2xl bg-white/5 p-3"><p className="text-[9px] font-black uppercase text-white/40 mb-3 text-center">NO CONV.</p><div className="grid grid-cols-3 gap-1">{squadData.extras.map((p:any) => <MiniPlayer key={p.id} p={p} small />)}</div></div>
            </div>
         </div>
       )}
    </div>
  );
};

export const NavBar = ({ view, setView, onLogout }: any) => (
    <div className="fixed top-0 left-0 w-full z-[110] bg-[#0d1526] border-b border-white/10 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center">
            <button onClick={() => setView('rules')} className={`flex flex-col items-center gap-1 transition-all ${view === 'rules' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><FileText size={20} /><span className="text-[8px] font-black uppercase">Reglas</span></button>
            <button onClick={() => setView('squad')} className={`flex flex-col items-center gap-1 transition-all ${view === 'squad' ? 'text-[#22c55e] scale-110' : 'text-white/40 hover:text-white'}`}><Shield size={20} /><span className="text-[8px] font-black uppercase">Plantilla</span></button>
            <button onClick={() => setView('classification')} className={`flex flex-col items-center gap-1 transition-all ${view === 'classification' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><Trophy size={20} /><span className="text-[8px] font-black uppercase">Rank</span></button>
            <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-sky-400 scale-110' : 'text-white/40 hover:text-white'}`}><CalendarDays size={20} /><span className="text-[8px] font-black uppercase">Calendario</span></button>
            <button onClick={onLogout} className="flex flex-col items-center gap-1 text-white/40 hover:text-red-500 transition-all group"><LogOut size={20} /><span className="text-[8px] font-black uppercase">Salir</span></button>
        </div>
    </div>
);

export const Slot = ({ p, on, cap, setCap, showCap, active }: any) => (
  <div className="flex flex-col items-center gap-1.5">
    <div onClick={on} className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'} ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer' : (p && on) ? 'cursor-pointer' : 'cursor-default'}`}>{p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <Plus size={18} className="text-white/20"/>}</div>
    {p && showCap && <button onClick={(e) => { e.stopPropagation(); setCap(); }} className={`w-6 h-6 rounded-full border-2 font-black text-[10px] flex items-center justify-center transition-all z-50 ${cap ? 'bg-[#facc15] text-black border-white scale-110' : 'bg-black/60 text-white/30 border-white/10'}`}>{cap ? <Check size={10} strokeWidth={4}/> : 'C'}</button>}
  </div>
);

export const SelectionModal = ({ activeSlot, onClose, onSelect, onRemove, selectedIds, sortValue, setSortValue, sortAlpha, setSortAlpha, activeSortType, setActiveSortType, currentSelection, allPlayersSelected }: any) => {
  const isTitular = activeSlot.type === 'titular';
  const forcedPos = isTitular ? activeSlot.pos : "TODOS";
  const [filterCountry, setFilterCountry] = useState("TODOS");
  const [filterPos, setFilterPos] = useState(forcedPos);

  const uniqueCountries = useMemo(() => { const countries = new Set(PLAYERS_DB.map(p => p.seleccion)); return ["TODOS", ...Array.from(countries).sort()]; }, []);
  const countryCounts = useMemo(() => { return allPlayersSelected.reduce((acc: any, p: any) => { if (p.id !== currentSelection?.id) acc[p.seleccion] = (acc[p.seleccion] || 0) + 1; return acc; }, {}); }, [allPlayersSelected, currentSelection]);
  const filteredPlayers = useMemo(() => {
    let result = PLAYERS_DB.filter(p => !selectedIds.includes(p.id));
    if (filterCountry !== "TODOS") result = result.filter(p => p.seleccion === filterCountry);
    if (filterPos !== "TODOS") result = result.filter(p => p.posicion === filterPos);
    result.sort((a, b) => { if (activeSortType === 'value') return sortValue === 'desc' ? b.precio - a.precio : a.precio - b.precio; return sortAlpha === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre); });
    return result;
  }, [selectedIds, filterCountry, filterPos, sortValue, sortAlpha, activeSortType]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#05080f] p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic uppercase tracking-tighter">ELEGIR JUGADOR</h2><button onClick={onClose} className="p-3 bg-white/5 rounded-full"><X/></button></div>
      {currentSelection && <button onClick={onRemove} className="mb-6 w-full bg-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-xs uppercase"><Trash2 size={16}/> ELIMINAR</button>}
      <div className="flex gap-2 mb-4">{["POR", "DEF", "MED", "DEL"].map(pos => (<button key={pos} disabled={isTitular} onClick={() => setFilterPos(pos)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${filterPos === pos ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'} ${isTitular && filterPos !== pos ? 'opacity-20' : ''}`}>{pos}</button>))}</div>
      <div className="flex flex-wrap gap-2 mb-6 max-h-44 overflow-y-auto pr-2 custom-scrollbar content-start">{uniqueCountries.map(s => { const count = countryCounts[s] || 0; const isFull = count >= 7; return (<button key={s} onClick={() => setFilterCountry(s)} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[9px] italic whitespace-nowrap active:scale-95 mb-1 ${filterCountry === s ? 'bg-[#22c55e] text-black shadow-lg shadow-green-500/20' : (isFull ? 'bg-red-900/40 text-red-500 border border-red-500/30' : 'bg-[#162136] text-white/40 hover:bg-[#1c2a45]')}`}>{s !== "TODOS" && <span>{getFlag(s)}</span>} {s} {s !== "TODOS" && <span className={`${isFull ? 'text-red-400' : 'opacity-50'}`}>({count}/7)</span>}</button>); })}</div>
      <div className="grid grid-cols-2 gap-3 mb-6"><button onClick={() => { setSortValue((prev: string) => prev === 'desc' ? 'asc' : 'desc'); setActiveSortType('value'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'value' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}><ArrowUpDown size={14}/> {sortValue === 'desc' ? '€ MAX' : '€ MIN'}</button><button onClick={() => { setSortAlpha((prev: string) => prev === 'asc' ? 'desc' : 'asc'); setActiveSortType('alpha'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'alpha' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}><ArrowDownUp size={14}/> {sortAlpha === 'asc' ? 'A-Z' : 'Z-A'}</button></div>
      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">{filteredPlayers.map(p => (<div key={p.id} onClick={() => onSelect(p)} className="p-4 rounded-2xl flex justify-between items-center border bg-[#162136] border-white/5 active:scale-95 cursor-pointer"><div className="flex items-center gap-3 font-black italic uppercase tracking-tighter"><span className="text-2xl">{getFlag(p.seleccion)}</span><div className="flex flex-col text-left"><span className="text-sm">{p.nombre}</span><span className="text-[8px] text-white/40 tracking-widest">{p.posicion}</span></div></div><div className="text-right"><span className="text-[#22c55e] font-black text-lg block">{p.precio}M</span></div></div>))}</div>
    </div>
  );
};
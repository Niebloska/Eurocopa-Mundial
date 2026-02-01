"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Timer, Check, X, Lock, ArrowRight, Trophy, Edit3, Save, Volume2, VolumeX, 
  Users, LogOut, FileText, CalendarDays, Shield, ChevronUp, ChevronDown, User, Ban,
  ArrowUpDown, ArrowDownUp, Trash2, RefreshCcw
} from 'lucide-react';
import { PLAYERS_DB } from './players';

// ==========================================
// 1. CONFIGURACIÓN Y DATOS
// ==========================================

const MASTER_EMAIL = "admin@euro2024.com"; 
const VALID_FORMATIONS = ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"];

const posColors: Record<string, string> = {
  "POR": "bg-[#facc15] text-black", 
  "DEF": "bg-[#3b82f6] text-white",
  "MED": "bg-[#10b981] text-white", 
  "DEL": "bg-[#ef4444] text-white"
};

const getFlag = (country: string) => {
  const flags: Record<string, string> = {
    "España": "🇪🇸", "Alemania": "🇩🇪", "Francia": "🇫🇷", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 
    "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Turquía": "🇹🇷", "Georgia": "🇬🇪", "Portugal": "🇵🇹", "Países Bajos": "🇳🇱",
    "Italia": "🇮🇹", "Albania": "🇦🇱", "Hungría": "🇭🇺", "Suiza": "🇨🇭", "Croacia": "🇭🇷",
    "Eslovenia": "🇸🇮", "Dinamarca": "🇩🇰", "Serbia": "🇷🇸", "Polonia": "🇵🇱", "Austria": "🇦🇹",
    "Bélgica": "🇧🇪", "Eslovaquia": "🇸🇰", "Rumanía": "🇷🇴", "Ucrania": "🇺🇦", "República Checa": "🇨🇿"
  };
  return flags[country] || "🏳️";
};

const EURO_GROUPS_DATA = [
  { name: "GRUPO A", teams: ["Alemania", "Escocia", "Hungría", "Suiza"] },
  { name: "GRUPO B", teams: ["España", "Croacia", "Italia", "Albania"] },
  { name: "GRUPO C", teams: ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"] },
  { name: "GRUPO D", teams: ["Polonia", "Países Bajos", "Austria", "Francia"] },
  { name: "GRUPO E", teams: ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"] },
  { name: "GRUPO F", teams: ["Turquía", "Georgia", "Portugal", "República Checa"] },
];

const MOCK_TEAMS_DB = [
  { id: 101, name: "Los Galácticos", user: "CarlosCR7", points: 0, value: 295 },
  { id: 102, name: "La Furia Roja", user: "Ana_Futbol", points: 0, value: 299 },
  { id: 103, name: "Catenaccio FC", user: "Luigi_99", points: 0, value: 280 },
  { id: 104, name: "Oranje Power", user: "VanBasten_Fan", points: 0, value: 290 },
];

const getMockSquad = (offset: number) => {
  const start = (offset * 11) % Math.max(1, PLAYERS_DB.length - 20);
  const safePlayers = PLAYERS_DB.length > 0 ? PLAYERS_DB : [];
  return {
    titulares: safePlayers.slice(start, start + 11),
    banquillo: safePlayers.slice(start + 11, start + 17),
    extras: safePlayers.slice(start + 17, start + 20)
  };
};

// ==========================================
// 2. COMPONENTES VISUALES
// ==========================================

const Typewriter = ({ text, stepTitle, isError }: { text: string, stepTitle?: string, isError?: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0; setDisplayedText(""); 
    const fullText = text;
    const intervalId = setInterval(() => {
        setDisplayedText((prev) => fullText.substring(0, i + 1));
        i++; if (i === fullText.length) clearInterval(intervalId);
    }, 25);
    return () => clearInterval(intervalId);
  }, [text]);

  return (
    <span>
      {stepTitle && <span className={`${isError ? 'text-red-500' : 'text-[#22c55e]'} font-black mr-2`}>{stepTitle}</span>}
      <span className={isError ? "text-red-400 font-bold" : ""}>{displayedText}</span>
    </span>
  );
};

const CountdownBlock = () => {
  const [timeLeft, setTimeLeft] = useState(11793600); 
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (s: number) => {
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${d}D ${h}H ${m}M ${sec}S`;
  };
  return (
    <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5 mt-2">
       <div className="flex flex-col">
          <span className="text-lg font-black text-[#facc15] font-mono leading-none tracking-tight">{formatTime(timeLeft)}</span>
          <span className="text-[8px] font-bold text-[#22c55e] uppercase tracking-widest mt-1">TIEMPO RESTANTE PARA EDITAR MI EQUIPO</span>
       </div>
       <div className="bg-[#facc15] p-2 rounded-full text-black shadow-lg shadow-yellow-500/20"><Lock size={18} /></div>
    </div>
  );
};

const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio("/Banda sonora EF 2024.mp3"); 
        audioRef.current.loop = true; audioRef.current.volume = 0.5;
    }
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);
  useEffect(() => {
    if (audioRef.current) { if (playing) audioRef.current.play().catch(console.error); else audioRef.current.pause(); }
  }, [playing]);
  return (
    <button onClick={() => setPlaying(!playing)} className="p-2 bg-[#1c2a45] rounded-full border border-white/10 hover:bg-white/10 transition-all text-[#22c55e]">
      {playing ? <Volume2 size={16} className="animate-pulse"/> : <VolumeX size={16} className="text-white/50"/>}
    </button>
  );
};

const MiniPlayer = ({ p, small }: any) => {
  if (!p) return null;
  return (
    <div className={`flex flex-col items-center ${small ? 'gap-0.5' : 'gap-1'}`}>
      <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 bg-white flex items-center justify-center border-[#22c55e] relative shadow-md`}>
        <span className="text-[8px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop().substring(0, 8)}</span>
      </div>
      <span className={`text-[7px] font-black uppercase px-1 rounded ${posColors[p.posicion]}`}>{p.posicion}</span>
    </div>
  );
}

// --- SLOT TITULAR (SIN ÓVALO EN BANDERA, TAMAÑO XL) ---
const Slot = ({ p, on, cap, setCap, showCap, active, editable }: any) => (
  <div className="relative flex flex-col items-center group" onClick={on}>
    {/* CÍRCULO CON NOMBRE */}
    <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'} ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer' : (p && on) ? 'cursor-pointer' : 'cursor-default'}`}>
        {p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <Plus size={18} className="text-white/20"/>}
        
        {/* BOTÓN CAPITÁN (Esquina Superior Derecha del círculo) */}
        {p && showCap && (
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (editable) setCap(); 
                }} 
                className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 
                ${cap ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg' : 'bg-black/60 text-white/30 border-white/10'} 
                ${editable ? 'hover:bg-black/80 hover:text-white cursor-pointer' : 'cursor-default'}`}
            >
                {cap ? <Check size={8} strokeWidth={4}/> : 'C'}
            </button>
        )}
    </div>

    {/* BANDERA (Fuera, debajo, SIN FONDO, TAMAÑO XL) */}
    {p && (
        <span className="mt-1 text-3xl leading-none block shadow-black drop-shadow-lg z-20 filter">{getFlag(p.seleccion)}</span>
    )}
  </div>
);

// --- CROMO BANQUILLO/NO CONV ---
const BenchCard = ({ player, id, posColor }: any) => {
    return (
        <div className={`w-full h-full flex flex-col items-center justify-between p-1.5 ${player ? 'bg-white' : 'bg-transparent'}`}>
            {player ? (
                <>
                    <span className="text-[10px] font-black text-black text-center uppercase leading-none truncate w-full">{player.nombre.split(' ').pop()}</span>
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-4xl leading-none drop-shadow-md filter">{getFlag(player.seleccion)}</span>
                    </div>
                    <div className={`w-full text-center text-[10px] font-black uppercase py-0.5 rounded-sm ${posColors[player.posicion]}`}>{player.posicion}</div>
                </>
            ) : (
                <span className="text-white/50 font-black text-sm italic self-center my-auto">{id}</span>
            )}
        </div>
    );
};

const Field = ({ selected, step, canInteractField, setActiveSlot, captain, setCaptain }: any) => {
  return (
    <div className="mt-6 relative w-full aspect-[4/5] bg-gradient-to-b from-green-600 to-green-700 rounded-[2.5rem] border-[4px] border-white/20 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>
        {/* LÍNEAS DE CAMPO */}
        <div className="absolute inset-0 border-2 border-white/40 m-4 rounded-lg pointer-events-none"></div>
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/40 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-4 left-1/2 w-48 h-24 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
        <div className="absolute top-4 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
        <div className="absolute top-28 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-full pointer-events-none"></div>
        <div className="absolute bottom-4 left-1/2 w-48 h-24 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
        <div className="absolute bottom-4 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
        <div className="absolute bottom-28 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-full pointer-events-none"></div>

        {/* LÍNEAS DISCONTINUAS */}
        <div className="absolute top-[29%] left-4 right-4 border-t border-dashed border-white/20 pointer-events-none"></div>
        <div className="absolute top-[54%] left-4 right-4 border-t border-dashed border-white/20 pointer-events-none"></div>

        {/* ETIQUETAS */}
        <div className="absolute top-[8%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEL</div>
        <div className="absolute top-[33%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">MED</div>
        <div className="absolute top-[58%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEF</div>
        <div className="absolute top-[88%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-xl text-black text-[10px] font-black italic z-20 border-r border-y border-white/20">POR</div>
        
        {/* JUGADORES */}
        <div className="absolute top-[20%] w-full -translate-y-1/2 flex justify-center gap-4 px-6 z-30">
            {[1,2,3].map(i => (<Slot key={i} active={canInteractField && !selected[`DEL-${i}`]} p={selected[`DEL-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEL-${i}`, type:'titular', pos:'DEL'})} cap={captain === selected[`DEL-${i}`]?.id} setCap={() => setCaptain(selected[`DEL-${i}`].id)} showCap={step >= 3} editable={canInteractField} />))}
        </div>
        <div className="absolute top-[45%] w-full -translate-y-1/2 flex justify-between gap-1 px-6 z-30">
            {[1,2,3,4,5].map(i => (<Slot key={i} active={canInteractField && !selected[`MED-${i}`]} p={selected[`MED-${i}`]} on={() => canInteractField && setActiveSlot({id: `MED-${i}`, type:'titular', pos:'MED'})} cap={captain === selected[`MED-${i}`]?.id} setCap={() => setCaptain(selected[`MED-${i}`].id)} showCap={step >= 3} editable={canInteractField} />))}
        </div>
        <div className="absolute top-[70%] w-full -translate-y-1/2 flex justify-between gap-1 px-6 z-30">
            {[1,2,3,4,5].map(i => (<Slot key={i} active={canInteractField && !selected[`DEF-${i}`]} p={selected[`DEF-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEF-${i}`, type:'titular', pos:'DEF'})} cap={captain === selected[`DEF-${i}`]?.id} setCap={() => setCaptain(selected[`DEF-${i}`].id)} showCap={step >= 3} editable={canInteractField} />))}
        </div>
        <div className="absolute top-[90%] w-full -translate-y-1/2 flex justify-center z-30">
            <Slot active={canInteractField && !selected["POR-1"]} p={selected["POR-1"]} on={() => canInteractField && setActiveSlot({id: "POR-1", type:'titular', pos:'POR'})} cap={captain === selected["POR-1"]?.id} setCap={() => setCaptain(selected["POR-1"].id)} showCap={step >= 3} editable={canInteractField} />
        </div>
    </div>
  );
};

const NavBar = ({ view, setView, onLogout, squadCompleted }: any) => (
  <div className="fixed top-0 left-0 w-full z-[110] bg-[#0d1526] border-b border-white/10 px-4 py-3 shadow-lg">
      <div className="max-w-md mx-auto flex justify-between items-center">
          <button onClick={() => setView('rules')} className={`flex flex-col items-center gap-1 transition-all ${view === 'rules' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><FileText size={20} /><span className="text-[8px] font-black uppercase">Reglas</span></button>
          <button onClick={() => setView('squad')} className={`flex flex-col items-center gap-1 transition-all ${view === 'squad' ? 'text-[#22c55e] scale-110' : 'text-white/40 hover:text-white'}`}><Shield size={20} /><span className="text-[8px] font-black uppercase">Plantilla</span></button>
          <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('quiniela')} className={`flex flex-col items-center gap-1 transition-all ${view === 'quiniela' ? 'text-purple-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><Trophy size={20} /><span className="text-[8px] font-black uppercase">EUROQUINIELA</span></button>
          <button onClick={() => setView('classification')} className={`flex flex-col items-center gap-1 transition-all ${view === 'classification' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><Users size={20} /><span className="text-[8px] font-black uppercase">Clasificación</span></button>
          <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-sky-400 scale-110' : 'text-white/40 hover:text-white'}`}><CalendarDays size={20} /><span className="text-[8px] font-black uppercase">Calendario</span></button>
          <button onClick={onLogout} className="flex flex-col items-center gap-1 text-white/40 hover:text-red-500 transition-all group"><LogOut size={20} /><span className="text-[8px] font-black uppercase">Salir</span></button>
      </div>
  </div>
);

const AuthScreen = ({ onLogin }: { onLogin: (email: string, username: string, teamName?: string) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return alert("Rellena todos los campos");
    if (isRegister && !teamName) return alert("Debes poner un nombre a tu equipo");
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
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">USUARIO</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" placeholder="Tu nombre de manager" /></div>
          {isRegister && <div className="space-y-1 animate-in fade-in"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">NOMBRE EQUIPO</label><input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" placeholder="Ej: Los Invencibles" /></div>}
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">EMAIL</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" placeholder="correo@ejemplo.com" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">CONTRASEÑA</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e]" placeholder="••••••••" /></div>
          <button type="submit" className="w-full py-4 mt-6 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-black italic uppercase rounded-xl shadow-lg">{isRegister ? "CREAR CUENTA" : "ENTRAR"}</button>
        </form>
        <div className="mt-6 text-center border-t border-white/5 pt-4"><button type="button" onClick={() => setIsRegister(!isRegister)} className="text-xs text-white/50 hover:text-white font-bold underline uppercase">{isRegister ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Nuevo aquí? Regístrate gratis"}</button></div>
      </div>
    </div>
  );
};

const SelectionModal = ({ activeSlot, onClose, onSelect, onRemove, selectedIds, currentSelection, allPlayersSelected, 
  sortPrice, setSortPrice, sortAlpha, setSortAlpha, activeSort, setActiveSort 
}: any) => {
  const isTitular = activeSlot.type === 'titular';
  const [filterCountry, setFilterCountry] = useState("TODOS");
  const [filterPos, setFilterPos] = useState(isTitular ? activeSlot.pos : "TODOS");

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPlayersSelected.forEach((p: any) => { if (currentSelection && p.id === currentSelection.id) return; counts[p.seleccion] = (counts[p.seleccion] || 0) + 1; });
    return counts;
  }, [allPlayersSelected, currentSelection]);

  const uniqueCountries = useMemo(() => ["TODOS", ...Array.from(new Set(PLAYERS_DB.map(p => p.seleccion))).sort()], []);
  const filteredPlayers = useMemo(() => {
    let result = PLAYERS_DB.filter(p => !selectedIds.includes(p.id));
    if (filterCountry !== "TODOS") result = result.filter(p => p.seleccion === filterCountry);
    if (filterPos !== "TODOS") result = result.filter(p => p.posicion === filterPos);
    result.sort((a, b) => activeSort === 'price' ? (sortPrice === 'desc' ? b.precio - a.precio : a.precio - b.precio) : (sortAlpha === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)));
    return result;
  }, [selectedIds, filterCountry, filterPos, activeSort, sortPrice, sortAlpha]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#05080f] p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic uppercase tracking-tighter">ELEGIR JUGADOR</h2><button onClick={onClose} className="p-3 bg-white/5 rounded-full"><X/></button></div>
      {currentSelection && <button onClick={onRemove} className="mb-6 w-full bg-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-xs uppercase"><Trash2 size={16}/> ELIMINAR</button>}
      <div className="flex gap-2 mb-4">{["POR", "DEF", "MED", "DEL"].map(pos => (<button key={pos} disabled={isTitular && activeSlot.pos !== pos} onClick={() => setFilterPos(pos)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${filterPos === pos ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'} ${isTitular && activeSlot.pos !== pos ? 'opacity-20' : ''}`}>{pos}</button>))}</div>
      <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => { setSortPrice((prev: any) => prev === 'desc' ? 'asc' : 'desc'); setActiveSort('price'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'price' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><ArrowUpDown size={14}/> {sortPrice === 'desc' ? 'PRECIO MÁX' : 'PRECIO MÍN'}</button>
          <button onClick={() => { setSortAlpha((prev: any) => prev === 'asc' ? 'desc' : 'asc'); setActiveSort('alpha'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'alpha' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><ArrowDownUp size={14}/> {sortAlpha === 'asc' ? 'A - Z' : 'Z - A'}</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 max-h-32 overflow-y-auto pr-2 custom-scrollbar content-start">{uniqueCountries.map(s => { const count = countryCounts[s] || 0; const isFull = count >= 7; return (<button key={s} onClick={() => setFilterCountry(s)} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[9px] italic whitespace-nowrap active:scale-95 mb-1 ${filterCountry === s ? 'bg-[#22c55e] text-black shadow-lg shadow-green-500/20' : isFull ? 'bg-red-900/40 text-red-500 border border-red-500/30' : 'bg-[#162136] text-white/40 hover:bg-[#1c2a45]'}`}>{s !== "TODOS" && <span>{getFlag(s)}</span>} {s} {s !== "TODOS" && <span className={isFull ? "text-red-400" : "opacity-50"}>({count}/7)</span>}</button>); })}</div>
      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">{filteredPlayers.map(p => (<div key={p.id} onClick={() => onSelect(p)} className="p-4 rounded-2xl flex justify-between items-center border bg-[#162136] border-white/5 active:scale-95 cursor-pointer"><div className="flex items-center gap-3 font-black italic uppercase tracking-tighter"><span className="text-2xl">{getFlag(p.seleccion)}</span><div className="flex flex-col text-left"><span className="text-sm">{p.nombre}</span><span className="text-[8px] text-white/40 tracking-widest">{p.posicion}</span></div></div><div className="text-right"><span className="text-[#22c55e] font-black text-lg block">{p.precio}M</span></div></div>))}</div>
    </div>
  );
};

const generateFixture = () => {
  const G = [
    { n: "GRUPO A", m: [{t1:"Alemania",t2:"Escocia",d:"14 Jun 21:00"},{t1:"Hungría",t2:"Suiza",d:"15 Jun 15:00"},{t1:"Alemania",t2:"Hungría",d:"19 Jun 18:00"},{t1:"Escocia",t2:"Suiza",d:"19 Jun 21:00"},{t1:"Suiza",t2:"Alemania",d:"23 Jun 21:00"},{t1:"Escocia",t2:"Hungría",d:"23 Jun 21:00"}]},
    { n: "GRUPO B", m: [{t1:"España",t2:"Croacia",d:"15 Jun 18:00"},{t1:"Italia",t2:"Albania",d:"15 Jun 21:00"},{t1:"Croacia",t2:"Albania",d:"19 Jun 15:00"},{t1:"España",t2:"Italia",d:"20 Jun 21:00"},{t1:"Albania",t2:"España",d:"24 Jun 21:00"},{t1:"Croacia",t2:"Italia",d:"24 Jun 21:00"}]},
    { n: "GRUPO C", m: [{t1:"Eslovenia",t2:"Dinamarca",d:"16 Jun 18:00"},{t1:"Serbia",t2:"Inglaterra",d:"16 Jun 21:00"},{t1:"Eslovenia",t2:"Serbia",d:"20 Jun 15:00"},{t1:"Dinamarca",t2:"Inglaterra",d:"20 Jun 18:00"},{t1:"Inglaterra",t2:"Eslovenia",d:"25 Jun 21:00"},{t1:"Dinamarca",t2:"Serbia",d:"25 Jun 21:00"}]},
    { n: "GRUPO D", m: [{t1:"Polonia",t2:"Países Bajos",d:"16 Jun 15:00"},{t1:"Austria",t2:"Francia",d:"17 Jun 21:00"},{t1:"Polonia",t2:"Austria",d:"21 Jun 18:00"},{t1:"Países Bajos",t2:"Francia",d:"21 Jun 21:00"},{t1:"Países Bajos",t2:"Austria",d:"25 Jun 18:00"},{t1:"Francia",t2:"Polonia",d:"25 Jun 18:00"}]},
    { n: "GRUPO E", m: [{t1:"Rumanía",t2:"Ucrania",d:"17 Jun 15:00"},{t1:"Bélgica",t2:"Eslovaquia",d:"17 Jun 18:00"},{t1:"Eslovaquia",t2:"Ucrania",d:"21 Jun 15:00"},{t1:"Bélgica",t2:"Rumanía",d:"22 Jun 21:00"},{t1:"Eslovaquia",t2:"Rumanía",d:"26 Jun 18:00"},{t1:"Ucrania",t2:"Bélgica",d:"26 Jun 18:00"}]},
    { n: "GRUPO F", m: [{t1:"Turquía",t2:"Georgia",d:"18 Jun 18:00"},{t1:"Portugal",t2:"República Checa",d:"18 Jun 21:00"},{t1:"Georgia",t2:"República Checa",d:"22 Jun 15:00"},{t1:"Turquía",t2:"Portugal",d:"22 Jun 18:00"},{t1:"Georgia",t2:"Portugal",d:"26 Jun 21:00"},{t1:"República Checa",t2:"Turquía",d:"26 Jun 21:00"}]}
  ];
  return G;
};

const CalendarView = () => (
  <div className="max-w-md mx-auto px-4 mt-20 pb-32 animate-in fade-in">
     <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><CalendarDays /> CALENDARIO</h1>
     <div className="space-y-6">
        {generateFixture().map((g) => (
          <div key={g.n} className="bg-[#1c2a45] rounded-2xl overflow-hidden border border-white/5">
             <div className="bg-[#22c55e] p-2 text-center"><h3 className="font-black italic text-black uppercase">{g.n}</h3></div>
             <div className="divide-y divide-white/5">
                 {g.m.map((m, i) => (
                   <div key={i} className="flex flex-col relative">
                      {i % 2 === 0 && <div className="bg-blue-600 w-full text-center text-[10px] font-black text-white uppercase tracking-widest py-1">JORNADA {Math.floor(i/2) + 1}</div>}
                      <div className="p-4 pt-6 flex items-center justify-between">
                          <div className="w-[40%] flex items-center justify-end gap-2 text-right">
                              <span className="text-xs font-black uppercase text-white leading-tight">{m.t1}</span>
                              <span className="text-3xl">{getFlag(m.t1)}</span>
                          </div>

                          <div className="w-[20%] text-center">
                              <span className="text-[9px] text-[#facc15] font-mono font-bold block mb-0.5">{m.d.split(' ')[0]} {m.d.split(' ')[1]}</span>
                              <span className="text-[9px] text-white/40 block mb-1">{m.d.split(' ')[2]}</span>
                              <span className="text-white/20 font-black text-xl tracking-widest">-:-</span>
                          </div>

                          <div className="w-[40%] flex items-center justify-start gap-2 text-left">
                              <span className="text-3xl">{getFlag(m.t2)}</span>
                              <span className="text-xs font-black uppercase text-white leading-tight">{m.t2}</span>
                          </div>
                      </div>
                   </div>
                 ))}
             </div>
          </div>
        ))}
     </div>
  </div>
);

// COMPONENTE TARJETA DE EQUIPO (Clasificación - Once Inicial Centrado)
const TeamCard = ({ team, rank, isMyTeam, isAdmin }: any) => {
  const [expanded, setExpanded] = useState(false);
  const canView = isMyTeam || isAdmin;
  const squadData = team.squad || getMockSquad(team.id);

  const filterByPos = (pos: string) => squadData.titulares?.filter((p:any) => p.posicion === pos) || [];

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden mb-3 ${isMyTeam ? 'bg-[#1c2a45] border-[#22c55e]' : 'bg-[#1c2a45] border-white/5'}`}>
       <div onClick={() => canView && setExpanded(!expanded)} className={`p-4 flex items-center justify-between ${!canView ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'} transition-colors`}>
          <div className="flex items-center gap-4"><span className={`text-2xl font-black italic w-8 text-center ${rank === 1 ? 'text-[#facc15]' : 'text-white/30'}`}>#{rank}</span><div><h3 className={`font-black text-sm uppercase italic ${isMyTeam ? 'text-[#22c55e]' : 'text-white'}`}>{team.name}</h3><div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold"><User size={10} /> {team.user}</div></div></div>
          <div className="flex items-center gap-4"><div className="text-right"><span className="block font-black text-[#22c55e] text-lg">{team.points} PTS</span><span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span></div>{!canView ? <Lock size={16} className="text-white/20"/> : (expanded ? <ChevronUp size={20} className="text-white/30"/> : <ChevronDown size={20} className="text-white/30"/>)}</div>
       </div>
       {!canView && <div onClick={() => alert("🔒 Plantilla oculta hasta el inicio del torneo")} className="h-0" />} 
       
       {expanded && canView && (
         <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4">
            <div className="border border-[#22c55e]/20 rounded-2xl bg-[#2e9d4a]/10 p-4 relative overflow-hidden">
              <p className="text-[9px] font-black uppercase text-[#22c55e] mb-3 text-center">ONCE INICIAL</p>
              
              {/* LÍNEA DELANTEROS */}
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 py-1 rounded bg-[#ef4444] text-white text-[8px] font-black text-center">DEL</div>
                  <div className="flex flex-wrap gap-2 flex-1 justify-center">
                      {filterByPos('DEL').map((p:any) => (
                          <div key={p.id} className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span>
                              <span className="text-xl leading-none">{getFlag(p.seleccion)}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* LÍNEA MEDIOS */}
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 py-1 rounded bg-[#10b981] text-white text-[8px] font-black text-center">MED</div>
                  <div className="flex flex-wrap gap-2 flex-1 justify-center">
                      {filterByPos('MED').map((p:any) => (
                          <div key={p.id} className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span>
                              <span className="text-xl leading-none">{getFlag(p.seleccion)}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* LÍNEA DEFENSAS */}
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 py-1 rounded bg-[#3b82f6] text-white text-[8px] font-black text-center">DEF</div>
                  <div className="flex flex-wrap gap-2 flex-1 justify-center">
                      {filterByPos('DEF').map((p:any) => (
                          <div key={p.id} className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span>
                              <span className="text-xl leading-none">{getFlag(p.seleccion)}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* LÍNEA PORTERO */}
              <div className="flex items-center gap-2">
                  <div className="w-8 py-1 rounded bg-[#facc15] text-black text-[8px] font-black text-center">POR</div>
                  <div className="flex flex-wrap gap-2 flex-1 justify-center">
                      {filterByPos('POR').map((p:any) => (
                          <div key={p.id} className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span>
                              <span className="text-xl leading-none">{getFlag(p.seleccion)}</span>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
            
            {/* BANQUILLO Y NO CONV (2 COLUMNAS) */}
            <div className="grid grid-cols-2 gap-3">
               <div className="border border-sky-500/20 rounded-2xl bg-sky-900/10 p-3">
                   <p className="text-[9px] font-black uppercase text-sky-400 mb-3 text-center">BANQUILLO</p>
                   <div className="grid grid-cols-2 gap-2">
                       {squadData.banquillo?.map((p:any) => <BenchCard key={p.id} player={p} id="S" />)}
                   </div>
               </div>
               <div className="border border-white/10 rounded-2xl bg-white/5 p-3">
                   <p className="text-[9px] font-black uppercase text-white/40 mb-3 text-center">NO CONV.</p>
                   <div className="grid grid-cols-2 gap-2">
                       {squadData.extras?.length > 0 ? squadData.extras.map((p:any) => <BenchCard key={p.id} player={p} id="NC" />) : <span className="text-[8px] text-white/20 italic col-span-2 text-center self-center">Vacío</span>}
                   </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function EuroApp() {
  const [user, setUser] = useState<{email: string, username: string, teamName?: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'rules' | 'squad' | 'classification' | 'calendar' | 'quiniela'>('squad'); 
  const [teamName, setTeamName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  const [captain, setCaptain] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [squadValidated, setSquadValidated] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<Record<string, string[]>>({});
  const [quinielaLocked, setQuinielaLocked] = useState(false);
  
  const [sortPrice, setSortPrice] = useState<'desc' | 'asc'>('desc');
  const [sortAlpha, setSortAlpha] = useState<'asc' | 'desc'>('asc');
  const [activeSort, setActiveSort] = useState<'price' | 'alpha'>('price');
  
  const [hasValidatedOnce, setHasValidatedOnce] = useState(false);

  // --- PERSISTENCIA DE DATOS ---
  useEffect(() => {
    const savedUser = localStorage.getItem('euro_user');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAdmin(parsed.email === MASTER_EMAIL);
        if (parsed.teamName) { setTeamName(parsed.teamName); setNameLocked(true); }
        
        const savedGame = localStorage.getItem(`euro_game_${parsed.email}`);
        if (savedGame) {
            const gameData = JSON.parse(savedGame);
            setSelected(gameData.selected || {}); setBench(gameData.bench || {}); setExtras(gameData.extras || {});
            setCaptain(gameData.captain || null); setStep(gameData.step || 1); setTeamName(gameData.teamName || parsed.teamName);
            setQuinielaSelections(gameData.quinielaSelections || {}); setSquadValidated(gameData.squadValidated || false);
            setQuinielaLocked(gameData.quinielaLocked || false); if (gameData.teamName) setNameLocked(true);
            setHasValidatedOnce(gameData.hasValidatedOnce || false);
        }
    }
  }, []);

  useEffect(() => {
    if (user) {
        const gameState = { selected, bench, extras, captain, step, teamName, quinielaSelections, squadValidated, quinielaLocked, hasValidatedOnce };
        localStorage.setItem(`euro_game_${user.email}`, JSON.stringify(gameState));
    }
  }, [selected, bench, extras, captain, step, teamName, quinielaSelections, squadValidated, quinielaLocked, user, hasValidatedOnce]);

  const handleLogin = (email: string, username: string, tName?: string) => {
    const newUser = { email, username, teamName: tName };
    setUser(newUser); setIsAdmin(email === MASTER_EMAIL);
    if (tName) { setTeamName(tName); setNameLocked(true); }
    localStorage.setItem('euro_user', JSON.stringify(newUser));
  };

  const handleLogout = () => { setUser(null); setIsAdmin(false); localStorage.removeItem('euro_user'); setView('squad'); };

  const tactic = useMemo(() => {
    const def = Object.keys(selected).filter(k => k.startsWith("DEF")).length;
    const med = Object.keys(selected).filter(k => k.startsWith("MED")).length;
    const del = Object.keys(selected).filter(k => k.startsWith("DEL")).length;
    return `${def}-${med}-${del}`;
  }, [selected]);

  const isValidTactic = useMemo(() => VALID_FORMATIONS.includes(tactic), [tactic]);
  const allPlayers = [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)];
  const budgetSpent = allPlayers.reduce((acc: number, p: any) => acc + p.precio, 0);
  const isOverBudget = budgetSpent > 300;

  const canInteractField = (step >= 2 && step <= 5) || isEditing;
  const canInteractBench = (step >= 4 && step <= 5) || isEditing;
  const canInteractExtras = (step === 5) || isEditing;

  useEffect(() => {
    if (isEditing) return;
    if (step === 2 && Object.keys(selected).length === 11) {
        if (isValidTactic) setStep(3);
    }
    if (step === 3 && captain) setStep(4);
    if (step === 4 && Object.keys(bench).length === 6) setStep(5);
  }, [selected, captain, bench, step, isEditing, isValidTactic]);

  const handleValidateSquad = () => { 
      if (!isValidTactic) return alert("⚠️ Táctica inválida. Revisa tu alineación.");
      if (Object.keys(selected).length !== 11) return alert("⚠️ Debes tener 11 titulares.");
      if (isOverBudget) return alert("⚠️ Presupuesto excedido.");
      setSquadValidated(true); setHasValidatedOnce(true); setStep(6); 
  };
  
  const handleGoToQuiniela = () => {
      setSquadValidated(true);
      setHasValidatedOnce(true);
      setView('quiniela');
  }

  const handleUnlockSquad = () => { setSquadValidated(false); setStep(5); };
  
  const handleResetTeam = () => {
      if (confirm("¿Estás seguro? Se borrará TODO tu equipo y empezarás de cero.")) {
          setSelected({}); setBench({}); setExtras({}); setCaptain(null); setTeamName("");
          setNameLocked(false); setStep(1); setSquadValidated(false); setQuinielaSelections({});
          setQuinielaLocked(false); setHasValidatedOnce(false); localStorage.removeItem(`euro_game_${user?.email}`);
      }
  };

  const getAssistantState = () => {
      if (isEditing) return { title: "", text: "MODO EDICIÓN ACTIVADO. Recuerda que puedes editar cualquier detalle hasta que se acabe el tiempo." };
      
      if (Object.keys(selected).length === 11 && !isValidTactic) {
          return { title: "ALERTA", text: "Tu táctica no es válida, corríjela.", isError: true };
      }

      if (isOverBudget) return { title: "ALERTA", text: "⚠️ Presupuesto excedido." };
      
      if (view === 'quiniela') {
          if (quinielaLocked) return { title: "¡HECHO!", text: "¡Enhorabuena, ya tienes tu equipo de elegidos para la gloria y tu apuesta en la Euroquiniela! Recuerda que puedes editar cualquier detalle hasta que se acabe el tiempo." };
          return { title: "PASO 7 DE 7", text: "Te explico como funciona: debes elegir a las 2 selecciones que crees que se clasificarán para la siguiente fase. Cuando hayas rellenado todos los grupos pulsa en el botón VALIDAR." };
      }
      
      if (!squadValidated && hasValidatedOnce && step === 5) return { title: "MODO EDICIÓN", text: "Edita tu equipo y no olvides pulsar VALIDAR EQUIPO para guardar los cambios." };
      if (squadValidated) return { title: "¡LISTO!", text: "Recuerda que puedes editar tu plantilla las veces que quieras hasta que acabe la cuenta atrás." };
      
      switch(step) {
          case 1: return { title: "PASO 1 DE 7", text: "Comienza dándole un nombre a tu equipo." };
          case 2: return { title: "PASO 2 DE 7", text: "Ahora escoge tu once inicial." };
          case 3: return { title: "PASO 3 DE 7", text: "Escoge un capitán, pulsa sobre la “C” sobre cualquier jugador de tu alineación." };
          case 4: return { title: "PASO 4 DE 7", text: "Es hora de escoger a tus suplentes. Recuerda que reemplazarán automáticamente a tus titulares si estos no juegan, pero entrarán estrictamente según el orden de los suplentes." };
          case 5: return { title: "PASO 5 DE 7", text: "Por último escoge a los no convocados, recuerda que puedes elegir entre 0 y 3 jugadores." };
          case 6: return { title: "PASO 6 DE 7", text: "Perfecto, ahora que ya tienes a tu plantilla pasemos a la Euroquiniela, pulsa en el botón verde que acaba de aparecer." };
          default: return { title: "", text: "" };
      }
  };

  const assistant = getAssistantState();

  const toggleQuiniela = (group: string, team: string) => {
      if (quinielaLocked) return;
      const current = quinielaSelections[group] || [];
      if (current.includes(team)) setQuinielaSelections({...quinielaSelections, [group]: current.filter(t => t !== team)});
      else if (current.length < 2) setQuinielaSelections({...quinielaSelections, [group]: [...current, team]});
  };

  const isQuinielaComplete = EURO_GROUPS_DATA.every(g => (quinielaSelections[g.name] || []).length === 2);

  const combinedTeams = useMemo(() => {
      const mySquad = { titulares: Object.values(selected), banquillo: Object.values(bench), extras: Object.values(extras) };
      const myTeam = { id: 999, name: teamName || "Mi Equipo", user: user?.username || "Yo", points: 0, value: budgetSpent, squad: mySquad };
      return [myTeam, ...MOCK_TEAMS_DB].sort((a,b) => b.points - a.points);
  }, [teamName, user, budgetSpent, selected, bench, extras]);

  const activeClass = "border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)] z-20 relative";
  const inactiveClass = "border border-white/5 opacity-80";

  const isTeamComplete = Object.keys(selected).length === 11 && Object.keys(bench).length === 6;

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-44">
      <NavBar view={view} setView={setView} onLogout={handleLogout} squadCompleted={squadValidated} />

      {/* HEADER FIJO CON ASISTENTE Y BARRA DE ACCIÓN */}
      {(view === 'squad' || view === 'quiniela') && (
        <div className="sticky top-[60px] z-[100] bg-[#0d1526]/95 backdrop-blur-md pb-2 shadow-xl border-b border-white/5">
            <div className="px-4 pt-4">
              <div className={`p-4 rounded-2xl border-l-4 transition-all duration-500 ${isOverBudget || assistant.isError ? 'border-red-600 bg-red-950/20' : 'border-[#22c55e] bg-[#1c2a45]'} shadow-2xl mb-3`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-[10px] font-black italic uppercase mb-1 tracking-widest ${isOverBudget || assistant.isError ? 'text-red-500' : 'text-[#22c55e]'}`}>ASISTENTE VIRTUAL</p>
                    <div className="text-xs font-semibold italic min-h-[3rem] leading-relaxed pr-2 whitespace-pre-line">
                      {step === 1 && !isEditing && <div className="mb-2 text-white/70">Bienvenido a la Eurocopa Fantástica 2024. Te voy a guiar paso a paso para que hagas tu equipo y participes en este emocionante juego.</div>}
                      <Typewriter text={assistant.text} stepTitle={assistant.title} isError={assistant.isError} />
                    </div>
                    <CountdownBlock />
                  </div>
                  <div className="flex flex-col gap-2 items-end"><MusicPlayer /></div>
                </div>
              </div>
              
              {view === 'squad' && (
                  <>
                    <div className="mb-2"><div className="flex justify-between uppercase italic font-black text-[10px] mb-1"><span className="text-white/40">PRESUPUESTO</span><span className={isOverBudget ? "text-red-500" : "text-[#22c55e]"}>{budgetSpent}M / 300M</span></div><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5"><div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent / 300) * 100, 100)}%` }} /></div></div>
                    
                    {/* BARRA DE ACCIÓN FIJA SQUAD */}
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleResetTeam} className="bg-red-600/90 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-1 border border-red-500/50"><RefreshCcw size={14}/> RESETEAR PLANTILLA</button>
                        
                        {squadValidated ? (
                            <button onClick={handleUnlockSquad} className="bg-[#facc15] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-[2]"><Edit3 size={14}/> EDITAR EQUIPO</button>
                        ) : (step === 6 ? (
                            <button onClick={handleGoToQuiniela} className="bg-[#22c55e] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-[2] animate-pulse"><Trophy size={14}/> IR A EUROQUINIELA</button>
                        ) : (
                            <button 
                                onClick={handleValidateSquad} 
                                disabled={!isTeamComplete}
                                className={`flex-[2] px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-transform ${isTeamComplete ? 'bg-[#22c55e] text-black hover:scale-105 animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-white/5'}`}
                            >
                                <Check size={14}/> VALIDAR EQUIPO
                            </button>
                        ))}
                    </div>
                  </>
              )}

              {/* BARRA DE ACCIÓN FIJA QUINIELA */}
              {view === 'quiniela' && (
                  <div className="mt-3">
                      {quinielaLocked ? (
                          <button onClick={() => setQuinielaLocked(false)} className="w-full bg-[#facc15] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Edit3 size={14}/> EDITAR QUINIELA</button>
                      ) : (
                          <button 
                              onClick={() => { setQuinielaLocked(true); setStep(7); alert("¡Quiniela validada!"); }} 
                              disabled={!isQuinielaComplete}
                              className={`w-full px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-transform ${isQuinielaComplete ? 'bg-[#22c55e] text-black hover:scale-105 animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-white/5'}`}
                          >
                              <Check size={14}/> {isQuinielaComplete ? "VALIDAR QUINIELA" : "COMPLETA LA QUINIELA"}
                          </button>
                      )}
                  </div>
              )}
            </div>
        </div>
      )}

      {view === 'classification' && (
        <div className="max-w-md mx-auto px-4 mt-20 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><Users /> CLASIFICACIÓN</h1>
            <div className="space-y-4">
                {combinedTeams.map((team, idx) => (
                    <TeamCard key={team.id} team={team} rank={idx + 1} isMyTeam={team.id === 999} isAdmin={isAdmin} />
                ))}
            </div>
        </div>
      )}

      {view === 'quiniela' && (
        <div className="max-w-md mx-auto px-4 mt-6 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><Trophy /> EURO QUINIELA</h1>
            <div className="grid grid-cols-1 gap-6">
                {EURO_GROUPS_DATA.map(g => (
                    <div key={g.name} className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="bg-[#22c55e] p-2 text-center text-black font-black uppercase text-sm">{g.name}</div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {g.teams.map(t => {
                                const isSelected = (quinielaSelections[g.name] || []).includes(t);
                                return (
                                    <button key={t} onClick={() => toggleQuiniela(g.name, t)} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${isSelected ? 'bg-green-600/20 border-[#22c55e]' : 'bg-[#0d1526] border-white/10 hover:bg-white/5'}`}>
                                        <span className="text-2xl">{getFlag(t)}</span>
                                        <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-[#22c55e]' : 'text-white'}`}>{t}</span>
                                        {isSelected && <div className="absolute top-2 right-2 bg-[#22c55e] rounded-full p-0.5"><Check size={10} className="text-black"/></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {view === 'calendar' && <CalendarView />}
      {view === 'rules' && <div className="max-w-md mx-auto px-4 mt-20 pb-32 text-center"><h1 className="text-2xl font-black text-[#22c55e]">REGLAMENTO</h1><p className="text-white/50 mt-4">Consulta las reglas oficiales aquí.</p></div>}

      {view === 'squad' && (
        <>
          <div className="max-w-md mx-auto px-4 mt-40"> 
            
            <div className={`relative mb-3 transition-all duration-300 ${step === 1 ? 'scale-105 z-20' : ''}`}>
                <div className={`relative rounded-2xl overflow-hidden ${step === 1 ? activeClass : 'border border-white/10'}`}>
                    <input className={`w-full p-5 pr-32 bg-[#1c2a45] text-left font-black text-xl text-[#22c55e] border-none outline-none shadow-inner ${nameLocked ? 'opacity-80' : ''}`} placeholder="NOMBRE EQUIPO" value={teamName} disabled={nameLocked} onChange={(e) => setTeamName(e.target.value)} />
                    {!nameLocked && teamName.trim().length >= 3 && (<button onClick={() => { setNameLocked(true); if(step===1) setStep(2); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#22c55e] text-black px-4 py-2.5 rounded-xl font-black text-[10px] z-10 hover:scale-105 transition-transform">OK</button>)}
                    {nameLocked && (<button onClick={() => setNameLocked(false)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#facc15] text-black px-4 py-2.5 rounded-xl font-black text-[10px] z-10 hover:scale-105 transition-transform flex items-center gap-1"><Edit3 size={12}/> EDITAR</button>)}
                </div>
            </div>
            
            <div className="text-left font-black italic text-lg text-white/40 tracking-widest uppercase pl-1">
                TÁCTICA: 
                <span className={`${isValidTactic ? 'text-[#22c55e]' : 'text-red-500'} ml-2 transition-colors`}>
                    {Object.keys(selected).length === 11 ? tactic : '-- -- --'}
                </span>
            </div>

            <Field selected={selected} step={step} canInteractField={canInteractField} setActiveSlot={setActiveSlot} captain={captain} setCaptain={setCaptain} />

            <div className={`mt-8 p-4 rounded-[2.5rem] bg-sky-400/10 transition-all duration-300 ${step === 4 ? activeClass : inactiveClass}`}>
                <p className="text-center font-black italic text-[10px] text-sky-400 mb-3 uppercase tracking-widest">BANQUILLO</p>
                <div className="grid grid-cols-3 gap-3">{["S1", "S2", "S3", "S4", "S5", "S6"].map(id => <div key={id} onClick={() => canInteractBench && setActiveSlot({id, type:'bench', pos: 'TODOS'})} className={`aspect-[1.1/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all ${bench[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-2'} ${canInteractBench ? 'cursor-pointer' : 'opacity-80'}`}><BenchCard player={bench[id]} id={id} posColor={bench[id] ? posColors[bench[id].posicion] : ''} /></div>)}</div>
            </div>

            <div className={`mt-6 p-4 rounded-[2.5rem] bg-[#2a3b5a]/30 transition-all duration-300 ${step === 5 ? activeClass : inactiveClass}`}>
                <p className="text-center font-black italic text-[10px] text-white/40 mb-3 uppercase tracking-widest">NO CONVOCADOS</p>
                <div className="grid grid-cols-3 gap-3 mb-4">{["NC1", "NC2", "NC3"].map(id => <div key={id} onClick={() => canInteractExtras && setActiveSlot({id, type:'extras', pos: 'TODOS'})} className={`aspect-[1.1/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all ${extras[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-2'} ${canInteractExtras ? 'cursor-pointer' : 'opacity-80'}`}><BenchCard player={extras[id]} id={id} posColor={extras[id] ? posColors[extras[id].posicion] : ''} /></div>)}</div>
                
                {/* BOTÓN SOLO APARECE SI NO HAY NADIE FICHADO AQUÍ Y NO ESTÁ VALIDADO */}
                {step === 5 && !isEditing && !squadValidated && Object.keys(extras).length === 0 && (
                    <button onClick={handleValidateSquad} className="w-full bg-red-600/20 text-red-500 border border-red-500/30 p-4 rounded-2xl font-black italic text-[10px] uppercase flex items-center justify-center gap-2 mb-6 hover:bg-red-600/30 transition-all"><Ban size={14}/> NO QUIERO NO CONVOCADOS</button>
                )}
            </div>
          </div>
        </>
      )}

      {activeSlot && (
        <SelectionModal 
          activeSlot={activeSlot} onClose={() => setActiveSlot(null)} 
          selectedIds={allPlayers.map((p: any) => p.id)} allPlayersSelected={allPlayers}
          sortPrice={sortPrice} setSortPrice={setSortPrice} sortAlpha={sortAlpha} setSortAlpha={setSortAlpha} activeSort={activeSort} setActiveSort={setActiveSort}
          onSelect={(p: any) => {
            const isTitular = activeSlot.type === 'titular';
            const currentCount = allPlayers.filter((pl: any) => pl.seleccion === p.seleccion && pl.id !== (selected[activeSlot.id] || bench[activeSlot.id] || extras[activeSlot.id])?.id).length;
            if (currentCount >= 7) { alert(`⚠️ Límite selección (7)`); return; }
            if (isTitular && !selected[activeSlot.id] && Object.keys(selected).length >= 11) { alert("¡Ya tienes 11 titulares!"); return; }
            if (isTitular) setSelected({...selected, [activeSlot.id]: p}); else if (activeSlot.type === 'bench') setBench({...bench, [activeSlot.id]: p}); else if (activeSlot.type === 'extras') setExtras({...extras, [activeSlot.id]: p});
            setActiveSlot(null);
          }}
          onRemove={() => { if (activeSlot.type === 'titular') { const n = {...selected}; delete n[activeSlot.id]; setSelected(n); } else if (activeSlot.type === 'bench') { const n = {...bench}; delete n[activeSlot.id]; setBench(n); } else { const n = {...extras}; delete n[activeSlot.id]; setExtras(n); } setActiveSlot(null); }}
          currentSelection={activeSlot.type === 'titular' ? selected[activeSlot.id] : (activeSlot.type === 'bench' ? bench[activeSlot.id] : extras[activeSlot.id])} 
        />
      )}
    </div>
  );
}
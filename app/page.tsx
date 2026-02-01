"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PLAYERS_DB } from './players';

// ==========================================
// 0. SISTEMA DE ICONOS (SVG PURO - SIN LIBRERÍAS EXTERNAS)
// ==========================================
// Definimos TODOS los iconos a mano para evitar errores de importación "Element type invalid".

const SvgIcon = ({ children, size = 24, className = "", fill = "none", stroke = "currentColor", strokeWidth = 2 }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

// --- Iconos de Interfaz ---
const IconPlus = ({ size=18 }) => <SvgIcon size={size}><path d="M5 12h14"/><path d="M12 5v14"/></SvgIcon>;
const IconCheck = ({ size=18 }) => <SvgIcon size={size}><polyline points="20 6 9 17 4 12"/></SvgIcon>;
const IconX = ({ size=18 }) => <SvgIcon size={size}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></SvgIcon>;
const IconLock = ({ size=18 }) => <SvgIcon size={size}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>;
const IconTrophy = ({ size=18 }) => <SvgIcon size={size}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></SvgIcon>;
const IconEdit = ({ size=18 }) => <SvgIcon size={size}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></SvgIcon>;
const IconVolume2 = ({ size=18 }) => <SvgIcon size={size}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></SvgIcon>;
const IconVolumeX = ({ size=18 }) => <SvgIcon size={size}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></SvgIcon>;
const IconUsers = ({ size=18 }) => <SvgIcon size={size}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>;
const IconLogOut = ({ size=18 }) => <SvgIcon size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></SvgIcon>;
const IconFileText = ({ size=18 }) => <SvgIcon size={size}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></SvgIcon>;
const IconCalendar = ({ size=18 }) => <SvgIcon size={size}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></SvgIcon>;
const IconShield = ({ size=18 }) => <SvgIcon size={size}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></SvgIcon>;
const IconChevronUp = ({ size=18 }) => <SvgIcon size={size}><path d="m18 15-6-6-6 6"/></SvgIcon>;
const IconChevronDown = ({ size=18 }) => <SvgIcon size={size}><path d="m6 9 6 6 6-6"/></SvgIcon>;
const IconUser = ({ size=18 }) => <SvgIcon size={size}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>;
const IconBan = ({ size=18 }) => <SvgIcon size={size}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></SvgIcon>;
const IconArrowUpDown = ({ size=18 }) => <SvgIcon size={size}><path d="m7 15 5 5 5-5"/><path d="M7 9l5-5 5 5"/></SvgIcon>;
const IconArrowDownUp = ({ size=18 }) => <SvgIcon size={size}><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></SvgIcon>;
const IconTrash2 = ({ size=18 }) => <SvgIcon size={size}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></SvgIcon>;
const IconRefresh = ({ size=18 }) => <SvgIcon size={size}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></SvgIcon>;

// --- Iconos Personalizados (Reglas) ---
const IconStar = ({ className, fill = "currentColor" }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

const IconBoot = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
    <path d="M49.6 232.8C20.4 262.8 3.1 303 1.2 344.8 0 371.2 8.8 448 8.8 448l24.8 24.8 19.2-22.4 20.8 20.8 20-22.4 20 23.2 20-24 19.2 23.2 20.8-21.6 23.2 19.2 13.6-28.8c42.4-8 84.8-19.2 119.2-36 60-29.6 112-76 136.8-136.8 12.8-31.2 16-64 8.8-96.8-4-18.4-12-36-24-51.2-16.8-21.6-40.8-36.8-66.4-44.8-36-11.2-75.2-8-109.6 8-28.8 13.6-54.4 34.4-76.8 59.2-24 26.4-42.4 56.8-56.8 88.8l-1.6 2.4z" fill="#374151"/>
    <path d="M137.6 244c-12 16-24.8 31.2-39.2 44.8l-20-20c13.6-12.8 25.6-27.2 36.8-42.4L137.6 244zM180.8 204.8c-12 17.6-26.4 33.6-41.6 48.8l-20.8-20.8c14.4-14.4 27.2-29.6 38.4-46.4L180.8 204.8zM221.6 163.2c-12.8 18.4-27.2 35.2-43.2 50.4l-20-20.8c15.2-14.4 28.8-30.4 40.8-48L221.6 163.2z" fill="#9ca3af"/>
    <path d="M52 480h16v32H52zM108 472h16v32h-16zM164 464h16v32h-16zM220 448h16v32h-16z" fill="#d1d5db"/>
  </svg>
);

const IconSub = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" stroke="none" /> 
    <path d="M16 9l-4-4-4 4" stroke="#22c55e" />
    <path d="M12 5v7" stroke="#22c55e" />
    <path d="M12 19l4-4" stroke="#ef4444" />
    <path d="M8 15l4 4" stroke="#ef4444" />
    <path d="M12 12v7" stroke="#ef4444" />
  </svg>
);

const IconCaptain = () => (
    <div className="w-6 h-4 bg-[#facc15] rounded-sm flex items-center justify-center shadow-sm border border-yellow-600/50">
        <span className="text-black font-black text-[10px] leading-none">C</span>
    </div>
);

const IconDoubleYellow = () => (
    <div className="flex items-center relative h-5 w-6">
       <div className="absolute left-0 top-0.5 w-3 h-4 bg-[#facc15] rounded-[1px] border border-yellow-600/50 transform -rotate-6 z-10"></div>
       <div className="absolute left-2 top-0.5 w-3 h-4 bg-[#facc15] rounded-[1px] border border-yellow-600/50 transform rotate-12 z-20 shadow-sm"></div>
    </div>
);

const IconFourStars = () => (
    <div className="flex flex-col items-center leading-none gap-0.5">
       <div className="flex -space-x-0.5">
         <IconStar className="text-[#facc15]" />
         <IconStar className="text-[#facc15] -mt-1.5" />
         <IconStar className="text-[#facc15]" />
       </div>
       <IconStar className="text-[#facc15] -mt-1" />
    </div>
);

const IconGoal = () => (
    <SvgIcon size={14} className="text-white">
        <path d="M3 22v-8c0-3.1 2.9-6 6-6h6c3.1 0 6 2.9 6 6v8"/><path d="M3 10h18"/><path d="M8 10v12"/><path d="M16 10v12"/>
    </SvgIcon>
);

const IconCheckCircle = () => (
  <SvgIcon size={14} stroke="#22c55e" strokeWidth="3">
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </SvgIcon>
);

const IconXCircle = () => (
  <SvgIcon size={14} stroke="#ef4444" strokeWidth="3">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </SvgIcon>
);

const IconAward = () => (
    <SvgIcon size={24} className="text-[#ffd700]">
        <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </SvgIcon>
);


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
// 3. COMPONENTES VISUALES APP
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
       <div className="bg-[#facc15] p-2 rounded-full text-black shadow-lg shadow-yellow-500/20"><IconLock size={18} /></div>
    </div>
  );
};

const MusicPlayer = () => {
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
        if (playing) audioRef.current.play().catch(console.error); 
        else audioRef.current.pause(); 
    }
  }, [playing]);

  return (
    <div className="fixed top-[70px] right-4 z-[200]">
        <button 
            onClick={() => setPlaying(!playing)} 
            className={`flex items-center gap-2 ${playing ? 'bg-[#22c55e] text-black' : 'bg-[#ef4444] text-white'} px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg transition-transform hover:scale-105 border-2 border-white`}
        >
            {playing ? <IconVolume2 size={14}/> : <IconVolumeX size={14}/>}
            <span>MÚSICA {playing ? 'ON' : 'OFF'}</span>
        </button>
    </div>
  );
};

// --- SLOT TITULAR ---
const Slot = ({ p, on, cap, setCap, showCap, active, editable }: any) => (
  <div className="relative flex flex-col items-center group" onClick={on}>
    <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'} ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer' : (p && on) ? 'cursor-pointer' : 'cursor-default'}`}>
        {p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <IconPlus size={18} />}
        {p && showCap && (
            <button onClick={(e) => { e.stopPropagation(); if (editable) setCap(); }} className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 ${cap ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg' : 'bg-black/60 text-white/30 border-white/10'} ${editable ? 'hover:bg-black/80 hover:text-white cursor-pointer' : 'cursor-default'}`}>
                {cap ? <IconCheck size={8} /> : 'C'}
            </button>
        )}
    </div>
    {p && (<span className="mt-1 text-3xl leading-none block shadow-black drop-shadow-lg z-20 filter">{getFlag(p.seleccion)}</span>)}
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
        <div className="absolute inset-0 border-2 border-white/40 m-4 rounded-lg pointer-events-none"></div>
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/40 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-4 left-1/2 w-48 h-24 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
        <div className="absolute top-4 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
        <div className="absolute top-28 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-full pointer-events-none"></div>
        <div className="absolute bottom-4 left-1/2 w-48 h-24 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
        <div className="absolute bottom-4 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
        <div className="absolute bottom-28 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-full pointer-events-none"></div>
        <div className="absolute top-[29%] left-4 right-4 border-t border-dashed border-white/20 pointer-events-none"></div>
        <div className="absolute top-[54%] left-4 right-4 border-t border-dashed border-white/20 pointer-events-none"></div>
        <div className="absolute top-[8%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEL</div>
        <div className="absolute top-[33%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">MED</div>
        <div className="absolute top-[58%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEF</div>
        <div className="absolute top-[88%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-xl text-black text-[10px] font-black italic z-20 border-r border-y border-white/20">POR</div>
        
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
          <button onClick={() => setView('rules')} className={`flex flex-col items-center gap-1 transition-all ${view === 'rules' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconFileText /><span className="text-[8px] font-black uppercase">Reglas</span></button>
          <button onClick={() => setView('squad')} className={`flex flex-col items-center gap-1 transition-all ${view === 'squad' ? 'text-[#22c55e] scale-110' : 'text-white/40 hover:text-white'}`}><IconShield /><span className="text-[8px] font-black uppercase">Plantilla</span></button>
          <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('quiniela')} className={`flex flex-col items-center gap-1 transition-all ${view === 'quiniela' ? 'text-purple-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><IconTrophy /><span className="text-[8px] font-black uppercase">EUROQUINIELA</span></button>
          <button onClick={() => setView('classification')} className={`flex flex-col items-center gap-1 transition-all ${view === 'classification' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconUsers /><span className="text-[8px] font-black uppercase">Clasificación</span></button>
          <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-sky-400 scale-110' : 'text-white/40 hover:text-white'}`}><IconCalendar /><span className="text-[8px] font-black uppercase">Calendario</span></button>
          <button onClick={onLogout} className="flex flex-col items-center gap-1 text-white/40 hover:text-red-500 transition-all group"><IconLogOut /><span className="text-[8px] font-black uppercase">Salir</span></button>
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
           <IconTrophy size={48} className="mx-auto text-[#facc15] mb-4 animate-bounce" />
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
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic uppercase tracking-tighter">ELEGIR JUGADOR</h2><button onClick={onClose} className="p-3 bg-white/5 rounded-full"><IconX /></button></div>
      {currentSelection && <button onClick={onRemove} className="mb-6 w-full bg-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-xs uppercase"><IconTrash2 size={16}/> ELIMINAR</button>}
      <div className="flex gap-2 mb-4">{["POR", "DEF", "MED", "DEL"].map(pos => (<button key={pos} disabled={isTitular && activeSlot.pos !== pos} onClick={() => setFilterPos(pos)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${filterPos === pos ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'} ${isTitular && activeSlot.pos !== pos ? 'opacity-20' : ''}`}>{pos}</button>))}</div>
      <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => { setSortPrice((prev: any) => prev === 'desc' ? 'asc' : 'desc'); setActiveSort('price'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'price' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><IconArrowUpDown size={14}/> {sortPrice === 'desc' ? 'PRECIO MÁX' : 'PRECIO MÍN'}</button>
          <button onClick={() => { setSortAlpha((prev: any) => prev === 'asc' ? 'desc' : 'asc'); setActiveSort('alpha'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'alpha' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><IconArrowDownUp size={14}/> {sortAlpha === 'asc' ? 'A - Z' : 'Z - A'}</button>
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
     <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><IconCalendar /> CALENDARIO</h1>
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

const TeamCard = ({ team, rank, isMyTeam, isAdmin }: any) => {
  const [expanded, setExpanded] = useState(false);
  const canView = isMyTeam || isAdmin;
  const squadData = team.squad || getMockSquad(team.id);

  const filterByPos = (pos: string) => squadData.titulares?.filter((p:any) => p.posicion === pos) || [];

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden mb-3 ${isMyTeam ? 'bg-[#1c2a45] border-[#22c55e]' : 'bg-[#1c2a45] border-white/5'}`}>
       <div onClick={() => canView && setExpanded(!expanded)} className={`p-4 flex items-center justify-between ${!canView ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'} transition-colors`}>
          <div className="flex items-center gap-4"><span className={`text-2xl font-black italic w-8 text-center ${rank === 1 ? 'text-[#facc15]' : 'text-white/30'}`}>#{rank}</span><div><h3 className={`font-black text-sm uppercase italic ${isMyTeam ? 'text-[#22c55e]' : 'text-white'}`}>{team.name}</h3><div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold"><IconUser size={10} /> {team.user}</div></div></div>
          <div className="flex items-center gap-4"><div className="text-right"><span className="block font-black text-[#22c55e] text-lg">{team.points} PTS</span><span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span></div>{!canView ? <IconLock size={16} /> : (expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />)}</div>
       </div>
       {!canView && <div onClick={() => alert("🔒 Plantilla oculta hasta el inicio del torneo")} className="h-0" />} 
       
       {expanded && canView && (
         <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4">
            <div className="border border-[#22c55e]/20 rounded-2xl bg-[#2e9d4a]/10 p-4 relative overflow-hidden">
              <p className="text-[9px] font-black uppercase text-[#22c55e] mb-3 text-center">ONCE INICIAL</p>
              
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

const RuleCard = ({ color, title, icon, children }: any) => {
  return (
    <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-xl">
      <div 
        className="p-4 flex items-center justify-between"
        style={{ borderLeft: `6px solid ${color}` }}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-black italic uppercase text-lg tracking-wide text-white">{title}</h3>
        </div>
      </div>
      <div className="p-5 border-t border-white/5 bg-[#0d1526]/50 text-sm text-gray-100 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

const ScoreRow = ({ label, pts, color = "text-white" }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
        <span className="text-gray-200 font-medium text-xs uppercase">{label}</span>
        <span className={`font-black text-sm ${color}`}>{pts}</span>
    </div>
);

const RulesView = () => {
  return (
    <div className="pb-32 animate-in fade-in duration-500">
      
      {/* HERO SECTION DE REGLAS */}
      <div className="relative h-72 w-full mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[#05080f]/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/20 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1624280433509-b4dca387790d?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Stadium Action"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 z-20">
            <h1 className="text-4xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-2 flex items-center gap-3 drop-shadow-lg">
              <IconFileText size={36} /> REGLAMENTO
            </h1>
            <p className="text-white text-sm font-bold tracking-widest max-w-lg leading-relaxed drop-shadow-md">
                Bienvenido a la guía oficial. Aquí encontrarás todo lo necesario para dominar el juego, desde el sistema de puntuación hasta los premios finales. ¡Suerte, míster!
            </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4">
        
        {/* 1. PLANTILLA */}
        <RuleCard color="#22c55e" title="1. Plantilla Inicial" icon={<IconUsers />}>
          <p className="mb-4 text-base leading-relaxed">
            Crea tu plantilla inicial compuesta por un máximo de <strong>20 jugadores</strong> distribuidos de la siguiente manera: <strong>11 Titulares, 6 suplentes</strong> y el resto esperarán su oportunidad desde la grada.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-3 space-y-3">
            <div className="flex items-center gap-3">
              <IconCaptain />
              <p className="text-sm"><strong className="text-[#facc15] uppercase">Capitán:</strong> Puntúa DOBLE (positivo o negativo).</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-lg">⚠️</span>
              <p className="text-sm"><strong className="text-red-400 uppercase">Penalización:</strong> Cada hueco vacío en el 11 resta <strong>-1 punto</strong>.</p>
            </div>
             <div className="flex items-center gap-3">
              <IconSub />
              <p className="text-sm"><strong className="text-blue-400 uppercase">Suplentes:</strong> Entran automático por orden (S1→S6) si un titular no juega.</p>
            </div>
          </div>
        </RuleCard>

        {/* 2. TÁCTICAS */}
        <RuleCard color="#3b82f6" title="2. Tácticas Válidas" icon={<IconShield />}>
          <p className="mb-4 text-xs uppercase font-bold text-white/50">Esquemas permitidos:</p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold text-center">
             {["1-5-3-2", "1-4-4-2", "1-4-5-1", "1-4-3-3", "1-3-4-3"].map(t => (
               <div key={t} className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:bg-[#22c55e]/20 transition-colors cursor-default">{t}</div>
             ))}
             <div className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] flex justify-center gap-2 items-center">
                 1-3-5-2 <span className="text-red-500 font-black animate-pulse">(NEW)</span>
             </div>
          </div>
        </RuleCard>

        {/* 3. FICHAJES */}
        <RuleCard color="#ec4899" title="3. Mercado de Fichajes" icon={<IconRefresh />}>
           <p className="mb-4 font-bold text-white text-base">Ventana abierta: Jornada 3 → Octavos</p>
           <ul className="space-y-3 text-sm text-gray-200">
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Máximo <strong>7 cambios</strong> permitidos.</li>
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Límite por país sube de 7 a <strong>8 jugadores.</strong></li>
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Tu presupuesto aumenta con los premios de la <span className="text-[#22c55e] font-black uppercase ml-1">EUROQUINIELA.</span></li>
           </ul>
        </RuleCard>

        {/* 4. PUNTUACIONES */}
        <RuleCard color="#facc15" title="4. Puntuaciones" icon={<IconFileText />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* OFENSIVA */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-[#22c55e] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Acción Ofensiva</h4>
                    <ScoreRow label="⚽ Gol (Cualquiera)" pts="+5" color="text-[#22c55e]" />
                    <ScoreRow label="👟 Asistencia" pts="+1" color="text-[#22c55e]" />
                    <ScoreRow label={<div className="flex items-center gap-2">🥅 ✅ <span>Penalti Marcado</span></div>} pts="+5" color="text-[#22c55e]" />
                    <ScoreRow label={<div className="flex items-center gap-2">🥅 ❌ <span>Penalti Fallado</span></div>} pts="-3" color="text-red-500" />
                    <ScoreRow label="📉 Gol Propia Meta" pts="-1" color="text-red-500" />
                </div>

                {/* DEFENSIVA (DIVIDIDA) */}
                <div className="space-y-6">
                    {/* PORTERO */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-[#facc15] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Portero (POR)</h4>
                        {/* REORDENADO: PENALTI PRIMERO, LUEGO PORTERÍA A CERO */}
                        <ScoreRow label={<div className="flex items-center gap-2">🥅 ⛔ <span>Penalti Parado</span></div>} pts="+3" color="text-[#22c55e]" />
                        <ScoreRow label={<div className="flex items-center gap-2">🥅 🧤 <span>Portería a 0 (+60')</span></div>} pts="+4" color="text-[#22c55e]" />
                        
                        <div className="pt-2 border-t border-white/5 mt-2">
                             <ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽ <span>1 Gol Encajado</span></div>} pts="0" color="text-gray-400" />
                             <ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽⚽ / + <span>2 Goles Enc.</span></div>} pts="-2 / -3..." color="text-red-400" />
                             <p className="text-[10px] text-red-400 italic mt-1 text-right">-1 punto extra por cada gol adicional.</p>
                        </div>
                    </div>
                    {/* DEFENSA */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-[#3b82f6] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Defensa (DEF)</h4>
                        <ScoreRow label="🛡️ Portería a 0 (+45')" pts="+2" color="text-[#22c55e]" />
                    </div>
                </div>

                {/* PARTIDO */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-white/60 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Partido y Resultado</h4>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors">
                        <span className="text-gray-200 font-medium text-xs uppercase flex items-center gap-2">👟 ⚽ Jugar Partido</span>
                        <span className="font-black text-sm text-[#22c55e]">+1</span>
                    </div>
                    <ScoreRow label="👕 Ser Titular" pts="+1" color="text-[#22c55e]" />
                    <ScoreRow label="✅ Victoria Equipo" pts="+1" color="text-[#22c55e]" />
                    <ScoreRow label="❌ Derrota Equipo" pts="-1" color="text-red-500" />
                </div>

                {/* SANCIONES */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-red-400 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Sanciones</h4>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors">
                        <div className="flex items-center gap-2"><IconDoubleYellow /><span className="text-gray-200 font-medium text-xs uppercase">Doble Amarilla</span></div>
                        <span className="font-black text-sm text-red-500">-3</span>
                    </div>
                    <ScoreRow label="🟥 Roja Directa" pts="-5" color="text-red-500" />
                </div>
            </div>
        </RuleCard>

        {/* 5. VALORACIONES */}
        <RuleCard color="#a855f7" title="5. Valoraciones Sofascore" icon={<IconFourStars />}>
           <p className="mb-4 text-left text-gray-300 text-sm">Puntos extra basados en la nota del jugador en la App <span className="text-blue-400 font-black uppercase">SOFASCORE</span></p>
           <div className="grid grid-cols-2 gap-4 text-center text-xs">
              
              {/* COLUMNA IZQUIERDA (TOP TIER) */}
              <div className="space-y-3">
                  <div className="bg-[#1e4620] p-3 rounded-lg border border-[#22c55e]/30 shadow-lg">
                    <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Excelente</div>
                    <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.5 - 10</span><b className="text-[#22c55e]">+14</b></div>
                    <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.0 - 9.4</span><b className="text-[#22c55e]">+13</b></div>
                  </div>
                  
                  <div className="bg-[#14532d] p-3 rounded-lg border border-green-500/20 shadow-lg">
                    <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Bueno</div>
                    <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.6 - 8.9</span><b className="text-[#4ade80]">+12</b></div>
                    <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.2 - 8.5</span><b className="text-[#4ade80]">+11</b></div>
                    <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.0 - 8.1</span><b className="text-[#4ade80]">+10</b></div>
                  </div>

                  <div className="bg-[#166534] p-3 rounded-lg border border-green-500/20 shadow-lg">
                     <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Bueno</div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.8 - 7.9</span><b className="text-[#86efac]">+9</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.6 - 7.7</span><b className="text-[#86efac]">+8</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.4 - 7.5</span><b className="text-[#86efac]">+7</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.2 - 7.3</span><b className="text-[#86efac]">+6</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.0 - 7.1</span><b className="text-[#86efac]">+5</b></div>
                  </div>
              </div>

              {/* COLUMNA DERECHA (MID/LOW TIER) */}
              <div className="space-y-3">
                  <div className="bg-[#374151] p-3 rounded-lg border border-gray-500/20 shadow-lg">
                     <div className="font-black text-gray-300 text-sm uppercase mb-2 border-b border-white/10 pb-1">Medio</div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.8 - 6.9</span><b className="text-white">+4</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.6 - 6.7</span><b className="text-white">+3</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.4 - 6.5</span><b className="text-white">+2</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.2 - 6.3</span><b className="text-white">+1</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.0 - 6.1</span><b className="text-white">0</b></div>
                  </div>

                  <div className="bg-[#7f1d1d] p-3 rounded-lg border border-red-500/20 shadow-lg">
                     <div className="font-black text-red-200 text-sm uppercase mb-2 border-b border-white/10 pb-1">Malo</div>
                     <div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.8 - 5.9</span><b className="text-white">-1</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.6 - 5.7</span><b className="text-white">-2</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.4 - 5.5</span><b className="text-white">-3</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.2 - 5.3</span><b className="text-white">-4</b></div>
                  </div>
                  
                  <div className="bg-[#450a0a] p-3 rounded-lg border border-red-900/40 shadow-lg">
                     <div className="font-black text-red-400 text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Malo</div>
                     <div className="flex justify-between px-2 py-0.5 text-red-300"><span>5.0 - 5.1</span><b className="text-white">-5</b></div>
                     <div className="flex justify-between px-2 py-0.5 text-red-300"><span>0.0 - 4.9</span><b className="text-white">-6</b></div>
                  </div>
              </div>
           </div>
        </RuleCard>

        {/* 6. EUROQUINIELA */}
        <RuleCard color="#06b6d4" title="6. Euroquiniela" icon={<IconTrophy size={24} style={{ color: "#06b6d4" }} />}>
          <p className="text-sm mb-4 text-left text-gray-300 leading-relaxed">
            Acierta los 2 clasificados de cada grupo para ganar presupuesto para fichar en la ventana de fichajes:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs font-black text-center uppercase tracking-wide">
            <div className="bg-[#ea580c] text-white p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">12 aciertos <span className="block text-lg">25 M</span></div>
            <div className="bg-[#10b981] text-white p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">8 aciertos <span className="block text-lg">10 M</span></div>
            
            <div className="bg-[#f59e0b] text-black p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">11 aciertos <span className="block text-lg">20 M</span></div>
            <div className="bg-[#06b6d4] text-black p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">7 aciertos <span className="block text-lg">8 M</span></div>
            
            <div className="bg-[#eab308] text-black p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">10 aciertos <span className="block text-lg">15 M</span></div>
            <div className="bg-[#3b82f6] text-white p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">6 aciertos <span className="block text-lg">6 M</span></div>
            
            <div className="bg-[#84cc16] text-black p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">9 aciertos <span className="block text-lg">12 M</span></div>
            <div className="bg-gray-500 text-white p-3 rounded-lg shadow-md border border-white/5 transform hover:scale-105 transition-transform">5 aciertos <span className="block text-lg">5 M</span></div>
          </div>
        </RuleCard>
        
        {/* 7. PREMIO */}
        <RuleCard color="#ffd700" title="7. Premio" icon={<IconAward size={24} style={{ color: "#ffd700" }} />}>
            <div className="text-center p-6 bg-[#ffd700]/10 rounded-xl border border-[#ffd700]/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
              <h4 className="text-[#ffd700] font-black uppercase text-2xl mb-1 tracking-tight drop-shadow-sm">Prestigio Eterno</h4>
              <p className="text-sm text-white/80 mb-6 italic">La satisfacción de ganar a tus amigos es el verdadero trofeo.</p>
              
              <div className="border-t border-[#ffd700]/20 pt-6">
                <span className="bg-[#ffd700] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Opcional</span>
                <p className="mt-3 text-lg font-bold text-white mb-6">Apuesta: <span className="text-[#ffd700] text-2xl">5€</span></p>
                <div className="flex justify-center items-end gap-6">
                   <div className="flex flex-col items-center gap-1">
                      {/* PLATA */}
                      <span className="text-3xl drop-shadow-md text-[#c0c0c0] filter brightness-125">🥈</span>
                      <span className="text-xs font-bold text-gray-400">2º Puesto</span>
                      <span className="text-xl font-black text-[#e2e8f0]">30%</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 -mt-4">
                      {/* ORO */}
                      <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] filter brightness-110">🥇</span>
                      <span className="text-sm font-black text-[#ffd700] uppercase tracking-wide">1º Puesto</span>
                      <span className="text-3xl font-black text-white drop-shadow-md">60%</span>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      {/* BRONCE */}
                      <span className="text-3xl drop-shadow-md text-[#cd7f32] filter saturate-150">🥉</span>
                      <span className="text-xs font-bold text-orange-700/80">3º Puesto</span>
                      <span className="text-xl font-black text-[#f97316]">10%</span>
                   </div>
                </div>
              </div>
            </div>
        </RuleCard>

      </div>
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
      {/* MÚSICA - BOTÓN FLOTANTE SIEMPRE VISIBLE */}
      <MusicPlayer />

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
                </div>
              </div>
              
              {view === 'squad' && (
                  <>
                    <div className="mb-2"><div className="flex justify-between uppercase italic font-black text-[10px] mb-1"><span className="text-white/40">PRESUPUESTO</span><span className={isOverBudget ? "text-red-500" : "text-[#22c55e]"}>{budgetSpent}M / 300M</span></div><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5"><div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent / 300) * 100, 100)}%` }} /></div></div>
                    
                    {/* BARRA DE ACCIÓN FIJA SQUAD */}
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleResetTeam} className="bg-red-600/90 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-1 border border-red-500/50"><IconRefresh size={14}/> RESETEAR PLANTILLA</button>
                        
                        {squadValidated ? (
                            <button onClick={handleUnlockSquad} className="bg-[#facc15] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-[2]"><IconEdit size={14}/> EDITAR EQUIPO</button>
                        ) : (step === 6 ? (
                            <button onClick={handleGoToQuiniela} className="bg-[#22c55e] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform flex-[2] animate-pulse"><IconTrophy size={14}/> IR A EUROQUINIELA</button>
                        ) : (
                            <button 
                                onClick={handleValidateSquad} 
                                disabled={!isTeamComplete}
                                className={`flex-[2] px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-transform ${isTeamComplete ? 'bg-[#22c55e] text-black hover:scale-105 animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-white/5'}`}
                            >
                                <IconCheck size={14}/> VALIDAR EQUIPO
                            </button>
                        ))}
                    </div>
                  </>
              )}

              {/* BARRA DE ACCIÓN FIJA QUINIELA */}
              {view === 'quiniela' && (
                  <div className="mt-3">
                      {quinielaLocked ? (
                          <button onClick={() => setQuinielaLocked(false)} className="w-full bg-[#facc15] text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"><IconEdit size={14}/> EDITAR QUINIELA</button>
                      ) : (
                          <button 
                              onClick={() => { setQuinielaLocked(true); setStep(7); alert("¡Quiniela validada!"); }} 
                              disabled={!isQuinielaComplete}
                              className={`w-full px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-transform ${isQuinielaComplete ? 'bg-[#22c55e] text-black hover:scale-105 animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-white/5'}`}
                          >
                              <IconCheck size={14}/> {isQuinielaComplete ? "VALIDAR QUINIELA" : "COMPLETA LA QUINIELA"}
                          </button>
                      )}
                  </div>
              )}
            </div>
        </div>
      )}

      {view === 'classification' && (
        <div className="max-w-md mx-auto px-4 mt-20 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><IconUsers /> CLASIFICACIÓN</h1>
            <div className="space-y-4">
                {combinedTeams.map((team, idx) => (
                    <TeamCard key={team.id} team={team} rank={idx + 1} isMyTeam={team.id === 999} isAdmin={isAdmin} />
                ))}
            </div>
        </div>
      )}

      {view === 'quiniela' && (
        <div className="max-w-md mx-auto px-4 mt-6 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><IconTrophy /> EURO QUINIELA</h1>
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
                                        {isSelected && <div className="absolute top-2 right-2 bg-[#22c55e] rounded-full p-0.5"><IconCheck size={10} className="text-black"/></div>}
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
      
      {/* VISTA DE REGLAS */}
      {view === 'rules' && <RulesView />}

      {view === 'squad' && (
        <>
          <div className="max-w-md mx-auto px-4 mt-40"> 
            
            <div className={`relative mb-3 transition-all duration-300 ${step === 1 ? 'scale-105 z-20' : ''}`}>
                <div className={`relative rounded-2xl overflow-hidden ${step === 1 ? activeClass : 'border border-white/10'}`}>
                    <input className={`w-full p-5 pr-32 bg-[#1c2a45] text-left font-black text-xl text-[#22c55e] border-none outline-none shadow-inner ${nameLocked ? 'opacity-80' : ''}`} placeholder="NOMBRE EQUIPO" value={teamName} disabled={nameLocked} onChange={(e) => setTeamName(e.target.value)} />
                    {!nameLocked && teamName.trim().length >= 3 && (<button onClick={() => { setNameLocked(true); if(step===1) setStep(2); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#22c55e] text-black px-4 py-2.5 rounded-xl font-black text-[10px] z-10 hover:scale-105 transition-transform">OK</button>)}
                    {nameLocked && (<button onClick={() => setNameLocked(false)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#facc15] text-black px-4 py-2.5 rounded-xl font-black text-[10px] z-10 hover:scale-105 transition-transform flex items-center gap-1"><IconEdit size={12}/> EDITAR</button>)}
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
                    <button onClick={handleValidateSquad} className="w-full bg-red-600/20 text-red-500 border border-red-500/30 p-4 rounded-2xl font-black italic text-[10px] uppercase flex items-center justify-center gap-2 mb-6 hover:bg-red-600/30 transition-all"><IconBan size={14}/> NO QUIERO NO CONVOCADOS</button>
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
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PLAYERS_DB } from './players'; 

// ==========================================
// 1. CONFIGURACIÓN
// ==========================================

const MASTER_EMAIL = "admin@euro2024.com"; 
const VALID_FORMATIONS = ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"];
const CHART_COLORS = ["#22d3ee", "#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#f87171"];
const LINEUP_MATCHDAYS = ["J1", "J2", "J3", "OCT", "SEM", "FIN"];
const MAX_BUDGET = 400; 
const GAME_START_DATE = "2024-06-14T21:00:00";
const CURRENT_REAL_MATCHDAY = "J1"; 

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

const generateFixture = () => {
  return [
    { n: "GRUPO A", m: [{t1:"Alemania",t2:"Escocia",d:"14 Jun 21:00"},{t1:"Hungría",t2:"Suiza",d:"15 Jun 15:00"},{t1:"Alemania",t2:"Hungría",d:"19 Jun 18:00"},{t1:"Escocia",t2:"Suiza",d:"19 Jun 21:00"},{t1:"Suiza",t2:"Alemania",d:"23 Jun 21:00"},{t1:"Escocia",t2:"Hungría",d:"23 Jun 21:00"}]},
    { n: "GRUPO B", m: [{t1:"España",t2:"Croacia",d:"15 Jun 18:00"},{t1:"Italia",t2:"Albania",d:"15 Jun 21:00"},{t1:"Croacia",t2:"Albania",d:"19 Jun 15:00"},{t1:"España",t2:"Italia",d:"20 Jun 21:00"},{t1:"Albania",t2:"España",d:"24 Jun 21:00"},{t1:"Croacia",t2:"Italia",d:"24 Jun 21:00"}]},
    { n: "GRUPO C", m: [{t1:"Eslovenia",t2:"Dinamarca",d:"16 Jun 18:00"},{t1:"Serbia",t2:"Inglaterra",d:"16 Jun 21:00"},{t1:"Eslovenia",t2:"Serbia",d:"20 Jun 15:00"},{t1:"Dinamarca",t2:"Inglaterra",d:"20 Jun 18:00"},{t1:"Inglaterra",t2:"Eslovenia",d:"25 Jun 21:00"},{t1:"Dinamarca",t2:"Serbia",d:"25 Jun 21:00"}]},
    { n: "GRUPO D", m: [{t1:"Polonia",t2:"Países Bajos",d:"16 Jun 15:00"},{t1:"Austria",t2:"Francia",d:"17 Jun 21:00"},{t1:"Polonia",t2:"Austria",d:"21 Jun 18:00"},{t1:"Países Bajos",t2:"Francia",d:"21 Jun 21:00"},{t1:"Países Bajos",t2:"Austria",d:"25 Jun 18:00"},{t1:"Francia",t2:"Polonia",d:"25 Jun 18:00"}]},
    { n: "GRUPO E", m: [{t1:"Rumanía",t2:"Ucrania",d:"17 Jun 15:00"},{t1:"Bélgica",t2:"Eslovaquia",d:"17 Jun 18:00"},{t1:"Eslovaquia",t2:"Ucrania",d:"21 Jun 15:00"},{t1:"Bélgica",t2:"Rumanía",d:"22 Jun 21:00"},{t1:"Eslovaquia",t2:"Rumanía",d:"26 Jun 18:00"},{t1:"Ucrania",t2:"Bélgica",d:"26 Jun 18:00"}]},
    { n: "GRUPO F", m: [{t1:"Turquía",t2:"Georgia",d:"18 Jun 18:00"},{t1:"Portugal",t2:"República Checa",d:"18 Jun 21:00"},{t1:"Georgia",t2:"República Checa",d:"22 Jun 15:00"},{t1:"Turquía",t2:"Portugal",d:"22 Jun 18:00"},{t1:"Georgia",t2:"Portugal",d:"26 Jun 21:00"},{t1:"República Checa",t2:"Turquía",d:"26 Jun 21:00"}]}
  ];
};

const formatTeamData = (team: any, index: number) => {
    let parsedSquad = team.squad;
    if (typeof parsedSquad === 'string') { try { parsedSquad = JSON.parse(parsedSquad); } catch(e) { parsedSquad = {}; } }
    
    const titulares = parsedSquad?.titulares || (parsedSquad?.selected ? Object.values(parsedSquad.selected) : []);
    const banquillo = parsedSquad?.banquillo || (parsedSquad?.bench ? Object.values(parsedSquad.bench) : []);
    const extras = parsedSquad?.extras ? (Array.isArray(parsedSquad.extras) ? parsedSquad.extras : Object.values(parsedSquad.extras)) : [];

    return {
        ...team,
        squad: { titulares, banquillo, extras }, 
        points: team.points || 0, 
        matchdayPoints: team.matchdayPoints || { "J1": 0, "J2": 0, "J3": 0 },
        hasPaidBet: team.hasPaidBet || false,
        evolution: team.evolution || [index+1]
    };
};

const MOCK_TEAMS_DB: any[] = []; 

// ==========================================
// 2. SISTEMA DE ICONOS
// ==========================================

const SvgBase = ({ children, className, size = 24, fill="none", stroke="currentColor", strokeWidth="2" }: any) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>);
const IconPlus = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M5 12h14"/><path d="M12 5v14"/></SvgBase>;
const IconCheck = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><polyline points="20 6 9 17 4 12"/></SvgBase>;
const IconX = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></SvgBase>;
const IconLock = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgBase>;
const IconTrophy = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></SvgBase>;
const IconEdit = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></SvgBase>;
const IconVolume2 = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></SvgBase>;
const IconVolumeX = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></SvgBase>;
const IconUsers = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgBase>;
const IconLogOut = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></SvgBase>;
const IconFileText = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></SvgBase>;
const IconCalendar = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></SvgBase>;
const IconShield = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></SvgBase>;
const IconChevronUp = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="m18 15-6-6-6 6"/></SvgBase>;
const IconChevronDown = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="m6 9 6 6 6-6"/></SvgBase>;
const IconUser = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgBase>;
const IconBan = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></SvgBase>;
const IconArrowUpDown = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="m7 15 5 5 5-5"/><path d="M7 9l5-5 5 5"/></SvgBase>;
const IconArrowDownUp = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></SvgBase>;
const IconTrash2 = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></SvgBase>;
const IconRefresh = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></SvgBase>;
const IconClipboard = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></SvgBase>;
const IconChart = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></SvgBase>;
const IconStar = ({ className, fill = "currentColor" }: any) => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconBoot = ({ className="" }: any) => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor" className={className}><path d="M49.6 232.8C20.4 262.8 3.1 303 1.2 344.8 0 371.2 8.8 448 8.8 448l24.8 24.8 19.2-22.4 20.8 20.8 20-22.4 20 23.2 20-24 19.2 23.2 20.8-21.6 23.2 19.2 13.6-28.8c42.4-8 84.8-19.2 119.2-36 60-29.6 112-76 136.8-136.8 12.8-31.2 16-64 8.8-96.8-4-18.4-12-36-24-51.2-16.8-21.6-40.8-36.8-66.4-44.8-36-11.2-75.2-8-109.6 8-28.8 13.6-54.4 34.4-76.8 59.2-24 26.4-42.4 56.8-56.8 88.8l-1.6 2.4z" fill="#374151"/><path d="M137.6 244c-12 16-24.8 31.2-39.2 44.8l-20-20c13.6-12.8 25.6-27.2 36.8-42.4L137.6 244zM180.8 204.8c-12 17.6-26.4 33.6-41.6 48.8l-20.8-20.8c14.4-14.4 27.2-29.6 38.4-46.4L180.8 204.8zM221.6 163.2c-12.8 18.4-27.2 35.2-43.2 50.4l-20-20.8c15.2-14.4 28.8-30.4 40.8-48L221.6 163.2z" fill="#9ca3af"/><path d="M52 480h16v32H52zM108 472h16v32h-16zM164 464h16v32h-16zM220 448h16v32h-16z" fill="#d1d5db"/></svg>);
const IconSub = ({ className="", size=24 }: any) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14" stroke="none" /><path d="M16 9l-4-4-4 4" stroke="#22c55e" /><path d="M12 5v7" stroke="#22c55e" /><path d="M12 19l4-4" stroke="#ef4444" /><path d="M8 15l4 4" stroke="#ef4444" /><path d="M12 12v7" stroke="#ef4444" /></svg>);
const IconCaptain = ({ className="" }: any) => (<div className={`w-6 h-4 bg-[#facc15] rounded-sm flex items-center justify-center shadow-sm border border-yellow-600/50 ${className}`}><span className="text-black font-black text-[10px] leading-none">C</span></div>);
const IconDoubleYellow = ({ className="" }: any) => (<div className={`flex items-center relative h-5 w-6 ${className}`}><div className="absolute left-0 top-0.5 w-3 h-4 bg-[#facc15] rounded-[1px] border border-yellow-600/50 transform -rotate-6 z-10"></div><div className="absolute left-2 top-0.5 w-3 h-4 bg-[#facc15] rounded-[1px] border border-yellow-600/50 transform rotate-12 -ml-1.5 z-20 shadow-sm"></div></div>);
const IconFourStars = ({ className="" }: any) => (<div className={`flex flex-col items-center leading-none gap-0.5 ${className}`}><div className="flex -space-x-0.5"><IconStar className="text-[#facc15]" /><IconStar className="text-[#facc15] -mt-1.5" /><IconStar className="text-[#facc15]" /></div><IconStar className="text-[#facc15] -mt-1" /></div>);
const IconAward = ({ className="" }: any) => (<SvgBase size={24} className={`text-[#ffd700] ${className}`}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></SvgBase>);
const IconCoinGold = ({ className = "" }: any) => (<div className={`w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border border-yellow-200 shadow-md flex items-center justify-center ${className}`}><span className="text-[10px] font-black text-yellow-950 drop-shadow-sm">5€</span></div>);
const IconNoCoin = ({ className = "" }: any) => (<div className={`w-5 h-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center ${className}`}><div className="w-3 h-0.5 bg-gray-400 transform rotate-45 absolute"></div><div className="w-3 h-0.5 bg-gray-400 transform -rotate-45 absolute"></div></div>);
const IconTshirt = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></SvgBase>;
// ==========================================
// 3. COMPONENTES VISUALES Y UI BASE
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
    return (<span>{stepTitle && <span className={`${isError ? 'text-red-500' : 'text-[#22c55e]'} font-black mr-2`}>{stepTitle}</span>}<span className={isError ? "text-red-400 font-bold" : ""}>{displayedText}</span></span>);
  };
  
  const CountdownBlock = ({ label, targetDate }: { label?: string, targetDate?: string }) => {
    const [timeLeft, setTimeLeft] = useState(0); 
    useEffect(() => { 
        const calculateTimeLeft = () => {
            const target = targetDate ? new Date(targetDate).getTime() : new Date(GAME_START_DATE).getTime();
            const now = new Date().getTime();
            return Math.max(0, Math.floor((target - now) / 1000));
        };
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000); 
        return () => clearInterval(timer); 
    }, [targetDate]);
  
    const formatTime = (s: number) => { 
        const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; 
        return `${d}D ${h}H ${m}M ${sec}S`; 
    };
    return (<div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5 mt-2"><div className="flex flex-col"><span className="text-lg font-black text-[#facc15] font-mono leading-none tracking-tight">{formatTime(timeLeft)}</span><span className="text-[8px] font-bold text-[#22c55e] uppercase tracking-widest mt-1">{label || "TIEMPO RESTANTE PARA EDITAR MI EQUIPO"}</span></div><div className="bg-[#facc15] p-2 rounded-full text-black shadow-lg shadow-yellow-500/20"><IconLock size={18} /></div></div>);
  };
  
  const MusicPlayer = () => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => { if (typeof window !== 'undefined') { audioRef.current = new Audio("/Banda sonora EF 2024.mp3"); audioRef.current.loop = true; audioRef.current.volume = 0.5; } return () => { if (audioRef.current) audioRef.current.pause(); }; }, []);
    useEffect(() => { if (audioRef.current) { if (playing) audioRef.current.play().catch(console.error); else audioRef.current.pause(); } }, [playing]);
    return (<div className="fixed top-[70px] right-4 z-[200]"><button onClick={() => setPlaying(!playing)} className={`flex items-center gap-2 ${playing ? 'bg-[#22c55e] text-black' : 'bg-[#ef4444] text-white'} px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg transition-transform hover:scale-105 border-2 border-white`}>{playing ? <IconVolume2 size={14} className="animate-pulse"/> : <IconVolumeX size={14}/>}<span>MÚSICA {playing ? 'ON' : 'OFF'}</span></button></div>);
  };
  
  const NavBar = ({ view, setView, onLogout, squadCompleted }: any) => (
    <div className="fixed top-0 left-0 w-full z-[110] bg-[#0d1526] border-b border-white/10 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center">
            <button onClick={() => setView('rules')} className={`flex flex-col items-center gap-1 transition-all ${view === 'rules' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconFileText /><span className="text-[8px] font-black uppercase">Reglas</span></button>
            <button onClick={() => setView('squad')} className={`flex flex-col items-center gap-1 transition-all ${view === 'squad' ? 'text-[#22c55e] scale-110' : 'text-white/40 hover:text-white'}`}><IconShield /><span className="text-[8px] font-black uppercase">Plantilla</span></button>
            <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('lineups')} className={`flex flex-col items-center gap-1 transition-all ${view === 'lineups' ? 'text-cyan-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><IconTshirt /><span className="text-[8px] font-black uppercase">Alineaciones</span></button>
            <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('quiniela')} className={`flex flex-col items-center gap-1 transition-all ${view === 'quiniela' ? 'text-purple-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><IconTrophy /><span className="text-[8px] font-black uppercase">EUROQUINIELA</span></button>
            <button onClick={() => setView('scores')} className={`flex flex-col items-center gap-1 transition-all ${view === 'scores' ? 'text-orange-400 scale-110' : 'text-white/40 hover:text-white'}`}><IconClipboard /><span className="text-[8px] font-black uppercase">Puntos</span></button>
            <button onClick={() => setView('classification')} className={`flex flex-col items-center gap-1 transition-all ${view === 'classification' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconUsers /><span className="text-[8px] font-black uppercase">Clasificación</span></button>
            <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-sky-400 scale-110' : 'text-white/40 hover:text-white'}`}><IconCalendar /><span className="text-[8px] font-black uppercase">Calendario</span></button>
            <button onClick={onLogout} className="flex flex-col items-center gap-1 text-white/40 hover:text-red-500 transition-all group"><IconLogOut /><span className="text-[8px] font-black uppercase">Salir</span></button>
        </div>
    </div>
  );
  
  const Slot = ({ p, on, cap, setCap, showCap, active, editable }: any) => (
    <div className="relative flex flex-col items-center group" onClick={on}>
      <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'} ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer' : (p && on && editable) ? 'cursor-pointer' : 'cursor-default'}`}>
          {p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <IconPlus size={18} />}
          {p && showCap && (<button onClick={(e) => { e.stopPropagation(); if (editable) setCap(); }} className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 ${cap ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg' : 'bg-black/60 text-white/30 border-white/10'} ${editable ? 'hover:bg-black/80 hover:text-white cursor-pointer' : 'cursor-default'}`}>{cap ? <IconCheck size={8} /> : 'C'}</button>)}
      </div>
      {p && (<span className="mt-1 text-3xl leading-none block shadow-black drop-shadow-lg z-20 filter">{getFlag(p.seleccion)}</span>)}
    </div>
  );
  
  const BenchCard = ({ player, id, posColor }: any) => (
      <div className={`w-full h-full flex flex-col items-center justify-between p-1.5 ${player ? 'bg-white' : 'bg-transparent'}`}>
          {player ? (<><span className="text-[10px] font-black text-black text-center uppercase leading-none truncate w-full">{player.nombre.split(' ').pop()}</span><div className="flex-1 flex items-center justify-center"><span className="text-4xl leading-none drop-shadow-md filter">{getFlag(player.seleccion)}</span></div><div className={`w-full text-center text-[10px] font-black uppercase py-0.5 rounded-sm ${posColors[player.posicion]}`}>{player.posicion}</div></>) : (<span className="text-white/50 font-black text-sm italic self-center my-auto">{id}</span>)}
      </div>
  );
  
  // TEAM CARD 
  const TeamCard = ({ team, rank, isMyTeam, isAdmin, onToggleBet }: any) => {
    const [expanded, setExpanded] = useState(false);
    const canView = isMyTeam || isAdmin;
    
    useEffect(() => { if (isMyTeam) setExpanded(true); }, [isMyTeam]);
  
    // Si no hay plantilla, usamos un objeto vacío.
    const squadData = team.squad || {};
    
    const filterByPos = (pos: string) => (Array.isArray(squadData.titulares) ? squadData.titulares : []).filter((p:any) => p.posicion === pos);
    const trophies = team.trophies || [];
    const getRankColor = (r: number) => { if (r === 1) return "text-[#ffd700] drop-shadow-md"; if (r === 2) return "text-[#c0c0c0]"; if (r === 3) return "text-[#cd7f32]"; return "text-white/30"; };
  
    return (
      <div className={`rounded-2xl border transition-all overflow-hidden mb-3 ${isMyTeam ? 'bg-[#1c2a45] border-[#22c55e] animate-pulse-slow shadow-[0_0_10px_rgba(34,197,94,0.3)] ring-1 ring-[#22c55e]' : 'bg-[#1c2a45] border-white/5'}`}>
         <div onClick={() => canView && setExpanded(!expanded)} className={`p-4 flex items-center justify-between ${!canView ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'} transition-colors`}>
            <div className="flex items-center gap-4">
                <span className={`text-2xl font-black italic w-8 text-center ${getRankColor(rank)}`}>#{rank}</span>
                <div>
                    <h3 className={`font-black text-sm uppercase italic ${isMyTeam ? 'text-[#22c55e]' : 'text-white'}`}>{team.name}</h3>
                    <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold"><IconUser size={10} /> {team.user}</div>{team.hasPaidBet ? <IconCoinGold /> : <IconNoCoin />}</div>
                    {trophies.length > 0 && (<div className="flex gap-1 mt-1">{trophies.map((t: string) => (<div key={t} className="bg-[#facc15] text-black px-1.5 rounded flex items-center gap-0.5 text-[8px] font-black shadow-lg shadow-yellow-500/20"><IconTrophy size={8} /> {t}</div>))}</div>)}
                </div>
            </div>
            <div className="flex items-center gap-4">
                {isAdmin && (
                    <div className="flex gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onToggleBet(team.id, true)} className={`px-2 py-1 rounded-md text-[8px] font-black ${team.hasPaidBet ? 'bg-yellow-500 text-black border border-white' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-900/50'}`}>SÍ</button>
                        <button onClick={() => onToggleBet(team.id, false)} className={`px-2 py-1 rounded-md text-[8px] font-black ${!team.hasPaidBet ? 'bg-red-500 text-white border border-white' : 'bg-red-900/30 text-red-500 border border-red-500/30 hover:bg-red-900/50'}`}>NO</button>
                    </div>
                )}
                <div className="text-right"><span className="block font-black text-[#22c55e] text-lg">{team.points} PTS</span><span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span></div>
                {!canView ? <IconLock size={16} /> : (expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />)}
            </div>
         </div>
         {!canView && <div onClick={() => alert("🔒 Plantilla oculta hasta el inicio del torneo")} className="h-0" />} 
         {expanded && canView && (
           <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4">
              <div className="border border-[#22c55e]/20 rounded-2xl bg-[#2e9d4a]/10 p-4 relative overflow-hidden">
                <p className="text-[9px] font-black uppercase text-[#22c55e] mb-3 text-center">ONCE INICIAL</p>
                {/* Si no hay jugadores, estos filter devolverán vacío y no se renderizará basura */}
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#ef4444] text-white text-[8px] font-black text-center">DEL</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('DEL').length > 0 ? filterByPos('DEL').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#10b981] text-white text-[8px] font-black text-center">MED</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('MED').length > 0 ? filterByPos('MED').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#3b82f6] text-white text-[8px] font-black text-center">DEF</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('DEF').length > 0 ? filterByPos('DEF').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2"><div className="w-8 py-1 rounded bg-[#facc15] text-black text-[8px] font-black text-center">POR</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('POR').length > 0 ? filterByPos('POR').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="border border-sky-500/20 rounded-2xl bg-sky-900/10 p-3"><p className="text-[9px] font-black uppercase text-sky-400 mb-3 text-center">BANQUILLO</p><div className="grid grid-cols-2 gap-2">{squadData.banquillo && squadData.banquillo.length > 0 ? squadData.banquillo.map((p:any) => <BenchCard key={p.id} player={p} id="S" />) : <span className="text-[8px] text-white/20 italic col-span-2 text-center self-center">Vacío</span>}</div></div>
                 <div className="border border-white/10 rounded-2xl bg-white/5 p-3"><p className="text-[9px] font-black uppercase text-white/40 mb-3 text-center">NO CONV.</p><div className="grid grid-cols-2 gap-2">{squadData.extras && squadData.extras.length > 0 ? squadData.extras.map((p:any) => <BenchCard key={p.id} player={p} id="NC" />) : <span className="text-[8px] text-white/20 italic col-span-2 text-center self-center">Vacío</span>}</div></div>
              </div>
           </div>
         )}
      </div>
    );
  };
  
  // ==========================================
  // 4. COMPONENTE DE CAMPO (FIELD)
  // ==========================================
  
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
          
          {/* ETIQUETAS DE POSICIÓN LATERALES */}
          <div className="absolute top-[8%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEL</div>
          <div className="absolute top-[33%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">MED</div>
          <div className="absolute top-[58%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEF</div>
          <div className="absolute top-[88%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-xl text-black text-[10px] font-black italic z-20 border-r border-y border-white/20">POR</div>
          
          {/* SLOT DE DELANTEROS */}
          <div className="absolute top-[20%] w-full -translate-y-1/2 flex justify-center gap-4 px-6 z-30">
              {[1,2,3].map(i => (<Slot key={i} active={canInteractField && !selected[`DEL-${i}`]} p={selected[`DEL-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEL-${i}`, type:'titular', pos:'DEL'})} cap={captain === selected[`DEL-${i}`]?.id} setCap={() => setCaptain(selected[`DEL-${i}`].id)} showCap={step >= 2} editable={canInteractField} />))}
          </div>
          {/* SLOT DE MEDIOCENTROS */}
          <div className="absolute top-[45%] w-full -translate-y-1/2 flex justify-between gap-1 px-6 z-30">
              {[1,2,3,4,5].map(i => (<Slot key={i} active={canInteractField && !selected[`MED-${i}`]} p={selected[`MED-${i}`]} on={() => canInteractField && setActiveSlot({id: `MED-${i}`, type:'titular', pos:'MED'})} cap={captain === selected[`MED-${i}`]?.id} setCap={() => setCaptain(selected[`MED-${i}`].id)} showCap={step >= 2} editable={canInteractField} />))}
          </div>
          {/* SLOT DE DEFENSAS */}
          <div className="absolute top-[70%] w-full -translate-y-1/2 flex justify-between gap-1 px-6 z-30">
              {[1,2,3,4,5].map(i => (<Slot key={i} active={canInteractField && !selected[`DEF-${i}`]} p={selected[`DEF-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEF-${i}`, type:'titular', pos:'DEF'})} cap={captain === selected[`DEF-${i}`]?.id} setCap={() => setCaptain(selected[`DEF-${i}`].id)} showCap={step >= 2} editable={canInteractField} />))}
          </div>
          {/* SLOT DE PORTERO */}
          <div className="absolute top-[90%] w-full -translate-y-1/2 flex justify-center z-30">
              <Slot active={canInteractField && !selected["POR-1"]} p={selected["POR-1"]} on={() => canInteractField && setActiveSlot({id: "POR-1", type:'titular', pos:'POR'})} cap={captain === selected["POR-1"]?.id} setCap={() => setCaptain(selected["POR-1"].id)} showCap={step >= 2} editable={canInteractField} />
          </div>
      </div>
    );
  };
  // ==========================================
// 5. VISTAS DE DATOS: GRÁFICAS Y CALENDARIO
// ==========================================

const EvolutionChart = ({ teams, myTeamId }: { teams: any[], myTeamId: string | undefined }) => {
    const height = 220; const width = 350; const padding = 30;
    const matchdays = ["J1", "J2", "J3", "J4"]; 
    const maxRank = Math.max(...teams.map(t => Math.max(...(t.evolution || [1]))), 4); 
    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (matchdays.length - 1);
    const getY = (rank: number) => padding + ((rank - 1) * (height - 2 * padding)) / (maxRank - 1);

    return (
        <div className="w-full bg-[#1c2a45] rounded-2xl p-5 border border-white/5 shadow-xl mb-6 overflow-hidden relative">
            <h3 className="text-sm font-black italic uppercase text-[#facc15] mb-6 flex items-center gap-2"><IconChart size={14} /> EVOLUCIÓN DEL RANKING</h3>
            <div className="flex justify-center">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    {matchdays.map((day, i) => (<g key={i}><line x1={getX(i)} y1={padding} x2={getX(i)} y2={height - padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="4" /><text x={getX(i)} y={height - 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="bold">{day}</text></g>))}
                    {[...Array(maxRank)].map((_, i) => (<g key={i}><line x1={padding} y1={getY(i + 1)} x2={width - padding} y2={getY(i + 1)} stroke="rgba(255,255,255,0.03)" /><text x={padding - 12} y={getY(i + 1) + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="bold">{i + 1}</text></g>))}
                    {teams.map((team, index) => {
                        const isMyTeam = team.id === myTeamId;
                        const evolution = team.evolution || [];
                        if (evolution.length < 2) return null;
                        const teamColor = CHART_COLORS[index % CHART_COLORS.length];
                        const points = evolution.map((rank: number, i: number) => `${getX(i)},${getY(rank)}`).join(" ");
                        return (
                            <g key={team.id} style={{ zIndex: isMyTeam ? 10 : 1 }} className="relative">
                                <polyline points={points} fill="none" stroke={teamColor} strokeWidth={isMyTeam ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${isMyTeam ? '6px' : '3px'} ${teamColor})` }} className="transition-all duration-500"/>
                                {evolution.map((rank: number, i: number) => (<circle key={i} cx={getX(i)} cy={getY(rank)} r={isMyTeam ? 4 : 3} fill={teamColor} stroke="#1c2a45" strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${teamColor})` }} className="transition-all duration-500"/>))}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const MatchdayStandings = ({ teams }: { teams: any[] }) => {
    const [selectedJornada, setSelectedJornada] = useState("J1");
    const jornadas = ["J1", "J2", "J3", "OCT", "SEM", "FIN"];
    const standings = useMemo(() => {
        return [...teams].sort((a, b) => {
            const ptsA = a.matchdayPoints?.[selectedJornada] || 0;
            const ptsB = b.matchdayPoints?.[selectedJornada] || 0;
            return ptsB - ptsA;
        });
    }, [teams, selectedJornada]);

    const getRankColor = (index: number) => {
        if (index === 0) return "text-[#ffd700] drop-shadow-md"; 
        if (index === 1) return "text-[#c0c0c0]"; 
        if (index === 2) return "text-[#cd7f32]"; 
        return "text-white/50";
    };

    return (
        <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden">
             <div className="p-4 border-b border-white/5">
                 <h3 className="text-2xl font-black italic uppercase text-[#22c55e] tracking-tighter mb-3 flex items-center gap-2"><IconTrophy /> CLASIFICACIÓN POR JORNADA</h3>
                 <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                     {jornadas.map(j => (
                         <button key={j} onClick={() => setSelectedJornada(j)} className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all ${selectedJornada === j ? 'bg-[#22c55e] text-black scale-105 shadow-lg' : 'bg-black/40 text-white/40 hover:bg-white/10'}`}>{j}</button>
                     ))}
                 </div>
             </div>
             <div className="p-2 space-y-1">
                 {standings.map((team, idx) => (
                     <div key={team.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1526] border border-white/5">
                         <div className="flex items-center gap-3">
                             <span className={`font-black text-xl w-6 text-center ${getRankColor(idx)}`}>{idx + 1}</span>
                             <div className="flex flex-col"><span className="text-xs font-bold text-white uppercase">{team.name}</span><span className="text-[8px] text-white/30 uppercase">{team.user}</span></div>
                         </div>
                         <span className="text-[#22c55e] font-black text-sm">{team.matchdayPoints?.[selectedJornada] || 0} PTS</span>
                     </div>
                 ))}
             </div>
        </div>
    );
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

// VISTA DE EUROQUINIELA
const QuinielaView = ({ selections, onToggle, locked, onEdit, canEdit }: any) => {
    return (
        <div className="max-w-md mx-auto px-4 mt-24 pb-32 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black italic text-purple-400 uppercase tracking-tighter flex items-center gap-2"><IconTrophy /> EUROQUINIELA</h1>
                {locked ? (
                    <button onClick={onEdit} className="bg-[#facc15] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:scale-105 transition-transform border border-yellow-600"><IconEdit size={14}/> EDITAR</button>
                ) : (
                    <button onClick={onEdit} className="bg-[#22c55e] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:scale-105 transition-transform border border-green-600"><IconCheck size={14}/> GUARDAR</button>
                )}
            </div>
            <p className="text-white/60 text-xs mb-4">Selecciona los 2 equipos que pasarán de grupo. (12 aciertos = 25M extra).</p>
            <div className="space-y-4">
                {EURO_GROUPS_DATA.map((group) => (
                    <div key={group.name} className="bg-[#1c2a45] p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-3"><h3 className="text-[#facc15] font-black uppercase text-sm">{group.name}</h3><span className="text-[9px] text-white/40 font-bold uppercase">{selections[group.name]?.length || 0}/2 SELECCIONADOS</span></div>
                        <div className="grid grid-cols-2 gap-2">
                            {group.teams.map((team) => {
                                const isSelected = selections[group.name]?.includes(team);
                                return (
                                    <button key={team} disabled={locked} onClick={() => onToggle(group.name, team)} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${isSelected ? 'bg-[#22c55e] text-black border-white shadow-lg' : 'bg-[#0d1526] text-white/50 border-white/5 hover:bg-white/5'} ${locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}>
                                        <span className="text-xl">{getFlag(team)}</span><span className="text-[10px] font-black uppercase">{team}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// 6. REGLAS Y PUNTUACIONES
// ==========================================

const RuleCard = ({ color, title, icon, children }: any) => {
  return (
    <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-xl">
      <div className="p-4 flex items-center justify-between" style={{ borderLeft: `6px solid ${color}` }}>
        <div className="flex items-center gap-3">{icon}<h3 className="font-black italic uppercase text-lg tracking-wide text-white">{title}</h3></div>
      </div>
      <div className="p-5 border-t border-white/5 bg-[#0d1526]/50 text-sm text-gray-100 leading-relaxed text-left">{children}</div>
    </div>
  );
};

const ScoreRow = ({ label, pts, color = "text-white" }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
        <span className="text-gray-200 font-medium text-xs uppercase">{label}</span><span className={`font-black text-sm ${color}`}>{pts}</span>
    </div>
);

const FixedRulesView = () => {
  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <div className="relative h-72 w-full mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[#05080f]/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/20 to-transparent z-10"></div>
        <div className="absolute inset-0 z-0">
           <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1624280433509-b4dca387790d?q=80&w=2070&auto=format&fit=crop')" }}></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-8 z-20">
            <h1 className="text-4xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-2 flex items-center gap-3 drop-shadow-lg">
              <IconFileText size={36} /> REGLAMENTO
            </h1>
            <p className="text-white text-sm font-bold tracking-widest max-w-lg leading-relaxed drop-shadow-md">
                Bienvenido a la guía oficial. Aquí encontrarás todo lo necesario para dominar el juego.
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
            <div className="flex items-center gap-3"><IconCaptain /><p className="text-sm"><strong className="text-[#facc15] uppercase">Capitán:</strong> Puntúa DOBLE (positivo o negativo).</p></div>
            <div className="flex items-center gap-3"><span className="text-red-400 text-lg">⚠️</span><p className="text-sm"><strong className="text-red-400 uppercase">Penalización:</strong> Cada hueco vacío en el 11 resta <strong>-1 punto</strong>.</p></div>
             <div className="flex items-center gap-3"><IconSub className="w-7 h-7 text-blue-400" /><p className="text-sm"><strong className="text-blue-400 uppercase">Suplentes:</strong> Entran automático por orden (S1→S6) si un titular no juega.</p></div>
             <div className="flex items-center gap-3 bg-blue-900/20 p-2 rounded border border-blue-500/30"><IconCheck size={16} className="text-blue-400"/><p className="text-sm text-blue-200"><strong>En la primera fase el límite de jugadores de la misma selección es 7.</strong></p></div>
          </div>
        </RuleCard>

        {/* 2. TÁCTICAS */}
        <RuleCard color="#3b82f6" title="2. Tácticas Válidas" icon={<IconShield />}>
          <p className="mb-4 text-xs uppercase font-bold text-white/50">Esquemas permitidos:</p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold text-center">
             {["1-5-3-2", "1-4-4-2", "1-4-5-1", "1-4-3-3", "1-3-4-3"].map(t => (
               <div key={t} className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:bg-[#22c55e]/20 transition-colors cursor-default">{t}</div>
             ))}
             <div className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] flex justify-center gap-2 items-center">1-3-5-2 <span className="text-red-500 font-black animate-pulse">(NEW)</span></div>
          </div>
        </RuleCard>

        {/* 3. FICHAJES */}
        <RuleCard color="#ec4899" title="3. Mercado de Fichajes" icon={<IconRefresh />}>
           <p className="mb-4 font-bold text-white text-base">Ventana abierta: Jornada 3 → Octavos.</p>
           <ul className="space-y-3 text-sm text-gray-200">
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Máximo <strong>7 cambios</strong> permitidos.</li>
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Límite: <strong>8 jugadores/país</strong>.</li>
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Tu presupuesto aumenta con los premios de la <span className="text-[#22c55e] font-black uppercase ml-1">EUROQUINIELA.</span></li>
             <li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Presupuesto inicial: <strong>400M</strong>.</li>
           </ul>
        </RuleCard>

        {/* 4. PUNTUACIONES */}
        <RuleCard color="#facc15" title="4. Puntuaciones" icon={<IconFileText />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-[#22c55e] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Acción Ofensiva</h4>
                    <ScoreRow label="⚽ Gol (Cualquiera)" pts="+5" color="text-[#22c55e]" />
                    <ScoreRow label="👟 Asistencia" pts="+1" color="text-[#22c55e]" />
                    <ScoreRow label={<div className="flex items-center gap-2">🥅 ✅ <span>Penalti Marcado</span></div>} pts="+5" color="text-[#22c55e]" />
                    <ScoreRow label={<div className="flex items-center gap-2">🥅 ❌ <span>Penalti Fallado</span></div>} pts="-3" color="text-red-500" />
                    <ScoreRow label="📉 Gol Propia Meta" pts="-1" color="text-red-500" />
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-[#facc15] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Portero (POR)</h4>
                        <ScoreRow label={<div className="flex items-center gap-2">🥅 ⛔ <span>Penalti Parado</span></div>} pts="+3" color="text-[#22c55e]" />
                        <ScoreRow label={<div className="flex items-center gap-2">🥅 🧤 <span>Portería a 0 (+60&apos;)</span></div>} pts="+4" color="text-[#22c55e]" />
                        <div className="pt-2 border-t border-white/5 mt-2"><ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽ <span>1 Gol Encajado</span></div>} pts="0" color="text-gray-400" /><ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽⚽ / + <span>2 Goles Enc.</span></div>} pts="-2 / -3..." color="text-red-400" /></div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-[#3b82f6] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Defensa (DEF)</h4>
                        <ScoreRow label="🛡️ Portería a 0 (+45&apos;)" pts="+2" color="text-[#22c55e]" />
                    </div>
                </div>

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

        {/* 5. VALORACIONES SOFASCORE */}
        <RuleCard color="#a855f7" title="5. Valoraciones Sofascore" icon={<IconFourStars />}>
           <p className="mb-4 text-left text-gray-300 text-sm">Puntos extra basados en la nota del jugador en la App <span className="text-blue-400 font-black uppercase">SOFASCORE</span></p>
           <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div className="space-y-3">
                  <div className="bg-[#1e4620] p-3 rounded-lg border border-[#22c55e]/30 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Excelente</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.5 - 10</span><b className="text-[#22c55e]">+14</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.0 - 9.4</span><b className="text-[#22c55e]">+13</b></div></div>
                  <div className="bg-[#14532d] p-3 rounded-lg border border-green-500/20 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Bueno</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.6 - 8.9</span><b className="text-[#4ade80]">+12</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.2 - 8.5</span><b className="text-[#4ade80]">+11</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.0 - 8.1</span><b className="text-[#4ade80]">+10</b></div></div>
                  <div className="bg-[#166534] p-3 rounded-lg border border-green-500/20 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Bueno</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.8 - 7.9</span><b className="text-[#86efac]">+9</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.6 - 7.7</span><b className="text-[#86efac]">+8</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.4 - 7.5</span><b className="text-[#86efac]">+7</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.2 - 7.3</span><b className="text-[#86efac]">+6</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.0 - 7.1</span><b className="text-[#86efac]">+5</b></div></div>
              </div>
              <div className="space-y-3">
                  <div className="bg-[#374151] p-3 rounded-lg border border-gray-500/20 shadow-lg"><div className="font-black text-gray-300 text-sm uppercase mb-2 border-b border-white/10 pb-1">Medio</div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.8 - 6.9</span><b className="text-white">+4</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.6 - 6.7</span><b className="text-white">+3</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.4 - 6.5</span><b className="text-white">+2</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.2 - 6.3</span><b className="text-white">+1</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.0 - 6.1</span><b className="text-white">0</b></div></div>
                  <div className="bg-[#7f1d1d] p-3 rounded-lg border border-red-500/20 shadow-lg"><div className="font-black text-red-200 text-sm uppercase mb-2 border-b border-white/10 pb-1">Malo</div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.8 - 5.9</span><b className="text-white">-1</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.6 - 5.7</span><b className="text-white">-2</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.4 - 5.5</span><b className="text-white">-3</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.2 - 5.3</span><b className="text-white">-4</b></div></div>
                  <div className="bg-[#450a0a] p-3 rounded-lg border border-red-900/40 shadow-lg"><div className="font-black text-red-400 text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Malo</div><div className="flex justify-between px-2 py-0.5 text-red-300"><span>5.0 - 5.1</span><b className="text-white">-5</b></div><div className="flex justify-between px-2 py-0.5 text-red-300"><span>0.0 - 4.9</span><b className="text-white">-6</b></div></div>
              </div>
           </div>
        </RuleCard>
        
        {/* 6. EUROQUINIELA */}
        <RuleCard color="#06b6d4" title="6. Euroquiniela" icon={<IconTrophy size={24} style={{ color: "#06b6d4" }} />}>
          <p className="text-sm mb-4 text-left text-gray-300 leading-relaxed">Acierta los 2 clasificados de cada grupo para ganar presupuesto para fichar en la ventana de fichajes:</p>
          <div className="grid grid-cols-2 gap-3 text-xs font-black text-center uppercase tracking-wide">
            <div className="bg-[#ea580c] text-white p-3 rounded-lg shadow-md border border-white/5">12 aciertos <span className="block text-lg">25 M</span></div>
            <div className="bg-[#10b981] text-white p-3 rounded-lg shadow-md border border-white/5">8 aciertos <span className="block text-lg">10 M</span></div>
            <div className="bg-[#f59e0b] text-black p-3 rounded-lg shadow-md border border-white/5">11 aciertos <span className="block text-lg">20 M</span></div>
            <div className="bg-[#06b6d4] text-black p-3 rounded-lg shadow-md border border-white/5">7 aciertos <span className="block text-lg">8 M</span></div>
            <div className="bg-[#eab308] text-black p-3 rounded-lg shadow-md border border-white/5">10 aciertos <span className="block text-lg">15 M</span></div>
            <div className="bg-[#3b82f6] text-white p-3 rounded-lg shadow-md border border-white/5">6 aciertos <span className="block text-lg">6 M</span></div>
            <div className="bg-[#84cc16] text-black p-3 rounded-lg shadow-md border border-white/5">9 aciertos <span className="block text-lg">12 M</span></div>
            <div className="bg-gray-500 text-white p-3 rounded-lg shadow-md border border-white/5">5 aciertos <span className="block text-lg">5 M</span></div>
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
                   <div className="flex flex-col items-center gap-1"><span className="text-3xl filter brightness-125">🥈</span><span className="text-xs font-bold text-gray-400">2º Puesto</span><span className="text-xl font-black text-[#e2e8f0]">30%</span></div>
                   <div className="flex flex-col items-center gap-1 -mt-4"><span className="text-5xl filter brightness-110">🥇</span><span className="text-sm font-black text-[#ffd700] uppercase tracking-wide">1º Puesto</span><span className="text-3xl font-black text-white drop-shadow-md">60%</span></div>
                   <div className="flex flex-col items-center gap-1"><span className="text-3xl filter saturate-150">🥉</span><span className="text-xs font-bold text-orange-700/80">3º Puesto</span><span className="text-xl font-black text-[#f97316]">10%</span></div>
                </div>
              </div>
            </div>
        </RuleCard>
      </div>
    </div>
  );
};

// COMPONENTE SCORETEAMROW
const ScoreTeamRow = ({ team, isMyTeam, isAdmin }: any) => {
    const [isOpen, setIsOpen] = useState(isMyTeam);
    const positionOrder: Record<string, number> = { "POR": 1, "DEF": 2, "MED": 3, "DEL": 4 };
    
    // Si no tiene squad, se muestra vacío (NO INVENTADO)
    const safeSquad = team.squad || {};
    
    const titulares = Array.isArray(safeSquad.titulares) ? safeSquad.titulares : [];
    const banquillo = Array.isArray(safeSquad.banquillo) ? safeSquad.banquillo : [];
    const extras = Array.isArray(safeSquad.extras) ? safeSquad.extras : [];

    const allPlayers = [...titulares, ...banquillo, ...extras];
    
    allPlayers.sort((a: any, b: any) => { 
        const posDiff = positionOrder[a.posicion] - positionOrder[b.posicion]; 
        if (posDiff !== 0) return posDiff; 
        return a.nombre.localeCompare(b.nombre); 
    });

    const canView = isMyTeam || isAdmin;

    useEffect(() => { if (isMyTeam) setIsOpen(true); }, [isMyTeam]);

    return (
        <div className={`rounded-2xl overflow-hidden shadow-xl transition-all mb-4 ${isMyTeam ? 'border-2 border-[#facc15] shadow-[#facc15]/20 bg-[#facc15]/10' : 'border border-white/5 bg-[#1c2a45]'}`}>
            <div onClick={() => canView && setIsOpen(!isOpen)} className={`p-4 flex justify-between items-center ${canView ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'} transition-colors`}>
                <div><h2 className={`text-lg font-black italic uppercase ${isMyTeam ? 'text-[#facc15]' : 'text-white'}`}>{team.name}</h2><span className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1"><IconUser size={10}/> {team.user}</span></div>
                <div className="flex items-center gap-4"><span className="block text-2xl font-black text-cyan-400">{team.points} PTS</span>{!canView ? <IconLock size={16} /> : (isOpen ? <IconChevronUp size={20} className="text-white/40"/> : <IconChevronDown size={20} className="text-white/40"/>)}</div>
            </div>
            {!canView && <div onClick={() => alert("🔒 Plantilla oculta hasta el inicio del torneo")} className="h-0" />} 
            {isOpen && canView && (
                <div className="overflow-x-auto custom-scrollbar animate-in slide-in-from-top duration-300">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead><tr className="bg-white/5 text-[10px] font-black uppercase text-white tracking-widest border-b-2 border-cyan-500/50"><th className="p-3">Pos</th><th className="p-3 text-center">SEL</th><th className="p-3 w-1/3">Nombre</th><th className="p-3 text-center bg-blue-900/30 text-cyan-400 border-x border-white/5">Total</th><th className="p-3 text-center">J1</th><th className="p-3 text-center">J2</th><th className="p-3 text-center">J3</th></tr></thead>
                        <tbody className="text-xs font-bold text-white divide-y divide-white/5">
                            <tr className="bg-blue-600/20 text-xs font-black text-cyan-400 border-b-2 border-white/10"><td colSpan={3} className="p-3 text-right uppercase tracking-widest">PUNTOS JORNADA</td><td className="p-3 text-center text-white bg-blue-600/40 border-x border-white/10 text-sm">{team.points}</td><td className="p-3 text-center">0</td><td className="p-3 text-center">0</td><td className="p-3 text-center">0</td></tr>
                            {allPlayers.length > 0 ? allPlayers.map((p: any) => (<tr key={p.id} className="hover:bg-white/5 transition-colors group"><td className="p-3"><span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${posColors[p.posicion]}`}>{p.posicion}</span></td><td className="p-3 text-center text-lg">{getFlag(p.seleccion)}</td><td className="p-3 truncate max-w-[120px] font-medium text-white/90 group-hover:text-white">{p.nombre}</td><td className="p-3 text-center font-black text-white bg-blue-900/20 border-x border-white/5 text-sm">0</td><td className="p-3 text-center text-white/30">-</td><td className="p-3 text-center text-white/30">-</td><td className="p-3 text-center text-white/30">-</td></tr>)) : (
                                <tr><td colSpan={7} className="p-6 text-center text-white/30 italic">Sin jugadores alineados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ScoresView = ({ teams, myTeamId, isAdmin }: { teams: any[], myTeamId: string | undefined, isAdmin: boolean }) => {
    const sortedTeams = useMemo(() => { return [...teams].sort((a, b) => a.name.localeCompare(b.name)); }, [teams]);
    return (
        <div className="max-w-4xl mx-auto px-4 mt-24 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-cyan-400 uppercase tracking-tighter mb-6 flex items-center gap-2"><IconClipboard /> TABLA DE PUNTUACIONES</h1>
            <div className="space-y-4">{sortedTeams.map((team) => <ScoreTeamRow key={team.id} team={team} isMyTeam={team.id === myTeamId} isAdmin={isAdmin} />)}</div>
        </div>
    );
};
// ==========================================
// 7. PANTALLAS MODALES Y APP PRINCIPAL
// ==========================================

const AuthScreen = ({ onLogin }: { onLogin: (email: string, username: string, teamName?: string) => void }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [teamName, setTeamName] = useState(""); 
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setErrorMsg(""); setLoading(true);
      try {
          if (isRegister) {
              if (!email || !password || !username || !teamName) throw new Error("Rellena todos los campos");
              const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, team_name: teamName } } });
              if (error) throw error; if (data.user) onLogin(data.user.email!, username, teamName);
          } else {
               if (!email || !password) throw new Error("Rellena email y contraseña");
               const { data, error } = await supabase.auth.signInWithPassword({ email, password });
               if (error) throw error; if (data.user) onLogin(data.user.email!, data.user.user_metadata.username || "Mister", data.user.user_metadata.team_name || "");
          }
      } catch (err: any) { setErrorMsg(err.message || "Error"); } finally { setLoading(false); }
    };
  
    return (
      <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 font-sans text-white"><div className="w-full max-w-md bg-[#162136] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden"><div className="text-center mb-8"><h1 className="text-3xl font-black italic uppercase text-[#22c55e]">EUROCOPA<br/><span className="text-white">FANTÁSTICA</span></h1></div>{errorMsg && <div className="mb-4 text-red-500 text-xs text-center">{errorMsg}</div>}<form onSubmit={handleSubmit} className="space-y-4">{isRegister && <><input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none" placeholder="Usuario" /><input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none" placeholder="Nombre Equipo" /></>}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none" placeholder="Email" /><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none" placeholder="Contraseña" /><button type="submit" className="w-full py-4 mt-6 bg-[#22c55e] text-black font-black uppercase rounded-xl">{loading ? "..." : (isRegister ? "CREAR" : "ENTRAR")}</button></form><div className="mt-6 text-center"><button onClick={() => setIsRegister(!isRegister)} className="text-xs font-black underline text-[#facc15]">{isRegister ? "¿Ya tienes cuenta?" : "Regístrate"}</button></div></div></div>
    );
  };
  
  const SelectionModal = ({ activeSlot, onClose, onSelect, onRemove, selectedIds, lineupTopology, mode, sortPrice, setSortPrice, activeSort, setActiveSort, allPlayersSelected }: any) => {
    const [filterPos, setFilterPos] = useState((mode === 'lineup' && activeSlot.type === 'titular') ? activeSlot.pos : "TODOS");
    const [filterCountry, setFilterCountry] = useState("TODOS");
    const uniqueCountries = useMemo(() => ["TODOS", ...Array.from(new Set(PLAYERS_DB.map(p => p.seleccion))).sort()], []);
  
    const getCountryCount = React.useCallback((country: string) => {
        if (!allPlayersSelected) return 0;
        return allPlayersSelected.filter((p: any) => p.seleccion === country).length;
    }, [allPlayersSelected]);
  
    const getPlayerStatus = React.useCallback((playerId: number) => {
        if (!lineupTopology) return "NONE";
        const { selected, bench, extras } = lineupTopology;
        if (Object.values(selected).find((p:any) => p.id === playerId)) return "TITULAR";
        if (Object.values(bench).find((p:any) => p.id === playerId)) return "BANQUILLO";
        if (Object.values(extras).find((p:any) => p.id === playerId)) return "NO CONVOCADO";
        return "NONE";
    }, [lineupTopology]);
  
    const filteredPlayers = useMemo(() => {
      let result: any[] = [];
      
      // MODO ALINEACIÓN
      if (mode === 'lineup' && lineupTopology) {
          const { selected, bench, extras } = lineupTopology;
          const allMyPlayers = [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)];
          if (activeSlot.type === 'titular') { 
              result = allMyPlayers.filter((p:any) => p.posicion === activeSlot.pos); 
          } else { 
              result = allMyPlayers; 
          }
      } 
      // MODO MERCADO
      else {
          result = PLAYERS_DB.filter(p => !selectedIds.includes(p.id));
      }
  
      if (filterCountry !== "TODOS") result = result.filter((p:any) => p.seleccion === filterCountry);
      if (filterPos !== "TODOS") result = result.filter((p:any) => p.posicion === filterPos);
      
      if (mode === 'lineup') {
          result.sort((a:any, b:any) => {
              const statusOrder: any = { "TITULAR": 1, "BANQUILLO": 2, "NO CONVOCADO": 3, "NONE": 4 };
              return statusOrder[getPlayerStatus(a.id)] - statusOrder[getPlayerStatus(b.id)];
          });
      } else {
          result.sort((a:any, b:any) => activeSort === 'price' ? (sortPrice === 'desc' ? b.precio - a.precio : a.precio - b.precio) : b.nombre.localeCompare(a.nombre));
      }
      
      return result;
    }, [selectedIds, filterPos, filterCountry, mode, lineupTopology, activeSlot, sortPrice, activeSort, getPlayerStatus]);
  
    const getStatusBg = (id: number) => {
        const s = getPlayerStatus(id);
        if (s === "TITULAR") return "bg-green-900/30 border-green-500/50";
        if (s === "BANQUILLO") return "bg-yellow-400/20 border-yellow-400/60";
        if (s === "NO CONVOCADO") return "bg-red-900/40 border-red-500/50";
        return "bg-[#162136] border-white/10";
    };
  
    return (
      <div className="fixed inset-0 z-[200] bg-[#05080f] p-6 flex flex-col animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic uppercase text-white">ELEGIR</h2><button onClick={onClose}><IconX/></button></div>
        
        {onRemove && (
            <button onClick={onRemove} className="mb-4 w-full bg-red-600/20 border border-red-500 text-red-500 p-4 rounded-xl font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-2">
                {mode === 'lineup' ? 'ENVIAR A LA GRADA' : 'ELIMINAR JUGADOR'} <IconTrash2 size={16} />
            </button>
        )}
        
        <div className="flex gap-2 mb-4">{["POR", "DEF", "MED", "DEL"].map(pos => (<button key={pos} disabled={mode === 'lineup' && activeSlot.type === 'titular'} onClick={() => setFilterPos(pos)} className={`flex-1 py-2 rounded-xl font-black text-[10px] border ${filterPos === pos ? 'bg-white text-black' : 'text-white border-white/20'} ${mode === 'lineup' && activeSlot.type === 'titular' && activeSlot.pos !== pos ? 'opacity-20' : ''}`}>{pos}</button>))}</div>
        
        {mode === 'market' && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                {uniqueCountries.map(c => {
                    const count = getCountryCount(c);
                    const isMaxed = count >= 7; 
                    return (
                        <button key={c} onClick={()=>setFilterCountry(c)} className={`px-3 py-1 rounded-lg text-[9px] font-black border whitespace-nowrap flex items-center gap-1 ${filterCountry===c?'bg-[#22c55e] text-black':'border-white/20'} ${isMaxed ? 'opacity-50' : ''}`}>
                            {c !== "TODOS" && <span>{getFlag(c)}</span>} {c} {c !== "TODOS" && <span className={isMaxed ? "text-red-500 ml-1" : "opacity-50 ml-1"}>({count}/7)</span>}
                        </button>
                    );
                })}
            </div>
        )}
        
        {mode === 'market' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => { setSortPrice((prev: any) => prev === 'desc' ? 'asc' : 'desc'); setActiveSort('price'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'price' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><IconArrowUpDown size={14}/> {sortPrice === 'desc' ? 'PRECIO MÁX' : 'PRECIO MÍN'}</button>
                <button onClick={() => { setActiveSort('alpha'); }} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${activeSort === 'alpha' ? 'bg-[#1c2a45] border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40'}`}><IconArrowDownUp size={14}/> A - Z</button>
            </div>
        )}
  
        <div className="space-y-3 overflow-y-auto flex-1 pb-10">
            {filteredPlayers.length === 0 ? <p className="text-center text-white/30 italic mt-10">No hay jugadores disponibles.</p> : filteredPlayers.map((p: any) => (
                <div key={p.id} onClick={() => onSelect(p)} className={`p-4 rounded-xl border flex justify-between items-center active:scale-95 transition-transform ${mode === 'lineup' ? getStatusBg(p.id) : 'bg-[#162136] border-white/10'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(p.seleccion)}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{p.nombre}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/50">{p.posicion}</span>
                                {mode === 'lineup' && <span className="text-[9px] font-black uppercase tracking-wide opacity-70">{getPlayerStatus(p.id)}</span>}
                            </div>
                        </div>
                    </div>
                    <span className="text-[#22c55e] font-black">{p.precio}M</span>
                </div>
            ))}
        </div>
      </div>
    );
  };
  
  export default function EuroApp() {
    const [user, setUser] = useState<{email: string, username: string, teamName?: string, id?: string} | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState<'rules' | 'squad' | 'classification' | 'calendar' | 'quiniela' | 'scores' | 'lineups'>('squad'); 
    const [selected, setSelected] = useState<any>({});
    const [bench, setBench] = useState<any>({});
    const [extras, setExtras] = useState<any>({});
    const [captain, setCaptain] = useState<number | null>(null);
    const [squadValidated, setSquadValidated] = useState(false);
    const [currentTeamName, setCurrentTeamName] = useState(""); 
    const [isEditingName, setIsEditingName] = useState(false); 
    const [lineupViewJornada, setLineupViewJornada] = useState("J2"); 
    const [lineupSelected, setLineupSelected] = useState<any>({});
    const [lineupBench, setLineupBench] = useState<any>({});
    const [lineupExtras, setLineupExtras] = useState<any>({});
    const [isLineupEditing, setIsLineupEditing] = useState(false); 
    const [quinielaSelections, setQuinielaSelections] = useState<Record<string, string[]>>({});
    const [quinielaLocked, setQuinielaLocked] = useState(false);
    const [allTeams, setAllTeams] = useState<any[]>(MOCK_TEAMS_DB); 
    const [activeSlot, setActiveSlot] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [benchFilter, setBenchFilter] = useState("TODOS");
    const [extrasFilter, setExtrasFilter] = useState("TODOS");
    const [sortPrice, setSortPrice] = useState<'desc' | 'asc'>('desc');
    const [activeSort, setActiveSort] = useState<'price' | 'alpha'>('price');
  
    const allSquadPlayers = useMemo(() => [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)], [selected, bench, extras]);
    const budgetSpent = allSquadPlayers.reduce((a:number, p:any) => a + p.precio, 0);
    const isValidTactic = useMemo(() => VALID_FORMATIONS.includes(`${Object.keys(selected).filter(k=>k.startsWith("DEF")).length}-${Object.keys(selected).filter(k=>k.startsWith("MED")).length}-${Object.keys(selected).filter(k=>k.startsWith("DEL")).length}`), [selected]);
    
    const currentLineupTactic = useMemo(() => {
        const s = (isLineupEditing && Object.keys(lineupSelected).length > 0) ? lineupSelected : selected;
        if (!s || Object.keys(s).length === 0) return "0-0-0";
        const defs = Object.keys(s).filter(k=>k.startsWith("DEF")).length;
        const meds = Object.keys(s).filter(k=>k.startsWith("MED")).length;
        const dels = Object.keys(s).filter(k=>k.startsWith("DEL")).length;
        return `${defs}-${meds}-${dels}`;
    }, [lineupSelected, selected, isLineupEditing]);
  
    const isValidLineupTactic = useMemo(() => VALID_FORMATIONS.includes(currentLineupTactic), [currentLineupTactic]);
  
    const isJornadaEditable = (j: string) => {
        const activeIndex = LINEUP_MATCHDAYS.indexOf(CURRENT_REAL_MATCHDAY);
        const targetIndex = LINEUP_MATCHDAYS.indexOf(j);
        return targetIndex === activeIndex + 1; 
    };
  
    useEffect(() => { const c = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) loadUserData(session.user); }; c(); }, []);
    
    // Sincronización Inicial de Alineación (Con dependencias corregidas para Vercel)
    useEffect(() => {
       if (lineupViewJornada === CURRENT_REAL_MATCHDAY) {
           setLineupSelected(selected); setLineupBench(bench); setLineupExtras(extras);
       } else if (Object.keys(lineupSelected).length === 0 && Object.keys(selected).length > 0) {
           setLineupSelected(selected); setLineupBench(bench); setLineupExtras(extras);
       }
    }, [selected, bench, extras, lineupViewJornada, lineupSelected]); 
  
    const loadUserData = async (u: any) => { 
        try {
            const { data: dbTeams } = await supabase.from('teams').select('*');
            const myData = dbTeams?.find((d:any) => d.id === u.id);
            setIsAdmin(u.email === MASTER_EMAIL);
            const tName = myData?.team_name || u.user_metadata?.team_name || "Mi Equipo";
            setUser({ email: u.email, username: myData?.username || u.user_metadata?.username, teamName: tName, id: u.id });
            setCurrentTeamName(tName);
            
            let myParsedSquad = { titulares: [], banquillo: [], extras: [] };
            if (myData) {
                let s = myData.squad;
                if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { s = {}; } }
                setSelected(s?.selected || {}); setBench(s?.bench || {}); setExtras(s?.extras || {});
                setCaptain(s?.captain); setSquadValidated(myData.is_validated); 
                myParsedSquad = { titulares: s?.selected ? Object.values(s.selected) : [], banquillo: s?.bench ? Object.values(s.bench) : [], extras: s?.extras ? Object.values(s.extras) : [] };
                let q = myData.quiniela;
                if (typeof q === 'string') { try { q = JSON.parse(q); } catch (e) { q = {}; } }
                setQuinielaSelections(q?.selections || {}); setQuinielaLocked(q?.locked || false);
            }
  
            let combinedTeams = (dbTeams || []).map((t:any, i:number) => formatTeamData({...t, id: t.id, name: t.team_name, user: t.username}, i));
            const myIndex = combinedTeams.findIndex((t:any) => t.id === u.id);
            const myLiveData = { id: u.id, name: tName, user: myData?.username || u.user_metadata?.username || "Yo", points: myData?.points || 0, squad: myParsedSquad, hasPaidBet: myData?.hasPaidBet || false };
  
            if (myIndex === -1) combinedTeams.push(formatTeamData(myLiveData, 0));
            else combinedTeams[myIndex] = formatTeamData({ ...combinedTeams[myIndex], name: tName, squad: myParsedSquad }, 0);
  
            setAllTeams(combinedTeams);
        } catch(e) { console.error("Error cargando datos:", e); }
    };
  
    const handleLogin = (e: string, u: string, t?: string) => setUser({ email: e, username: u, teamName: t }); 
    const toggleQuiniela = (g: string, t: string) => { if(quinielaLocked) return; const c = quinielaSelections[g]||[]; if(c.includes(t)) setQuinielaSelections({...quinielaSelections,[g]:c.filter(x=>x!==t)}); else if(c.length<2) setQuinielaSelections({...quinielaSelections,[g]:[...c,t]}); };
  
    const handleSaveName = async () => {
        if(user && user.id) {
            await supabase.from('teams').update({ team_name: currentTeamName }).eq('id', user.id);
            setIsEditingName(false);
            loadUserData(user); 
        }
    };
  
    const handleLineupSwap = (slotId: string, player: any, slotType: 'selected' | 'bench' | 'extras') => {
        const sourceSelected = view === 'lineups' ? lineupSelected : selected;
        const sourceBench = view === 'lineups' ? lineupBench : bench;
        const sourceExtras = view === 'lineups' ? lineupExtras : extras;
  
        const cleanState = (obj: any) => {
            const newObj = { ...obj };
            Object.keys(newObj).forEach(key => { if (newObj[key].id === player.id) delete newObj[key]; });
            return newObj;
        };
  
        const cleanedSel = cleanState(sourceSelected);
        const cleanedBen = cleanState(sourceBench);
        const cleanedExt = cleanState(sourceExtras);
  
        setTimeout(() => {
            if (slotType === 'selected') cleanedSel[slotId] = player;
            else if (slotType === 'bench') cleanedBen[slotId] = player;
            else cleanedExt[slotId] = player;
  
            if (view === 'lineups') { setLineupSelected(cleanedSel); setLineupBench(cleanedBen); setLineupExtras(cleanedExt); } 
            else { setSelected(cleanedSel); setBench(cleanedBen); setExtras(cleanedExt); }
        }, 0);
    };
  
    const handleLineupToExtras = () => {
        if (!activeSlot) return;
        const playerToRemove = view === 'lineups' 
            ? (activeSlot.type === 'titular' ? lineupSelected[activeSlot.id] : lineupBench[activeSlot.id]) 
            : (activeSlot.type === 'titular' ? selected[activeSlot.id] : bench[activeSlot.id]);
        if (!playerToRemove) return;
  
        if (view === 'lineups') {
            const newKey = `NC-${Date.now()}`;
            const newExtras = { ...lineupExtras, [newKey]: playerToRemove };
            let newSelected = { ...lineupSelected };
            let newBench = { ...lineupBench };
            if (activeSlot.type === 'titular') delete newSelected[activeSlot.id]; else delete newBench[activeSlot.id];
            setLineupSelected(newSelected); setLineupBench(newBench); setLineupExtras(newExtras);
        } else {
            const n = {...selected}; delete n[activeSlot.id]; setSelected(n);
            const b = {...bench}; delete b[activeSlot.id]; setBench(b);
            const e = {...extras}; delete e[activeSlot.id]; setExtras(e);
        }
        setActiveSlot(null);
    };
  
    const handleValidateSquad = async () => { 
        if(!isValidTactic) return alert("⚠️ Táctica inválida."); 
        if(Object.keys(selected).length!==11) return alert("⚠️ Faltan titulares."); 
        if(budgetSpent > MAX_BUDGET) return alert("⚠️ Presupuesto excedido.");
        setSquadValidated(true); 
        if(user && user.id) {
            await supabase.from('teams').update({ team_name: currentTeamName, is_validated: true, squad: { selected, bench, extras, captain } }).eq('id', user.id);
            loadUserData(user);
        }
    };
    
    const handleUnlockSquad = () => { setSquadValidated(false); setStep(4); };
    const handleResetTeam = async () => { 
        if(confirm("¿Estás seguro? Se borrará todo tu equipo.")) { 
            setSelected({}); setBench({}); setExtras({}); setSquadValidated(false); 
            if(user && user.id) { await supabase.from('teams').update({ squad: {}, is_validated: false, points: 0 }).eq('id', user.id); loadUserData(user); }
        }
    };
    const handleToggleBet = async (teamId: any, status: boolean) => {
        const updatedTeams = allTeams.map(t => { if (t.id === teamId) return { ...t, hasPaidBet: status }; return t; });
        setAllTeams(updatedTeams);
        try { await supabase.from('teams').update({ hasPaidBet: status }).eq('id', teamId); } catch (err) {}
    };
  
    const getAssistantText = () => {
        if (view === 'squad') return !squadValidated ? `PASO ${step} DE 6: ${step===1?"Elige tu 11 titular":step===2?"Elige capitán":step===3?"Elige banquillo":"Elige no convocados"}` : "¡PLANTILLA LISTA! Ve a Alineaciones.";
        if (view === 'quiniela') return "Predice los 2 clasificados de cada grupo. ¡Acierta y gana presupuesto!";
        if (view === 'lineups') {
            if (lineupViewJornada === CURRENT_REAL_MATCHDAY) return `VISUALIZANDO ${lineupViewJornada}: Esta jornada ya está en juego. No se puede editar.`;
            if (isJornadaEditable(lineupViewJornada)) {
                if (!isValidLineupTactic) return `⚠️ TÁCTICA ${currentLineupTactic} INCORRECTA. Revisa tu 11.`;
                return `EDITANDO ${lineupViewJornada}: Táctica ${currentLineupTactic} correcta. Haz cambios y guarda.`;
            }
            return `JORNADA ${lineupViewJornada}: Bloqueada hasta el inicio de la misma.`;
        }
        return "";
    };
  
    if (!user) return <AuthScreen onLogin={handleLogin} />;
  
    return (
      <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-44">
        <MusicPlayer />
        <NavBar view={view} setView={setView} onLogout={() => setUser(null)} squadCompleted={squadValidated} />
        
        {/* HEADER FIJO CON ASISTENTE */}
        {['squad', 'lineups', 'quiniela'].includes(view) && (
          <div className="sticky top-[60px] z-[100] bg-[#0d1526]/95 backdrop-blur-md pb-2 shadow-xl border-b border-white/5 px-4 pt-4">
              <div className="flex justify-between items-start bg-[#1c2a45] p-3 rounded-xl border-l-4 border-[#22c55e]">
                 <div className="flex-1"><p className="text-[10px] font-black text-[#22c55e]">ASISTENTE VIRTUAL</p><div className="text-xs font-semibold italic min-h-[1.5rem]"><Typewriter text={getAssistantText()} isError={false}/></div><CountdownBlock /></div>
              </div>
              
              {/* BOTONES PLANTILLA (SOLUCIÓN: MISMO TAMAÑO) */}
              {view === 'squad' && (
                  <div className="mt-2">
                      {squadValidated ? (
                          <button onClick={handleUnlockSquad} className="w-full bg-[#facc15] text-black p-2 rounded-lg font-black text-[10px] uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"><IconEdit size={14}/> EDITAR PLANTILLA</button>
                      ) : (
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={handleValidateSquad} className="bg-[#22c55e] text-black p-2 rounded-lg font-black text-[10px] uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg animate-pulse-slow"><IconCheck size={14}/> VALIDAR EQUIPO</button>
                              <button onClick={handleResetTeam} className="bg-red-500/20 text-red-500 border border-red-500/50 p-2 rounded-lg font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"><IconTrash2 size={14}/> REINICIAR</button>
                          </div>
                      )}
                  </div>
              )}
          </div>
        )}
  
        {view === 'rules' && <FixedRulesView />}
        {view === 'calendar' && <CalendarView />}
        {view === 'scores' && <ScoresView teams={allTeams} myTeamId={user.id} isAdmin={isAdmin} />}
        {view === 'classification' && ( <div className="max-w-md mx-auto px-4 mt-20 pb-32"> <div className="mb-8 mt-4"><h3 className="text-[#facc15] font-black uppercase text-lg mb-4 flex gap-2"><IconTrophy/> CLASIFICACIÓN GENERAL</h3>{allTeams.sort((a,b)=>b.points-a.points).map((t,i) => (<TeamCard key={t.id} team={t} rank={i+1} isMyTeam={t.id === user.id} isAdmin={isAdmin} onToggleBet={handleToggleBet} />))}</div><EvolutionChart teams={allTeams} myTeamId={user.id}/> <MatchdayStandings teams={allTeams} /> </div> )}
        {view === 'quiniela' && <QuinielaView selections={quinielaSelections} onToggle={toggleQuiniela} locked={quinielaLocked} onEdit={() => setQuinielaLocked(!quinielaLocked)} canEdit={new Date() < new Date(GAME_START_DATE)} />}
  
        {view === 'squad' && (
           <div className="max-w-md mx-auto px-4 mt-40"> 
               <div className="bg-[#162136] p-4 rounded-2xl border border-white/10 mb-4 shadow-lg mt-2">
                   <div className="flex justify-between text-xs font-black uppercase mb-2"><span className="text-white/50">PRESUPUESTO</span><span className={budgetSpent > MAX_BUDGET ? "text-red-500" : "text-[#22c55e]"}>{budgetSpent}M / {MAX_BUDGET}M</span></div>
                   <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10"><div className={`h-full shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all duration-500 ${budgetSpent > MAX_BUDGET ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent/MAX_BUDGET)*100, 100)}%`}}></div></div>
               </div>
  
               <div className="mb-6 bg-[#1c2a45] p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                   <div className="bg-[#22c55e] p-2 rounded-lg text-black"><IconShield size={20}/></div>
                   <div className="flex-1">
                       <p className="text-[9px] font-bold text-white/40 uppercase mb-1">NOMBRE DE TU EQUIPO</p>
                       {isEditingName ? (
                           <input type="text" value={currentTeamName} onChange={(e) => setCurrentTeamName(e.target.value)} className="w-full bg-black/20 p-2 rounded text-white font-black uppercase text-sm outline-none border border-white/20" autoFocus />
                       ) : (
                           <h2 className="text-lg font-black text-white uppercase italic">{currentTeamName}</h2>
                       )}
                   </div>
                   {isEditingName ? (
                       <button onClick={handleSaveName} className="bg-[#22c55e] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">VALIDAR</button>
                   ) : (
                       <button onClick={() => setIsEditingName(true)} className="bg-[#facc15] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform flex items-center gap-1"><IconEdit size={12}/> EDITAR</button>
                   )}
               </div>
  
               <div className="text-left font-black italic text-lg text-white/40 tracking-widest uppercase pl-1 mb-2">TÁCTICA: <span className="text-[#22c55e] ml-2 text-xl drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">{Object.keys(selected).length === 11 ? `${Object.keys(selected).filter(k=>k.startsWith("DEF")).length}-${Object.keys(selected).filter(k=>k.startsWith("MED")).length}-${Object.keys(selected).filter(k=>k.startsWith("DEL")).length}` : '--'}</span></div>
               
               <Field selected={selected} step={step} canInteractField={!squadValidated} setActiveSlot={setActiveSlot} captain={captain} setCaptain={setCaptain} />
               
               <div className={`mt-8 p-4 rounded-[2.5rem] bg-sky-400/10 transition-all duration-300 ${step === 3 ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border border-white/5 opacity-80'}`}>
                  <p className="text-center font-black italic text-[10px] text-sky-400 mb-3 uppercase tracking-widest">BANQUILLO</p>
                  <div className="grid grid-cols-3 gap-2">{["S1", "S2", "S3", "S4", "S5", "S6"].map(id => <div key={id} onClick={() => !squadValidated && setActiveSlot({id, type:'bench', pos:'TODOS'})} className="aspect-square bg-white/5 rounded-xl border border-white/10 p-1"><BenchCard player={bench[id]} id={id} posColor={posColors[bench[id]?.posicion]} /></div>)}</div>
               </div>
  
               <div className={`mt-6 p-4 rounded-[2.5rem] bg-[#2a3b5a]/30 transition-all duration-300 ${step === 4 ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border border-white/5 opacity-80'}`}>
                   <p className="text-center font-black italic text-[10px] text-white/40 mb-3 uppercase tracking-widest">NO CONVOCADOS</p>
                   <div className="grid grid-cols-3 gap-2 mb-4">{["NC1", "NC2", "NC3"].map(id => <div key={id} onClick={() => !squadValidated && setActiveSlot({id, type:'extras', pos:'TODOS'})} className="aspect-square bg-white/5 rounded-xl border border-white/10 p-1"><BenchCard player={extras[id]} id={id} posColor={posColors[extras[id]?.posicion]} /></div>)}</div>
               </div>
           </div>
        )}
  
        {view === 'lineups' && (
           <div className="max-w-md mx-auto px-4 mt-36">
               <h1 className="text-2xl font-black italic text-cyan-400 uppercase tracking-tighter mb-4 flex items-center gap-2"><IconTshirt /> ALINEACIONES</h1>
               
               <div className="bg-blue-600 p-3 rounded-2xl mb-4 overflow-x-auto custom-scrollbar flex gap-3 shadow-lg border border-blue-400">
                   {LINEUP_MATCHDAYS.map(j => (
                       <button key={j} onClick={() => setLineupViewJornada(j)} className={`px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap transition-all ${lineupViewJornada===j ? 'bg-white text-blue-600 shadow-xl scale-105' : 'bg-blue-800/50 text-white/70 hover:bg-blue-700'}`}>{j}</button>
                   ))}
               </div>
               
               {isJornadaEditable(lineupViewJornada) && (
                   <div className="mb-6 flex flex-col gap-2">
                       <button onClick={()=>setIsLineupEditing(!isLineupEditing)} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLineupEditing?'bg-[#22c55e] text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105':'bg-[#facc15] text-black shadow-lg'}`}>
                           {isLineupEditing ? <><IconCheck/> GUARDAR ALINEACIÓN</> : <><IconEdit/> EDITAR ALINEACIÓN</>}
                       </button>
                       <div className={`text-center text-sm font-black uppercase tracking-widest py-1 rounded border ${isValidLineupTactic ? 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10' : 'text-red-500 border-red-500/30 bg-red-500/10 animate-pulse'}`}>
                           TÁCTICA: {currentLineupTactic} {isValidLineupTactic ? '(CORRECTA)' : '(INCORRECTA)'}
                       </div>
                   </div>
               )}
  
               <Field 
                  selected={lineupViewJornada === CURRENT_REAL_MATCHDAY ? selected : lineupSelected} 
                  step={2} 
                  canInteractField={isJornadaEditable(lineupViewJornada) && isLineupEditing} 
                  setActiveSlot={isLineupEditing ? setActiveSlot : undefined} 
                  captain={captain} 
                  setCaptain={isLineupEditing ? setCaptain : () => {}} 
               />
               
               {isJornadaEditable(lineupViewJornada) ? (
                   <div className={`mt-8 transition-all duration-300 ${isLineupEditing ? 'opacity-100 translate-y-0' : 'opacity-60 grayscale pointer-events-none translate-y-4'}`}>
                       <div className="p-4 rounded-[2.5rem] bg-[#1c2a45]/50 border border-white/5 mb-4 shadow-xl">
                           <div className="flex justify-between mb-2"><p className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">BANQUILLO</p><div className="flex gap-1">{["TODOS", "POR", "DEF", "MED", "DEL"].map(p=><button key={p} onClick={()=>setBenchFilter(p)} className={`text-[8px] px-2 py-0.5 rounded font-bold ${benchFilter===p?'bg-cyan-400 text-black':'bg-black/30'}`}>{p}</button>)}</div></div>
                           <div className="grid grid-cols-3 gap-2">{["S1", "S2", "S3", "S4", "S5", "S6"].map(id => { const p = lineupBench[id]; if(benchFilter!=="TODOS" && p?.posicion!==benchFilter) return null; return (<div key={id} onClick={() => setActiveSlot({id, type:'bench', pos:'TODOS'})} className="aspect-square bg-white/5 rounded-xl border border-white/10 p-1 cursor-pointer hover:bg-white/10 transition-colors"><BenchCard player={p} id={id} posColor={posColors[p?.posicion]} /></div>)})}</div>
                       </div>
                       <div className="p-4 rounded-[2.5rem] bg-[#2a3b5a]/30 border border-white/5 mb-10 shadow-xl">
                           <div className="flex justify-between mb-2"><p className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">NO CONVOCADOS</p><div className="flex gap-1">{["TODOS", "POR", "DEF", "MED", "DEL"].map(p=><button key={p} onClick={()=>setExtrasFilter(p)} className={`text-[8px] px-2 py-0.5 rounded font-bold ${extrasFilter===p?'bg-cyan-400 text-black':'bg-black/30'}`}>{p}</button>)}</div></div>
                           <div className="grid grid-cols-3 gap-2">
                               {Object.entries(lineupExtras).map(([key, p]: any) => {
                                   if (extrasFilter !== "TODOS" && p.posicion !== extrasFilter) return null;
                                   return (<div key={key} onClick={() => setActiveSlot({id: key, type:'extras', pos:'TODOS'})} className="aspect-square bg-white/5 rounded-xl border border-white/10 p-1 cursor-pointer hover:bg-white/10 transition-colors"><BenchCard player={p} id={key} posColor={posColors[p.posicion]} /></div>);
                               })}
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="mt-4 text-center text-white/30 text-xs italic font-bold p-6 border border-white/10 rounded-xl bg-black/20 flex flex-col items-center gap-2">
                       <IconLock size={24} className="text-white/20"/>
                       <span>{lineupViewJornada === CURRENT_REAL_MATCHDAY ? "Jornada en curso (Solo lectura)" : "Jornada bloqueada"}</span>
                   </div>
               )}
           </div>
        )}
  
        {activeSlot && (
          <SelectionModal 
              activeSlot={activeSlot} 
              onClose={() => setActiveSlot(null)} 
              selectedIds={allSquadPlayers.map((p: any) => p.id)} 
              // Eliminar prop duplicada (la borré aquí)
              mode={view === 'lineups' ? 'lineup' : 'market'} 
              lineupTopology={{ selected: lineupSelected, bench: lineupBench, extras: lineupExtras }}
              sortPrice={sortPrice} setSortPrice={setSortPrice} activeSort={activeSort} setActiveSort={setActiveSort}
              allPlayersSelected={allSquadPlayers} 
              onSelect={(p: any) => {
                  if (view === 'lineups') { handleLineupSwap(activeSlot.id, p, activeSlot.type === 'titular' ? 'selected' : activeSlot.type); }
                  else { if (activeSlot.type === 'titular') setSelected({...selected, [activeSlot.id]: p}); else if (activeSlot.type === 'bench') setBench({...bench, [activeSlot.id]: p}); else setExtras({...extras, [activeSlot.id]: p}); }
                  setActiveSlot(null);
              }}
              onRemove={handleLineupToExtras} 
          />
        )}
      </div>
    );
  }


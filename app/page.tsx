"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PLAYERS_DB } from './players'; 

// ==========================================
// 1. CONFIGURACIÓN Y DATOS (V24.0 - SUSTITUCIONES)
// ==========================================

const MASTER_EMAIL = "admin@euro2024.com"; 
const VALID_FORMATIONS = ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"];
const CHART_COLORS = ["#22d3ee", "#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#f87171"];
const LINEUP_MATCHDAYS = ["J1", "J2", "J3", "OCT", "CUA", "SEM", "FIN"];
const MAX_BUDGET = 400;
const GAME_START_DATE = "2024-06-14T21:00:00";

const SIMULATED_GAME_START = new Date(Date.now() -1 * 24 * 60 * 60 * 1000).toISOString(); 


// --- PUNTOS J1 (GLOBAL) ---
const MOCK_SCORES: Record<string, number | null> = {
    // Alemania
    "Florian Wirtz": 14,   
    "Jamal Musiala": 12,   
    "Kai Havertz": 9,      
    "Toni Kroos": 6,       
    "Ilkay Gündogan": 7,   
    "Antonio Rüdiger": -1, 
    "Manuel Neuer": 6,     
    "Maximilian Mittelstädt": 5,
    "Jonathan Tah": 6,
    "Joshua Kimmich": 8,   
    "Robert Andrich": 4,   
    "Niclas Füllkrug": 8,  
    "Emre Can": 8,         
    "Thomas Müller": 3,
    "Leroy Sané": 2,       
    
    // Escocia
    "Ryan Porteous": -5,   
    "Angus Gunn": -2,      
    "Scott McTominay": 2,
    "Andrew Robertson": 1,
    "John McGinn": 2,
    "Che Adams": 1,
    "Kieran Tierney": 1,
    "Scott McKenna": 1,
    
    // CASO DE PRUEBA: NO JUEGAN (Para forzar sustituciones automáticas)
    "Marc-André ter Stegen": null, 
    "David Raum": null
};

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
    { n: "GRUPO A", m: [
        {t1:"Alemania",t2:"Escocia",d:"14 Jun 21:00", result: "5 - 1"}, 
        {t1:"Hungría",t2:"Suiza",d:"15 Jun 15:00"},
        {t1:"Alemania",t2:"Hungría",d:"19 Jun 18:00"},
        {t1:"Escocia",t2:"Suiza",d:"19 Jun 21:00"},
        {t1:"Suiza",t2:"Alemania",d:"23 Jun 21:00"},
        {t1:"Escocia",t2:"Hungría",d:"23 Jun 21:00"}
    ]},
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
    const banquillo = parsedSquad?.banquillo ? parsedSquad.banquillo : (parsedSquad?.bench ? ["S1","S2","S3","S4","S5","S6"].map(k=>parsedSquad.bench[k]).filter(Boolean) : []);
    const extras = parsedSquad?.extras ? (Array.isArray(parsedSquad.extras) ? parsedSquad.extras : Object.values(parsedSquad.extras)) : [];

    return {
        ...team,
        squad: { titulares, banquillo, extras, captain: parsedSquad?.captain },
        rawSquad: parsedSquad, 
        points: team.points || 0, 
        matchdayPoints: team.matchdayPoints || { "J1": 0, "J2": 0, "J3": 0 },
        hasPaidBet: team.has_paid_bet || team.hasPaidBet || false, // <-- MAGIA AQUÍ
        evolution: team.evolution || [index+1]
    };
};

const MOCK_TEAMS_DB: any[] = [];
const GLOBAL_MATCHES: Record<string, string> = {};
const GLOBAL_SCORES: Record<string, any> = {};
let GLOBAL_ACTIVE_MATCHDAY = "J1";

// ==========================================
// 2. SISTEMA DE ICONOS Y UI
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
const IconSettings = ({ size=18, className="" }: any) => <SvgBase size={size} className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></SvgBase>;
const IconAlertTriangle = ({size=16}:any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconSearch = ({size=24}:any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconArrowUp = ({ size=24, className="" }:any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const IconArrowDown = ({ size=24, className="" }:any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const IconSave = ({ size=24, className="" }:any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const IconArrowUpDown = ({ size=24, className="" }:any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>;
const IconArrowDownUp = ({ size=24, className="" }:any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>;

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
  
  const NavBar = ({ view, setView, onLogout, squadCompleted, isAdmin }: any) => (
    <div className="fixed top-0 left-0 w-full z-[110] bg-[#0d1526] border-b border-white/10 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center">
            <button onClick={() => setView('rules')} className={`flex flex-col items-center gap-1 transition-all ${view === 'rules' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconFileText /><span className="text-[8px] font-black uppercase">Reglas</span></button>
            <button onClick={() => setView('squad')} className={`flex flex-col items-center gap-1 transition-all ${view === 'squad' ? 'text-[#22c55e] scale-110' : 'text-white/40 hover:text-white'}`}><IconShield /><span className="text-[8px] font-black uppercase">Plantilla</span></button>
            <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('lineups')} className={`flex flex-col items-center gap-1 transition-all ${view === 'lineups' ? 'text-cyan-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><IconTshirt /><span className="text-[8px] font-black uppercase">Alineaciones</span></button>
            <button disabled={!squadCompleted} onClick={() => squadCompleted && setView('quiniela')} className={`flex flex-col items-center gap-1 transition-all ${view === 'quiniela' ? 'text-purple-400 scale-110' : !squadCompleted ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white'}`}><IconTrophy /><span className="text-[8px] font-black uppercase">EUROQUINIELA</span></button>
            <button onClick={() => setView('scores')} className={`flex flex-col items-center gap-1 transition-all ${view === 'scores' ? 'text-orange-400 scale-110' : 'text-white/40 hover:text-white'}`}><IconClipboard /><span className="text-[8px] font-black uppercase">Puntos</span></button>
            <button onClick={() => setView('classification')} className={`flex flex-col items-center gap-1 transition-all ${view === 'classification' ? 'text-[#facc15] scale-110' : 'text-white/40 hover:text-white'}`}><IconUsers /><span className="text-[8px] font-black uppercase">Clasificación</span></button>
            <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-sky-400 scale-110' : 'text-white/40 hover:text-white'}`}><IconCalendar /><span className="text-[8px] font-black uppercase">Calendario</span></button>
            {isAdmin && (
                <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 transition-all ${view === 'admin' ? 'text-red-500 scale-110' : 'text-red-900/50 hover:text-red-400'}`}><IconSettings size={18} /><span className="text-[8px] font-black uppercase">Admin</span></button>
            )}
            <button onClick={onLogout} className="flex flex-col items-center gap-1 text-white/40 hover:text-red-500 transition-all group ml-1"><IconLogOut /><span className="text-[8px] font-black uppercase">Salir</span></button>
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
  
  // Función de apoyo para evitar que los datos se líen
const safeArray = (data: any) => { if (!data) return []; return Array.isArray(data) ? data : Object.values(data); };

// TEAM CARD 
const TeamCard = ({ team, rank, isMyTeam, isAdmin }: any) => {
    const [expanded, setExpanded] = useState(false);
    const canView = isMyTeam || isAdmin;
    
    useEffect(() => { if (isMyTeam) setExpanded(true); }, [isMyTeam]);
  
    const squadData = team.squad || {};
    const filterByPos = (pos: string) => safeArray(squadData.titulares).filter((p:any) => p && p.posicion === pos);
    
    const trophies = team.trophies || [];
    
    // MAGIA: Detectamos si el torneo ha terminado y este es el ganador absoluto
    const isChampion = rank === 1 && GLOBAL_CLOSED_MATCHDAYS['FIN'];
    
    // Hacemos que el #1 brille más fuerte si es el campeón
    const getRankColor = (r: number) => { 
        if (r === 1) return isChampion ? "text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] scale-110 transition-transform" : "text-[#ffd700] drop-shadow-md"; 
        if (r === 2) return "text-[#c0c0c0]"; 
        if (r === 3) return "text-[#cd7f32]"; 
        return "text-white/30"; 
    };
  
    // Asignamos el traje de gala si es el campeón
    const cardStyles = isChampion 
        ? 'bg-gradient-to-br from-yellow-900/30 via-[#1c2a45] to-[#1c2a45] border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-1 ring-[#ffd700]' 
        : (isMyTeam ? 'bg-[#1c2a45] border-[#22c55e] animate-pulse-slow shadow-[0_0_10px_rgba(34,197,94,0.3)] ring-1 ring-[#22c55e]' : 'bg-[#1c2a45] border-white/5');
  
    return (
      <div className={`relative rounded-2xl border transition-all overflow-hidden mb-3 ${cardStyles}`}>
         
         {/* LA BANDA DE CAMPEÓN */}
         {isChampion && (
             <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-300 text-black text-[8px] font-black px-3 py-1 rounded-bl-xl shadow-lg z-10 flex items-center gap-1 border-b border-l border-yellow-100 animate-in slide-in-from-top">
                 <IconTrophy size={10} /> CAMPEÓN EUROCOPA FANTÁSTICA 2024
             </div>
         )}
  
         <div onClick={() => canView && setExpanded(!expanded)} className={`p-4 flex items-center justify-between ${!canView ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'} transition-colors relative z-0`}>
            <div className="flex items-center gap-4">
                <span className={`text-2xl font-black italic w-8 text-center ${getRankColor(rank)}`}>#{rank}</span>
                <div>
                    <h3 className={`font-black text-sm uppercase italic ${isChampion ? 'text-[#ffd700]' : (isMyTeam ? 'text-[#22c55e]' : 'text-white')}`}>{team.name}</h3>
                    <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold"><IconUser size={10} /> {team.user}</div>{team.hasPaidBet ? <IconCoinGold /> : <IconNoCoin />}</div>
                    {trophies.length > 0 && (<div className="flex gap-1 mt-1">{trophies.map((t: string) => (<div key={t} className="bg-[#facc15] text-black px-1.5 rounded flex items-center gap-0.5 text-[8px] font-black shadow-lg shadow-yellow-500/20"><IconTrophy size={8} /> {t}</div>))}</div>)}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right"><span className={`block font-black text-lg ${isChampion ? 'text-[#ffd700]' : 'text-[#22c55e]'}`}>{team.points} PTS</span><span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span></div>
                {!canView ? <IconLock size={16} /> : (expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />)}
            </div>
         </div>
         {!canView && <div onClick={() => alert("🔒 Plantilla oculta hasta el inicio del torneo")} className="h-0" />} 
         {expanded && canView && (
           <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4">
              <div className={`border rounded-2xl p-4 relative overflow-hidden ${isChampion ? 'bg-yellow-900/10 border-yellow-500/30' : 'bg-[#2e9d4a]/10 border-[#22c55e]/20'}`}>
                <p className={`text-[9px] font-black uppercase mb-3 text-center ${isChampion ? 'text-[#ffd700]' : 'text-[#22c55e]'}`}>ONCE INICIAL</p>
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#ef4444] text-white text-[8px] font-black text-center">DEL</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('DEL').length > 0 ? filterByPos('DEL').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#10b981] text-white text-[8px] font-black text-center">MED</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('MED').length > 0 ? filterByPos('MED').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2 mb-2"><div className="w-8 py-1 rounded bg-[#3b82f6] text-white text-[8px] font-black text-center">DEF</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('DEF').length > 0 ? filterByPos('DEF').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
                <div className="flex items-center gap-2"><div className="w-8 py-1 rounded bg-[#facc15] text-black text-[8px] font-black text-center">POR</div><div className="flex flex-wrap gap-2 flex-1 justify-center">{filterByPos('POR').length > 0 ? filterByPos('POR').map((p:any) => (<div key={p.id} className="flex flex-col items-center"><span className="text-[9px] font-bold text-white">{p.nombre.split(' ').pop()}</span><span className="text-xl leading-none">{getFlag(p.seleccion)}</span></div>)) : <span className="text-[8px] text-white/20 italic">Vacío</span>}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="border border-sky-500/20 rounded-2xl bg-sky-900/10 p-3"><p className="text-[9px] font-black uppercase text-sky-400 mb-3 text-center">BANQUILLO</p><div className="grid grid-cols-2 gap-2">{squadData.banquillo && squadData.banquillo.length > 0 ? squadData.banquillo.map((p:any) => <BenchCard key={p.id} player={p} id="S" posColor={posColors[p?.posicion]} />) : <span className="text-[8px] text-white/20 italic col-span-2 text-center self-center">Vacío</span>}</div></div>
                 <div className="border border-white/10 rounded-2xl bg-white/5 p-3"><p className="text-[9px] font-black uppercase text-white/40 mb-3 text-center">NO CONV.</p><div className="grid grid-cols-2 gap-2">{squadData.extras && squadData.extras.length > 0 ? squadData.extras.map((p:any) => <BenchCard key={p.id} player={p} id="NC" posColor={posColors[p?.posicion]} />) : <span className="text-[8px] text-white/20 italic col-span-2 text-center self-center">Vacío</span>}</div></div>
              </div>
           </div>
         )}
      </div>
    );
  };

// ==========================================
// 4. CAMPO DE FÚTBOL Y BANQUILLO
// ==========================================

const Field = ({ selected, step, canInteractField, setActiveSlot, captain, setCaptain, substitutions, matchday, renderPointsBadge, advancedTeams }: any) => {
    const { subbedOutIds, penalizedSlots } = substitutions || { subbedOutIds: new Set(), penalizedSlots: new Set() };
    const isEditable = !matchday || (Date.now() >= new Date(SIMULATED_GAME_START).getTime() && LINEUP_MATCHDAYS.indexOf(GLOBAL_ACTIVE_MATCHDAY) + 1 === LINEUP_MATCHDAYS.indexOf(matchday));
    const isMatchdayClosed = GLOBAL_CLOSED_MATCHDAYS[matchday] || false;
  
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
          
          <div className="absolute top-[8%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEL</div>
          <div className="absolute top-[33%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">MED</div>
          <div className="absolute top-[58%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">DEF</div>
          <div className="absolute top-[88%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-xl text-black text-[10px] font-black italic z-20 border-r border-y border-white/20">POR</div>
          
          {[ {pos: 'DEL', top: '20%', slots: [1,2,3]}, {pos: 'MED', top: '45%', slots: [1,2,3,4,5]}, {pos: 'DEF', top: '70%', slots: [1,2,3,4,5]}, {pos: 'POR', top: '90%', slots: [1]} ].map(row => (
              <div key={row.pos} className={`absolute w-full -translate-y-1/2 flex justify-${row.slots.length===1?'center':'between'} gap-1 px-6 z-30`} style={{top: row.top}}>
                  {row.slots.map(i => {
                      const id = `${row.pos}-${i}`; const p = selected[id];
                      const pts = (matchday && p) ? getPlayerPointsRow(p.nombre, matchday) : null;
                      const isPenalized = isMatchdayClosed && penalizedSlots.has(id);
                      const isSubbedOut = p && !isEditable && subbedOutIds.has(p.id) && !isPenalized;
                      // MAGIA: Solo hay eliminados de verdad cuando la Jornada 3 se ha cerrado oficialmente
                      const isKnockoutPhase = GLOBAL_CLOSED_MATCHDAYS['J3'] === true;
                      const isEliminated = isKnockoutPhase && advancedTeams && p && advancedTeams.size > 0 && !advancedTeams.has(p.seleccion);
                      
                      // VARIABLES DE ESTILO RECUPERADAS:
                      const bgClass = isPenalized ? 'bg-red-900/90 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)]' : (isSubbedOut ? 'bg-gray-500 border-gray-400' : (p ? (isEliminated ? 'bg-gray-300 border-gray-400 shadow-inner' : 'bg-white border-[#22c55e]') : 'bg-black/40 border-white/20'));
                      const textClass = (isSubbedOut || isPenalized) ? 'text-white' : 'text-black';
                      return (
                          <div key={i} className="relative flex flex-col items-center group" onClick={() => canInteractField && setActiveSlot({id, type:'titular', pos:row.pos})}>
                              <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${bgClass} ${(canInteractField && !p) ? 'animate-pulse ring-4 ring-white/50 border-white' : ''}`}>
                                  
                                  {p ? (
                                      <span className={`text-[9px] font-black ${textClass} text-center leading-none uppercase italic`}>{p.nombre.split(' ').pop()}</span>
                                  ) : isPenalized ? (
                                      <span className="text-2xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] z-50 animate-pulse">-1</span>
                                  ) : (
                                      <IconPlus size={18} />
                                  )}

                                  {p && step >= 2 && !isPenalized && (<button onClick={(e) => { e.stopPropagation(); if (canInteractField) setCaptain(p.id); }} className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 ${(captain === p.id && !isSubbedOut) ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg' : 'bg-black/60 text-white/30 border-white/10'} ${canInteractField ? 'hover:bg-black/80 hover:text-white cursor-pointer' : 'cursor-default'}`}>{(captain === p.id && !isSubbedOut) ? <IconCheck size={8} /> : 'C'}</button>)}
                                  
                                  {p && !isEditable && !isSubbedOut && !isPenalized && renderPointsBadge && renderPointsBadge(p, true)}

                                  {isSubbedOut && (
                                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center shadow-lg z-50 animate-in zoom-in">
                                          <IconSub size={16} className="text-white" />
                                      </div>
                                  )}

                                  {isPenalized && p && (
                                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center shadow-lg z-50 animate-pulse">
                                          <span className="text-[10px] font-black text-white">-1</span>
                                      </div>
                                  )}
                              </div>
                              {p && !isPenalized && <span className={`mt-1 text-3xl leading-none block shadow-black drop-shadow-lg z-20 filter ${isEliminated ? 'grayscale opacity-50' : ''}`}>{getFlag(p.seleccion)}</span>}
                              {isPenalized && p && <span className="mt-1 text-3xl leading-none block shadow-black drop-shadow-lg z-20 filter grayscale opacity-50">{getFlag(p.seleccion)}</span>}
                          </div>
                      );
                      
                  })}
              </div>
          ))}
      </div>
    );
  };
  
  // ==========================================
  // 5. VISTAS DE DATOS: GRÁFICAS Y CALENDARIO
  // ==========================================
  const BenchCard = ({ player, id, posColor, onClick, isSubbedIn, matchday, advancedTeams }: any) => {
    if (!player) return (
        <div onClick={onClick} className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-white/20 cursor-pointer hover:bg-white/5 transition-colors p-4">
            <IconPlus size={24} />
            <span className="text-[10px] font-black mt-2 uppercase tracking-widest">{id}</span>
        </div>
    );

    // ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!
    const pts = matchday ? getPlayerPointsRow(player.nombre, matchday) : null;
    const isKnockoutPhase = GLOBAL_CLOSED_MATCHDAYS['J3'] === true;
    const isEliminated = isKnockoutPhase && advancedTeams && advancedTeams.size > 0 && !advancedTeams.has(player.seleccion);
    
    return (
      <div onClick={onClick} className={`relative w-full h-full flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-lg ${isSubbedIn ? 'bg-[#1c2a45] border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]' : (isEliminated ? 'bg-gray-800 border-gray-600 opacity-60' : 'bg-[#1c2a45] border-white/10 hover:bg-white/5')}`}>
          
          {isSubbedIn && (
              <div className="absolute top-1 right-1 flex flex-col items-center z-40">
                  <IconSub size={16} className="text-[#22c55e] drop-shadow-md"/>
                  {pts !== undefined && pts !== null && (
                      <span className="text-[10px] font-black text-[#22c55e] leading-none mt-0.5">
                          {pts > 0 ? `+${pts}` : pts}
                      </span>
                  )}
              </div>
          )}

          <span className={`text-[10px] font-black text-white text-center uppercase leading-tight truncate w-full ${isSubbedIn ? 'pr-3' : ''}`}>
              {player.nombre.split(' ').pop()}
          </span>
          
          <div className="flex-1 flex items-center justify-center mt-1">
              <span className={`text-4xl leading-none drop-shadow-md filter ${isEliminated ? 'grayscale opacity-50' : ''}`}>{getFlag(player.seleccion)}</span>
          </div>
          
          <div className={`w-full text-center text-[9px] font-black uppercase py-0.5 mt-1 rounded ${posColor}`}>
              {player.posicion}
          </div>
      </div>
    );
  };

  const EvolutionChart = ({ teams, myTeamId }: { teams: any[], myTeamId: string | undefined }) => {
    const height = 220; const width = 350; const padding = 30;
    
    // FIJAMOS EL EJE X PARA QUE SIEMPRE MUESTRE HASTA LA FINAL (7 JORNADAS)
    const xLabels = LINEUP_MATCHDAYS; 
    
    const maxRank = teams.length > 0 ? teams.length : 4; 
    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (xLabels.length - 1);
    const getY = (rank: number) => padding + ((rank - 1) * (height - 2 * padding)) / Math.max(1, (maxRank - 1));
    
    return (
        <div className="w-full bg-[#1c2a45] rounded-2xl p-5 border border-white/5 shadow-xl mb-6 overflow-hidden relative">
            <h3 className="text-sm font-black italic uppercase text-[#facc15] mb-6 flex items-center gap-2"><IconChart size={14} /> EVOLUCIÓN DEL RANKING</h3>
            
            {(!teams[0] || (teams[0].calculatedEvolution || []).length === 0) ? (
                <div className="text-center text-white/40 italic py-10 text-xs">La gráfica aparecerá al jugar la J1.</div>
            ) : (
                <>
                    <div className="flex justify-center overflow-x-auto custom-scrollbar pb-2">
                        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible min-w-[350px]">
                            {xLabels.map((day, i) => (<g key={i}><line x1={getX(i)} y1={padding} x2={getX(i)} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" /><text x={getX(i)} y={height - 5} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold">{day}</text></g>))}
                            {[...Array(maxRank)].map((_, i) => (<g key={i}><line x1={padding} y1={getY(i + 1)} x2={width - padding} y2={getY(i + 1)} stroke="rgba(255,255,255,0.05)" /><text x={padding - 12} y={getY(i + 1) + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold">{i + 1}</text></g>))}
                            
                            {teams.map((team, index) => {
                                const isMyTeam = team.id === myTeamId; 
                                const evolution = team.calculatedEvolution || [];
                                if (evolution.length === 0) return null;
                                
                                const teamColor = CHART_COLORS[index % CHART_COLORS.length];
                                const points = evolution.map((rank: number, i: number) => `${getX(i)},${getY(rank)}`).join(" ");
                                
                                return (
                                    <g key={team.id} style={{ zIndex: isMyTeam ? 10 : 1 }} className="relative">
                                        {evolution.length > 1 && <polyline points={points} fill="none" stroke={teamColor} strokeWidth={isMyTeam ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${isMyTeam ? '6px' : '3px'} ${teamColor})`, opacity: isMyTeam ? 1 : 0.6 }} className="transition-all duration-500"/>}
                                        {evolution.map((rank: number, i: number) => (<circle key={i} cx={getX(i)} cy={getY(rank)} r={isMyTeam ? 4 : 3} fill={teamColor} stroke="#1c2a45" strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${teamColor})`, opacity: isMyTeam ? 1 : 0.6 }} className="transition-all duration-500"/>))}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    
                    <div className="mt-6 flex flex-wrap justify-center gap-3 pt-4 border-t border-white/10">
                        {teams.map((team, index) => (
                            <div key={team.id} className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5 shadow-inner">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                <span className={`text-[9px] font-black uppercase ${team.id === myTeamId ? 'text-white' : 'text-white/60'}`}>{team.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
  };

  
  const MatchdayStandings = ({ teams }: { teams: any[] }) => {
      const [selectedJornada, setSelectedJornada] = useState("J1");
      const jornadas = ["J1", "J2", "J3", "OCT", "CUA", "SEM", "FIN"];
      const standings = useMemo(() => { return [...teams].sort((a, b) => { const ptsA = a.matchdayPoints?.[selectedJornada] || 0; const ptsB = b.matchdayPoints?.[selectedJornada] || 0; return ptsB - ptsA; }); }, [teams, selectedJornada]);
      const getRankColor = (index: number) => { if (index === 0) return "text-[#ffd700] drop-shadow-md"; if (index === 1) return "text-[#c0c0c0]"; if (index === 2) return "text-[#cd7f32]"; return "text-white/50"; };
  
      return (
          <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-4 border-b border-white/5">
                   <h3 className="text-2xl font-black italic uppercase text-[#22c55e] tracking-tighter mb-3 flex items-center gap-2"><IconTrophy /> CLASIFICACIÓN POR JORNADA</h3>
                   <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">{jornadas.map(j => ( <button key={j} onClick={() => setSelectedJornada(j)} className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all ${selectedJornada === j ? 'bg-[#22c55e] text-black scale-105 shadow-lg' : 'bg-black/40 text-white/40 hover:bg-white/10'}`}>{j}</button> ))}</div>
               </div>
               <div className="p-2 space-y-1">
                   {standings.map((team, idx) => (
                       <div key={team.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1526] border border-white/5">
                           <div className="flex items-center gap-3"><span className={`font-black text-xl w-6 text-center ${getRankColor(idx)}`}>{idx + 1}</span><div className="flex flex-col"><span className="text-xs font-bold text-white uppercase">{team.name}</span><span className="text-[8px] text-white/30 uppercase">{team.user}</span></div></div>
                           <span className="text-[#22c55e] font-black text-sm">{team.matchdayPoints?.[selectedJornada] || 0} PTS</span>
                       </div>
                   ))}
               </div>
          </div>
      );
  };
  
  const CalendarView = () => {
    const [phase, setPhase] = useState<'grupos'|'eliminatorias'>('grupos');
    const { standings } = getTournamentStandings();
    const knockouts = getKnockoutFixtures();

    const MatchBox = ({ match }: any) => {
        const res1 = GLOBAL_MATCHES[`${match.t1.name}-${match.t2.name}`];
        const res2 = GLOBAL_MATCHES[`${match.t2.name}-${match.t1.name}`];
        const res = res1 || res2;
        
        // Buscamos si hubo penaltis
        const pen1 = GLOBAL_MATCHES[`${match.t1.name}-${match.t2.name}_PEN`];
        const pen2 = GLOBAL_MATCHES[`${match.t2.name}-${match.t1.name}_PEN`];
        const penWinner = pen1 || pen2;

        let s1 = "-", s2 = "-";
        if (res) {
            const parts = res.split('-');
            if (res1) { s1 = parts[0].trim(); s2 = parts[1].trim(); }
            else { s1 = parts[1].trim(); s2 = parts[0].trim(); }
        }

        const w1 = res && (parseInt(s1) > parseInt(s2) || penWinner === match.t1.name) ? 'text-[#22c55e]' : 'text-white/60';
        const w2 = res && (parseInt(s2) > parseInt(s1) || penWinner === match.t2.name) ? 'text-[#22c55e]' : 'text-white/60';

        return (
            <div className="bg-[#1c2a45] border border-white/10 rounded-lg p-2 shadow-lg w-full mb-3 relative overflow-hidden">
                <div className={`flex items-center justify-between py-1 border-b border-white/5 ${match.t1.isKnown ? 'text-white' : 'text-white/40 italic'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{match.t1.isKnown ? getFlag(match.t1.name) : '🏳️'}</span>
                        <span className="text-[9px] font-black uppercase truncate">{match.t1.name}</span>
                        {penWinner === match.t1.name && <span className="text-[7px] bg-yellow-500/20 text-yellow-500 px-1 rounded border border-yellow-500/30">PEN</span>}
                    </div>
                    <span className={`font-black bg-black/40 px-1.5 rounded ${w1}`}>{s1}</span>
                </div>
                <div className={`flex items-center justify-between py-1 ${match.t2.isKnown ? 'text-white' : 'text-white/40 italic'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{match.t2.isKnown ? getFlag(match.t2.name) : '🏳️'}</span>
                        <span className="text-[9px] font-black uppercase truncate">{match.t2.name}</span>
                        {penWinner === match.t2.name && <span className="text-[7px] bg-yellow-500/20 text-yellow-500 px-1 rounded border border-yellow-500/30">PEN</span>}
                    </div>
                    <span className={`font-black bg-black/40 px-1.5 rounded ${w2}`}>{s2}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-md mx-auto px-4 mt-20 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-4 flex items-center gap-2"><IconCalendar /> CALENDARIO</h1>
            
            <div className="flex gap-2 bg-black/40 p-2 rounded-xl border border-white/5 mb-6">
                <button onClick={() => setPhase('grupos')} className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all ${phase === 'grupos' ? 'bg-[#22c55e] text-black shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>FASE INICIAL</button>
                <button onClick={() => setPhase('eliminatorias')} className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all ${phase === 'eliminatorias' ? 'bg-cyan-400 text-black shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>ELIMINATORIAS</button>
            </div>

            {phase === 'grupos' && (
                <div className="space-y-8">
                    {generateFixture().map((g) => (
                        <div key={g.n} className="bg-[#1c2a45] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                            <div className="bg-gradient-to-r from-[#22c55e] to-green-700 p-2 text-center shadow-md">
                                <h3 className="font-black italic text-black uppercase">{g.n}</h3>
                            </div>
                            <div className="bg-[#0d1526] p-2 border-b border-white/10">
                                <table className="w-full text-left text-[9px] uppercase font-black text-white/70">
                                    <thead><tr className="border-b border-white/10"><th className="pb-1 pl-1 w-6">#</th><th className="pb-1">Equipo</th><th className="pb-1 text-center">PJ</th><th className="pb-1 text-center">GF</th><th className="pb-1 text-center">GC</th><th className="pb-1 text-center text-[#22c55e]">PTS</th></tr></thead>
                                    <tbody>
                                        {standings[g.n]?.map((t, idx) => (
                                            <tr key={t.name} className={`border-b border-white/5 last:border-0 ${idx < 2 ? 'bg-green-900/10 text-white' : idx === 2 ? 'bg-yellow-900/10 text-yellow-100' : 'text-white/40'}`}>
                                                <td className="py-1.5 pl-1">{idx+1}</td>
                                                <td className="py-1.5 flex items-center gap-1.5"><span className="text-sm">{getFlag(t.name)}</span> <span className="truncate max-w-[70px]">{t.name}</span></td>
                                                <td className="py-1.5 text-center">{t.played}</td>
                                                <td className="py-1.5 text-center">{t.gf}</td>
                                                <td className="py-1.5 text-center">{t.gc}</td>
                                                <td className="py-1.5 text-center text-[#22c55e]">{t.pts}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="divide-y divide-white/5">
                                {g.m.map((m, i) => {
                                    const matchId = `${m.t1}-${m.t2}`;
                                    const result = GLOBAL_MATCHES[matchId] || m.result; 
                                    return (
                                        <div key={i} className="flex flex-col relative bg-[#1c2a45] hover:bg-white/5 transition-colors">
                                            {i % 2 === 0 && <div className="bg-white/5 w-full text-center text-[8px] font-black text-white/50 uppercase tracking-widest py-0.5 border-y border-white/5">JORNADA {Math.floor(i/2) + 1}</div>}
                                            <div className="p-3 flex items-center justify-between">
                                                <div className="w-[40%] flex items-center justify-end gap-2 text-right"><span className="text-[10px] font-black uppercase text-white leading-tight">{m.t1}</span><span className="text-2xl">{getFlag(m.t1)}</span></div>
                                                <div className="w-[20%] text-center">
                                                    {result ? ( <span className="text-lg font-black text-[#22c55e] tracking-widest drop-shadow-md bg-black/40 px-2 py-1 rounded">{result}</span>
                                                    ) : ( <><span className="text-[8px] text-[#facc15] font-mono font-bold block mb-0.5">{m.d.split(' ')[0]} {m.d.split(' ')[1]}</span><span className="text-[8px] text-white/40 block">{m.d.split(' ')[2]}</span></> )}
                                                </div>
                                                <div className="w-[40%] flex items-center justify-start gap-2 text-left"><span className="text-2xl">{getFlag(m.t2)}</span><span className="text-[10px] font-black uppercase text-white leading-tight">{m.t2}</span></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {phase === 'eliminatorias' && (
                <div className="space-y-6">
                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl text-center shadow-lg">
                        <h2 className="text-cyan-400 font-black italic uppercase text-lg mb-1">El Camino a Berlín</h2>
                        <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Los cruces se generan según los resultados reales</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-cyan-400 font-black text-[10px] text-center uppercase tracking-widest mb-3 border-b border-cyan-500/30 pb-2">OCTAVOS DE FINAL</h3>
                            <div className="grid grid-cols-2 gap-x-3">{knockouts.octavos.map(m => <MatchBox key={m.id} match={m} />)}</div>
                        </div>
                        
                        <div>
                            <h3 className="text-cyan-400 font-black text-[10px] text-center uppercase tracking-widest mb-3 border-b border-cyan-500/30 pb-2 mt-4">CUARTOS DE FINAL</h3>
                            <div className="grid grid-cols-2 gap-x-3">{knockouts.cuartos.map(m => <MatchBox key={m.id} match={m} />)}</div>
                        </div>
                        
                        <div>
                            <h3 className="text-cyan-400 font-black text-[10px] text-center uppercase tracking-widest mb-3 border-b border-cyan-500/30 pb-2 mt-4">SEMIFINALES</h3>
                            <div className="grid grid-cols-2 gap-x-3">{knockouts.semis.map(m => <MatchBox key={m.id} match={m} />)}</div>
                        </div>
                        
                        <div>
                            <h3 className="text-[#ffd700] font-black text-sm text-center uppercase tracking-widest mb-3 border-b border-[#ffd700]/30 pb-2 mt-4 flex items-center justify-center gap-2"><IconTrophy/> GRAN FINAL</h3>
                            <div className="flex justify-center w-full max-w-[250px] mx-auto">{knockouts.final.map(m => <MatchBox key={m.id} match={m} />)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
  
const QuinielaView = ({ selections, onToggle, locked, onEdit, canEdit }: any) => {
    const isLocked = locked || !canEdit; 
    const { standings } = getTournamentStandings();
    
    let aciertos = 0;
    let fallos = 0;
    let evaluados = 0;

     EURO_GROUPS_DATA.forEach(group => {
        const groupStandings = standings[group.name];
        const isGroupFinished = groupStandings?.every((t: any) => t.played === 3);
        const userPicks = selections[group.name] || [];
        
        if (isGroupFinished) {
            const top2 = [groupStandings[0]?.name, groupStandings[1]?.name];
            userPicks.forEach((team: string) => {
                evaluados++;
                if (top2.includes(team)) aciertos++;
                else fallos++;
            });
        }
    });

    const pendientes = 12 - evaluados; 

    // Definimos los estilos de los premios según la escala de "temperatura"
    const prizeStyles = [
        { hits: 5, prize: '5M', style: 'bg-gray-800/80 text-gray-400 border-gray-700' }, // Gris
        { hits: 6, prize: '6M', style: 'bg-blue-900/50 text-blue-300 border-blue-800' }, // Frío inicio
        { hits: 7, prize: '8M', style: 'bg-cyan-900/50 text-cyan-300 border-cyan-800' },
        { hits: 8, prize: '10M', style: 'bg-emerald-900/50 text-emerald-300 border-emerald-800' },
        { hits: 9, prize: '12M', style: 'bg-green-900/50 text-green-300 border-green-800' }, // Frío final
        { hits: 10, prize: '15M', style: 'bg-yellow-900/50 text-yellow-300 border-yellow-800' }, // Cálido inicio
        { hits: 11, prize: '20M', style: 'bg-orange-900/50 text-orange-300 border-orange-800' }, // Cálido final
        { hits: 12, prize: '25M', style: 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)]' } // ¡ROJO ARDIENTE!
    ];

    return (
        <div className="max-w-md mx-auto px-4 mt-24 pb-32 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black italic text-purple-400 uppercase tracking-tighter flex items-center gap-2"><IconTrophy /> EUROQUINIELA</h1>
                {canEdit ? ( locked ? ( <button onClick={onEdit} className="bg-[#facc15] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:scale-105 transition-transform border border-yellow-600"><IconEdit size={14}/> EDITAR</button> ) : ( <button onClick={onEdit} className="bg-[#22c55e] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:scale-105 transition-transform border border-green-600"><IconCheck size={14}/> GUARDAR</button> )
                ) : ( <div className="bg-red-900/40 text-red-500 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border border-red-500/50 flex items-center gap-1 shadow-lg"><IconLock size={12}/> CERRADO</div> )}
            </div>

            {/* MARCADOR DE ACIERTOS */}
            <div className="bg-[#1c2a45] rounded-2xl border border-white/10 p-4 mb-6 shadow-xl flex justify-around text-center divide-x divide-white/10">
                <div className="flex flex-col px-2 w-1/3">
                    <span className="text-3xl font-black text-[#22c55e] drop-shadow-md">{aciertos}</span>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Aciertos</span>
                </div>
                <div className="flex flex-col px-2 w-1/3">
                    <span className="text-3xl font-black text-red-500 drop-shadow-md">{fallos}</span>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Fallos</span>
                </div>
                <div className="flex flex-col px-2 w-1/3">
                    <span className="text-3xl font-black text-white/80">{pendientes}</span>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Pendientes</span>
                </div>
            </div>

            {/* RECORDATORIO DE PREMIOS (CON ESCALA DE COLOR) */}
            <div className="mb-6 rounded-xl p-3 border border-white/10 bg-[#0d1526]">
                <p className="text-[10px] font-black uppercase text-white/50 mb-2 flex items-center gap-1"><IconAward size={12}/> Premios para Fichajes</p>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
                    {prizeStyles.map(p => (
                        <div key={p.hits} className={`rounded p-1 border ${p.style} flex flex-col justify-center`}>
                            <span className="opacity-80">{p.hits} ac:</span>
                            <span className="text-sm leading-none mt-0.5">{p.prize}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {EURO_GROUPS_DATA.map((group) => {
                    const groupStandings = standings[group.name];
                    const isGroupFinished = groupStandings?.every((t: any) => t.played === 3);
                    
                    return (
                        <div key={group.name} className="bg-[#1c2a45] p-4 rounded-2xl border border-white/10 shadow-lg">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[#facc15] font-black uppercase text-sm">{group.name}</h3>
                                <span className="text-[9px] text-white/40 font-bold uppercase">{selections[group.name]?.length || 0}/2 SELECCIONADOS</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {group.teams.map((team) => {
                                    const isSelected = selections[group.name]?.includes(team);
                                    let btnStyle = 'bg-[#0d1526] text-white/50 border-white/5 hover:bg-white/5';
                                    let iconContent = null;

                                    if (isSelected) {
                                        btnStyle = 'bg-[#22c55e] text-black border-white shadow-lg';
                                        if (isGroupFinished) {
                                            const top2 = [groupStandings[0]?.name, groupStandings[1]?.name];
                                            if (top2.includes(team)) {
                                                btnStyle = 'bg-green-500 text-black border-2 border-white shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse-slow';
                                                iconContent = <IconCheck size={16} className="text-black drop-shadow-md" />;
                                            } else {
                                                btnStyle = 'bg-red-900/80 text-red-400 border-red-500 line-through grayscale opacity-80';
                                                iconContent = <IconX size={16} className="text-red-500" />;
                                            }
                                        }
                                    }
                                    return ( 
                                        <button key={team} disabled={isLocked} onClick={() => onToggle(group.name, team)} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${btnStyle} ${isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'}`}>
                                            <div className="flex items-center gap-2"><span className="text-2xl">{getFlag(team)}</span><span className="text-[10px] font-black uppercase">{team}</span></div>{iconContent}
                                        </button> 
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
  
  // ==========================================
  // 6. REGLAS Y PUNTUACIONES
  // ==========================================
  
  const RuleCard = ({ color, title, icon, children }: any) => (
      <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-xl"><div className="p-4 flex items-center justify-between" style={{ borderLeft: `6px solid ${color}` }}><div className="flex items-center gap-3">{icon}<h3 className="font-black italic uppercase text-lg tracking-wide text-white">{title}</h3></div></div><div className="p-5 border-t border-white/5 bg-[#0d1526]/50 text-sm text-gray-100 leading-relaxed text-left">{children}</div></div>
  );
  
  const ScoreRow = ({ label, pts, color = "text-white" }: any) => ( <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors"><span className="text-gray-200 font-medium text-xs uppercase">{label}</span><span className={`font-black text-sm ${color}`}>{pts}</span></div> );
  
  const FixedRulesView = () => {
    return (
      <div className="pb-32 animate-in fade-in duration-500">
        <div className="relative h-72 w-full mb-8 overflow-hidden"><div className="absolute inset-0 bg-[#05080f]/50 z-10"></div><div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/20 to-transparent z-10"></div><div className="absolute inset-0 z-0"><div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1624280433509-b4dca387790d?q=80&w=2070&auto=format&fit=crop')" }}></div></div><div className="absolute bottom-0 left-0 w-full p-8 z-20"><h1 className="text-4xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-2 flex items-center gap-3 drop-shadow-lg"><IconFileText size={36} /> REGLAMENTO</h1><p className="text-white text-sm font-bold tracking-widest max-w-lg leading-relaxed drop-shadow-md">Bienvenido a la guía oficial. Aquí encontrarás todo lo necesario para dominar el juego.</p></div></div>
        <div className="max-w-xl mx-auto px-4">
          <RuleCard color="#22c55e" title="1. Plantilla Inicial" icon={<IconUsers />}><p className="mb-4 text-base leading-relaxed">Crea tu plantilla inicial compuesta por un máximo de <strong>20 jugadores</strong> distribuidos de la siguiente manera: <strong>11 Titulares, 6 suplentes</strong> y el resto esperarán su oportunidad desde la grada.</p><div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-3 space-y-3"><div className="flex items-center gap-3"><IconCaptain /><p className="text-sm"><strong className="text-[#facc15] uppercase">Capitán:</strong> Puntúa DOBLE (positivo o negativo).</p></div><div className="flex items-center gap-3"><span className="text-red-400 text-lg">⚠️</span><p className="text-sm"><strong className="text-red-400 uppercase">Penalización:</strong> Cada hueco vacío en el 11 resta <strong>-1 punto</strong>.</p></div><div className="flex items-center gap-3"><IconSub className="w-7 h-7 text-blue-400" /><p className="text-sm"><strong className="text-blue-400 uppercase">Suplentes:</strong> Entran automático por orden (S1→S6) si un titular no juega.</p></div><div className="flex items-center gap-3 bg-blue-900/20 p-2 rounded border border-blue-500/30"><IconCheck size={16} className="text-blue-400"/><p className="text-sm text-blue-200"><strong>En la primera fase el límite de jugadores de la misma selección es 7.</strong></p></div></div></RuleCard>
          <RuleCard color="#3b82f6" title="2. Tácticas Válidas" icon={<IconShield />}><p className="mb-4 text-xs uppercase font-bold text-white/50">Esquemas permitidos:</p><div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold text-center">{["1-5-3-2", "1-4-4-2", "1-4-5-1", "1-4-3-3", "1-3-4-3"].map(t => ( <div key={t} className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:bg-[#22c55e]/20 transition-colors cursor-default">{t}</div> ))} <div className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.1)] flex justify-center gap-2 items-center">1-3-5-2 <span className="text-red-500 font-black animate-pulse">(NEW)</span></div></div></RuleCard>
          <RuleCard color="#ec4899" title="3. Mercado de Fichajes" icon={<IconRefresh />}><p className="mb-4 font-bold text-white text-base">Ventana abierta: Jornada 3 → Octavos.</p><ul className="space-y-3 text-sm text-gray-200"><li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Máximo <strong>7 cambios</strong> permitidos.</li><li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Límite: <strong>8 jugadores/país</strong>.</li><li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Tu presupuesto aumenta con los premios de la <span className="text-[#22c55e] font-black uppercase ml-1">EUROQUINIELA.</span></li><li className="flex items-center gap-3 bg-white/5 p-2 rounded"><IconCheck size={16} className="text-[#22c55e]"/> Presupuesto inicial: <strong>400M</strong>.</li></ul></RuleCard>
          <RuleCard color="#facc15" title="4. Puntuaciones" icon={<IconFileText />}><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white/5 rounded-xl p-4 border border-white/5"><h4 className="text-[#22c55e] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Acción Ofensiva</h4><ScoreRow label="⚽ Gol (Cualquiera)" pts="+5" color="text-[#22c55e]" /><ScoreRow label="👟 Asistencia" pts="+1" color="text-[#22c55e]" /><ScoreRow label={<div className="flex items-center gap-2">🥅 ✅ <span>Penalti Marcado</span></div>} pts="+5" color="text-[#22c55e]" /><ScoreRow label={<div className="flex items-center gap-2">🥅 ❌ <span>Penalti Fallado</span></div>} pts="-3" color="text-red-500" /><ScoreRow label="📉 Gol Propia Meta" pts="-1" color="text-red-500" /></div><div className="space-y-6"><div className="bg-white/5 rounded-xl p-4 border border-white/5"><h4 className="text-[#facc15] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Portero (POR)</h4><ScoreRow label={<div className="flex items-center gap-2">🥅 ⛔ <span>Penalti Parado</span></div>} pts="+3" color="text-[#22c55e]" /><ScoreRow label={<div className="flex items-center gap-2">🥅 🧤 <span>Portería a 0 (+60&apos;)</span></div>} pts="+4" color="text-[#22c55e]" /><div className="pt-2 border-t border-white/5 mt-2"><ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽ <span>1 Gol Encajado</span></div>} pts="0" color="text-gray-400" /><ScoreRow label={<div className="flex items-center gap-1">🥅 ⚽⚽ / + <span>2 Goles Enc.</span></div>} pts="-2 / -3..." color="text-red-400" /></div></div><div className="bg-white/5 rounded-xl p-4 border border-white/5"><h4 className="text-[#3b82f6] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Defensa (DEF)</h4><ScoreRow label="🛡️ Portería a 0 (+45&apos;)" pts="+2" color="text-[#22c55e]" /></div></div><div className="bg-white/5 rounded-xl p-4 border border-white/5"><h4 className="text-white/60 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Partido y Resultado</h4><div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors"><span className="text-gray-200 font-medium text-xs uppercase flex items-center gap-2">👟 ⚽ Jugar Partido</span><span className="font-black text-sm text-[#22c55e]">+1</span></div><ScoreRow label="👕 Ser Titular" pts="+1" color="text-[#22c55e]" /><ScoreRow label="✅ Victoria Equipo" pts="+1" color="text-[#22c55e]" /><ScoreRow label="❌ Derrota Equipo" pts="-1" color="text-red-500" /></div><div className="bg-white/5 rounded-xl p-4 border border-white/5"><h4 className="text-red-400 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">Sanciones</h4><div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors"><div className="flex items-center gap-2"><IconDoubleYellow /><span className="text-gray-200 font-medium text-xs uppercase">Doble Amarilla</span></div><span className="font-black text-sm text-red-500">-3</span></div><ScoreRow label="🟥 Roja Directa" pts="-5" color="text-red-500" /></div></div></RuleCard>
          <RuleCard color="#a855f7" title="5. Valoraciones Sofascore" icon={<IconFourStars />}><p className="mb-4 text-left text-gray-300 text-sm">Puntos extra basados en la nota del jugador en la App <span className="text-blue-400 font-black uppercase">SOFASCORE</span></p><div className="grid grid-cols-2 gap-4 text-center text-xs"><div className="space-y-3"><div className="bg-[#1e4620] p-3 rounded-lg border border-[#22c55e]/30 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Excelente</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.5 - 10</span><b className="text-[#22c55e]">+14</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>9.0 - 9.4</span><b className="text-[#22c55e]">+13</b></div></div><div className="bg-[#14532d] p-3 rounded-lg border border-green-500/20 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Bueno</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.6 - 8.9</span><b className="text-[#4ade80]">+12</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.2 - 8.5</span><b className="text-[#4ade80]">+11</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>8.0 - 8.1</span><b className="text-[#4ade80]">+10</b></div></div><div className="bg-[#166534] p-3 rounded-lg border border-green-500/20 shadow-lg"><div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">Bueno</div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.8 - 7.9</span><b className="text-[#86efac]">+9</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.6 - 7.7</span><b className="text-[#86efac]">+8</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.4 - 7.5</span><b className="text-[#86efac]">+7</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.2 - 7.3</span><b className="text-[#86efac]">+6</b></div><div className="flex justify-between px-2 py-0.5 text-gray-300"><span>7.0 - 7.1</span><b className="text-[#86efac]">+5</b></div></div></div><div className="space-y-3"><div className="bg-[#374151] p-3 rounded-lg border border-gray-500/20 shadow-lg"><div className="font-black text-gray-300 text-sm uppercase mb-2 border-b border-white/10 pb-1">Medio</div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.8 - 6.9</span><b className="text-white">+4</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.6 - 6.7</span><b className="text-white">+3</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.4 - 6.5</span><b className="text-white">+2</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.2 - 6.3</span><b className="text-white">+1</b></div><div className="flex justify-between px-2 py-0.5 text-gray-400"><span>6.0 - 6.1</span><b className="text-white">0</b></div></div><div className="bg-[#7f1d1d] p-3 rounded-lg border border-red-500/20 shadow-lg"><div className="font-black text-red-200 text-sm uppercase mb-2 border-b border-white/10 pb-1">Malo</div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.8 - 5.9</span><b className="text-white">-1</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.6 - 5.7</span><b className="text-white">-2</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.4 - 5.5</span><b className="text-white">-3</b></div><div className="flex justify-between px-2 py-0.5 text-red-100"><span>5.2 - 5.3</span><b className="text-white">-4</b></div></div><div className="bg-[#450a0a] p-3 rounded-lg border border-red-900/40 shadow-lg"><div className="font-black text-red-400 text-sm uppercase mb-2 border-b border-white/10 pb-1">Muy Malo</div><div className="flex justify-between px-2 py-0.5 text-red-300"><span>5.0 - 5.1</span><b className="text-white">-5</b></div><div className="flex justify-between px-2 py-0.5 text-red-300"><span>0.0 - 4.9</span><b className="text-white">-6</b></div></div></div></div></RuleCard>
          <RuleCard color="#06b6d4" title="6. Euroquiniela" icon={<IconTrophy size={24} style={{ color: "#06b6d4" }} />}><p className="text-sm mb-4 text-left text-gray-300 leading-relaxed">Acierta los 2 clasificados de cada grupo para ganar presupuesto para fichar en la ventana de fichajes:</p><div className="grid grid-cols-2 gap-3 text-xs font-black text-center uppercase tracking-wide"><div className="bg-[#ea580c] text-white p-3 rounded-lg shadow-md border border-white/5">12 aciertos <span className="block text-lg">25 M</span></div><div className="bg-[#10b981] text-white p-3 rounded-lg shadow-md border border-white/5">8 aciertos <span className="block text-lg">10 M</span></div><div className="bg-[#f59e0b] text-black p-3 rounded-lg shadow-md border border-white/5">11 aciertos <span className="block text-lg">20 M</span></div><div className="bg-[#06b6d4] text-black p-3 rounded-lg shadow-md border border-white/5">7 aciertos <span className="block text-lg">8 M</span></div><div className="bg-[#eab308] text-black p-3 rounded-lg shadow-md border border-white/5">10 aciertos <span className="block text-lg">15 M</span></div><div className="bg-[#3b82f6] text-white p-3 rounded-lg shadow-md border border-white/5">6 aciertos <span className="block text-lg">6 M</span></div><div className="bg-[#84cc16] text-black p-3 rounded-lg shadow-md border border-white/5">9 aciertos <span className="block text-lg">12 M</span></div><div className="bg-gray-500 text-white p-3 rounded-lg shadow-md border border-white/5">5 aciertos <span className="block text-lg">5 M</span></div></div></RuleCard>
          <RuleCard color="#ffd700" title="7. Premio" icon={<IconAward size={24} style={{ color: "#ffd700" }} />}><div className="text-center p-6 bg-[#ffd700]/10 rounded-xl border border-[#ffd700]/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]"><h4 className="text-[#ffd700] font-black uppercase text-2xl mb-1 tracking-tight drop-shadow-sm">Prestigio Eterno</h4><p className="text-sm text-white/80 mb-6 italic">La satisfacción de ganar a tus amigos es el verdadero trofeo.</p><div className="border-t border-[#ffd700]/20 pt-6"><span className="bg-[#ffd700] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Opcional</span><p className="mt-3 text-lg font-bold text-white mb-6">Apuesta: <span className="text-[#ffd700] text-2xl">5€</span></p><div className="flex justify-center items-end gap-6"><div className="flex flex-col items-center gap-1"><span className="text-3xl filter brightness-125">🥈</span><span className="text-xs font-bold text-gray-400">2º Puesto</span><span className="text-xl font-black text-[#e2e8f0]">30%</span></div><div className="flex flex-col items-center gap-1 -mt-4"><span className="text-5xl filter brightness-110">🥇</span><span className="text-sm font-black text-[#ffd700] uppercase tracking-wide">1º Puesto</span><span className="text-3xl font-black text-white drop-shadow-md">60%</span></div><div className="flex flex-col items-center gap-1"><span className="text-3xl filter saturate-150">🥉</span><span className="text-xs font-bold text-orange-700/80">3º Puesto</span><span className="text-xl font-black text-[#f97316]">10%</span></div></div></div></div></RuleCard>
        </div>
      </div>
    );
  };
// ==========================================
// 8. BUSCADOR INTELIGENTE Y MOTOR DE SUSTITUCIONES
// ==========================================

const GLOBAL_CLOSED_MATCHDAYS: Record<string, boolean> = {};

const getPlayerPointsRow = (playerName: string, matchday: string) => {
    if (!playerName) return undefined;
    
    const scores = GLOBAL_SCORES[playerName];
    if (scores && scores[matchday] !== undefined) return scores[matchday];

    const normalizedName = playerName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [key, value] of Object.entries(GLOBAL_SCORES)) {
        const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalizedKey === normalizedName) return value[matchday];
        const lastName = normalizedName.split(' ').pop();
        if (lastName && normalizedKey.includes(lastName)) return value[matchday];
    }

    // Usamos el puente global aquí
    if (matchday === GLOBAL_ACTIVE_MATCHDAY && MOCK_SCORES[playerName] !== undefined) return MOCK_SCORES[playerName];
    
    return undefined;
};

// --- LÓGICA DE CLASIFICACIÓN Y CUADRO DE ELIMINATORIAS ---
const getTournamentStandings = () => {
    const standings: Record<string, any[]> = {};
    let allThirds: any[] = [];
    const advancedTeams = new Set<string>();

    EURO_GROUPS_DATA.forEach(g => {
        let teams = g.teams.map(t => ({ name: t, pts: 0, gf: 0, gc: 0, gd: 0, played: 0, w: 0, d: 0, l: 0 }));
        const groupMatches = generateFixture().find(x => x.n === g.name)?.m || [];
        
        groupMatches.forEach(m => {
            const matchId = `${m.t1}-${m.t2}`;
            const res = GLOBAL_MATCHES[matchId] || m.result;
            if (res && res.includes('-')) {
                const [g1, g2] = res.split('-').map(x => parseInt(x.trim()));
                const t1 = teams.find(x => x.name === m.t1);
                const t2 = teams.find(x => x.name === m.t2);
                if (t1 && t2 && !isNaN(g1) && !isNaN(g2)) {
                    t1.played++; t2.played++;
                    t1.gf += g1; t1.gc += g2; t1.gd = t1.gf - t1.gc;
                    t2.gf += g2; t2.gc += g1; t2.gd = t2.gf - t2.gc;
                    if (g1 > g2) { t1.pts += 3; t1.w++; t2.l++; }
                    else if (g1 < g2) { t2.pts += 3; t2.w++; t1.l++; }
                    else { t1.pts += 1; t2.pts += 1; t1.d++; t2.d++; }
                }
            }
        });

        teams.sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        standings[g.name] = teams;
        
        // Top 2 clasificados directamente si han jugado todo
       // Eliminamos la restricción estricta de partidos para que el torneo no se bloquee
       if (teams[0]) advancedTeams.add(teams[0].name);
       if (teams[1]) advancedTeams.add(teams[1].name);
       
       // Recogemos a los 3º para la tabla global de mejores terceros
       if (teams[2]) allThirds.push({ ...teams[2], group: g.name.replace('GRUPO ', '') });
   });

   // Ordenamos los 3º y sacamos los 4 mejores
   allThirds.sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
   const bestThirds = allThirds.slice(0, 4);
   const thirdGroups = bestThirds.map(t => t.group).sort().join('');
   
   bestThirds.forEach(t => advancedTeams.add(t.name));

   return { standings, advancedTeams, bestThirds, thirdGroups };
};

const resolveMatchWinner = (t1: string, t2: string) => {
    if (!t1 || !t2 || t1 === '???' || t2 === '???') return null;
    const res1 = GLOBAL_MATCHES[`${t1}-${t2}`];
    const res2 = GLOBAL_MATCHES[`${t2}-${t1}`];
    const res = res1 || res2;
    if (!res) return null;
    
    const [g1, g2] = res.split('-').map(Number);
    if (g1 > g2) return res1 ? t1 : t2;
    if (g2 > g1) return res1 ? t2 : t1;
    
    // MAGIA DE PENALTIS: Si hay empate, buscamos la etiqueta "_PEN" en la base de datos
    const penWinner1 = GLOBAL_MATCHES[`${t1}-${t2}_PEN`];
    const penWinner2 = GLOBAL_MATCHES[`${t2}-${t1}_PEN`];
    if (penWinner1) return penWinner1;
    if (penWinner2) return penWinner2;
    
    return t1; // Si simulamos a lo bestia y hay empate, pasamos al 1º para no romper el cuadro
};

const getKnockoutFixtures = () => {
    const { standings, thirdGroups } = getTournamentStandings();
    const thirdMappings: any = {
        'ABCD': { '1B': '3A', '1C': '3D', '1E': '3B', '1F': '3C' }, 'ABCE': { '1B': '3A', '1C': '3E', '1E': '3B', '1F': '3C' },
        'ABCF': { '1B': '3A', '1C': '3F', '1E': '3B', '1F': '3C' }, 'ABDE': { '1B': '3D', '1C': '3E', '1E': '3A', '1F': '3B' },
        'ABDF': { '1B': '3D', '1C': '3F', '1E': '3A', '1F': '3B' }, 'ABEF': { '1B': '3E', '1C': '3F', '1E': '3B', '1F': '3A' },
        'ACDE': { '1B': '3E', '1C': '3D', '1E': '3C', '1F': '3A' }, 'ACDF': { '1B': '3F', '1C': '3D', '1E': '3C', '1F': '3A' },
        'ACEF': { '1B': '3E', '1C': '3F', '1E': '3C', '1F': '3A' }, 'ADEF': { '1B': '3E', '1C': '3F', '1E': '3D', '1F': '3A' },
        'BCDE': { '1B': '3E', '1C': '3D', '1E': '3B', '1F': '3C' }, 'BCDF': { '1B': '3F', '1C': '3D', '1E': '3C', '1F': '3B' },
        'BCEF': { '1B': '3F', '1C': '3E', '1E': '3C', '1F': '3B' }, 'BDEF': { '1B': '3F', '1C': '3E', '1E': '3D', '1F': '3B' },
        'CDEF': { '1B': '3F', '1C': '3E', '1E': '3D', '1F': '3C' }
    };

    const getTeam = (posCode: string) => {
        if (!posCode) return { name: '???', isKnown: false };
        if (posCode.length === 2) {
            const rank = parseInt(posCode.charAt(0)) - 1; 
            const group = posCode.charAt(1);
            const team = standings[`GRUPO ${group}`]?.[rank];
            // MAGIA: Ahora coge al clasificado haya jugado o no todos sus partidos
            return team ? { name: team.name, isKnown: true } : { name: posCode, isKnown: false };
        }
        return { name: posCode, isKnown: false }; 
    };

    const map = thirdMappings[thirdGroups] || { '1B': '3A/D/E/F', '1C': '3D/E/F', '1E': '3A/B/C/D', '1F': '3A/B/C' };

    const O1 = { id: 'O1', t1: getTeam('1B'), t2: getTeam(map['1B']) };
    const O2 = { id: 'O2', t1: getTeam('1A'), t2: getTeam('2C') };
    const O3 = { id: 'O3', t1: getTeam('1F'), t2: getTeam(map['1F']) };
    const O4 = { id: 'O4', t1: getTeam('2D'), t2: getTeam('2E') };
    const O5 = { id: 'O5', t1: getTeam('1E'), t2: getTeam(map['1E']) };
    const O6 = { id: 'O6', t1: getTeam('1D'), t2: getTeam('2F') };
    const O7 = { id: 'O7', t1: getTeam('1C'), t2: getTeam(map['1C']) };
    const O8 = { id: 'O8', t1: getTeam('2A'), t2: getTeam('2B') };

    const getW = (match: any) => {
        if (!match.t1.isKnown || !match.t2.isKnown) return { name: '???', isKnown: false };
        const winnerName = resolveMatchWinner(match.t1.name, match.t2.name);
        return winnerName ? { name: winnerName, isKnown: true } : { name: '???', isKnown: false };
    };

    const C1 = { id: 'C1', t1: getW(O1), t2: getW(O2) };
    const C2 = { id: 'C2', t1: getW(O3), t2: getW(O4) };
    const C3 = { id: 'C3', t1: getW(O5), t2: getW(O6) };
    const C4 = { id: 'C4', t1: getW(O7), t2: getW(O8) };

    const S1 = { id: 'S1', t1: getW(C1), t2: getW(C2) };
    const S2 = { id: 'S2', t1: getW(C3), t2: getW(C4) };
    const F = { id: 'F', t1: getW(S1), t2: getW(S2) };

    return { octavos: [O1, O2, O3, O4, O5, O6, O7, O8], cuartos: [C1, C2, C3, C4], semis: [S1, S2], final: [F] };
};

// --- CALCULADORA DE PREMIOS EUROQUINIELA ---
const calculateQuinielaPrize = (selections: any, standings: any) => {
    let aciertos = 0;
    EURO_GROUPS_DATA.forEach(group => {
        const groupStandings = standings[group.name];
        const isGroupFinished = groupStandings?.every((t: any) => t.played === 3);
        
        if (isGroupFinished) {
            const top2 = [groupStandings[0]?.name, groupStandings[1]?.name];
            const userPicks = selections[group.name] || [];
            userPicks.forEach((team: string) => {
                if (top2.includes(team)) aciertos++;
            });
        }
    });

    if (aciertos >= 12) return 25;
    if (aciertos === 11) return 20;
    if (aciertos === 10) return 15;
    if (aciertos === 9) return 12;
    if (aciertos === 8) return 10;
    if (aciertos === 7) return 8;
    if (aciertos === 6) return 6;
    if (aciertos === 5) return 5;
    return 0; // Menos de 5 aciertos no da premio
};

// --- MOTOR INTELIGENTE DE SUSTITUCIONES ---





const ScoresView = ({ teams, myTeamId, isAdmin }: { teams: any[], myTeamId: string | undefined, isAdmin: boolean }) => {
    const sortedTeams = useMemo(() => { return [...teams].sort((a, b) => b.points - a.points); }, [teams]); 
    return (
        <div className="max-w-4xl mx-auto px-4 mt-24 pb-32 animate-in fade-in">
            <h1 className="text-2xl font-black italic text-cyan-400 uppercase tracking-tighter mb-6 flex items-center gap-2"><IconClipboard /> TABLA DE PUNTUACIONES</h1>
            <div className="space-y-4">{sortedTeams.map((team) => <ScoreTeamRow key={team.id} team={team} isMyTeam={team.id === myTeamId} isAdmin={isAdmin} />)}</div>
        </div>
    );
};
// ==========================================
// 9. TABLAS DE PUNTUACIONES (VISTAS)
// ==========================================
const processSubstitutions = (starters: any, bench: any[], captain: number | null, matchday: string, isClosed: boolean) => {
    let total = 0;
    const subbedInIds = new Set();
    const subbedOutIds = new Set();
    const penalizedSlots = new Set();

    if (!isClosed) {
        Object.values(starters).forEach((p: any) => {
            if(!p) return;
            let pts = getPlayerPointsRow(p.nombre, matchday);
            if (typeof pts === 'number') {
                if (p.id === captain) pts *= 2;
                total += pts;
            }
        });
        return { total, subbedInIds, subbedOutIds, penalizedSlots };
    }

    const formation: Record<string, number> = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
    const missingStarters: any[] = [];
    const activeStarters: any[] = [];

    // 1. Evaluamos a los titulares
    Object.entries(starters).forEach(([slot, p]: [string, any]) => {
        if (!p) {
            penalizedSlots.add(slot);
            total -= 1;
            return;
        }
        const pts = getPlayerPointsRow(p.nombre, matchday);
        if (typeof pts !== 'number') {
            missingStarters.push({ slot, p });
        } else {
            activeStarters.push(p);
            formation[p.posicion] = (formation[p.posicion] || 0) + 1;
            let pPts = pts;
            if (p.id === captain) pPts *= 2;
            total += pPts;
        }
    });

    let subsUsed = 0;
    const replacedSlots = new Set();

    // 2. Intentamos sustituir (AHORA SOLO REVISA LÍMITES MÁXIMOS)
    if (missingStarters.length > 0) {
        bench.forEach((sub: any) => {
            if (!sub || subsUsed >= missingStarters.length) return;
            const subPts = getPlayerPointsRow(sub.nombre, matchday);
            if (typeof subPts !== 'number') return; 

            const neededPos = sub.posicion;
            if (activeStarters.length < 11) {
                const tempFormation = { ...formation };
                tempFormation[neededPos] = (tempFormation[neededPos] || 0) + 1;
                
                // MAGIA: Solo frenamos si excede el máximo permitido por la UEFA
                const isValid = 
                    tempFormation.POR <= 1 &&
                    tempFormation.DEF <= 5 &&
                    tempFormation.MED <= 5 &&
                    tempFormation.DEL <= 3;

                if (isValid) {
                    formation[neededPos]++;
                    activeStarters.push(sub);
                    subbedInIds.add(sub.id);
                    subsUsed++;
                    
                    const matchIdx = missingStarters.findIndex(m => !replacedSlots.has(m.slot) && m.p.posicion === neededPos);
                    if (matchIdx !== -1) {
                        replacedSlots.add(missingStarters[matchIdx].slot);
                        subbedOutIds.add(missingStarters[matchIdx].p.id);
                    } else {
                        const anyIdx = missingStarters.findIndex(m => !replacedSlots.has(m.slot));
                        if (anyIdx !== -1) {
                            replacedSlots.add(missingStarters[anyIdx].slot);
                            subbedOutIds.add(missingStarters[anyIdx].p.id);
                        }
                    }

                    let pts = subPts;
                    if (sub.id === captain) pts *= 2;
                    total += pts;
                }
            }
        });
    }

    // 3. Castigamos solo a los que NO entraron
    missingStarters.forEach(m => {
        if (!replacedSlots.has(m.slot)) {
            penalizedSlots.add(m.slot);
            total -= 1; 
        }
    });

    return { total, subbedInIds, subbedOutIds, penalizedSlots };
};

const ScoreTeamRow = ({ team, isMyTeam, isAdmin }: any) => {
    const [isOpen, setIsOpen] = useState(isMyTeam);
    const positionOrder: Record<string, number> = { "POR": 1, "DEF": 2, "MED": 3, "DEL": 4 };
    
    const allUniquePlayers = new Map();
    const safeSquad = team.squad || {};
    const currentPlayers = [...safeArray(safeSquad.titulares), ...safeArray(safeSquad.banquillo), ...safeArray(safeSquad.extras)].filter(Boolean);
    currentPlayers.forEach((p: any) => allUniquePlayers.set(p.id, { ...p, isSold: false }));

    const checkHistory = (phaseObj: any) => {
        if (!phaseObj) return;
        const pastPlayers = [...safeArray(phaseObj.selected || phaseObj.titulares), ...safeArray(phaseObj.bench || phaseObj.banquillo), ...safeArray(phaseObj.extras)].filter(Boolean);
        pastPlayers.forEach((p: any) => {
            if (!allUniquePlayers.has(p.id)) allUniquePlayers.set(p.id, { ...p, isSold: true }); 
        });
    };

    const raw = team.rawSquad || {};
    checkHistory(raw); 
    checkHistory(raw.j1_snapshot); // ¡AQUÍ ESTÁ LA MAGIA PARA LEER A LOS DESCARTADOS!
    checkHistory(raw.j2); checkHistory(raw.j3); 
    checkHistory(raw.oct); checkHistory(raw.cua); checkHistory(raw.sem); checkHistory(raw.fin);

    const allPlayers = Array.from(allUniquePlayers.values()).sort((a: any, b: any) => {
        if (a.isSold && !b.isSold) return 1; if (!a.isSold && b.isSold) return -1;
        const posDiff = positionOrder[a.posicion] - positionOrder[b.posicion]; 
        if (posDiff !== 0) return posDiff; return a.nombre.localeCompare(b.nombre); 
    });
        
    const canView = isMyTeam || isAdmin;
    useEffect(() => { if (isMyTeam) setIsOpen(true); }, [isMyTeam]);

    const getPhaseObj = (j: string) => {
        if (j === 'J2') return raw.j2 || raw;
        if (j === 'J3') return raw.j3 || raw.j2 || raw;
        if (j === 'OCT') return raw.oct || raw.j3 || raw.j2 || raw;
        if (j === 'CUA') return raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
        if (j === 'SEM') return raw.sem || raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
        if (j === 'FIN') return raw.fin || raw.sem || raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
        return raw;
    };

    const matchdaySubs: Record<string, any> = {};
    LINEUP_MATCHDAYS.forEach(j => {
        const phaseObj = getPhaseObj(j);
        const starters = phaseObj.selected || phaseObj.titulares || {};
        const benchRaw = phaseObj.bench || phaseObj.banquillo || [];
        const benchArr = Array.isArray(benchRaw) ? benchRaw : ["S1","S2","S3","S4","S5","S6"].map(k => benchRaw[k]).filter(Boolean);
        matchdaySubs[j] = processSubstitutions(starters, benchArr, phaseObj.captain, j, GLOBAL_CLOSED_MATCHDAYS[j] || false);
    });

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
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase text-white tracking-widest border-b-2 border-cyan-500/50">
                                <th className="p-3">Pos</th><th className="p-3 text-center">SEL</th><th className="p-3 w-1/3">Nombre</th><th className="p-3 text-center bg-blue-900/30 text-cyan-400 border-x border-white/5">Total</th>
                                {LINEUP_MATCHDAYS.map(j => <th key={j} className="p-3 text-center">{j}</th>)}
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-white divide-y divide-white/5">
                            <tr className="bg-blue-600/20 text-xs font-black text-cyan-400 border-b-2 border-white/10">
                                <td colSpan={3} className="p-3 text-right uppercase tracking-widest">PUNTOS JORNADA</td>
                                <td className="p-3 text-center text-white bg-blue-600/40 border-x border-white/10 text-sm">{team.points}</td>
                                {LINEUP_MATCHDAYS.map(j => {
                                    const pen = matchdaySubs[j]?.penalizedSlots?.size || 0;
                                    return (
                                        <td key={j} className="p-3 text-center">
                                            <span className="block text-sm">{team.matchdayPoints?.[j] || 0}</span>
                                            {pen > 0 && <span className="text-[8px] text-red-400 block mt-0.5" title="Hueco vacío">- {pen} hueco</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                            {allPlayers.length > 0 ? allPlayers.map((p: any) => {
                                let totalPts = 0;
                                let isCapInSomePhase = false;

                                const cells = LINEUP_MATCHDAYS.map(j => {
                                    const phaseObj = getPhaseObj(j);
                                    const starters = phaseObj.selected || phaseObj.titulares || {};
                                    const benchRaw = phaseObj.bench || phaseObj.banquillo || [];
                                    const benchArr = Array.isArray(benchRaw) ? benchRaw : ["S1","S2","S3","S4","S5","S6"].map(k => benchRaw[k]).filter(Boolean);
                                    
                                    const isStarter = Object.values(starters).some((s:any) => s && s.id === p.id);
                                    const isBench = benchArr.some((s:any) => s && s.id === p.id);
                                    const capForThisMatchday = phaseObj.captain === p.id;
                                    if (capForThisMatchday) isCapInSomePhase = true;

                                    const pts = getPlayerPointsRow(p.nombre, j);
                                    const subs = matchdaySubs[j];
                                    const isClosed = GLOBAL_CLOSED_MATCHDAYS[j] || false;

                                    let displayPts: any = "-";
                                    let actualPtsAdded = 0;

                                    if (typeof pts === 'number') {
                                        if (isStarter) {
                                            if (isClosed && subs.subbedOutIds.has(p.id)) {
                                                displayPts = <span className="text-red-500 line-through opacity-70" title="Sustituido">{pts}</span>; 
                                            } else {
                                                actualPtsAdded = capForThisMatchday ? pts * 2 : pts;
                                                displayPts = <span className="text-[#22c55e] font-bold">{actualPtsAdded}</span>;
                                            }
                                        } else if (isBench) {
                                            if (isClosed && subs.subbedInIds.has(p.id)) {
                                                actualPtsAdded = capForThisMatchday ? pts * 2 : pts;
                                                displayPts = <span className="text-[#22c55e] font-black" title="Entró de suplente">+{actualPtsAdded}</span>;
                                            } else {
                                                displayPts = <span className="text-white/30" title="Suplente sin jugar">({pts})</span>; 
                                            }
                                        } else {
                                            displayPts = <span className="text-white/20">-</span>;
                                        }
                                    } else if (pts === null || (pts === undefined && isClosed)) { // <-- MAGIA AQUÍ
                                        if (isStarter) {
                                            displayPts = <span className="text-red-500 font-bold" title="No jugó">X</span>;
                                        } else {
                                            displayPts = <span className="text-white/30">-</span>;
                                        }
                                    }

                                    totalPts += actualPtsAdded;
                                    return <td key={j} className="p-3 text-center">{displayPts}</td>;
                                });

                                return ( 
                                    <tr key={p.id} className={`hover:bg-white/5 transition-colors group ${p.isSold ? 'bg-gray-800/40 opacity-70 grayscale' : ''}`}>
                                        <td className="p-3"><span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${p.isSold ? 'bg-gray-700 text-gray-400 opacity-60' : posColors[p.posicion]}`}>{p.posicion}</span></td>
                                        <td className="p-3 text-center text-lg">{p.isSold ? <span className="grayscale opacity-40">{getFlag(p.seleccion)}</span> : getFlag(p.seleccion)}</td>
                                        <td className="p-3 truncate max-w-[120px] font-medium text-white/90 flex items-center gap-2">
                                            <span className={p.isSold ? 'text-white/50 italic' : 'group-hover:text-white'}>{p.nombre}</span>
                                            {p.isSold ? <span className="bg-gray-700 text-gray-300 text-[8px] px-1 py-0.5 rounded font-black tracking-widest border border-gray-500">DESCARTADO</span> : (isCapInSomePhase && <IconCaptain className="scale-75"/>)}
                                        </td>
                                        <td className="p-3 text-center font-black text-white bg-blue-900/20 border-x border-white/5 text-sm">{totalPts > 0 ? totalPts : "-"}</td>
                                        {cells}
                                    </tr>
                                );
                            }) : ( <tr><td colSpan={4 + LINEUP_MATCHDAYS.length} className="p-6 text-center text-white/30 italic">Sin jugadores alineados</td></tr> )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
// ==========================================
// 10. PANTALLA VIP: PANEL DE ADMINISTRACIÓN
// ==========================================

const PlayerAdminRow = ({ p, onRefresh, adminMatchday, isMatchdayClosed }: any) => {
    const [manualPts, setManualPts] = useState(0); 
    const [played, setPlayed] = useState(false); 
    const [starter, setStarter] = useState(false); 
    const [matchRes, setMatchRes] = useState<'win'|'loss'|null>(null); 
    const [sofa, setSofa] = useState<number|''>(''); 
    const [cleanSheet, setCleanSheet] = useState(false); 
    const [gkGoals, setGkGoals] = useState<number|''>(''); 
    const [doubleYellow, setDoubleYellow] = useState(false); 
    const [red, setRed] = useState(false); 
    const [isSaving, setIsSaving] = useState(false); 
    
    const [dnp, setDnp] = useState(false); 
    const [isLocked, setIsLocked] = useState(false); // NUEVO: Controla si ya se ha guardado

    // Comprueba si el jugador ya tiene puntuación guardada al cargar
    useEffect(() => {
        const savedValue = GLOBAL_SCORES[p.nombre]?.[adminMatchday];
        if (savedValue !== undefined) {
            setIsLocked(true); // Bloquea la edición por defecto
            if (savedValue === null) {
                setDnp(true);
                setManualPts(0);
            } else {
                setDnp(false);
                setManualPts(savedValue);
            }
        } else {
            setIsLocked(false);
            setDnp(false);
            setManualPts(0);
        }
        setPlayed(false); setStarter(false); setMatchRes(null); setSofa(''); setCleanSheet(false); setGkGoals(''); setDoubleYellow(false); setRed(false);
    }, [p.nombre, adminMatchday]);

    const getGkGoalsPts = (goals: number | '') => { if (goals === '') return 0; if (goals === 0) return 4; if (goals === 1) return 0; return -goals; };
    const totalPts = manualPts + (played ? 1 : 0) + (starter ? 1 : 0) + (matchRes === 'win' ? 1 : matchRes === 'loss' ? -1 : 0) + (sofa !== '' ? Number(sofa) : 0) + (cleanSheet && p.posicion === 'DEF' ? 2 : 0) + (p.posicion === 'POR' ? getGkGoalsPts(gkGoals) : 0) + (doubleYellow ? -3 : 0) + (red ? -5 : 0);
    
    const handleReset = () => { setManualPts(0); setPlayed(false); setStarter(false); setMatchRes(null); setSofa(''); setCleanSheet(false); setGkGoals(''); setDoubleYellow(false); setRed(false); setDnp(false); };

    const handleSave = async () => {
        setIsSaving(true); 
        const currentScores = GLOBAL_SCORES[p.nombre] || {}; 
        const finalValue = dnp ? null : totalPts; 
        const newScores = { ...currentScores, [adminMatchday]: finalValue };
        
        const { error } = await supabase.from('player_scores').upsert({ player_name: p.nombre, scores: newScores });
        if (!error) { 
            GLOBAL_SCORES[p.nombre] = newScores; 
            setIsLocked(true); // Bloquea la fila tras guardar con éxito
            onRefresh(); 
        } else {
            alert("Error al guardar: " + error.message);
        }
        setIsSaving(false);
    };

    const sofascoreOptions = [ { label: "9.5 - 10 (+14)", val: 14 }, { label: "9.0 - 9.4 (+13)", val: 13 }, { label: "8.6 - 8.9 (+12)", val: 12 }, { label: "8.2 - 8.5 (+11)", val: 11 }, { label: "8.0 - 8.1 (+10)", val: 10 }, { label: "7.8 - 7.9 (+9)", val: 9 }, { label: "7.6 - 7.7 (+8)", val: 8 }, { label: "7.4 - 7.5 (+7)", val: 7 }, { label: "7.2 - 7.3 (+6)", val: 6 }, { label: "7.0 - 7.1 (+5)", val: 5 }, { label: "6.8 - 6.9 (+4)", val: 4 }, { label: "6.6 - 6.7 (+3)", val: 3 }, { label: "6.4 - 6.5 (+2)", val: 2 }, { label: "6.2 - 6.3 (+1)", val: 1 }, { label: "6.0 - 6.1 (0)", val: 0 }, { label: "5.8 - 5.9 (-1)", val: -1 }, { label: "5.6 - 5.7 (-2)", val: -2 }, { label: "5.4 - 5.5 (-3)", val: -3 }, { label: "5.2 - 5.3 (-4)", val: -4 }, { label: "5.0 - 5.1 (-5)", val: -5 }, { label: "0.0 - 4.9 (-6)", val: -6 } ];
    const gkGoalsOptions = [ { label: "0 Goles (+4)", val: 0 }, { label: "1 Gol (0)", val: 1 }, { label: "2 Goles (-2)", val: 2 }, { label: "3 Goles (-3)", val: 3 }, { label: "4 Goles (-4)", val: 4 }, { label: "5 Goles (-5)", val: 5 }, { label: "6 Goles (-6)", val: 6 }, { label: "7 Goles (-7)", val: 7 }, { label: "8 Goles (-8)", val: 8 }, { label: "9 Goles (-9)", val: 9 }, { label: "10 Goles (-10)", val: 10 } ];

    // Si está cerrado globalmente o bloqueado por guardado, deshabilitamos
    const isFormDisabled = isLocked || isMatchdayClosed;

    return (
        <div className={`bg-[#1c2a45] border rounded-xl p-3 flex flex-col gap-3 transition-all ${isLocked ? 'border-yellow-500/30 bg-yellow-900/10' : (dnp ? 'bg-[#0d1526] border-red-900/50' : 'border-white/5 hover:bg-white/5')}`}>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-2xl ${dnp ? 'grayscale opacity-50' : ''}`}>{getFlag(p.seleccion)}</span>
                    <div>
                        <span className={`font-bold block leading-none ${dnp ? 'text-white/50 line-through' : 'text-white'}`}>{p.nombre}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${posColors[p.posicion]} ${dnp ? 'opacity-50' : ''}`}>{p.posicion}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button disabled={isFormDisabled} onClick={() => setDnp(!dnp)} className={`px-2 py-1.5 rounded text-[9px] font-black transition-all border ${dnp ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-105' : 'bg-black/40 text-white/40 border-white/10 hover:text-white'} ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        NO JUEGA
                    </button>
                    
                    <div className={`w-10 h-8 rounded flex items-center justify-center font-black text-sm border ${dnp ? 'bg-red-900/40 text-red-500 border-red-500/50' : 'bg-black text-white border-white/10'}`}>
                        {dnp ? 'X' : totalPts}
                    </div>
                    
                    {/* LÓGICA DE BOTONES: CERRADO / EDITAR / GUARDAR */}
                    {isMatchdayClosed ? (
                        <div className="bg-red-900/50 text-red-400 px-3 py-2 rounded font-black text-[10px] uppercase border border-red-500/50 cursor-not-allowed">
                            CERRADO
                        </div>
                    ) : isLocked ? (
                        <button onClick={() => setIsLocked(false)} className="bg-[#facc15] text-black px-3 py-2 rounded font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg border border-yellow-600 hover:bg-yellow-400">
                            EDITAR
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={isSaving} className={`text-white px-3 py-2 rounded font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg ${isSaving ? 'bg-gray-500' : 'bg-[#22c55e] hover:bg-green-600'}`}>
                            {isSaving ? '...' : 'GUARDAR'}
                        </button>
                    )}
                </div>
            </div>
            
            {/* BLOQUEO DE BOTONES SI ESTÁ GUARDADO (isFormDisabled) O NO JUEGA (dnp) */}
            <div className={`flex flex-col gap-2 transition-all duration-300 ${isFormDisabled ? 'opacity-40 pointer-events-none grayscale' : (dnp ? 'opacity-30 pointer-events-none grayscale' : '')}`}>
                <div className="flex flex-wrap gap-1 items-center">
                    <button onClick={() => setPlayed(!played)} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${played ? 'bg-blue-600 text-white' : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'}`}>+1 Juega</button>
                    <button onClick={() => setStarter(!starter)} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${starter ? 'bg-blue-600 text-white' : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'}`}>+1 Titular</button>
                    <button onClick={() => setMatchRes(matchRes === 'win' ? null : 'win')} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${matchRes === 'win' ? 'bg-green-600 text-white' : 'bg-green-900/30 text-green-500 border border-green-500/30'}`}>+1 Victoria</button>
                    <button onClick={() => setMatchRes(matchRes === 'loss' ? null : 'loss')} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${matchRes === 'loss' ? 'bg-red-600 text-white' : 'bg-red-900/30 text-red-500 border border-red-500/30'}`}>-1 Derrota</button>
                    <select value={sofa} onChange={(e) => setSofa(e.target.value === '' ? '' : Number(e.target.value))} className={`px-2 py-1 rounded text-[9px] font-black outline-none appearance-none cursor-pointer ${sofa !== '' ? 'bg-[#a855f7] text-white shadow-lg' : 'bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/50'}`}>
                        <option value="">⭐ SOFASCORE</option>
                        {sofascoreOptions.map(opt => <option key={opt.label} value={opt.val} className="bg-[#1c2a45] text-white">{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                    <button onClick={() => setManualPts(p => p + 5)} className="px-2 py-1 bg-green-900/30 text-green-500 border border-green-500/30 rounded text-[9px] font-black active:bg-green-900/50">+5 Gol</button>
                    <button onClick={() => setManualPts(p => p + 1)} className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded text-[9px] font-black active:bg-blue-900/50">+1 Asist.</button>
                    <button onClick={() => setManualPts(p => p + 5)} className="px-2 py-1 bg-green-900/30 text-green-500 border border-green-500/30 rounded text-[9px] font-black active:bg-green-900/50">+5 Pen. Marc.</button>
                    {p.posicion === 'DEF' && <button onClick={() => setCleanSheet(!cleanSheet)} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${cleanSheet ? 'bg-yellow-500 text-black shadow-lg' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30'}`}>+2 P. Cero</button>}
                    {p.posicion === 'POR' && (
                        <><select value={gkGoals} onChange={(e) => setGkGoals(e.target.value === '' ? '' : Number(e.target.value))} className={`px-2 py-1 rounded text-[9px] font-black outline-none appearance-none cursor-pointer ${gkGoals !== '' ? 'bg-orange-600 text-white shadow-lg' : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'}`}>
                            <option value="">🧤 GOLES ENC.</option>
                            {gkGoalsOptions.map(opt => <option key={opt.label} value={opt.val} className="bg-[#1c2a45] text-white">{opt.label}</option>)}
                        </select>
                        <button onClick={() => setManualPts(p => p + 3)} className="px-2 py-1 bg-teal-900/30 text-teal-400 border border-teal-500/30 rounded text-[9px] font-black active:bg-teal-900/50">+3 Para Pen.</button></>
                    )}
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                    <button onClick={() => setDoubleYellow(!doubleYellow)} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${doubleYellow ? 'bg-orange-500 text-black shadow-lg' : 'bg-orange-900/30 text-orange-500 border border-orange-500/30'}`}>-3 Dob. Amarilla</button>
                    <button onClick={() => setRed(!red)} className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${red ? 'bg-red-600 text-white shadow-lg' : 'bg-red-900/30 text-red-500 border border-red-500/30'}`}>-5 Roja</button>
                    <button onClick={() => setManualPts(p => p - 3)} className="px-2 py-1 bg-orange-900/30 text-orange-500 border border-orange-500/30 rounded text-[9px] font-black active:bg-orange-900/50">-3 Fall. Pen.</button>
                    <button onClick={() => setManualPts(p => p - 1)} className="px-2 py-1 bg-red-900/30 text-red-500 border border-red-500/30 rounded text-[9px] font-black active:bg-red-900/50">-1 Prop. Meta</button>
                    
                    {/* El botón Reset lo dejamos libre por si te equivocas tras darle a EDITAR */}
                    <button onClick={handleReset} className="px-2 py-1 bg-black text-white/50 border border-white/20 rounded text-[9px] font-black hover:text-white ml-auto pointer-events-auto">Reset</button>
                </div>
            </div>
        </div>
    );
};

const MatchAdminRow = ({ m, onRefresh }: any) => {
    const matchId = `${m.t1}-${m.t2}`;
    const currentRes = GLOBAL_MATCHES[matchId] || ""; 
    const currentPenWinner = GLOBAL_MATCHES[`${matchId}_PEN`] || "";
    
    const [g1, g2] = currentRes ? currentRes.split(" - ") : ["", ""];
    const [score1, setScore1] = useState(g1);
    const [score2, setScore2] = useState(g2);
    const [penWinner, setPenWinner] = useState(currentPenWinner);
    const [isSaving, setIsSaving] = useState(false);
    const [isLocked, setIsLocked] = useState(!!currentRes); 

    // Detectamos si es eliminatoria para habilitar la tanda de penaltis
    const isKnockout = ["Octavos", "Cuartos", "Semis", "Final"].includes(m.d);
    const isTie = score1 !== "" && score2 !== "" && score1 === score2;

    const handleSave = async () => {
        if (score1 === "" || score2 === "") return;
        if (isKnockout && isTie && !penWinner) return alert("⚠️ Al haber empate, debes seleccionar qué equipo ganó la tanda de penaltis.");

        setIsSaving(true);
        const resString = `${score1} - ${score2}`;
        
        // Empaquetamos el resultado y (si hay) el ganador de penaltis
        const upserts = [{ match_id: matchId, result: resString }];
        if (isKnockout && isTie && penWinner) {
            upserts.push({ match_id: `${matchId}_PEN`, result: penWinner });
        }
        
        const { error } = await supabase.from('match_results').upsert(upserts, { onConflict: 'match_id' });
        
        if (!error) { 
            GLOBAL_MATCHES[matchId] = resString; 
            if (isKnockout && isTie && penWinner) GLOBAL_MATCHES[`${matchId}_PEN`] = penWinner;
            setIsLocked(true); 
            onRefresh(); 
        } else { 
            alert("Error al guardar: " + error.message); 
        }
        setIsSaving(false);
    };

    return (
        <div className={`relative flex flex-col p-3 rounded-xl border mb-2 transition-colors ${isLocked ? 'bg-green-900/10 border-green-500/30' : 'bg-[#1c2a45] border-white/5 hover:bg-white/5'}`}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 w-[40%] justify-end"><span className="text-[10px] font-black uppercase text-white truncate">{m.t1}</span> <span className="text-xl">{getFlag(m.t1)}</span></div>
                
                <div className="flex items-center gap-1 justify-center w-[20%]">
                    <input type="number" disabled={isLocked} value={score1} onChange={e=>setScore1(e.target.value)} className={`w-8 h-8 bg-black text-white text-center font-black rounded outline-none focus:border-red-500 border ${isLocked ? 'border-green-500/50 opacity-80' : 'border-white/10'}`} />
                    <span className="text-white/50 font-black">-</span>
                    <input type="number" disabled={isLocked} value={score2} onChange={e=>setScore2(e.target.value)} className={`w-8 h-8 bg-black text-white text-center font-black rounded outline-none focus:border-red-500 border ${isLocked ? 'border-green-500/50 opacity-80' : 'border-white/10'}`} />
                </div>
                
                <div className="flex items-center gap-2 w-[40%] justify-start"><span className="text-xl">{getFlag(m.t2)}</span> <span className="text-[10px] font-black uppercase text-white truncate">{m.t2}</span></div>
                
                <div className="absolute right-4 flex items-center">
                    {isLocked ? (
                        <button onClick={() => setIsLocked(false)} className="bg-[#facc15] text-black px-2 py-1.5 rounded text-[8px] font-black uppercase hover:bg-yellow-400 active:scale-95 shadow-lg flex items-center gap-1 border border-yellow-600 transition-all">
                            <IconEdit size={12}/> EDITAR
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={isSaving} className="bg-red-600 text-white px-2 py-1.5 rounded text-[8px] font-black uppercase hover:bg-red-500 active:scale-95 shadow-lg flex items-center gap-1 transition-all">
                            {isSaving ? '...' : <><IconCheck size={12}/> OK</>}
                        </button>
                    )}
                </div>
            </div>
            
            {/* ZONA DE PENALTIS DESPLEGABLE */}
            {isKnockout && isTie && (
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col items-center animate-in slide-in-from-top duration-300">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1">⚽ ¿Quién ganó los penaltis?</span>
                    <div className="flex gap-2">
                        <button disabled={isLocked} onClick={() => setPenWinner(m.t1)} className={`px-4 py-1.5 rounded text-[10px] font-black transition-all border ${penWinner === m.t1 ? 'bg-[#22c55e] text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-105' : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30'}`}>{getFlag(m.t1)} {m.t1}</button>
                        <button disabled={isLocked} onClick={() => setPenWinner(m.t2)} className={`px-4 py-1.5 rounded text-[10px] font-black transition-all border ${penWinner === m.t2 ? 'bg-[#22c55e] text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-105' : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30'}`}>{getFlag(m.t2)} {m.t2}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminView = ({ onRefresh, allTeams, onToggleBet, onSaveTreasury, currentRealMatchday, setCurrentRealMatchday }: any) => {
    const [adminTab, setAdminTab] = useState<'puntos'|'partidos'|'tesoreria'|'laboratorio'>('puntos');
    const [adminMatchday, setAdminMatchday] = useState("J1");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSimulating, setIsSimulating] = useState(false);
    const [updateTrigger, setUpdateTrigger] = useState(0); 

    const isMatchdayClosed = GLOBAL_CLOSED_MATCHDAYS[adminMatchday] || false;
    const isMarketOpen = GLOBAL_MATCHES['MARKET_OPEN'] === 'true'; 

    const handleToggleClose = async () => {
        const newVal = !isMatchdayClosed;
        const matchId = `CLOSED_${adminMatchday}`;
        const { error } = await supabase.from('match_results').upsert({ match_id: matchId, result: newVal ? 'true' : 'false' });
        if (!error) { 
            GLOBAL_CLOSED_MATCHDAYS[adminMatchday] = newVal; 
            setUpdateTrigger(prev => prev + 1); 
            onRefresh(); 
        } else alert("Error: " + error.message);
    };

    const handleToggleMarket = async () => {
        if (!confirm(isMarketOpen ? "¿CERRAR el Mercado de Fichajes?" : "⚠️ ¿ABRIR MERCADO? Esto guardará la 'Caja Fuerte' con la plantilla de Fase de Grupos de TODOS los jugadores.")) return;
        
        const newVal = !isMarketOpen;
        
        // EL BLINDAJE: Usamos upsert con onConflict para que Supabase no se bloquee
        const { error } = await supabase
            .from('match_results')
            .upsert(
                { match_id: 'MARKET_OPEN', result: newVal ? 'true' : 'false' },
                { onConflict: 'match_id' }
            );
        
        if (newVal && !error) {
            for (const t of allTeams) {
                const squadData = t.rawSquad || {};
                if (!squadData.j1_snapshot) {
                    const snap = { selected: squadData.selected || squadData.titulares || {}, bench: squadData.bench || squadData.banquillo || {}, extras: squadData.extras || {}, captain: squadData.captain };
                    await supabase.from('teams').update({ squad: { ...squadData, j1_snapshot: snap } }).eq('id', t.id);
                }
            }
        }
        
        if (!error) { 
            GLOBAL_MATCHES['MARKET_OPEN'] = newVal ? 'true' : 'false'; 
            setTimeout(() => onRefresh(), 500); // Respiro de medio segundo para que guarde bien
        } else {
            alert("Error al guardar mercado: " + error.message);
        }
    };

    // --- EL SCRIPT DE SIMULACIÓN ---
    // --- EL SCRIPT DE SIMULACIÓN BLINDADO ---
    // --- EL SCRIPT DE SIMULACIÓN BLINDADO Y CON ELIMINATORIAS ---
    // --- EL SCRIPT DE SIMULACIÓN BLINDADO Y ATÓMICO ---
    const handleSimulateJornada = async (jornada: string) => {
        if (!confirm(`¿Generar datos ficticios para los partidos de la ${jornada}?`)) return;
        setIsSimulating(true);
        
        try {
            let matchesToSimulate: any[] = [];
            
            // FASE DE GRUPOS
            if (['J1', 'J2', 'J3'].includes(jornada)) {
                EURO_GROUPS_DATA.forEach(g => {
                    const [t1, t2, t3, t4] = g.teams;
                    if (jornada === 'J1') matchesToSimulate.push([t1, t2], [t3, t4]);
                    if (jornada === 'J2') matchesToSimulate.push([t1, t3], [t2, t4]);
                    if (jornada === 'J3') matchesToSimulate.push([t1, t4], [t2, t3]);
                });
            } else {
                // FASE ELIMINATORIA: Cogemos los cruces del nuevo motor
                const knockouts = getKnockoutFixtures();
                let roundMatches: any[] = [];
                if (jornada === 'OCT') roundMatches = knockouts.octavos;
                if (jornada === 'CUA') roundMatches = knockouts.cuartos;
                if (jornada === 'SEM') roundMatches = knockouts.semis;
                if (jornada === 'FIN') roundMatches = knockouts.final;
                
                roundMatches.forEach((m: any) => {
                    if (m.t1.isKnown && m.t2.isKnown) matchesToSimulate.push([m.t1.name, m.t2.name]);
                });

                if (matchesToSimulate.length === 0) {
                    alert("⚠️ Faltan resultados de la fase anterior para generar estos cruces.");
                    setIsSimulating(false);
                    return;
                }
            }

            const manualMatch = matchesToSimulate.length > 1 ? matchesToSimulate.pop() : null; 
            
            const playerUpserts: any[] = [];
            const matchUpserts: any[] = [];

            for (const [teamA, teamB] of matchesToSimulate) {
                const score = `${Math.floor(Math.random() * 4)}-${Math.floor(Math.random() * 4)}`;
                matchUpserts.push({ match_id: `${teamA}-${teamB}`, result: score });
                GLOBAL_MATCHES[`${teamA}-${teamB}`] = score;

                for (const team of [teamA, teamB]) {
                    const squad = PLAYERS_DB.filter((p: any) => p.seleccion === team);
                    const shuffled = squad.sort(() => 0.5 - Math.random()).slice(0, 15);
                    
                    shuffled.forEach((player: any) => {
                        const pts = Math.floor(Math.random() * 12) + 1;
                        const currentScores = GLOBAL_SCORES[player.nombre] || {};
                        const newScores = { ...currentScores, [jornada]: pts };
                        
                        playerUpserts.push({ player_name: player.nombre, scores: newScores });
                        GLOBAL_SCORES[player.nombre] = newScores;
                    });
                }
            }

            // ⚡ MAGIA ATÓMICA: Metemos el avance de jornada DENTRO de los partidos
    matchUpserts.push({ match_id: 'ACTIVE_MATCHDAY', result: jornada });

    if (matchUpserts.length > 0) {
        // 🛡️ Filtro anti-duplicados para los partidos
        const uniqueMatchUpserts = Array.from(new Map(matchUpserts.map(item => [item.match_id, item])).values());
        const { error: errM } = await supabase.from('match_results').upsert(uniqueMatchUpserts, { onConflict: 'match_id' });
        if (errM) console.error("Error partidos:", errM);
    }
    
    if (playerUpserts.length > 0) {
        // 🛡️ Filtro anti-duplicados para los jugadores (Esto soluciona tu error de raíz)
        const uniquePlayerUpserts = Array.from(new Map(playerUpserts.map(item => [item.player_name, item])).values());
        const { error: errP } = await supabase.from('player_scores').upsert(uniquePlayerUpserts, { onConflict: 'player_name' });
        if (errP) alert("Aviso Supabase: " + errP.message);
    }

            setCurrentRealMatchday(jornada);
            GLOBAL_ACTIVE_MATCHDAY = jornada;

            alert(`✅ Simulación inyectada con éxito.\nSe han puntuado ${playerUpserts.length} jugadores.` + (manualMatch ? `\n\nEl partido reservado para ti es:\n⚽ ${manualMatch[0]} vs ${manualMatch[1]}` : ''));
            
            // Lo bajamos a medio segundo porque ya no hay peligro de cuelgue
            setTimeout(() => {
                setUpdateTrigger(prev => prev + 1);
                onRefresh();
            }, 500); 

        } catch(e) { console.error(e); alert("Error simulando."); }
        setIsSimulating(false);
    };

    // --- EL BOTÓN NUCLEAR (LIMPIEZA) ---
    const handleClearDatabase = async () => {
        if (prompt("Escribe BORRAR para eliminar todos los puntos y resultados del torneo (Las plantillas NO se borrarán):") !== "BORRAR") return;
        setIsSimulating(true);
        try {
            await supabase.from('match_results').delete().neq('match_id', 'DUMMY');
            await supabase.from('player_scores').delete().neq('player_name', 'DUMMY');
            alert("🧹 Base de datos de resultados limpia y lista para la Eurocopa real.");
            onRefresh();
        } catch(e) { console.error(e); }
        setIsSimulating(false);
    };

    const filteredPlayers = useMemo(() => {
        if (searchTerm.length < 3) return [];
        const posOrder: Record<string, number> = { "POR": 1, "DEF": 2, "MED": 3, "DEL": 4 };
        const cleanSearch = searchTerm.toLowerCase().trim();
        const allCountries = Array.from(new Set(PLAYERS_DB.map((p: any) => p.seleccion)));
        const matchedCountry = allCountries.find(c => c.toLowerCase() === cleanSearch || (cleanSearch.length >= 4 && c.toLowerCase().startsWith(cleanSearch)));
        if (matchedCountry) return PLAYERS_DB.filter((p: any) => p.seleccion === matchedCountry).sort((a: any, b: any) => posOrder[a.posicion] - posOrder[b.posicion]);
        else return PLAYERS_DB.filter(p => p.nombre.toLowerCase().includes(cleanSearch)).slice(0, 10);
    }, [searchTerm]);

    return (
        <div className="max-w-md mx-auto px-4 mt-20 pb-32 animate-in fade-in">
            <div className="flex justify-between items-center bg-red-600/10 border-2 border-red-500/50 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div><h1 className="text-2xl font-black italic text-red-500 uppercase tracking-tighter flex items-center gap-2"><IconSettings size={28} className={isSimulating ? "animate-spin" : "animate-spin-slow"} /> MODO DIOS</h1><p className="text-red-400/60 text-[9px] font-bold uppercase tracking-widest">Panel de Control</p></div>
                {adminTab === 'puntos' && ( <select value={adminMatchday} onChange={e => setAdminMatchday(e.target.value)} className="bg-red-600 text-white font-black p-2 rounded-xl outline-none shadow-lg border border-red-500 text-sm cursor-pointer">{LINEUP_MATCHDAYS.map(j => <option key={j} value={j} className="bg-[#1c2a45] text-white">Editando {j}</option>)}</select> )}
            </div>
            
            <div className="flex gap-2 bg-black/40 p-2 rounded-xl border border-white/5 mb-6 overflow-x-auto custom-scrollbar">
                <button onClick={()=>setAdminTab('puntos')} className={`py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${adminTab==='puntos'?'bg-red-600 text-white shadow-lg':'text-white/40 hover:bg-white/5'}`}>Puntos</button>
                <button onClick={()=>setAdminTab('partidos')} className={`py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${adminTab==='partidos'?'bg-red-600 text-white shadow-lg':'text-white/40 hover:bg-white/5'}`}>Partidos</button>
                <button onClick={()=>setAdminTab('tesoreria')} className={`py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${adminTab==='tesoreria'?'bg-red-600 text-white shadow-lg':'text-white/40 hover:bg-white/5'}`}>Tesorería</button>
                <button onClick={()=>setAdminTab('laboratorio')} className={`py-2 px-4 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${adminTab==='laboratorio'?'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]':'text-purple-400/50 hover:bg-purple-900/20 border border-purple-500/30'}`}><IconRefresh size={12} className="inline mr-1"/> Lab</button>
            </div>
            
            {adminTab === 'laboratorio' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="bg-purple-900/20 p-4 rounded-2xl border border-purple-500/30 text-center">
                        <h3 className="text-purple-400 font-black uppercase text-sm mb-2">Simulador de Torneo</h3>
                        <p className="text-white/60 text-xs mb-4">Inyecta datos masivos para probar las clasificaciones, quinielas y eliminatorias. Se dejará 1 partido vacío por jornada para tus pruebas manuales.</p>
                        
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('J1')} className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular J1</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('J2')} className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular J2</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('J3')} className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular J3</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('OCT')} className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular OCT</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('CUA')} className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular CUA</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('SEM')} className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl font-black text-[10px] transition-colors">Simular SEM</button>
                            <button disabled={isSimulating} onClick={() => handleSimulateJornada('FIN')} className="bg-yellow-600 hover:bg-yellow-500 text-black py-2 rounded-xl font-black text-[10px] transition-colors col-span-2 shadow-[0_0_10px_rgba(250,204,21,0.5)]">Simular FINAL 🏆</button>
                        </div>

                        <div className="pt-4 border-t border-purple-500/30">
                            <button disabled={isSimulating} onClick={handleClearDatabase} className="w-full bg-red-900/40 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2">
                                <IconTrash2 size={16}/> BORRAR TODA LA BASE DE DATOS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {adminTab === 'puntos' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col justify-center bg-blue-900/20 p-3 rounded-xl border border-blue-500/30">
                            <h3 className="text-[10px] font-black text-blue-400 uppercase mb-2">Estado Jornada</h3>
                            <button onClick={handleToggleClose} className={`w-full py-2 rounded-lg font-black text-[10px] uppercase transition-all shadow-lg flex items-center justify-center gap-1 ${isMatchdayClosed ? 'bg-red-600 text-white border border-red-500' : 'bg-[#22c55e] text-black border border-green-500'}`}>
                                {isMatchdayClosed ? <><IconLock size={12}/> CERRADA</> : <><IconCheck size={12}/> ABIERTA</>}
                            </button>
                        </div>
                        <div className="flex flex-col justify-center bg-purple-900/20 p-3 rounded-xl border border-purple-500/30">
                            <h3 className="text-[10px] font-black text-purple-400 uppercase mb-2">Mercado Octavos</h3>
                            <button onClick={handleToggleMarket} className={`w-full py-2 rounded-lg font-black text-[10px] uppercase transition-all shadow-lg flex items-center justify-center gap-1 ${isMarketOpen ? 'bg-purple-500 text-white border border-purple-400 animate-pulse' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                                {isMarketOpen ? <><IconRefresh size={12}/> ABIERTO</> : <><IconLock size={12}/> CERRADO</>}
                            </button>
                        </div>
                        
                        <div className="flex flex-col justify-center bg-orange-900/20 p-3 rounded-xl border border-orange-500/30 col-span-2 mt-2 shadow-inner">
                            <h3 className="text-[10px] font-black text-orange-400 uppercase mb-2 flex items-center gap-1"><IconAlertTriangle size={12}/> Jornada Activa (En Juego)</h3>
                            <p className="text-[8px] text-white/50 mb-2 leading-tight">Define qué jornada se está jugando ahora. Esto BLOQUEA sus alineaciones y permite editar la SIGUIENTE.</p>
                            <select 
                                value={currentRealMatchday} 
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setCurrentRealMatchday(val); 
                                    GLOBAL_ACTIVE_MATCHDAY = val; 
                                    
                                    // Usamos el UPSERT nativo forzando la resolución de conflictos
                                    // Esto elimina de raíz el error "duplicate key"
                                    const { error } = await supabase
                                        .from('match_results')
                                        .upsert(
                                            { match_id: 'ACTIVE_MATCHDAY', result: val }, 
                                            { onConflict: 'match_id' }
                                        );
                                    
                                    if (!error) { 
                                        setTimeout(() => onRefresh(), 500); 
                                    } else { 
                                        alert("Error de Supabase: " + error.message); 
                                    }
                                }}
                                className="w-full bg-orange-600 text-white font-black p-2 rounded-lg outline-none shadow-lg border border-orange-500 text-sm cursor-pointer"
                            >
                                {LINEUP_MATCHDAYS.map(j => <option key={j} value={j} className="bg-[#1c2a45] text-white">🏆 Jugando ahora: {j}</option>)}
                            </select>
                        </div>
                    </div>
                    <input type="text" placeholder={`🔍 Buscar para sumar a ${adminMatchday}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1c2a45] border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-red-500 transition-colors shadow-inner" />
                    <div className="space-y-2">
                        {searchTerm.length >= 3 ? ( filteredPlayers.length > 0 ? filteredPlayers.map(p => ( <PlayerAdminRow key={p.id} p={p} onRefresh={onRefresh} adminMatchday={adminMatchday} isMatchdayClosed={isMatchdayClosed} /> )) : <div className="text-center p-8 text-white/30 italic text-sm border border-dashed border-white/10 rounded-xl">Ningún resultado encontrado.</div> ) : <div className="text-center p-8 text-white/30 italic text-sm border border-dashed border-white/10 rounded-xl">Escribe al menos 3 letras. (Ej: Alemania)</div>}
                    </div>
                </div>
            )}
            
            {adminTab === 'partidos' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    {(() => {
                        const knockouts = getKnockoutFixtures();
                        const adminFixtures = [
                            ...generateFixture(),
                            { n: "OCTAVOS DE FINAL", m: knockouts.octavos.filter((m:any) => m.t1.isKnown && m.t2.isKnown).map((m:any) => ({ t1: m.t1.name, t2: m.t2.name, d: "Octavos", result: "" })) },
                            { n: "CUARTOS DE FINAL", m: knockouts.cuartos.filter((m:any) => m.t1.isKnown && m.t2.isKnown).map((m:any) => ({ t1: m.t1.name, t2: m.t2.name, d: "Cuartos", result: "" })) },
                            { n: "SEMIFINALES", m: knockouts.semis.filter((m:any) => m.t1.isKnown && m.t2.isKnown).map((m:any) => ({ t1: m.t1.name, t2: m.t2.name, d: "Semis", result: "" })) },
                            { n: "GRAN FINAL", m: knockouts.final.filter((m:any) => m.t1.isKnown && m.t2.isKnown).map((m:any) => ({ t1: m.t1.name, t2: m.t2.name, d: "Final", result: "" })) }
                        ].filter(g => g.m.length > 0);

                        return adminFixtures.map(g => (
                            <div key={g.n} className="bg-black/20 p-3 rounded-2xl border border-white/5">
                                <h3 className="text-[#22c55e] font-black text-xs uppercase mb-3 text-center">{g.n}</h3>
                                {g.m.map((m:any, i:number) => <MatchAdminRow key={i} m={m} onRefresh={onRefresh} />)}
                            </div>
                        ));
                    })()}
                </div>
            )}
            
            {adminTab === 'tesoreria' && (
                <div className="space-y-2 animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                        <p className="text-white/50 text-[10px] text-left uppercase font-bold w-1/2">Control de pagos. Marca quién ha pagado.</p>
                        <button onClick={onSaveTreasury} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-2 transition-all">
                            <IconSave size={14}/> GUARDAR
                        </button>
                    </div>
                    {allTeams.map((t: any) => (
                        <div key={t.id} className="bg-[#1c2a45] p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div><h3 className="text-white font-black italic uppercase text-sm">{t.name}</h3><span className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1"><IconUser size={10}/> {t.user}</span></div>
                            <button onClick={() => onToggleBet(t.id, !t.hasPaidBet)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all shadow-lg flex items-center gap-2 ${t.hasPaidBet ? 'bg-[#facc15] text-black border border-yellow-500' : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'}`}>
                                {t.hasPaidBet ? <><IconCheck size={14}/> PAGADO</> : <><IconX size={14}/> SIN APUESTA</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ==========================================
// 11. PANTALLAS MODALES Y LOGIN SENCILLO
// ==========================================

const AuthScreen = ({ onLogin }: { onLogin: (email: string, username: string, teamName?: string) => void }) => {
    const [isRegister, setIsRegister] = useState(false); const [username, setUsername] = useState(""); const [teamName, setTeamName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [errorMsg, setErrorMsg] = useState("");
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setErrorMsg(""); setLoading(true);
      try {
          if (isRegister) {
              if (!email || !password || !username || !teamName) throw new Error("Rellena todos los campos");
              const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, team_name: teamName } } });
              if (error) throw error; if (data.user) onLogin(data.user.email!, username, teamName);
          } else {
               if (!email || !password) throw new Error("Rellena email y contraseña");
               // ¡MAGIA AQUÍ! Ignoramos el Auth de Supabase y forzamos la entrada para que la app busque en tu tabla
               onLogin(email, "", "");
          }
      } catch (err: any) { setErrorMsg(err.message || "Error al entrar"); } finally { setLoading(false); }
    };
    
    return ( 
      <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 font-sans text-white">
          <div className="w-full max-w-md bg-[#162136] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-8">
                  <h1 className="text-3xl font-black italic uppercase text-[#22c55e]">EUROCOPA<br/><span className="text-white">FANTÁSTICA</span></h1>
              </div>
              {errorMsg && <div className="mb-4 text-red-500 text-xs text-center bg-red-900/20 p-2 rounded">{errorMsg}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                      <>
                          <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none border border-white/5 focus:border-[#22c55e]" placeholder="Usuario" />
                          <input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none border border-white/5 focus:border-[#22c55e]" placeholder="Nombre Equipo" />
                      </>
                  )}
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none border border-white/5 focus:border-[#22c55e]" placeholder="Email" />
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] text-white font-bold outline-none border border-white/5 focus:border-[#22c55e]" placeholder="Contraseña" />
                  
                  <button type="submit" className="w-full py-4 mt-6 bg-[#22c55e] text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform">
                      {loading ? "CARGANDO..." : (isRegister ? "CREAR EQUIPO" : "ENTRAR AL JUEGO")}
                  </button>
              </form>
              <div className="mt-6 text-center">
                  <button onClick={() => setIsRegister(!isRegister)} type="button" className="text-xs font-black underline text-[#facc15] hover:text-white transition-colors">
                      {isRegister ? "¿Ya tienes cuenta? Entra" : "¿No tienes equipo? Regístrate"}
                  </button>
              </div>
          </div>
      </div> 
    );
  };


  const SelectionModal = ({ activeSlot, onClose, onSelect, onRemove, onRemoveToBench, selectedIds, lineupTopology, mode, sortPrice, setSortPrice, activeSort, setActiveSort, allPlayersSelected, sortAlpha, setSortAlpha, isMarketOpen, advancedTeams }: any) => {
    const [filterPos, setFilterPos] = useState("TODOS"); 
    const [filterCountry, setFilterCountry] = useState("TODOS"); 

    // Filtrar países para el selector (Ocultar eliminados si hay mercado abierto)
    const uniqueCountries = useMemo(() => {
        let all = Array.from(new Set(PLAYERS_DB.map((p: any) => p.seleccion))).sort() as string[];
        if (isMarketOpen && advancedTeams && advancedTeams.size > 0) {
            all = all.filter(c => advancedTeams.has(c));
        }
        return ["TODOS", ...all];
    }, [isMarketOpen, advancedTeams]);

    // Arreglo del contador: mira la lista que le acabamos de pasar por cable
    const getCountryCount = React.useCallback((country: string) => { 
        if (!allPlayersSelected) return 0; 
        return allPlayersSelected.filter((p: any) => p.seleccion === country).length; 
    }, [allPlayersSelected]);

    const getPlayerStatus = React.useCallback((playerId: number) => { 
        if (!lineupTopology) return "NONE"; 
        const { selected, bench, extras } = lineupTopology; 
        if (Object.values(selected).find((p:any) => p?.id === playerId)) return "TITULAR"; 
        if (Object.values(bench).find((p:any) => p?.id === playerId)) return "BANQUILLO"; 
        if (Object.values(extras).find((p:any) => p?.id === playerId)) return "NO CONVOCADO"; 
        return "NONE"; 
    }, [lineupTopology]);

    useEffect(() => {
        const currentSlotId = typeof activeSlot === 'string' ? activeSlot : activeSlot?.id;
        if (currentSlotId && String(currentSlotId).includes('-')) {
            setFilterPos(String(currentSlotId).split('-')[0]);
        } else {
            setFilterPos("TODOS");
        }
    }, [activeSlot]);

    const filteredPlayers = useMemo(() => {
        let result: any[] = [];
        if (mode === 'lineup' && lineupTopology) { 
            const { selected, bench, extras } = lineupTopology; 
            const allMyPlayers = [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)]; 
            if (activeSlot.type === 'titular') { 
                result = allMyPlayers.filter((p:any) => p?.posicion === activeSlot.pos); 
            } else { 
                result = allMyPlayers; 
            } 
        } else { 
            result = PLAYERS_DB.filter(p => !(selectedIds || []).includes(p.id)); 
            // MAGIA: Ocultar jugadores de selecciones eliminadas al fichar
            if (isMarketOpen && advancedTeams && advancedTeams.size > 0) {
                result = result.filter(p => advancedTeams.has(p.seleccion));
            }
        }

        if (filterCountry !== "TODOS") result = result.filter((p:any) => p?.seleccion === filterCountry);
        if (filterPos !== "TODOS") result = result.filter((p:any) => p?.posicion === filterPos);
        
        if (mode === 'lineup') { 
            result.sort((a:any, b:any) => { 
                const statusOrder: any = { "TITULAR": 1, "BANQUILLO": 2, "NO CONVOCADO": 3, "NONE": 4 }; 
                return statusOrder[getPlayerStatus(a.id)] - statusOrder[getPlayerStatus(b.id)]; 
            }); 
        } else { 
            if (activeSort === 'price') { 
                result.sort((a:any, b:any) => sortPrice === 'desc' ? b.precio - a.precio : a.precio - b.precio); 
            } else { 
                result.sort((a:any, b:any) => sortAlpha === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)); 
            } 
        }
        return result.filter(Boolean);
    }, [selectedIds, filterPos, filterCountry, mode, lineupTopology, activeSlot, sortPrice, activeSort, getPlayerStatus, sortAlpha, isMarketOpen, advancedTeams]);

    const getStatusBg = (id: number) => { 
        const s = getPlayerStatus(id); 
        if (s === "TITULAR") return "bg-green-900/30 border-green-500/50"; 
        if (s === "BANQUILLO") return "bg-yellow-400/20 border-yellow-400/60"; 
        if (s === "NO CONVOCADO") return "bg-red-900/40 border-red-500/50"; 
        return "bg-[#162136] border-white/10"; 
    };

    const maxCountryLimit = isMarketOpen ? 8 : 7; 

    return (
        <div className="fixed inset-0 z-[200] bg-[#05080f] p-6 flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic uppercase text-white">ELEGIR</h2>
                <button onClick={onClose}><IconX/></button>
            </div>
            
            {onRemove && ( 
                <div className="flex gap-2 mb-4 w-full">
                    {onRemoveToBench && activeSlot && activeSlot.type !== 'bench' && mode === 'lineup' && (
                        <button onClick={onRemoveToBench} className="flex-1 bg-yellow-600/20 border border-yellow-500 text-yellow-500 py-3 px-2 rounded-xl font-black text-[10px] uppercase hover:bg-yellow-600 hover:text-black transition-colors flex justify-center items-center gap-1 shadow-lg">
                            AL BANQUILLO ⬇️
                        </button>
                    )}
                    <button onClick={onRemove} className="flex-1 bg-red-600/20 border border-red-500 text-red-500 py-3 px-2 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-1 shadow-lg">
                        {mode === 'lineup' ? 'A LA GRADA 🗑️' : 'DESCARTAR 💸'}
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-3 mb-4 mt-3">
                <div className="flex gap-2">
                    {["TODOS", "POR", "DEF", "MED", "DEL"].map(pos => (
                        <button key={pos} onClick={() => setFilterPos(pos)} className={`flex-1 py-2 rounded-xl font-black text-[10px] border transition-all ${filterPos === pos ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-white border-white/20 hover:bg-white/10'}`}>
                            {pos}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <select 
                        value={filterCountry} 
                        onChange={(e) => setFilterCountry(e.target.value)}
                        className="flex-1 bg-[#162136] text-white p-2 rounded-lg text-[10px] font-bold outline-none border border-white/20 shadow-inner cursor-pointer"
                    >
                        {uniqueCountries.map((c: string) => {
                            const countInSquad = getCountryCount(c);
                            return (
                                <option key={c} value={c}>
                                    {c === "TODOS" ? "🌍 TODOS LOS PAÍSES" : `${getFlag(c)} ${c} (${countInSquad}/${maxCountryLimit})`}
                                </option>
                            );
                        })}
                    </select>

                    <button onClick={() => { setActiveSort('price'); setSortPrice(sortPrice === 'desc' ? 'asc' : 'desc'); }} className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${activeSort === 'price' ? 'bg-[#facc15] text-black border-[#facc15]' : 'bg-[#162136] text-white border-white/20 hover:bg-white/10'}`}>
                        💰 PRECIO {activeSort === 'price' ? (sortPrice === 'desc' ? '⬇' : '⬆') : ''}
                    </button>

                    <button onClick={() => { setActiveSort('alpha'); setSortAlpha(sortAlpha === 'asc' ? 'desc' : 'asc'); }} className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${activeSort === 'alpha' ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'bg-[#162136] text-white border-white/20 hover:bg-white/10'}`}>
                        🔤 A-Z {activeSort === 'alpha' ? (sortAlpha === 'asc' ? '⬇' : '⬆') : ''}
                    </button>
                </div>
            </div>
            
            {mode === 'market' && ( 
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                    {uniqueCountries.map(c => { 
                        const count = getCountryCount(c); 
                        const isMaxed = count >= maxCountryLimit; 
                        return ( 
                            <button key={c} onClick={()=>setFilterCountry(c)} className={`px-3 py-1 rounded-lg text-[9px] font-black border whitespace-nowrap flex items-center gap-1 ${filterCountry===c?'bg-[#22c55e] text-black':'border-white/20'} ${isMaxed ? 'opacity-50' : ''}`}>
                                {c !== "TODOS" && <span>{getFlag(c)}</span>} {c} {c !== "TODOS" && <span className={isMaxed ? "text-red-500 ml-1" : "opacity-50 ml-1"}>({count}/{maxCountryLimit})</span>}
                            </button> 
                        ); 
                    })}
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

// ==========================================
// 12. APP PRINCIPAL (EuroApp)
// ==========================================

export default function EuroApp() {
  const [user, setUser] = useState<{email: string, username: string, teamName?: string, id?: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'rules' | 'squad' | 'classification' | 'calendar' | 'quiniela' | 'scores' | 'lineups' | 'admin'>('squad'); 
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  const [captain, setCaptain] = useState<number | null>(null);
  const [squadValidated, setSquadValidated] = useState(false);
  const [currentTeamName, setCurrentTeamName] = useState(""); 
  const [isEditingName, setIsEditingName] = useState(false); 
  const [lineupViewJornada, setLineupViewJornada] = useState("J1"); 
  const [lineupSelected, setLineupSelected] = useState<any>({});
  const [lineupBench, setLineupBench] = useState<any>({});
  const [lineupExtras, setLineupExtras] = useState<any>({});
  const [lineupCaptain, setLineupCaptain] = useState<number | null>(null);
  const [isLineupEditing, setIsLineupEditing] = useState(false); 
  const [hasConfirmedNoExtras, setHasConfirmedNoExtras] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<Record<string, string[]>>({});
  const [quinielaLocked, setQuinielaLocked] = useState(false);
  const [allTeams, setAllTeams] = useState<any[]>(MOCK_TEAMS_DB); 
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [benchFilter, setBenchFilter] = useState("TODOS");
  const [extrasFilter, setExtrasFilter] = useState("TODOS");
  const [sortPrice, setSortPrice] = useState<'desc' | 'asc'>('desc');
  const [activeSort, setActiveSort] = useState<'price' | 'alpha'>('price');
  const [sortAlpha, setSortAlpha] = useState<'asc' | 'desc'>('asc'); 
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [currentRealMatchday, setCurrentRealMatchday] = useState("J1");

  const hasTournamentStarted = useMemo(() => Date.now() >= new Date(SIMULATED_GAME_START).getTime(), []);

  const allSquadPlayers = useMemo(() => [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)], [selected, bench, extras]);
  const budgetSpent = Math.round(allSquadPlayers.reduce((a:number, p:any) => a + p.precio, 0) * 10) / 10;
  
  // Calculamos en tiempo real si el jugador ha ganado premio en la quiniela
  
 
// --- LÓGICA DEL MERCADO DE FICHAJES (CONTADOR DE CAMBIOS) ---

// --- LÓGICA DE CÁLCULO DINÁMICO (PRESUPUESTO, QUINIELA Y MERCADO) ---
const { standings: currentStandings, advancedTeams } = getTournamentStandings();
const myExtraBudget = calculateQuinielaPrize(quinielaSelections, currentStandings);
const dynamicMaxBudget = MAX_BUDGET + myExtraBudget;

const myTeamData = allTeams.find((t:any) => t.id === user?.id);
const snapshot = myTeamData?.rawSquad?.j1_snapshot;
let marketChangesCount = 0;

// Sacamos a los jugadores de la caja fuerte inicial
const snapshotIds = new Set([
    ...Object.values(snapshot?.selected || {}).map((p:any)=>p?.id),
    ...(Array.isArray(snapshot?.bench) ? snapshot.bench : Object.values(snapshot?.bench || {})).map((p:any)=>p?.id),
    ...(Array.isArray(snapshot?.extras) ? snapshot.extras : Object.values(snapshot?.extras || {})).map((p:any)=>p?.id)
].filter(Boolean));

const currentIdsSet = new Set(allSquadPlayers.map((p:any)=>p?.id));

// MAGIA: Si el mercado está abierto, el descarte son los que estaban en el snapshot pero ya no están en tu equipo actual
const discardedPlayers = isMarketOpen && snapshot ? PLAYERS_DB.filter((p:any) => snapshotIds.has(p.id) && !currentIdsSet.has(p.id)) : [];

if (isMarketOpen && snapshot) {
    const currentIds = Array.from(currentIdsSet);
    currentIds.forEach(id => {
        if (!snapshotIds.has(id)) marketChangesCount++;
    });
}
// -------------------------------------------------------------------

// --- FUNCIÓN ÚNICA Y BLINDADA PARA GUARDAR/VALIDAR PLANTILLA ---
const handleSaveSquad = async () => {
    if(!isValidTactic) return alert("⚠️ Táctica inválida."); 
    if(!captain) return alert("⚠️ ¡Debes elegir un CAPITÁN para tu plantilla!"); 

    const numPlayers = allSquadPlayers.length;
    // MAGIA: Válido si tiene entre 18 y 20, o si tiene 17 Y ha pulsado el botón rojo
    const isValidCount = (numPlayers >= 18 && numPlayers <= 20) || (numPlayers === 17 && hasConfirmedNoExtras);
    
    if (!isValidCount) {
        alert("Debes tener entre 17 y 20 jugadores. Si tienes 17, confirma que no quieres extras pulsando el botón rojo.");
        return;
    }
    if (budgetSpent > dynamicMaxBudget) {
        alert(`⚠️ Presupuesto excedido. Gastado: ${budgetSpent}M / Límite: ${dynamicMaxBudget}M`);
        return;
    }
    if (isMarketOpen && marketChangesCount > 7) {
        alert("⚠️ Has superado el límite de 7 fichajes.");
        return;
    }

    // Recuperamos tu equipo y su "caja fuerte" para NO BORRAR la historia (J1, J2, J3...)
    const myTeam = allTeams.find((t:any) => t.id === user?.id);
    const raw = myTeam?.rawSquad || {};

    const newSquad = {
        ...raw, // <-- BLINDAJE: Esto salva la vida de las alineaciones pasadas
        selected,
        bench,
        extras,
        captain
    };

    const { error } = await supabase.from('teams').update({ squad: newSquad, is_validated: true }).eq('id', user?.id);
    
    if (!error) {
        setSquadValidated(true);
        alert("✅ ¡Plantilla guardada y validada con éxito!");
        loadUserData(user); // MAGIA: Refresca inmediatamente la barra y los descartes
    } else {
        alert("Error al guardar: " + error.message);
    }
};

  const isValidTactic = useMemo(() => VALID_FORMATIONS.includes(`${Object.keys(selected).filter(k=>k.startsWith("DEF")).length}-${Object.keys(selected).filter(k=>k.startsWith("MED")).length}-${Object.keys(selected).filter(k=>k.startsWith("DEL")).length}`), [selected]);
  
  const currentLineupTactic = useMemo(() => {
    const s = lineupSelected; // FUERA LA TRAMPA: Siempre miramos lineupSelected
    if (!s || Object.keys(s).length === 0) return "0-0-0";
    const defs = Object.values(s).filter((p:any) => p && p.posicion === 'DEF').length;
    const meds = Object.values(s).filter((p:any) => p && p.posicion === 'MED').length;
    const dels = Object.values(s).filter((p:any) => p && p.posicion === 'DEL').length;
    return `${defs}-${meds}-${dels}`;
  }, [lineupSelected]);

  const isValidLineupTactic = useMemo(() => VALID_FORMATIONS.includes(currentLineupTactic), [currentLineupTactic]);
  const isJornadaEditable = (j: string) => { if (Date.now() < new Date(SIMULATED_GAME_START).getTime()) return false; const activeIndex = LINEUP_MATCHDAYS.indexOf(currentRealMatchday); const targetIndex = LINEUP_MATCHDAYS.indexOf(j); return targetIndex === activeIndex + 1; };

  // --- SUSTITUCIONES EN TIEMPO REAL (Limpio) ---
  const selectedObj = lineupSelected;
  const benchObj = lineupBench;
  const banquilloArr = ["S1","S2","S3","S4","S5","S6"].map(k => benchObj[k]).filter(Boolean);
  const viewCap = lineupCaptain;
  const isClosedView = GLOBAL_CLOSED_MATCHDAYS[lineupViewJornada] || false;
  
  const currentViewSubstitutions = processSubstitutions(selectedObj, banquilloArr, viewCap, lineupViewJornada, isClosedView);

  // --- MEMORIA INTELIGENTE (HERENCIA EN CASCADA) ---
  useEffect(() => {
      if (!user) return;
      const myTeam = allTeams.find(t => t.id === user.id);
      if (!myTeam) return;
      const raw = myTeam.rawSquad || {};
      const key = lineupViewJornada.toLowerCase();
      
      const getInheritedPhase = (j: string) => {
          if (j === 'j2') return raw.j2 || raw;
          if (j === 'j3') return raw.j3 || raw.j2 || raw;
          if (j === 'oct') return raw.oct || raw.j3 || raw.j2 || raw;
          if (j === 'cua') return raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
          if (j === 'sem') return raw.sem || raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
          if (j === 'fin') return raw.fin || raw.sem || raw.cua || raw.oct || raw.j3 || raw.j2 || raw;
          return raw;
      };

      if (key === 'j1') {
          setLineupSelected(raw.j1_snapshot?.selected || selected);
          setLineupBench(raw.j1_snapshot?.bench || bench);
          setLineupExtras(raw.j1_snapshot?.extras || extras);
          setLineupCaptain(raw.j1_snapshot?.captain || captain);
      } else {
          const phaseObj = getInheritedPhase(key);
          setLineupSelected(phaseObj.selected || selected);
          setLineupBench(phaseObj.bench || bench);
          setLineupExtras(phaseObj.extras || extras);
          setLineupCaptain(phaseObj.captain || captain);
      }
  }, [lineupViewJornada, allTeams, selected, bench, extras, captain, user]);
  
  

  const loadUserData = async (u: any) => { 
      try {
          const { data: scoresData } = await supabase.from('player_scores').select('*');
          if (scoresData) { scoresData.forEach((row: any) => { GLOBAL_SCORES[row.player_name] = row.scores || {}; }); }

          let marketStatus = false;
          let activeMatchdayStr = "J1"; 
          const { data: matchesData } = await supabase.from('match_results').select('*');
          if (matchesData) { 
              matchesData.forEach((row: any) => { 
                  if (row.match_id === 'MARKET_OPEN') {
                      marketStatus = (row.result === 'true');
                  } else if (row.match_id === 'ACTIVE_MATCHDAY') { 
                      activeMatchdayStr = row.result;
                  } else if (row.match_id.startsWith('CLOSED_')) {
                      GLOBAL_CLOSED_MATCHDAYS[row.match_id.replace('CLOSED_', '')] = (row.result === 'true');
                  } else {
                      GLOBAL_MATCHES[row.match_id] = row.result; 
                  }
              }); 
          }
          setIsMarketOpen(marketStatus);
          setCurrentRealMatchday(activeMatchdayStr);
          GLOBAL_ACTIVE_MATCHDAY = activeMatchdayStr;

          GLOBAL_MATCHES['MARKET_OPEN'] = marketStatus ? 'true' : 'false';

          const { data: dbTeams } = await supabase.from('teams').select('*');
          const myData = dbTeams?.find((d:any) => d.id === u.id);
          const tName = myData?.team_name || u.user_metadata?.team_name || "Mi Equipo";
          
          let myParsedSquad: any = { titulares: {}, banquillo: [], extras: [], captain: null };
          if (myData) {
              let s = myData.squad;
              if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { s = {}; } }
              setSelected(s?.selected || {}); setBench(s?.bench || {}); setExtras(s?.extras || {}); setCaptain(s?.captain); setSquadValidated(myData.is_validated); 
              const benchArray = s?.bench ? ["S1","S2","S3","S4","S5","S6"].map(k=>s.bench[k]).filter(Boolean) : [];
              myParsedSquad = { titulares: s?.selected || {}, banquillo: benchArray, extras: s?.extras ? Object.values(s.extras) : [], captain: s?.captain };
              let q = myData.quiniela; if (typeof q === 'string') { try { q = JSON.parse(q); } catch (e) { q = {}; } }
              setQuinielaSelections(q?.selections || {}); setQuinielaLocked(q?.locked || false);
          }

          let combinedTeams = (dbTeams || []).map((t:any, i:number) => formatTeamData({...t, hasPaidBet: t.has_paid_bet, id: t.id, name: t.team_name, user: t.username}, i));
          
          combinedTeams = combinedTeams.map(t => {
              let total = 0;
              const matchdayPoints: any = {};
              LINEUP_MATCHDAYS.forEach(j => {
                  let phaseObj = t.squad || {}; 
                  if (j === 'J1') phaseObj = t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'J2') phaseObj = t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'J3') phaseObj = t.squad?.j3 || t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'OCT') phaseObj = t.squad?.oct || t.squad?.j3 || t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'CUA') phaseObj = t.squad?.cua || t.squad?.oct || t.squad?.j3 || t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'SEM') phaseObj = t.squad?.sem || t.squad?.cua || t.squad?.oct || t.squad?.j3 || t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};
                  if (j === 'FIN') phaseObj = t.squad?.fin || t.squad?.sem || t.squad?.cua || t.squad?.oct || t.squad?.j3 || t.squad?.j2 || t.squad?.j1_snapshot || t.squad || {};

                  const starters = phaseObj.selected || phaseObj.titulares || {};
                  const benchRaw = phaseObj.bench || phaseObj.banquillo || [];
                  const benchArr = Array.isArray(benchRaw) ? benchRaw : ["S1","S2","S3","S4","S5","S6"].map(k => benchRaw[k]).filter(Boolean);
                  const isClosed = GLOBAL_CLOSED_MATCHDAYS[j] || false;

                  const pts = processSubstitutions(starters, benchArr, phaseObj.captain, j, isClosed).total;
                  matchdayPoints[j] = pts;
                  total += pts;
              });
              return { ...t, points: total, matchdayPoints };
          });

          // MAGIA: CALCULAR EVOLUCIÓN DEL RANKING EN TIEMPO REAL
          const historyPoints = combinedTeams.map(t => ({ id: t.id, pts: 0 }));
          combinedTeams.forEach(t => { t.calculatedEvolution = []; });
          
          // Calculamos el índice de la jornada actual para asegurar la línea de tiempo
          const activeIndex = LINEUP_MATCHDAYS.indexOf(activeMatchdayStr);
          
          LINEUP_MATCHDAYS.forEach((j, idx) => {
              // El blindaje: Si está cerrada, O si es una jornada pasada/actual, se calcula
              const isStarted = GLOBAL_CLOSED_MATCHDAYS[j] || idx <= activeIndex;
              
              if (isStarted) {
                  historyPoints.forEach(hp => {
                      const t = combinedTeams.find(x => x.id === hp.id);
                      hp.pts += (t?.matchdayPoints?.[j] || 0);
                  });
                  const sorted = [...historyPoints].sort((a, b) => b.pts - a.pts);
                  combinedTeams.forEach(t => {
                      const rank = sorted.findIndex(x => x.id === t.id) + 1;
                      t.calculatedEvolution.push(rank);
                  });
              }
          });

          // BLINDAJE AL CARGAR: Extraemos la plantilla en su estado más puro para no perder las jornadas
          let pureRawSquad = {};
          if (myData && myData.squad) {
              pureRawSquad = typeof myData.squad === 'string' ? JSON.parse(myData.squad) : myData.squad;
          }

          const myIndex = combinedTeams.findIndex((t:any) => t.id === u.id);
          if (myIndex === -1) {
              combinedTeams.push(formatTeamData({ id: u.id, name: tName, user: myData?.username || u.user_metadata?.username || "Yo", points: 0, matchdayPoints: {}, squad: pureRawSquad, hasPaidBet: myData?.hasPaidBet || false }, 0));
          } else {
              combinedTeams[myIndex] = formatTeamData({ ...combinedTeams[myIndex], name: tName, squad: pureRawSquad, points: combinedTeams[myIndex].points, matchdayPoints: combinedTeams[myIndex].matchdayPoints }, 0);
          }

          setAllTeams(combinedTeams);  
      } catch(e) { console.error("Error cargando datos:", e); }
  };

  const handleLogin = async (e: string, u: string, t?: string) => {
    // 1. Forzamos el Modo Dios si es tu email
    setIsAdmin(e === MASTER_EMAIL);

    // 2. Limpiamos la memoria del equipo anterior
    setSelected({}); setBench({}); setExtras({}); setCaptain(null); 
    setLineupSelected({}); setLineupBench({}); setLineupExtras({}); setLineupCaptain(null);
    setSquadValidated(false);

    // 3. BUSCAMOS DIRECTO EN TU TABLA 'teams' (evitando el bloqueo del Auth)
    const { data } = await supabase.from('teams').select('*').eq('email', e).single();
    
    if (data || e === MASTER_EMAIL) {
        const fakeUser = { 
            email: e, 
            username: data?.username || e.split('@')[0], 
            id: data?.id || 'admin-local-id', 
            teamName: data?.team_name || "Mi Equipo" 
        };
        setUser(fakeUser);
        setCurrentTeamName(fakeUser.teamName);
        loadUserData(fakeUser);
    } else {
        alert("Este email no está registrado en el torneo.");
    }

};

  const confirmLogout = async () => { 
      setUser(null); 
      setIsAdmin(false);
      setSelected({}); setBench({}); setExtras({}); setCaptain(null);
      setLineupSelected({}); setLineupBench({}); setLineupExtras({}); setLineupCaptain(null);
      setSquadValidated(false);
      setShowExitModal(false); 
  };

  useEffect(() => {
      if (user) { window.history.pushState(null, document.title, window.location.href); const handlePopState = () => { window.history.pushState(null, document.title, window.location.href); setShowExitModal(true); }; window.addEventListener('popstate', handlePopState); return () => { window.removeEventListener('popstate', handlePopState); }; }
  }, [user]);

  // --- MEMORIA INTELIGENTE DE ALINEACIONES ---
  useEffect(() => {
    if (!user) return;
    const myTeam = allTeams.find(t => t.id === user.id);
    if (!myTeam) return;
    const raw = myTeam.rawSquad || {};
    
    const key = lineupViewJornada.toLowerCase();
    
    if (key === 'j1') {
        // La J1 siempre es la plantilla base
        setLineupSelected(selected);
        setLineupBench(bench);
        setLineupExtras(extras);
        setLineupCaptain(captain);
    } else {
        // Si estamos viendo J2, J3... miramos si existe en la BD
        if (raw[key] && Object.keys(raw[key].selected || {}).length > 0) {
            setLineupSelected(raw[key].selected);
            setLineupBench(raw[key].bench || {});
            setLineupExtras(raw[key].extras || {});
            setLineupCaptain(raw[key].captain || null);
        } else {
            // Si no la hemos editado todavía, hereda la base
            setLineupSelected(selected);
            setLineupBench(bench);
            setLineupExtras(extras);
            setLineupCaptain(captain);
        }
    }
}, [lineupViewJornada, allTeams, selected, bench, extras, captain, user]);

const toggleQuiniela = (g: string, t: string) => { if(quinielaLocked) return; const c = quinielaSelections[g]||[]; if(c.includes(t)) setQuinielaSelections({...quinielaSelections,[g]:c.filter(x=>x!==t)}); else if(c.length<2) setQuinielaSelections({...quinielaSelections,[g]:[...c,t]}); };
  
// AÑADE ESTA FUNCIÓN NUEVA:
const handleToggleQuinielaLock = async () => {
    const newLockState = !quinielaLocked;
    setQuinielaLocked(newLockState);
    if (user && user.id) {
        await supabase.from('teams').update({ quiniela: { selections: quinielaSelections, locked: newLockState } }).eq('id', user.id);
    }
};
  const handleSaveName = async () => { if(user && user.id) { await supabase.from('teams').update({ team_name: currentTeamName }).eq('id', user.id); setIsEditingName(false); loadUserData(user); } };

  const handleLineupSwap = (slotId: string, incomingPlayer: any, targetSlotType: 'selected' | 'bench' | 'extras') => {
    const isLineup = view === 'lineups';
    let newSel = { ...(isLineup ? lineupSelected : selected) };
    let newBen = { ...(isLineup ? lineupBench : bench) };
    let newExt = { ...(isLineup ? lineupExtras : extras) };

    let incomingOldKey: string | null = null;
    let incomingOldSection: 'selected' | 'bench' | 'extras' | null = null;
    for (const [k, p] of Object.entries(newSel)) { if ((p as any)?.id === incomingPlayer.id) { incomingOldKey = k; incomingOldSection = 'selected'; break; } }
    if (!incomingOldSection) { for (const [k, p] of Object.entries(newBen)) { if ((p as any)?.id === incomingPlayer.id) { incomingOldKey = k; incomingOldSection = 'bench'; break; } } }
    if (!incomingOldSection) { for (const [k, p] of Object.entries(newExt)) { if ((p as any)?.id === incomingPlayer.id) { incomingOldKey = k; incomingOldSection = 'extras'; break; } } }

    let playerToDisplace = null;
    if (targetSlotType === 'selected') playerToDisplace = newSel[slotId];
    else if (targetSlotType === 'bench') playerToDisplace = newBen[slotId];
    else if (targetSlotType === 'extras') playerToDisplace = newExt[slotId];

    // 1. COLOCAR AL JUGADOR ENTRANTE EN SU POSICIÓN REAL
    if (targetSlotType === 'selected') {
        let properSlotId = slotId;
        if (slotId.split('-')[0] !== incomingPlayer.posicion) {
            const pos = incomingPlayer.posicion;
            const maxSlots = pos === 'POR' ? 1 : pos === 'DEF' || pos === 'MED' ? 5 : 3;
            let foundEmpty = false;
            for (let i = 1; i <= maxSlots; i++) {
                if (!newSel[`${pos}-${i}`]) { properSlotId = `${pos}-${i}`; foundEmpty = true; break; }
            }
            if (!foundEmpty) return alert(`⚠️ No hay hueco libre para colocar a otro ${pos}. Manda a alguien al banquillo primero.`);
            delete newSel[slotId]; // Eliminamos al desplazado de su hueco original
        }
        newSel[properSlotId] = incomingPlayer;
    } else if (targetSlotType === 'bench') newBen[slotId] = incomingPlayer;
    else if (targetSlotType === 'extras') newExt[slotId] = incomingPlayer;

    // 2. REUBICAR AL JUGADOR DESPLAZADO
    if (playerToDisplace && incomingOldKey && incomingOldSection) {
        if (incomingOldSection === 'selected') {
            let properOldSlotId = incomingOldKey;
            if (incomingOldKey.split('-')[0] !== playerToDisplace.posicion) {
                const pos = playerToDisplace.posicion;
                const maxSlots = pos === 'POR' ? 1 : pos === 'DEF' || pos === 'MED' ? 5 : 3;
                let foundEmpty = false;
                for (let i = 1; i <= maxSlots; i++) {
                    if (!newSel[`${pos}-${i}`]) { properOldSlotId = `${pos}-${i}`; foundEmpty = true; break; }
                }
                if (!foundEmpty) return alert(`⚠️ No hay hueco libre en la táctica para reubicar a ${playerToDisplace.nombre} (${pos}).`);
                delete newSel[incomingOldKey];
            }
            newSel[properOldSlotId] = playerToDisplace;
        }
        else if (incomingOldSection === 'bench') newBen[incomingOldKey] = playerToDisplace;
        else if (incomingOldSection === 'extras') newExt[incomingOldKey] = playerToDisplace;
    } else if (incomingOldKey && incomingOldSection) {
        if (incomingOldSection === 'selected') delete newSel[incomingOldKey];
        else if (incomingOldSection === 'bench') delete newBen[incomingOldKey];
        else if (incomingOldSection === 'extras') delete newExt[incomingOldKey];
    }

    setTimeout(() => {
        if (isLineup) { setLineupSelected(newSel); setLineupBench(newBen); setLineupExtras(newExt); }
        else { setSelected(newSel); setBench(newBen); setExtras(newExt); }
    }, 0);
};

  const handleLineupToExtras = () => {
      if (!activeSlot) return;
      if (view !== 'lineups') { const n = {...selected}; delete n[activeSlot.id]; setSelected(n); const b = {...bench}; delete b[activeSlot.id]; setBench(b); const e = {...extras}; delete e[activeSlot.id]; setExtras(e); setActiveSlot(null); return; }
      let playerToMove = null;
      if (activeSlot.type === 'titular') playerToMove = lineupSelected[activeSlot.id]; else if (activeSlot.type === 'bench') playerToMove = lineupBench[activeSlot.id]; else playerToMove = lineupExtras[activeSlot.id];
      if (!playerToMove) return;
      const newKey = `NC-${Date.now()}`; const newExt = { ...lineupExtras, [newKey]: playerToMove }; let newSel = { ...lineupSelected }; let newBen = { ...lineupBench };
      if (activeSlot.type === 'titular') delete newSel[activeSlot.id]; else if (activeSlot.type === 'bench') delete newBen[activeSlot.id];
      setLineupSelected(newSel); setLineupBench(newBen); setLineupExtras(newExt); setActiveSlot(null);
  };

  // --- NUEVA FUNCIÓN: ENVIAR AL BANQUILLO ---
  const handleLineupToBench = () => {
    if (!activeSlot || activeSlot.type === 'bench') return;
    
    const isLineup = view === 'lineups';
    const currSel = isLineup ? lineupSelected : selected;
    const currBen = isLineup ? lineupBench : bench;
    const currExt = isLineup ? lineupExtras : extras;

    let playerToMove = null;
    if (activeSlot.type === 'titular') playerToMove = currSel[activeSlot.id];
    else if (activeSlot.type === 'extras') playerToMove = currExt[activeSlot.id];
    
    if (!playerToMove) return;

    const emptySlot = ["S1", "S2", "S3", "S4", "S5", "S6"].find(id => !currBen[id]);
    if (!emptySlot) return alert("⚠️ El banquillo está lleno. Manda a alguien a la grada primero.");

    let newSel = { ...currSel };
    let newExt = { ...currExt };
    let newBen = { ...currBen, [emptySlot]: playerToMove };

    if (activeSlot.type === 'titular') delete newSel[activeSlot.id];
    else if (activeSlot.type === 'extras') delete newExt[activeSlot.id];

    if (isLineup) {
        setLineupSelected(newSel); setLineupBench(newBen); setLineupExtras(newExt);
    } else {
        setSelected(newSel); setBench(newBen); setExtras(newExt);
    }
    setActiveSlot(null);
};

// Redirigimos el botón antiguo al nuevo motor blindado
const handleValidateSquad = () => { 
    handleSaveSquad(); 
};

  const handleSaveLineup = async () => {
    if(!isValidLineupTactic) return alert("⚠️ Táctica inválida para esta jornada.");
    if(!lineupCaptain) return alert("⚠️ ¡Debes elegir un CAPITÁN para esta jornada!"); 
    
    setIsLineupEditing(false);

    if(user && user.id) {
        // BLINDAJE ABSOLUTO: Descargamos la celda 'squad' directamente de Supabase en tiempo real
        const { data: teamData } = await supabase.from('teams').select('squad').eq('id', user.id).single();
        
        let currentSquad = teamData?.squad || {};
        if (typeof currentSquad === 'string') {
            try { currentSquad = JSON.parse(currentSquad); } catch (e) { currentSquad = {}; }
        }
        
        const key = lineupViewJornada.toLowerCase(); 
        let newSquadData = { ...currentSquad };
        
        // Metemos los datos nuevos sin borrar lo que ya había en la base de datos
        if (key === 'j1') {
            newSquadData.selected = lineupSelected;
            newSquadData.bench = lineupBench;
            newSquadData.extras = lineupExtras;
            newSquadData.captain = lineupCaptain;
        } else {
            newSquadData[key] = { 
                selected: lineupSelected, 
                bench: lineupBench, 
                extras: lineupExtras, 
                captain: lineupCaptain 
            };
        }

        // Enviamos a guardar con total seguridad
        const { error } = await supabase.from('teams').update({ squad: newSquadData }).eq('id', user.id);
        
        if (!error) {
            alert(`✅ Alineación de la ${lineupViewJornada} guardada con éxito.`);
            loadUserData(user);
        } else {
            alert("❌ Error: " + error.message);
        }
    }
};
  
  const handleUnlockSquad = () => { setSquadValidated(false); setStep(4); };
// Reinicio Inteligente (No borra la historia)
const handleResetTeam = async () => { 
    if(confirm(isMarketOpen ? "⚠️ ¿Deshacer fichajes no guardados y volver a la plantilla base?" : "¿Estás seguro? Se borrará todo tu equipo.")) { 
        const myTeam = allTeams.find((t:any) => t.id === user?.id);
        const raw = myTeam?.rawSquad || {};

        if (isMarketOpen && raw.j1_snapshot) {
            // Si estamos en mercado, solo restauramos el snapshot (deshacer fichajes)
            setSelected(raw.j1_snapshot.selected || {}); 
            setBench(raw.j1_snapshot.bench || {}); 
            setExtras(raw.j1_snapshot.extras || {}); 
            setCaptain(raw.j1_snapshot.captain); 
        } else {
            // Si estamos creando equipo desde cero, borramos todo
            setSelected({}); setBench({}); setExtras({}); setCaptain(null); 
            if(user && user.id) { 
                await supabase.from('teams').update({ squad: raw, is_validated: false }).eq('id', user.id); 
            } 
        }
        setSquadValidated(false); 
    } 
};
  
  // Cambia el estado visualmente en la pantalla
  const handleToggleBet = (teamId: string, newValue: boolean) => {
    setAllTeams((prev: any) => prev.map((t: any) => t.id === teamId ? { ...t, hasPaidBet: newValue } : t));
};

// Envía todos los cambios juntos a la Base de Datos
const handleSaveTreasury = async () => {
    let successCount = 0;
    for (const t of allTeams) {
        const { error } = await supabase.from('teams').update({ has_paid_bet: t.hasPaidBet }).eq('id', t.id);
        if (!error) successCount++;
    }
    if (successCount === allTeams.length) {
        alert("✅ ¡Tesorería guardada en la base de datos de forma permanente!");
    } else {
        alert("⚠️ Hubo algún error guardando a ciertos equipos. Revisa tu conexión.");
    }
};




  // --- CEREBRO AUTOMÁTICO DE PASOS ---
  useEffect(() => {
    if (view !== 'squad') return;
    const numTitulares = Object.keys(selected).filter(k => selected[k]).length;
    const numBanquillo = Object.keys(bench).filter(k => bench[k]).length;
    const numExtras = Object.keys(extras).filter(k => extras[k]).length;

    if (numTitulares < 11) setStep(1); // Faltan titulares
    else if (numBanquillo < 6) setStep(2); // Faltan suplentes
    else if (numExtras === 0 && !hasConfirmedNoExtras) setStep(3); // Faltan no convocados o confirmar
    else if (!captain) setStep(4); // Falta el capitán
    else setStep(5); // Listo para validar
}, [selected, bench, extras, hasConfirmedNoExtras, captain, view]);

const getAssistantText = () => {
    if (view === 'squad') { if (isMarketOpen) return "MERCADO ABIERTO. Gestiona tus descartes y fichajes.";
        if (hasTournamentStarted) return "EL TORNEO HA COMENZADO. El mercado de fichajes está cerrado."; 
        if (squadValidated) return "¡PLANTILLA LISTA! Ve a Alineaciones.";
        if (step === 1) return "PASO 1 DE 4: Elige tu 11 titular";
        if (step === 2) return "PASO 2 DE 4: Ficha a tus 6 suplentes";
        if (step === 3) return "PASO 3 DE 4: Ficha no convocados o pulsa el botón rojo";
        if (step === 4) return "PASO 4 DE 4: Selecciona a tu Capitán (Puntúa Doble)";
        return "¡TODO LISTO! Pulsa Guardar Plantilla";
    }
    if (view === 'quiniela') return "Predice los 2 clasificados de cada grupo. ¡Acierta y gana presupuesto!";
    if (view === 'lineups') { 
        if (lineupViewJornada === currentRealMatchday) return `VISUALIZANDO ${lineupViewJornada}: JORNADA FINALIZADA. Sustituciones aplicadas.`; 
        if (Date.now() < new Date(SIMULATED_GAME_START).getTime()) return "El torneo aún no ha comenzado."; 
        if (isJornadaEditable(lineupViewJornada)) { 
            if (!isValidLineupTactic) return `⚠️ TÁCTICA ${currentLineupTactic} INCORRECTA. Revisa tu 11.`; 
            return `EDITANDO ${lineupViewJornada}: Táctica ${currentLineupTactic} correcta. Haz cambios y guarda.`; 
        } 
        return `JORNADA ${lineupViewJornada}: Bloqueada.`; 
    } 
    return "";
};

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const displayCaptain = isLineupEditing ? lineupCaptain : (lineupViewJornada === currentRealMatchday ? captain : lineupCaptain);

  

  const renderPointsBadge = (player: any, isStarter: boolean = true) => {
    if (!player) return null;

    let pts = getPlayerPointsRow(player.nombre, lineupViewJornada);
    const isClosed = GLOBAL_CLOSED_MATCHDAYS[lineupViewJornada] || false;
    
    const isSubbedIn = isClosed && currentViewSubstitutions.subbedInIds.has(player.id);
    const isSubbedOut = isClosed && currentViewSubstitutions.subbedOutIds.has(player.id);

    // 1. SI NO TIENE PUNTOS O NO HA JUGADO
    if (typeof pts !== 'number') {
        if (isStarter && isClosed && isSubbedOut) {
            return (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 z-20">
                    <div className="bg-red-600 rounded-full p-0.5 border border-white shadow-lg z-30">
                        <IconArrowDown size={12} className="text-white" />
                    </div>
                    <div className="text-[10px] font-black px-1.5 py-0.5 rounded-full border shadow-lg bg-red-900 text-red-300 border-red-500 line-through opacity-80">
                        -
                    </div>
                </div>
            );
        }
        return null; 
    }

    // 2. CAPITÁN x2
    const isCap = player.id === displayCaptain;
    if (isCap && (isStarter || isSubbedIn)) {
        pts *= 2;
    }

    // 3. OCULTAR SUPLENTES NO USADOS CUANDO SE CIERRA LA JORNADA
    if (!isStarter && isClosed && !isSubbedIn) return null;

    // 4. MAGIA VISUAL: Solo los del banquillo cuando la jornada está ABIERTA se ven semitransparentes
    const isVirtual = !isStarter && !isClosed; 

    return (
        <div className={`absolute -bottom-2 -right-2 flex items-center gap-1 z-20 transition-opacity ${isVirtual ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
            {!isStarter && isSubbedIn && (
                <div className="bg-[#22c55e] rounded-full p-0.5 border border-white shadow-lg z-30 animate-in zoom-in">
                    <IconArrowUp size={12} className="text-black" />
                </div>
            )}
            <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border shadow-lg ${
                (!isStarter && isSubbedIn) ? 'bg-[#22c55e] text-black border-white ring-2 ring-green-400' : 'bg-[#22c55e] text-black border-white'
            }`}>
                {pts > 0 ? '+' : ''}{pts}
            </div>
        </div>
    );
};


  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-44">
      <MusicPlayer />
      <NavBar view={view} setView={setView} onLogout={() => setShowExitModal(true)} squadCompleted={squadValidated} isAdmin={isAdmin} />
      
      {showExitModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#1c2a45] p-6 rounded-2xl border border-white/10 shadow-2xl max-w-xs w-full text-center">
                  <h3 className="text-xl font-black text-white uppercase italic mb-4">¿SALIR DEL JUEGO?</h3>
                  <div className="grid grid-cols-2 gap-3"><button onClick={confirmLogout} className="bg-red-500 text-white p-3 rounded-xl font-black uppercase hover:bg-red-600">SÍ</button><button onClick={() => setShowExitModal(false)} className="bg-gray-700 text-white p-3 rounded-xl font-black uppercase hover:bg-gray-600">NO</button></div>
              </div>
          </div>
      )}
      
      {['squad', 'lineups', 'quiniela'].includes(view) && (
        <div className="sticky top-[60px] z-[100] bg-[#0d1526]/95 backdrop-blur-md pb-2 shadow-xl border-b border-white/5 px-4 pt-4">
            <div className="flex justify-between items-start bg-[#1c2a45] p-3 rounded-xl border-l-4 border-[#22c55e]">
               <div className="flex-1"><p className="text-[10px] font-black text-[#22c55e]">ASISTENTE VIRTUAL</p><div className="text-xs font-semibold italic min-h-[1.5rem]"><Typewriter text={getAssistantText()} isError={false}/></div><CountdownBlock targetDate={SIMULATED_GAME_START} /></div>
            </div>
            {view === 'squad' && (
                <div className="mt-2 flex gap-2">
                    {(hasTournamentStarted && !isMarketOpen) ? ( <div className="w-full bg-red-900/40 text-red-500 px-3 py-2 rounded-lg font-black text-[10px] uppercase border border-red-500/50 flex items-center justify-center gap-2 shadow-lg"><IconLock size={14}/> MERCADO CERRADO</div>
                    ) : squadValidated ? ( <button onClick={handleUnlockSquad} className="flex-1 bg-[#facc15] text-black p-2 rounded-lg font-black text-[10px] uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"><IconEdit size={14}/> EDITAR PLANTILLA</button>
                    ) : ( <div className="flex gap-2 w-full"><button onClick={handleValidateSquad} className="flex-1 bg-[#22c55e] text-black p-2 rounded-lg font-black text-[10px] uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg animate-pulse-slow"><IconCheck size={14}/> VALIDAR</button><button onClick={handleResetTeam} className="flex-1 bg-red-500/20 text-red-500 border border-red-500/50 p-2 rounded-lg font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"><IconTrash2 size={14}/> REINICIAR</button></div> )}
                </div>
            )} 
        </div>
      )}

      {view === 'rules' && <FixedRulesView />}
      {view === 'calendar' && <CalendarView />}
      {view === 'scores' && <ScoresView teams={allTeams} myTeamId={user.id} isAdmin={isAdmin} />}
      {view === 'classification' && ( <div className="max-w-md mx-auto px-4 mt-20 pb-32"> <div className="mb-8 mt-4"><h3 className="text-[#facc15] font-black uppercase text-lg mb-4 flex gap-2"><IconTrophy/> CLASIFICACIÓN GENERAL</h3>{allTeams.sort((a,b)=>b.points-a.points).map((t,i) => (<TeamCard key={t.id} team={t} rank={i+1} isMyTeam={t.id === user.id} isAdmin={isAdmin} onToggleBet={handleToggleBet} />))}</div><EvolutionChart teams={allTeams} myTeamId={user.id}/> <MatchdayStandings teams={allTeams} /> </div> )}
      {view === 'quiniela' && <QuinielaView selections={quinielaSelections} onToggle={toggleQuiniela} locked={quinielaLocked} onEdit={handleToggleQuinielaLock} canEdit={!hasTournamentStarted} />}
      
      {view === 'admin' && isAdmin && <AdminView onRefresh={loadUserData} allTeams={allTeams} onToggleBet={handleToggleBet} onSaveTreasury={handleSaveTreasury} currentRealMatchday={currentRealMatchday} setCurrentRealMatchday={setCurrentRealMatchday} />}

      {view === 'squad' && (
         <div className="max-w-md mx-auto px-4 mt-36 pb-10"> 
             
             {/* BARRA DE PRESUPUESTO */}
             <div className="bg-[#162136] p-4 rounded-2xl border border-white/10 mb-4 shadow-lg mt-2 relative">
                 {isMarketOpen && (
                     <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg border border-purple-400 animate-pulse">
                         MERCADO ABIERTO
                     </div>
                 )}
                 <div className="flex justify-between items-center text-xs font-black uppercase mb-2">
                     <div className="flex items-center gap-2">
                         <span className="text-white/50">PRESUPUESTO</span>
                         {myExtraBudget > 0 && <span className="bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded text-[8px] animate-pulse">+{myExtraBudget}M PREMIO</span>}
                     </div>
                     <span className={budgetSpent > dynamicMaxBudget ? "text-red-500" : "text-[#22c55e]"}>{budgetSpent}M / {dynamicMaxBudget}M</span>
                 </div>
                 <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
                     <div className={`h-full shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all duration-500 ${budgetSpent > dynamicMaxBudget ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent/dynamicMaxBudget)*100, 100)}%`}}></div>
                 </div>
             </div>

             {/* CONTADOR DE CAMBIOS (SOLO VISIBLE EN MERCADO) */}
             {isMarketOpen && (
                 <div className={`flex justify-between items-center p-3 rounded-xl border mb-4 transition-colors ${marketChangesCount > 7 ? 'bg-red-900/20 border-red-500/50' : 'bg-purple-900/20 border-purple-500/30'}`}>
                     <span className={`text-[10px] font-black uppercase ${marketChangesCount > 7 ? 'text-red-400' : 'text-purple-400'}`}>
                         Fichajes Realizados
                     </span>
                     <span className={`text-lg font-black ${marketChangesCount > 7 ? 'text-red-500 animate-pulse' : 'text-purple-300'}`}>
                         {marketChangesCount} / 7
                     </span>
                 </div>
             )}

             <div className="mb-6 bg-[#1c2a45] p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                 <div className="bg-[#22c55e] p-2 rounded-lg text-black"><IconShield size={20}/></div>
                 <div className="flex-1">
                     <p className="text-[9px] font-bold text-white/40 uppercase mb-1">NOMBRE DE TU EQUIPO</p>
                     {isEditingName ? ( <input type="text" value={currentTeamName} onChange={(e) => setCurrentTeamName(e.target.value)} className="w-full bg-black/20 p-2 rounded text-white font-black uppercase text-sm outline-none border border-white/20" autoFocus /> ) : ( <h2 className="text-lg font-black text-white uppercase italic">{currentTeamName}</h2> )}
                 </div>
                 {isEditingName ? ( <button onClick={handleSaveName} className="bg-[#22c55e] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">VALIDAR</button> ) : ( <button onClick={() => setIsEditingName(true)} className="bg-[#facc15] text-black px-3 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform flex items-center gap-1"><IconEdit size={12}/> EDITAR</button> )}
             </div>

             <div className="text-left font-black italic text-lg text-white/40 tracking-widest uppercase pl-1 mb-2">TÁCTICA: <span className="text-[#22c55e] ml-2 text-xl drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">{Object.keys(selected).length === 11 ? `${Object.keys(selected).filter(k=>k.startsWith("DEF")).length}-${Object.keys(selected).filter(k=>k.startsWith("MED")).length}-${Object.keys(selected).filter(k=>k.startsWith("DEL")).length}` : '--'}</span></div>
             <Field selected={selected} step={step >= 4 ? 2 : 1} canInteractField={!squadValidated && !hasTournamentStarted || isMarketOpen} setActiveSlot={setActiveSlot} captain={captain} setCaptain={setCaptain} advancedTeams={advancedTeams} />
             
             <div className={`mt-8 p-4 rounded-[2.5rem] bg-sky-400/10 transition-all duration-300 ${step === 2 ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border border-white/5 opacity-80'}`}>
                <p className="text-center font-black italic text-[10px] text-sky-400 mb-3 uppercase tracking-widest">BANQUILLO</p>
                <div className="grid grid-cols-3 gap-2">{["S1", "S2", "S3", "S4", "S5", "S6"].map(id => <div key={id} onClick={() => (!squadValidated && (!hasTournamentStarted || isMarketOpen)) && setActiveSlot({id, type:'bench', pos:'TODOS'})} className={`aspect-square bg-white/5 rounded-xl border border-white/10 p-1 ${!squadValidated && (!hasTournamentStarted || isMarketOpen) ? 'cursor-pointer hover:bg-white/10' : ''}`}><BenchCard player={bench[id]} id={id} posColor={posColors[bench[id]?.posicion]} advancedTeams={advancedTeams} /></div>)}</div>
             </div>

             <div className={`mt-6 p-4 rounded-[2.5rem] bg-[#2a3b5a]/30 transition-all duration-300 ${step === 3 ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border border-white/5 opacity-80'}`}>
                 <p className="text-center font-black italic text-[10px] text-white/40 mb-3 uppercase tracking-widest">NO CONVOCADOS</p>
                 <div className="grid grid-cols-3 gap-2 mb-4">{["NC1", "NC2", "NC3"].map(id => <div key={id} onClick={() => (!squadValidated && (!hasTournamentStarted || isMarketOpen)) && setActiveSlot({id, type:'extras', pos:'TODOS'})} className={`aspect-square bg-white/5 rounded-xl border border-white/10 p-1 ${!squadValidated && (!hasTournamentStarted || isMarketOpen) ? 'cursor-pointer hover:bg-white/10' : ''}`}><BenchCard player={extras[id]} id={id} posColor={posColors[extras[id]?.posicion]} advancedTeams={advancedTeams} /></div>)}</div>
                 
                 {(!squadValidated && (!hasTournamentStarted || isMarketOpen)) && Object.keys(extras || {}).length === 0 && (
                     <div className="mt-4">
                         <button onClick={() => setHasConfirmedNoExtras(!hasConfirmedNoExtras)} className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest uppercase border transition-all ${hasConfirmedNoExtras ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-[#1c2a45] text-red-500 border-red-600/30 hover:bg-red-900/20'}`}>
                             {hasConfirmedNoExtras ? '✅ SIN NO CONVOCADOS' : '❌ JUGAR SIN NO CONVOCADOS'}
                         </button>
                         {!hasConfirmedNoExtras && <p className="text-center text-[#facc15] text-[9px] font-bold mt-3 uppercase animate-pulse">⚠️ Ficha un no convocado o pulsa el botón rojo para poder elegir capitán</p>}
                     </div>
                 )}
             </div>

             {/* BANDEJA DE DESCARTADOS (SOLO MERCADO ABIERTO) */}
             {isMarketOpen && discardedPlayers.length > 0 && (
                 <div className={`mt-6 p-4 rounded-[2.5rem] bg-red-900/10 border border-red-500/20 mb-10 shadow-xl`}>
                     <p className="text-center font-black italic text-[10px] text-red-500 mb-3 uppercase tracking-widest">DESCARTADOS (VENDIDOS)</p>
                     <div className="grid grid-cols-4 gap-2 mb-2">
                         {discardedPlayers.map(p => (
                             <div key={p.id} className="aspect-square bg-black/40 rounded-xl border border-red-900/30 p-1 opacity-50 grayscale transition-all hover:opacity-80">
                                 <BenchCard player={p} id="OUT" posColor="bg-gray-800 text-gray-400" />
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* BOTÓN GUARDAR (SOLO SI NO ESTÁ VALIDADO) */}
             {squadValidated ? (
                 <div className="mt-8 mb-8 p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl text-center">
                     <p className="text-[#22c55e] font-black text-sm uppercase flex items-center justify-center gap-2"><IconCheck size={20} /> Plantilla Validada</p>
                     <p className="text-[10px] text-white/50 mt-1 uppercase">Lista para competir</p>
                 </div>
             ) : (
                 <button 
                     disabled={(allSquadPlayers.length < 17) || (allSquadPlayers.length === 17 && !hasConfirmedNoExtras) || !captain || budgetSpent > dynamicMaxBudget || (isMarketOpen && marketChangesCount > 7)}
                     onClick={handleSaveSquad} 
                     className={`mt-8 mb-8 w-full p-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex justify-center items-center gap-2 ${((allSquadPlayers.length < 17) || (allSquadPlayers.length === 17 && !hasConfirmedNoExtras) || !captain || budgetSpent > dynamicMaxBudget || (isMarketOpen && marketChangesCount > 7)) ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-[#22c55e] to-green-600 text-black hover:scale-105 border border-green-400'}`}
                 >
                     <IconCheck size={20} /> 
                     {allSquadPlayers.length < 17 ? `Faltan ${17 - allSquadPlayers.length} Jugadores (Mínimo)` : 
                     (allSquadPlayers.length === 17 && !hasConfirmedNoExtras) ? `Confirma jugar sin Extras (Botón Rojo)` :
                     (!captain) ? '⚠️ ELIGE UN CAPITÁN' :
                     (budgetSpent > dynamicMaxBudget ? 'Presupuesto Excedido' : 
                     ((isMarketOpen && marketChangesCount > 7) ? 'Límite de Fichajes Superado' : 'Guardar Plantilla'))}
                 </button>
             )}
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
                     <button onClick={() => isLineupEditing ? handleSaveLineup() : setIsLineupEditing(true)} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLineupEditing?'bg-[#22c55e] text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105':'bg-[#facc15] text-black shadow-lg'}`}>
        {isLineupEditing ? <><IconCheck/> GUARDAR ALINEACIÓN</> : <><IconEdit/> EDITAR ALINEACIÓN</>}
    </button>
                     <div className={`text-center text-sm font-black uppercase tracking-widest py-1 rounded border ${isValidLineupTactic ? 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10' : 'text-red-500 border-red-500/30 bg-red-500/10 animate-pulse'}`}>
                         TÁCTICA: {currentLineupTactic} {isValidLineupTactic ? '(CORRECTA)' : '(INCORRECTA)'}
                     </div>
                 </div>
             )}

<Field 
                 selected={lineupSelected} 
                 step={(Object.keys(lineupExtras || {}).length > 0 || hasConfirmedNoExtras) ? 3 : 2} 
                 canInteractField={isJornadaEditable(lineupViewJornada) && isLineupEditing} 
                 setActiveSlot={setActiveSlot} 
                 captain={lineupCaptain} 
                 setCaptain={setLineupCaptain} 
                 substitutions={currentViewSubstitutions} 
                 matchday={lineupViewJornada} 
                 renderPointsBadge={renderPointsBadge} 
             />
             
             <div className="mt-8 transition-all duration-300">
                 <div className="p-4 rounded-[2.5rem] bg-[#1c2a45]/50 border border-white/5 mb-4 shadow-xl">
                 <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-3">
                     <p className="text-[9px] text-yellow-400 text-center uppercase font-bold tracking-widest leading-relaxed">
                         ⚠️ Los puntos asignados a los suplentes son virtuales. No serán efectivos si el cambio por un jugador titular no se realiza al cerrar la jornada.
                     </p>
                 </div>
                     <div className="flex justify-between mb-2"><p className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">BANQUILLO</p><div className="flex gap-1">{["TODOS", "POR", "DEF", "MED", "DEL"].map(p=><button key={p} onClick={()=>setBenchFilter(p)} className={`text-[8px] px-2 py-0.5 rounded font-bold ${benchFilter===p?'bg-cyan-400 text-black':'bg-black/30'}`}>{p}</button>)}</div></div>
                     <div className="grid grid-cols-3 gap-2">{["S1", "S2", "S3", "S4", "S5", "S6"].map(id => { 
                         const p = lineupBench[id];
                         if(benchFilter!=="TODOS" && p?.posicion!==benchFilter) return null;
                         
                         const isEditable = isJornadaEditable(lineupViewJornada);
                         const isSubbedIn = p && !isEditable && currentViewSubstitutions.subbedInIds.has(p.id);

                         return (
                             <div key={id} onClick={() => isEditable && isLineupEditing && setActiveSlot({id, type:'bench', pos:'TODOS'})} className={`aspect-square bg-white/5 rounded-xl border p-1 relative transition-colors ${isSubbedIn ? 'border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/10'}`}>
                                 <BenchCard player={p} id={id} posColor={posColors[p?.posicion]} isSubbedIn={isSubbedIn} matchday={lineupViewJornada} />
                                 {p && !isEditable && !isSubbedIn && renderPointsBadge(p, false)}
                             </div>
                         )
                     })}</div>
                 </div>
                 
                 <div className="p-4 rounded-[2.5rem] bg-[#2a3b5a]/30 border border-white/5 mb-10 shadow-xl">
                     <div className="flex justify-between mb-2"><p className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">NO CONVOCADOS</p><div className="flex gap-1">{["TODOS", "POR", "DEF", "MED", "DEL"].map(p=><button key={p} onClick={()=>setExtrasFilter(p)} className={`text-[8px] px-2 py-0.5 rounded font-bold ${extrasFilter===p?'bg-cyan-400 text-black':'bg-black/30'}`}>{p}</button>)}</div></div>
                     <div className="grid grid-cols-3 gap-2">
                         {Object.entries(lineupExtras || {}).map(([key, p]: any) => {
                             if(extrasFilter!=="TODOS" && p?.posicion!==extrasFilter) return null;
                             return (
                                 <div key={key} onClick={() => isJornadaEditable(lineupViewJornada) && isLineupEditing && setActiveSlot({id: key, type:'extras', pos:'TODOS'})} className="aspect-square bg-white/5 rounded-xl border border-white/10 p-1 cursor-pointer hover:bg-white/10 transition-colors">
                                     <BenchCard player={p} id={key} posColor={posColors[p.posicion]} />
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             </div>
         </div>
      )}

      {activeSlot && (
      <SelectionModal 
          isOpen={!!activeSlot} 
          onClose={() => setActiveSlot(null)} 
          players={PLAYERS_DB} 
          activeSlot={activeSlot}
          
          mode={view === 'lineups' ? 'lineup' : 'market'}
          lineupTopology={{ selected: lineupSelected, bench: lineupBench, extras: lineupExtras }}
          
          advancedTeams={advancedTeams}
          allPlayersSelected={[...Object.values(selected || {}), ...Object.values(bench || {}), ...Object.values(extras || {})].filter(Boolean)}
          
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          sortPrice={sortPrice}
          setSortPrice={setSortPrice}
          sortAlpha={sortAlpha}
          setSortAlpha={setSortAlpha}
          selectedIds={[...Object.values(selected || {}), ...Object.values(bench || {}), ...Object.values(extras || {})].map((p: any) => p?.id).filter(Boolean)}
          onSelect={(player: any) => {
              const slotId = typeof activeSlot === 'string' ? activeSlot : activeSlot?.id;
              let slotType = typeof activeSlot === 'string' ? 'selected' : activeSlot?.type;
              if (slotType === 'titular') slotType = 'selected'; 

              if (slotId && String(slotId).includes('-')) {
                  const slotPos = String(slotId).split('-')[0]; 
                  if (player.posicion !== slotPos) {
                      alert(`⚠️ ¡Falta táctica! Estás intentando colocar a un ${player.posicion} en un hueco de ${slotPos}.`);
                      return; 
                  }
              }

              if (slotId) handleLineupSwap(slotId, player, slotType);
              setActiveSlot(null);
          }}
          onRemove={handleLineupToExtras}
          onRemoveToBench={handleLineupToBench}
          isMarketOpen={isMarketOpen}
      />
      )}
    </div>
  );
}
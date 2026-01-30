"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Timer, Check, X, Lock, ArrowUpDown, ArrowDownUp, Trash2, Ban, ArrowRight, Trophy, Edit3, ArrowLeft, Save, Volume2, VolumeX, Users, LogOut, Eye, ChevronDown, ChevronUp, User } from 'lucide-react';
import { PLAYERS_DB } from './players';

// --- CONFIGURACIÓN ADMIN ---
const MASTER_EMAIL = "admin@euro2024.com"; 

// Generador de equipos FIJOS para evitar errores de hidratación
const getMockSquad = (offset: number) => {
  const safePlayers = PLAYERS_DB.length > 0 ? PLAYERS_DB : [];
  if (safePlayers.length === 0) return { titulares: [], banquillo: [], extras: [] };

  const start = offset * 11; 
  return {
    titulares: safePlayers.slice(start, start + 11),
    banquillo: safePlayers.slice(start + 11, start + 17),
    extras: safePlayers.slice(start + 17, start + 20)
  };
};

const MOCK_TEAMS_DB = [
  { id: 101, name: "Los Galácticos", user: "CarlosCR7", points: 120, value: 295, squadIndex: 1 },
  { id: 102, name: "La Furia Roja", user: "Ana_Futbol", points: 115, value: 299, squadIndex: 2 },
  { id: 103, name: "Catenaccio FC", user: "Luigi_99", points: 98, value: 280, squadIndex: 3 },
];

const EURO_GROUPS = [
  { name: "GRUPO A", teams: ["Alemania", "Escocia", "Hungría", "Suiza"] },
  { name: "GRUPO B", teams: ["España", "Croacia", "Italia", "Albania"] },
  { name: "GRUPO C", teams: ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"] },
  { name: "GRUPO D", teams: ["Polonia", "Países Bajos", "Austria", "Francia"] },
  { name: "GRUPO E", teams: ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"] },
  { name: "GRUPO F", teams: ["Turquía", "Georgia", "Portugal", "República Checa"] },
];

// --- AUXILIARES ---
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

const posColors: Record<string, string> = {
  "POR": "bg-[#facc15] text-black",
  "DEF": "bg-[#3b82f6] text-white",
  "MED": "bg-[#10b981] text-white",
  "DEL": "bg-[#ef4444] text-white"
};

const VALID_FORMATIONS = ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"];

const Typewriter = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0; 
    setDisplayedText(""); 
    const startTyping = () => {
      const intervalId = setInterval(() => {
        setDisplayedText((prev) => text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(intervalId);
      }, 15);
      return intervalId;
    };
    const timeoutId = setTimeout(() => {
        const interval = startTyping();
        return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [text, delay]);
  return <span>{displayedText}</span>;
};

const Countdown = ({ onTick }: { onTick?: (timeLeft: number) => void }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const formatTime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}D ${h}H ${m}M ${sec}S`;
  };
  return <span className="text-xl font-black italic uppercase tracking-tighter w-44 inline-block text-[#facc15]">{formatTime(timeLeft)}</span>;
};

const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioRef.current = new Audio("/Banda sonora EF 2024.mp3"); 
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
  }, []);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play().catch(e => console.log("Audio play blocked", e)); }
    setPlaying(!playing);
  };
  return (
    <button onClick={togglePlay} className="p-3 bg-[#1c2a45] rounded-full border border-white/10 hover:bg-white/10 transition-all text-[#22c55e]">
      {playing ? <Volume2 size={20} className="animate-pulse"/> : <VolumeX size={20} className="text-white/50"/>}
    </button>
  );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin }: { onLogin: (email: string, username: string, teamName?: string) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState(""); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return alert("Rellena todos los campos obligatorios");
    onLogin(email, username, isRegister ? teamName : undefined);
  };

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#162136] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#22c55e] to-[#facc15]" />
        <div className="text-center mb-8">
           <Trophy size={48} className="mx-auto text-[#facc15] mb-4 animate-bounce" />
           <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#22c55e] mb-2">
             EUROCOPA<br/><span className="text-white">FANTÁSTICA 2024</span>
           </h1>
           <p className="text-white/50 text-xs uppercase tracking-widest font-bold">
             {isRegister ? "CREA TU EQUIPO Y GANA" : "ACCEDE A TU VESTUARIO"}
           </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">NOMBRE DE USUARIO</label>
             <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e] transition-colors" placeholder="Ej: PepitoGamer" />
          </div>
          
          {isRegister && (
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">NOMBRE DE TU EQUIPO</label>
               <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e] transition-colors" placeholder="Ej: Rayo Vayacaño" />
             </div>
          )}
          
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">CORREO ELECTRÓNICO</label>
             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e] transition-colors" placeholder="tu@email.com" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-[#22c55e] ml-2">CONTRASEÑA</label>
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-[#05080f] border border-white/10 text-white font-bold outline-none focus:border-[#22c55e] transition-colors" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-4 mt-6 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-black italic uppercase rounded-xl transition-all shadow-lg active:scale-95">
            {isRegister ? "CREAR CUENTA" : "ENTRAR AL JUEGO"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsRegister(!isRegister)} className="text-xs text-white/50 hover:text-white font-bold uppercase underline decoration-dashed underline-offset-4 transition-colors">
            {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿Nuevo fichaje? Regístrate aquí"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- TEAM CARD (EXPANDIBLE) ---
const TeamCard = ({ team, rank, isMyTeam }: any) => {
  const [expanded, setExpanded] = useState(false);
  
  // Resolvemos el squad si es un mock
  const squadData = team.squad || getMockSquad(team.squadIndex);

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${isMyTeam ? 'bg-[#1c2a45] border-[#22c55e]' : 'bg-[#1c2a45] border-white/5'}`}>
       {/* CABECERA */}
       <div 
         onClick={() => setExpanded(!expanded)}
         className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors`}
       >
          <div className="flex items-center gap-4">
              <span className={`text-2xl font-black italic w-8 text-center ${rank === 1 ? 'text-[#facc15]' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-700' : 'text-white/30'}`}>#{rank}</span>
              <div>
                  <h3 className={`font-black text-sm uppercase italic ${isMyTeam ? 'text-[#22c55e]' : 'text-white'}`}>{team.name} {isMyTeam && '(TÚ)'}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase font-bold tracking-widest">
                    <User size={10} /> {team.user}
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="text-right">
                  <span className="block font-black text-[#22c55e] text-lg">{team.points} PTS</span>
                  <span className="text-[9px] text-white/30 font-bold uppercase">{team.value}M</span>
              </div>
              {expanded ? <ChevronUp size={20} className="text-white/30"/> : <ChevronDown size={20} className="text-white/30"/>}
          </div>
       </div>

       {/* DETALLE EXPANDIBLE (Cajas separadas por zonas) */}
       {expanded && (
         <div className="border-t border-white/10 bg-[#0d1526] p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            
            {/* CAJA ONCE INICIAL - VERDE */}
            <div className="border border-[#22c55e]/20 rounded-2xl bg-[#2e9d4a]/10 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#22c55e]/30" />
              <p className="text-[9px] font-black uppercase text-[#22c55e] mb-3 tracking-widest text-center">ONCE INICIAL</p>
              <div className="flex flex-wrap justify-center gap-2">
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">
                    {squadData.titulares.filter((p:any) => p.posicion === 'DEL').map((p:any) => <MiniPlayer key={p.id} p={p} />)}
                 </div>
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">
                    {squadData.titulares.filter((p:any) => p.posicion === 'MED').map((p:any) => <MiniPlayer key={p.id} p={p} />)}
                 </div>
                 <div className="w-full flex justify-center gap-2 pb-2 border-b border-white/5">
                    {squadData.titulares.filter((p:any) => p.posicion === 'DEF').map((p:any) => <MiniPlayer key={p.id} p={p} />)}
                 </div>
                 <div className="w-full flex justify-center pt-1">
                    {squadData.titulares.filter((p:any) => p.posicion === 'POR').map((p:any) => <MiniPlayer key={p.id} p={p} />)}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {/* CAJA BANQUILLO - AZUL */}
               <div className="border border-sky-500/20 rounded-2xl bg-sky-900/10 p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/30" />
                  <p className="text-[9px] font-black uppercase text-sky-400 mb-3 tracking-widest text-center">BANQUILLO</p>
                  <div className="grid grid-cols-3 gap-1">
                     {squadData.banquillo.map((p:any) => <MiniPlayer key={p.id} p={p} small />)}
                  </div>
               </div>
               
               {/* CAJA NO CONVOCADOS - GRIS */}
               <div className="border border-white/10 rounded-2xl bg-white/5 p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                  <p className="text-[9px] font-black uppercase text-white/40 mb-3 tracking-widest text-center">NO CONV.</p>
                  <div className="grid grid-cols-3 gap-1">
                     {squadData.extras.length > 0 ? squadData.extras.map((p:any) => <MiniPlayer key={p.id} p={p} small />) : <span className="col-span-3 text-[9px] italic text-white/20 text-center mt-4">N/A</span>}
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
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

// --- APP PRINCIPAL ---
export default function EuroApp() {
  const [user, setUser] = useState<{email: string, username: string, teamName?: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'squad' | 'quiniela' | 'classification'>('squad');
  const [teamName, setTeamName] = useState("");
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  const [captain, setCaptain] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<Record<string, string[]>>({});
  const [quinielaLocked, setQuinielaLocked] = useState(false);
  const [sortValue, setSortValue] = useState<'desc' | 'asc'>('desc');
  const [sortAlpha, setSortAlpha] = useState<'asc' | 'desc'>('asc');
  const [activeSortType, setActiveSortType] = useState<'value' | 'alpha'>('value');

  useEffect(() => {
    const savedUser = localStorage.getItem('euro_user');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAdmin(parsed.email === MASTER_EMAIL);
        if (parsed.teamName) setTeamName(parsed.teamName);
    }
  }, []);

  const handleLogin = (email: string, username: string, tName?: string) => {
    const newUser = { email, username, teamName: tName };
    setUser(newUser);
    setIsAdmin(email === MASTER_EMAIL);
    if (tName) setTeamName(tName);
    localStorage.setItem('euro_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('euro_user');
  };

  useEffect(() => {
    if (isEditing) return;
    if (step === 2 && Object.keys(selected).length === 11) setStep(3);
    if (step === 3 && captain) setStep(4);
    if (step === 4 && Object.keys(bench).length === 6) setStep(5);
  }, [teamName, selected, captain, bench, step, isEditing]);

  const allPlayers = [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)];
  const budgetSpent: number = allPlayers.reduce((acc: number, p: any) => acc + p.precio, 0);
  const isOverBudget = budgetSpent > 300;
  
  const tactic = useMemo(() => {
    const def = Object.keys(selected).filter(k => k.startsWith("DEF")).length;
    const med = Object.keys(selected).filter(k => k.startsWith("MED")).length;
    const del = Object.keys(selected).filter(k => k.startsWith("DEL")).length;
    return `${def}-${med}-${del}`;
  }, [selected]);

  const isValidTactic = useMemo(() => VALID_FORMATIONS.includes(tactic), [tactic]);
  const canSeeAllTeams = isAdmin || isCountdownFinished;

  const handleValidateAndSave = () => {
    if (isOverBudget) { alert("⚠️ El presupuesto excede los 300M. Debes ajustar tu equipo."); return; }
    if (Object.keys(selected).length !== 11) { alert("⚠️ Debes tener 11 jugadores titulares."); return; }
    if (!isValidTactic) { alert(`⚠️ La táctica ${tactic} no es válida.\nEsquemas permitidos:\n${VALID_FORMATIONS.join(", ")}`); return; }
    setIsEditing(false);
    setIsSaved(true); 
    alert("¡Equipo guardado con éxito! Ahora aparecerá en la clasificación.");
  };

  const handleFinishSquad = () => {
      setStep(6);
      setIsSaved(true); 
  }

  const canInteractField = (step >= 2 && step <= 5) || isEditing;
  const canInteractBench = (step >= 4 && step <= 5) || isEditing;
  const canInteractExtras = (step === 5) || isEditing;

  const combinedTeamsList = useMemo(() => {
    let list: any[] = [...MOCK_TEAMS_DB]; 
    if (isSaved && user) {
        const mySquad = {
            titulares: Object.values(selected),
            banquillo: Object.values(bench),
            extras: Object.values(extras)
        };
        const myTeam = { 
            id: 999,
            name: teamName || "Mi Equipo", 
            user: user.username, 
            points: 0, 
            value: budgetSpent,
            squad: mySquad
        };
        if (!list.find(t => t.id === 999)) list.push(myTeam);
    }
    return list.sort((a, b) => b.points - a.points);
  }, [isSaved, user, teamName, selected, bench, extras, budgetSpent]);

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  if (view === 'classification') {
    return (
      <div className="min-h-screen bg-[#05080f] text-white font-sans pb-32">
        <NavBar view={view} setView={setView} onLogout={handleLogout} isAdmin={isAdmin} />
        <div className="max-w-md mx-auto px-4 mt-8">
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-6 flex items-center gap-2"><Users /> CLASIFICACIÓN</h1>
            {!canSeeAllTeams ? (
                <div className="space-y-6">
                    <div className="bg-[#162136] border border-white/10 rounded-[2.5rem] p-8 text-center flex flex-col items-center gap-4 shadow-2xl animate-in fade-in">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-2"><Lock size={40} /></div>
                        <h2 className="text-xl font-black italic uppercase text-white">TOP SECRET</h2>
                        <p className="text-sm text-white/60">Los equipos rivales permanecerán ocultos hasta que comience el torneo.</p>
                        <div className="bg-black/30 p-4 rounded-xl w-full">
                            <p className="text-[10px] uppercase font-black text-[#22c55e] mb-1">TIEMPO PARA DESBLOQUEO</p>
                            <Countdown />
                        </div>
                    </div>
                    
                    {isSaved && (
                        <div>
                            <p className="text-center text-[10px] font-black uppercase text-white/40 mb-2 tracking-widest">TU EQUIPO (VISIBLE SOLO PARA TI)</p>
                            {combinedTeamsList.filter(t => t.id === 999).map((team) => (
                                <TeamCard key={team.id} team={team} rank={"-"} isMyTeam={true} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {isAdmin && (
                        <div className="bg-[#facc15]/20 border border-[#facc15] p-3 rounded-xl mb-6 flex items-center gap-3">
                            <Eye size={20} className="text-[#facc15]" />
                            <p className="text-[10px] font-black uppercase text-[#facc15]">MODO MASTER: Tú puedes ver esto siempre.</p>
                        </div>
                    )}
                    {combinedTeamsList.map((team, idx) => (
                        <TeamCard key={team.id} team={team} rank={idx + 1} isMyTeam={team.id === 999} />
                    ))}
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-44">
      {/* BARRA SUPERIOR (Z-110) */}
      <NavBar view={view} setView={setView} onLogout={handleLogout} isAdmin={isAdmin} />

      {/* HEADER STICKY (Z-100 para tapar el campo) */}
      <div className="sticky top-[60px] z-[100] bg-[#0d1526]/95 backdrop-blur-md pb-2 shadow-xl border-b border-white/5">
        <div className="px-4 pt-4">
          <div className={`p-4 rounded-2xl border-l-4 transition-all duration-500 ${isOverBudget ? 'border-red-600 bg-red-950/20' : 'border-[#22c55e] bg-[#1c2a45]'} shadow-2xl mb-3`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={`text-[10px] font-black italic uppercase mb-1 tracking-widest ${isOverBudget ? 'text-red-500' : 'text-[#22c55e]'}`}>{isOverBudget ? 'ALERTA DE PRESUPUESTO' : 'ASISTENTE VIRTUAL'}</p>
                <div className="text-xs font-semibold italic min-h-[3rem] leading-relaxed pr-2 whitespace-pre-line">
                   {view === 'quiniela' ? (
                        quinielaLocked ? <span className="text-white"><Typewriter text="Recuerda que puedes editar tu plantilla o la Euroquiniela tantas veces como quieras hasta que termine la cuenta atrás."/></span> :
                        <><span className="text-[#22c55e] mr-1">PASO 7 DE 7.</span><Typewriter text="Elige 2 selecciones por grupo." /></>
                   ) : (
                      isOverBudget ? <span className="text-white"><Typewriter text="⚠️ Superas los 300M. Ajusta el presupuesto."/></span> :
                      isEditing ? <span className="text-white"><Typewriter text="MODO EDICIÓN ACTIVADO. Ajusta tu equipo y pulsa GUARDAR cuando termines."/></span> : 
                      quinielaLocked ? <span className="text-white"><Typewriter text="Recuerda que puedes editar tu plantilla o la Euroquiniela tantas veces como quieras hasta que termine la cuenta atrás."/></span> :
                      step === 6 ? <><span className="text-[#22c55e] mr-1">PASO 6 DE 7.</span><Typewriter text="Perfecto, ahora que ya tienes a tu plantilla pasemos a la Euroquiniela, pulsa en el botón verde que acaba de aparecer." /></> :
                      step === 1 ? <div className="flex flex-col"><span className="text-white font-semibold italic mb-1.5"><Typewriter text="Bienvenido a la Eurocopa Fantástica 2024." /></span><div className="flex items-start"><span className="text-[#22c55e] mr-1 min-w-fit">PASO 1 DE 7.</span><span className="text-white"><Typewriter text=" Comienza dándole un nombre a tu equipo." delay={2000} /></span></div></div> :
                      <><span className="text-[#22c55e] mr-1">PASO {step} DE 7.</span><Typewriter text={step === 2 ? "Ahora escoge tu once inicial." : step === 3 ? "Escoge capitán pulsando la C." : step === 4 ? "Escoge banquillo." : step === 5 ? "Escoge no convocados." : "Ve a la Euroquiniela."} /></>
                   )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                 <MusicPlayer />
                 {(step >= 6 && !isEditing && !isOverBudget) && (
                    <button onClick={() => setView(prev => prev === 'squad' ? 'quiniela' : 'squad')} className="bg-[#22c55e] text-black px-5 py-3 rounded-xl flex items-center gap-2 font-black italic text-[11px] uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105">
                      {view === 'squad' ? <>Euroquiniela <ArrowRight size={16}/></> : <><ArrowLeft size={16}/> Mi Plantilla</>}
                    </button>
                 )}
              </div>
            </div>
          </div>

          {/* BOTONES ACCIÓN */}
          {view === 'quiniela' ? (
              <div className="mb-3 mt-2">
                {!quinielaLocked ? (
                  (Object.values(quinielaSelections).reduce((a,c)=>a+c.length,0) === 12) && (
                    <button onClick={() => setQuinielaLocked(true)} className="w-full bg-[#22c55e] text-black p-3 rounded-2xl font-black italic text-lg uppercase shadow-xl animate-bounce">VALIDAR SELECCIÓN</button>
                  )
                ) : <button onClick={() => setQuinielaLocked(false)} className="w-full bg-[#facc15] text-black p-3 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2"><Edit3 size={20}/> EDITAR QUINIELA</button>}
              </div>
          ) : (
              <div className="mb-3 space-y-2">
                {(step >= 6 && !isEditing) && <button onClick={() => setIsEditing(true)} className="w-full bg-[#facc15] text-black p-3 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300"><Edit3 size={20}/> EDITAR PLANTILLA</button>}
                {isEditing && <button onClick={handleValidateAndSave} className="w-full bg-[#22c55e] text-black p-3 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300"><Save size={20}/> GUARDAR CAMBIOS</button>}
              </div>
          )}
          
          {view === 'squad' && (
              <div className="mb-2">
                <div className="flex justify-between uppercase italic font-black text-[10px] mb-1"><span className="text-white/40">PRESUPUESTO</span><span className={isOverBudget ? "text-red-500 animate-pulse" : "text-[#22c55e]"}>{budgetSpent}M / 300M</span></div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5"><div className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent / 300) * 100, 100)}%` }} /></div>
              </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {view === 'quiniela' ? (
           <div className="mt-8 space-y-6 animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter">EUROQUINIELA</h1><Trophy size={32} className="text-[#facc15]" /></div>
                {EURO_GROUPS.map((group) => {
               const currentPicks = quinielaSelections[group.name] || [];
               return (
                 <div key={group.name} className="space-y-2">
                   <h3 className="text-[#22c55e] font-black italic text-sm ml-2">{group.name}</h3>
                   <div className="grid grid-cols-2 gap-3">
                     {group.teams.map((team) => {
                       const isSelected = currentPicks.includes(team);
                       return (
                         <button key={team} disabled={quinielaLocked} onClick={() => { if (quinielaLocked) return; const newPicks = isSelected ? currentPicks.filter(t => t !== team) : currentPicks.length < 2 ? [...currentPicks, team] : currentPicks; setQuinielaSelections({...quinielaSelections, [group.name]: newPicks}); }}
                           className={`p-4 rounded-2xl flex items-center gap-3 transition-all border-2 relative overflow-hidden ${isSelected ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-[#162136] border-white/5 text-white hover:bg-[#1c2a45]'} ${quinielaLocked ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-95'}`}>
                           <span className="text-2xl">{getFlag(team)}</span><span className="font-black italic text-[10px] uppercase">{team}</span>{isSelected && <Check size={18} className="absolute top-2 right-2 text-black stroke-[4]"/>}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               );
             })}
           </div>
        ) : (
           <>
            <div className="mt-4 space-y-3">
                <div className="relative">
                    <input className={`w-full p-5 pr-32 rounded-2xl bg-[#1c2a45] text-left font-black text-xl text-[#22c55e] border-none outline-none shadow-inner transition-all ${step === 1 ? 'ring-4 ring-white' : ''}`} placeholder="NOMBRE EQUIPO" value={teamName} disabled={!isEditing && step > 1} onChange={(e) => setTeamName(e.target.value)} />
                    {step === 1 && teamName.trim().length >= 3 && <button onClick={() => setStep(2)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#22c55e] text-black px-4 py-2.5 rounded-xl flex items-center gap-2 font-black italic text-[10px] uppercase transition-all animate-in zoom-in duration-300 hover:scale-105">CONTINUAR</button>}
                </div>
                <div className="text-left font-black italic text-lg text-white/40 tracking-widest uppercase pl-1">
                    TÁCTICA: <span className={`${isValidTactic ? 'text-[#22c55e]' : 'text-red-500'} ml-2 transition-colors`}>{Object.keys(selected).length === 11 ? tactic : '-- -- --'}</span>
                    {!isValidTactic && Object.keys(selected).length === 11 && <span className="text-red-500 text-[10px] ml-2 font-black italic">(NO VÁLIDA)</span>}
                </div>
            </div>

            <div className={`mt-6 relative w-full aspect-[3/4.2] bg-[#2e9d4a] rounded-[2.5rem] border-[4px] overflow-hidden shadow-2xl transition-all duration-300 ${(canInteractField && step < 6) ? 'border-white scale-[1.02]' : 'border-white/20'}`}>
                <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" /><div className="absolute top-1/2 w-full h-0.5 bg-white/30 -translate-y-1/2" /><div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[16%] border-b-2 border-x-2 border-white/30" /><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[6%] border-b-2 border-x-2 border-white/30" /><div className="absolute top-[16%] left-1/2 -translate-x-1/2 w-[20%] h-[4%] border-b-2 border-white/30 rounded-b-full" /><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-[16%] border-t-2 border-x-2 border-white/30" /><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-[6%] border-t-2 border-x-2 border-white/30" /><div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 w-[20%] h-[4%] border-t-2 border-white/30 rounded-t-full" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-40 font-black text-[9px] italic">
                    <div className="absolute top-[20%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-lg text-white">DEL</div>
                    <div className="absolute top-[45%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-lg text-white">MED</div>
                    <div className="absolute top-[70%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-lg text-white">DEF</div>
                    <div className="absolute top-[90%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-lg text-black">POR</div>
                </div>
                <div className="absolute top-[20%] w-full -translate-y-1/2 flex justify-center gap-6 px-16 z-30">
                    {[1,2,3].map(i => <Slot key={i} active={canInteractField && !selected[`DEL-${i}`]} p={selected[`DEL-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEL-${i}`, type:'titular', pos:'DEL'})} cap={captain === selected[`DEL-${i}`]?.id} setCap={() => setCaptain(selected[`DEL-${i}`].id)} showCap={step >= 3} />)}
                </div>
                <div className="absolute top-[45%] w-full -translate-y-1/2 flex justify-between px-16 z-30">
                    {[1,2,3,4,5].map(i => <Slot key={i} active={canInteractField && !selected[`MED-${i}`]} p={selected[`MED-${i}`]} on={() => canInteractField && setActiveSlot({id: `MED-${i}`, type:'titular', pos:'MED'})} cap={captain === selected[`MED-${i}`]?.id} setCap={() => setCaptain(selected[`MED-${i}`].id)} showCap={step >= 3} />)}
                </div>
                <div className="absolute top-[70%] w-full -translate-y-1/2 flex justify-between px-16 z-30">
                    {[1,2,3,4,5].map(i => <Slot key={i} active={canInteractField && !selected[`DEF-${i}`]} p={selected[`DEF-${i}`]} on={() => canInteractField && setActiveSlot({id: `DEF-${i}`, type:'titular', pos:'DEF'})} cap={captain === selected[`DEF-${i}`]?.id} setCap={() => setCaptain(selected[`DEF-${i}`].id)} showCap={step >= 3} />)}
                </div>
                <div className="absolute top-[90%] w-full -translate-y-1/2 flex justify-center z-30">
                    <Slot active={canInteractField && !selected["POR-1"]} p={selected["POR-1"]} on={() => canInteractField && setActiveSlot({id: "POR-1", type:'titular', pos:'POR'})} cap={captain === selected["POR-1"]?.id} setCap={() => setCaptain(selected["POR-1"].id)} showCap={step >= 3} />
                </div>
            </div>

            <div className={`mt-8 p-4 rounded-[2.5rem] bg-sky-400/10 border-2 transition-all duration-300 ${(canInteractBench && step < 6) ? 'border-white' : 'border-white/5'}`}>
                <p className="text-center font-black italic text-[10px] text-sky-400 mb-3 uppercase tracking-widest">BANQUILLO</p>
                <div className="grid grid-cols-3 gap-3">
                    {["S1", "S2", "S3", "S4", "S5", "S6"].map(id => (
                    <div key={id} onClick={() => canInteractBench && setActiveSlot({id, type:'bench', pos: 'TODOS'})} 
                        className={`aspect-[1.5/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all ${bench[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-4'} ${canInteractBench ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}>
                        {bench[id] ? (<><div className="flex-1 flex items-center justify-center p-2 text-center text-black font-black uppercase text-xs leading-tight">{bench[id].nombre.split(' ').pop()}</div><div className={`w-full py-1 text-center text-[10px] font-black uppercase ${posColors[bench[id].posicion]}`}>{bench[id].posicion}</div></>) : <span className="text-white/50 font-black text-sm italic">{id}</span>}
                    </div>
                    ))}
                </div>
            </div>

            <div className={`mt-6 p-4 rounded-[2.5rem] border-2 bg-[#2a3b5a]/30 transition-all duration-300 ${(canInteractExtras && step < 6) ? 'border-white' : 'border-white/5'}`}>
                <p className="text-center font-black italic text-[10px] text-white/40 mb-3 uppercase tracking-widest">NO CONVOCADOS</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {["NC1", "NC2", "NC3"].map(id => (
                    <div key={id} onClick={() => canInteractExtras && setActiveSlot({id, type:'extras', pos: 'TODOS'})} 
                        className={`aspect-[1.5/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all ${extras[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-4'} ${canInteractExtras ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}>
                        {extras[id] ? (<><div className="flex-1 flex items-center justify-center p-2 text-center text-black font-black uppercase text-xs">{extras[id].nombre.split(' ').pop()}</div><div className={`w-full py-1 text-center text-[10px] font-black uppercase ${posColors[extras[id].posicion]}`}>{extras[id].posicion}</div></>) : <span className="text-white/50 font-black text-sm italic">NC</span>}
                    </div>
                    ))}
                </div>
                {(step === 5 && !isEditing) && (
                    <button onClick={handleFinishSquad} className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-[10px] uppercase border transition-all duration-300 ${Object.keys(extras).length > 0 ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30 hover:bg-[#22c55e] hover:text-black animate-pulse' : 'bg-red-600/20 text-red-500 border-red-500/30'}`}>
                    {Object.keys(extras).length > 0 ? (<><Check size={14}/> CONFIRMAR Y FINALIZAR PLANTILLA</>) : (<><Ban size={14}/> NO QUIERO NO CONVOCADOS</>)}
                    </button>
                )}
            </div>
           </>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
        <div className="bg-[#0d1526]/95 border border-white/10 p-5 rounded-[2.5rem] flex justify-between items-center shadow-2xl backdrop-blur-xl">
          <div><div className="flex items-center gap-2 text-[#22c55e]"><Timer size={22}/><Countdown onTick={(t) => setIsCountdownFinished(t === 0)} /></div><p className="text-[9px] font-black italic text-[#22c55e]/70 uppercase tracking-tight">TIEMPO RESTANTE PARA EDITAR MI EQUIPO</p></div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-lg bg-[#facc15] cursor-pointer"><Lock size={28} /></div>
        </div>
      </div>

      {activeSlot && (
        <SelectionModal activeSlot={activeSlot} onClose={() => setActiveSlot(null)} sortValue={sortValue} setSortValue={setSortValue} sortAlpha={sortAlpha} setSortAlpha={setSortAlpha} activeSortType={activeSortType} setActiveSortType={setActiveSortType}
          onSelect={(p: any) => {
            const isTitular = activeSlot.type === 'titular';
            // AQUI ESTA LA CORRECCION DEL FILTRO (pl: any)
            const currentCount = allPlayers.filter((pl: any) => pl.seleccion === p.seleccion && pl.id !== (selected[activeSlot.id] || bench[activeSlot.id] || extras[activeSlot.id])?.id).length;
            if (currentCount >= 7) { alert(`⚠️ LÍMITE ALCANZADO: No puedes tener más de 7 jugadores de ${p.seleccion}.`); return; }
            const currentTitulares = Object.keys(selected).length;
            if (isTitular && !selected[activeSlot.id] && currentTitulares >= 11) { alert("¡Ya tienes 11 titulares! No puedes añadir más."); return; }
            if (isTitular) setSelected({...selected, [activeSlot.id]: p}); else if (activeSlot.type === 'bench') setBench({...bench, [activeSlot.id]: p}); else if (activeSlot.type === 'extras') setExtras({...extras, [activeSlot.id]: p});
            setActiveSlot(null);
          }}
          onRemove={() => { if (activeSlot.type === 'titular') { const n = {...selected}; delete n[activeSlot.id]; setSelected(n); } else if (activeSlot.type === 'bench') { const n = {...bench}; delete n[activeSlot.id]; setBench(n); } else { const n = {...extras}; delete n[activeSlot.id]; setExtras(n); } setActiveSlot(null); }}
          currentSelection={activeSlot.type === 'titular' ? selected[activeSlot.id] : (activeSlot.type === 'bench' ? bench[activeSlot.id] : extras[activeSlot.id])} selectedIds={allPlayers.map((p: any) => p.id)} allPlayersSelected={allPlayers}
        />
      )}
    </div>
  );
}

// --- NAV BAR (Z-110) ---
function NavBar({ view, setView, onLogout, isAdmin }: any) {
    return (
        <div className="sticky top-0 z-[110] bg-[#0d1526] border-b border-white/10 px-4 py-3 flex justify-between items-center shadow-lg">
            <div className="flex gap-4">
                <button onClick={() => setView('squad')} className={`text-[10px] font-black italic uppercase transition-colors ${view !== 'classification' ? 'text-[#22c55e]' : 'text-white/40 hover:text-white'}`}>MI PLANTILLA</button>
                <button onClick={() => setView('classification')} className={`text-[10px] font-black italic uppercase transition-colors flex items-center gap-1 ${view === 'classification' ? 'text-[#facc15]' : 'text-white/40 hover:text-white'}`}><Users size={12}/> {isAdmin ? 'CLASIFICACIÓN (MASTER)' : 'CLASIFICACIÓN'}</button>
            </div>
            <button onClick={onLogout} className="text-white/30 hover:text-red-500 transition-colors"><LogOut size={16}/></button>
        </div>
    );
}

function Slot({ p, on, cap, setCap, showCap, active }: any) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div onClick={on} className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'} ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer' : (p && on) ? 'cursor-pointer' : 'cursor-default'}`}>
        {p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <Plus size={18} className="text-white/20"/>}
      </div>
      {p && showCap && <button onClick={(e) => { e.stopPropagation(); setCap(); }} className={`w-6 h-6 rounded-full border-2 font-black text-[10px] flex items-center justify-center transition-all z-50 ${cap ? 'bg-[#facc15] text-black border-white scale-110' : 'bg-black/60 text-white/30 border-white/10'}`}>{cap ? <Check size={10} strokeWidth={4}/> : 'C'}</button>}
    </div>
  );
}

// --- MODAL (Z-200) ---
function SelectionModal({ activeSlot, onClose, onSelect, onRemove, selectedIds, sortValue, setSortValue, sortAlpha, setSortAlpha, activeSortType, setActiveSortType, currentSelection, allPlayersSelected }: any) {
  const isTitular = activeSlot.type === 'titular';
  const forcedPos = isTitular ? activeSlot.pos : "TODOS";
  const [filterCountry, setFilterCountry] = useState("TODOS");
  const [filterPos, setFilterPos] = useState(forcedPos);

  const uniqueCountries = useMemo(() => { const countries = new Set(PLAYERS_DB.map(p => p.seleccion)); return ["TODOS", ...Array.from(countries).sort()]; }, []);
  const countryCounts = useMemo(() => { return allPlayersSelected.reduce((acc: any, p: any) => { if (p.id !== currentSelection?.id) { acc[p.seleccion] = (acc[p.seleccion] || 0) + 1; } return acc; }, {}); }, [allPlayersSelected, currentSelection]);
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
      {currentSelection && <button onClick={onRemove} className="mb-6 w-full bg-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-xs uppercase"><Trash2 size={16}/> ELIMINAR JUGADOR</button>}
      <div className="flex gap-2 mb-4">{["POR", "DEF", "MED", "DEL"].map(pos => (<button key={pos} disabled={isTitular} onClick={() => setFilterPos(pos)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${filterPos === pos ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'} ${isTitular && filterPos !== pos ? 'opacity-20' : ''}`}>{pos}</button>))}</div>
      <div className="flex flex-wrap gap-2 mb-6 max-h-44 overflow-y-auto pr-2 custom-scrollbar content-start">{uniqueCountries.map(s => { const count = countryCounts[s] || 0; const isFull = count >= 7; return (<button key={s} onClick={() => setFilterCountry(s)} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[9px] italic whitespace-nowrap transition-all active:scale-95 mb-1 ${filterCountry === s ? 'bg-[#22c55e] text-black shadow-lg shadow-green-500/20' : (isFull ? 'bg-red-900/40 text-red-500 border border-red-500/30' : 'bg-[#162136] text-white/40 hover:bg-[#1c2a45]')}`}>{s !== "TODOS" && <span>{getFlag(s)}</span>} {s} {s !== "TODOS" && <span className={`${isFull ? 'text-red-400' : 'opacity-50'}`}>({count}/7)</span>}</button>); })}</div>
      <div className="grid grid-cols-2 gap-3 mb-6"><button onClick={() => { setSortValue(prev => prev === 'desc' ? 'asc' : 'desc'); setActiveSortType('value'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'value' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}><ArrowUpDown size={14}/> {sortValue === 'desc' ? '€ MAX' : '€ MIN'}</button><button onClick={() => { setSortAlpha(prev => prev === 'asc' ? 'desc' : 'asc'); setActiveSortType('alpha'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'alpha' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}><ArrowDownUp size={14}/> {sortAlpha === 'asc' ? 'A-Z' : 'Z-A'}</button></div>
      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">{filteredPlayers.map(p => (<div key={p.id} onClick={() => onSelect(p)} className="p-4 rounded-2xl flex justify-between items-center border bg-[#162136] border-white/5 active:scale-95 cursor-pointer"><div className="flex items-center gap-3 font-black italic uppercase tracking-tighter"><span className="text-2xl">{getFlag(p.seleccion)}</span><div className="flex flex-col text-left"><span className="text-sm">{p.nombre}</span><span className="text-[8px] text-white/40 tracking-widest">{p.posicion}</span></div></div><div className="text-right"><span className="text-[#22c55e] font-black text-lg block">{p.precio}M</span></div></div>))}</div>
    </div>
  );
}
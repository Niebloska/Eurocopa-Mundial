"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Timer, Globe, Check, LockOpen, X, Lock, ArrowUpDown, ArrowDownUp, Trash2, Ban, ArrowRight, Trophy, Edit3, ArrowLeft, Save } from 'lucide-react';
import { PLAYERS_DB } from './players';

// --- DATOS DE GRUPOS EURO 2024 ---
const EURO_GROUPS = [
  { name: "GRUPO A", teams: ["ALEMANIA", "ESCOCIA", "HUNGRÍA", "SUIZA"] },
  { name: "GRUPO B", teams: ["ESPAÑA", "CROACIA", "ITALIA", "ALBANIA"] },
  { name: "GRUPO C", teams: ["ESLOVENIA", "DINAMARCA", "SERBIA", "INGLATERRA"] },
  { name: "GRUPO D", teams: ["POLONIA", "P. BAJOS", "AUSTRIA", "FRANCIA"] },
  { name: "GRUPO E", teams: ["BÉLGICA", "ESLOVAQUIA", "RUMANÍA", "UCRANIA"] },
  { name: "GRUPO F", teams: ["TURQUÍA", "GEORGIA", "PORTUGAL", "REP. CHECA"] },
];

// --- FUNCIONES AUXILIARES ---
const getFlag = (country: string) => {
  const flags: Record<string, string> = {
    "ESPAÑA": "🇪🇸", "ALEMANIA": "🇩🇪", "FRANCIA": "🇫🇷", "INGLATERRA": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 
    "ESCOCIA": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "TURQUÍA": "🇹🇷", "GEORGIA": "🇬🇪", "PORTUGAL": "🇵🇹", "P. BAJOS": "🇳🇱",
    "ITALIA": "🇮🇹", "ALBANIA": "🇦🇱", "HUNGRÍA": "🇭🇺", "SUIZA": "🇨🇭", "CROACIA": "🇭🇷",
    "ESLOVENIA": "🇸🇮", "DINAMARCA": "🇩🇰", "SERBIA": "🇷🇸", "POLONIA": "🇵🇱", "AUSTRIA": "🇦🇹",
    "BÉLGICA": "🇧🇪", "ESLOVAQUIA": "🇸🇰", "RUMANÍA": "🇷🇴", "UCRANIA": "🇺🇦", "REP. CHECA": "🇨🇿"
  };
  return flags[country] || "🏳️";
};

const posColors: Record<string, string> = {
  "POR": "bg-[#facc15] text-black",
  "DEF": "bg-[#3b82f6] text-white",
  "MED": "bg-[#10b981] text-white",
  "DEL": "bg-[#ef4444] text-white"
};

// Formaciones válidas (Defensas-Medios-Delanteros)
const VALID_FORMATIONS = [
  "3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"
];

const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0; setDisplayedText(""); 
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => text.substring(0, i + 1));
      i++;
      if (i === text.length) clearInterval(intervalId);
    }, 20);
    return () => clearInterval(intervalId);
  }, [text]);
  return <span>{displayedText}</span>;
};

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState(12 * 24 * 60 * 60 + 13 * 3600 + 58 * 60 + 16);
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
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

// --- COMPONENTE PRINCIPAL ---
export default function EuroApp() {
  const [view, setView] = useState<'squad' | 'quiniela'>('squad');
  const [teamName, setTeamName] = useState("");
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  const [captain, setCaptain] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados Quiniela
  const [quinielaSelections, setQuinielaSelections] = useState<Record<string, string[]>>({});
  const [quinielaLocked, setQuinielaLocked] = useState(false);

  // Estados Filtros
  const [sortValue, setSortValue] = useState<'desc' | 'asc'>('desc');
  const [sortAlpha, setSortAlpha] = useState<'asc' | 'desc'>('asc');
  const [activeSortType, setActiveSortType] = useState<'value' | 'alpha'>('value');

  useEffect(() => {
    if (isEditing) return;
    // NOTA: Eliminado el salto automático del paso 1 al 2.
    if (step === 2 && Object.keys(selected).length === 11) setStep(3);
    if (step === 3 && captain) setStep(4);
    if (step === 4 && Object.keys(bench).length === 6) setStep(5);
  }, [teamName, selected, captain, bench, step, isEditing]);

  const allPlayers = [...Object.values(selected), ...Object.values(bench), ...Object.values(extras)];
  const budgetSpent = allPlayers.reduce((acc, p: any) => acc + p.precio, 0);
  const isOverBudget = budgetSpent > 300;
  
  const tactic = useMemo(() => {
    const def = Object.keys(selected).filter(k => k.startsWith("DEF")).length;
    const med = Object.keys(selected).filter(k => k.startsWith("MED")).length;
    const del = Object.keys(selected).filter(k => k.startsWith("DEL")).length;
    return `${def}-${med}-${del}`;
  }, [selected]);

  const isValidTactic = useMemo(() => VALID_FORMATIONS.includes(tactic), [tactic]);

  const handleValidateAndSave = () => {
    if (isOverBudget) {
      alert("⚠️ El presupuesto excede los 300M. Debes ajustar tu equipo.");
      return;
    }
    if (Object.keys(selected).length !== 11) {
      alert("⚠️ Debes tener 11 jugadores titulares.");
      return;
    }
    if (!isValidTactic) {
      alert(`⚠️ La táctica ${tactic} no es válida.\nEsquemas permitidos:\n${VALID_FORMATIONS.join(", ")}`);
      return;
    }
    setIsEditing(false); 
  };

  // --- TEXTOS ASISTENTE CORREGIDOS ---
  const messages: any = {
    1: "PASO 1 DE 7. Comienza dándole un nombre a tu equipo.",
    2: "PASO 2 DE 7. Ahora escoge tu once inicial en el terreno de juego.",
    3: "PASO 3 DE 7. Escoge un capitán, pulsa sobre la “C” sobre cualquier jugador de tu alineación.",
    4: "PASO 4 DE 7. Es hora de escoger a tus suplentes. Recuerda que reemplazarán automáticamente a tus titulares.",
    5: "PASO 5 DE 7. Por último escoge a los no convocados, recuerda que puedes elegir entre 0 y 3 jugadores.",
    6: "PASO 6 DE 7. Perfecto, ahora que ya tienes a tu plantilla pasemos a la Euroquiniela."
  };

  // --- VISTA: EUROQUINIELA ---
  if (view === 'quiniela') {
    const totalSelected = Object.values(quinielaSelections).reduce((acc, curr) => acc + curr.length, 0);
    const isComplete = totalSelected === 12;
    const finalText = "Bien hecho, has completado todos los pasos, ya estás listo para participar. Recuerda que puedes editar lo que quieras hasta que el contador llegue a cero. ¡MUCHA SUERTE!";

    return (
      <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-32">
        <div className="sticky top-0 z-50 p-4 bg-[#05080f]/95 backdrop-blur-md">
           <div className={`p-4 rounded-2xl border-l-4 transition-colors ${quinielaLocked ? 'border-[#facc15] bg-[#1c2a45]' : 'border-[#22c55e] bg-[#1c2a45]'} shadow-2xl`}>
             <div className="flex justify-between items-start">
               <div className="flex-1">
                 <p className={`text-[10px] font-black italic uppercase mb-1 tracking-widest ${quinielaLocked ? 'text-[#facc15]' : 'text-[#22c55e]'}`}>
                   {quinielaLocked ? '¡COMPLETADO!' : 'ASISTENTE VIRTUAL'}
                 </p>
                 <p className="text-xs font-semibold italic min-h-[1.5rem] leading-relaxed">
                    <Typewriter text={quinielaLocked ? finalText : "PASO 7 DE 7. Te explico como funciona: debes elegir a las 2 selecciones de cada grupo que pasarán a la siguiente fase."} />
                 </p>
               </div>
               <button 
                  onClick={() => setView('squad')}
                  className="ml-2 bg-[#162136] text-white/70 hover:text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-[9px] uppercase border border-white/10 transition-all active:scale-95"
               >
                 <ArrowLeft size={12}/> VOLVER A MI PLANTILLA
               </button>
             </div>
           </div>
        </div>

        <div className="max-w-md mx-auto px-4 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-6 mt-4">
             <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter">EUROQUINIELA</h1>
             <Trophy size={32} className="text-[#facc15]" />
          </div>

          <div className="space-y-6">
             {EURO_GROUPS.map((group) => {
               const currentPicks = quinielaSelections[group.name] || [];
               return (
                 <div key={group.name} className="space-y-2">
                   <h3 className="text-[#22c55e] font-black italic text-sm ml-2">{group.name}</h3>
                   <div className="grid grid-cols-2 gap-3">
                     {group.teams.map((team) => {
                       const isSelected = currentPicks.includes(team);
                       return (
                         <button
                           key={team}
                           disabled={quinielaLocked}
                           onClick={() => {
                             if (quinielaLocked) return;
                             const newPicks = isSelected 
                               ? currentPicks.filter(t => t !== team)
                               : currentPicks.length < 2 ? [...currentPicks, team] : currentPicks;
                             setQuinielaSelections({...quinielaSelections, [group.name]: newPicks});
                           }}
                           className={`p-4 rounded-2xl flex items-center gap-3 transition-all border-2 relative overflow-hidden
                             ${isSelected 
                               ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                               : 'bg-[#162136] border-white/5 text-white hover:bg-[#1c2a45]'
                             } ${quinielaLocked ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-95'}`}
                         >
                           <span className="text-2xl">{getFlag(team)}</span>
                           <span className="font-black italic text-[10px] uppercase">{team}</span>
                           {isSelected && <Check size={18} className="absolute top-2 right-2 text-black stroke-[4]"/>}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               );
             })}
          </div>

          <div className="mt-8 mb-20 space-y-3">
            {!quinielaLocked ? (
              isComplete && (
                <button 
                  onClick={() => setQuinielaLocked(true)}
                  className="w-full bg-[#22c55e] text-black p-4 rounded-2xl font-black italic text-lg uppercase shadow-xl animate-bounce"
                >
                  VALIDAR SELECCIÓN
                </button>
              )
            ) : (
              <button 
                onClick={() => setQuinielaLocked(false)}
                className="w-full bg-[#facc15] text-black p-4 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2"
              >
                <Edit3 size={20}/> EDITAR QUINIELA
              </button>
            )}
          </div>
        </div>
        
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <div className="bg-[#0d1526]/95 border border-white/10 p-5 rounded-[2.5rem] flex justify-between items-center shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 text-[#22c55e]"><Timer size={22}/><Countdown /></div>
              <p className="text-[9px] font-black italic text-[#22c55e]/70 uppercase tracking-tight">TIEMPO RESTANTE</p>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-lg bg-[#facc15] cursor-pointer">
               <Lock size={28} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA: SQUAD (CREACIÓN DE EQUIPO) ---
  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans antialiased pb-44">
      
      {/* HEADER FIJO (STICKY) */}
      <div className="sticky top-0 z-50 bg-[#05080f]/95 backdrop-blur-md pb-2 shadow-xl border-b border-white/5">
        <div className="px-4 pt-4">
          <div className={`p-4 rounded-2xl border-l-4 transition-all duration-500 ${isOverBudget ? 'border-red-600 bg-red-950/20' : 'border-[#22c55e] bg-[#1c2a45]'} shadow-2xl mb-3`}>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className={`text-[10px] font-black italic uppercase mb-1 tracking-widest ${isOverBudget ? 'text-red-500' : 'text-[#22c55e]'}`}>
                  {isOverBudget ? 'ALERTA DE PRESUPUESTO' : 'ASISTENTE VIRTUAL'}
                </p>
                <div className="text-xs font-semibold italic min-h-[2.5rem] leading-relaxed pr-2">
                  <Typewriter text={isOverBudget ? "⚠️ Superas los 300M. Ajusta el presupuesto." : (isEditing ? "MODO EDICIÓN ACTIVADO. Ajusta tu equipo y pulsa GUARDAR cuando termines." : messages[step])} />
                </div>
              </div>
              
              {/* BOTÓN CONTINUAR (Ahora aparece en Paso 1 también) */}
              {((step === 1 && teamName.trim().length >= 3) || (step >= 6 && !isEditing && !isOverBudget)) && (
                <button 
                  onClick={() => step === 1 ? setStep(2) : setView('quiniela')}
                  className="bg-[#22c55e] text-black px-5 py-3 rounded-xl flex items-center gap-2 font-black italic text-[11px] uppercase transition-all animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  {step === 1 ? 'Continuar' : 'Euroquiniela'} <ArrowRight size={16}/>
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between uppercase italic font-black text-[10px] mb-1">
              <span className="text-white/40">PRESUPUESTO</span>
              <span className={isOverBudget ? "text-red-500 animate-pulse" : "text-[#22c55e]"}>{budgetSpent}M / 300M</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${Math.min((budgetSpent / 300) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* NOMBRE Y TÁCTICA */}
        <div className="mt-4 space-y-3">
          <input 
            className={`w-full p-5 rounded-2xl bg-[#1c2a45] text-left font-black text-xl text-[#22c55e] border-none outline-none shadow-inner transition-all ${step === 1 ? 'ring-4 ring-white' : ''}`} 
            placeholder="NOMBRE EQUIPO" 
            value={teamName} 
            disabled={!isEditing && step > 1}
            onChange={(e) => setTeamName(e.target.value)} 
          />
          <div className="text-left font-black italic text-lg text-white/40 tracking-widest uppercase pl-1">
            TÁCTICA: <span className={`${isValidTactic ? 'text-[#22c55e]' : 'text-red-500'} ml-2 transition-colors`}>
              {Object.keys(selected).length === 11 ? tactic : '-- -- --'}
            </span>
            {!isValidTactic && Object.keys(selected).length === 11 && (
               <span className="text-red-500 text-[10px] ml-2 font-black italic">(NO VÁLIDA)</span>
            )}
          </div>
        </div>

        {/* CAMPO DE JUEGO */}
        <div className={`mt-6 relative w-full aspect-[3/4.2] bg-[#2e9d4a] rounded-[2.5rem] border-[4px] overflow-hidden shadow-2xl transition-all duration-300 ${(step === 2 || step === 3 || isEditing) ? 'border-white scale-[1.02]' : 'border-white/20'}`}>
          {/* ... Geometría del campo igual ... */}
          <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute top-1/2 w-full h-0.5 bg-white/30 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[15%] border-b-2 border-x-2 border-white/30" /> 
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-20 h-6 border-b-2 border-white/30 rounded-b-full border-t-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-[15%] border-t-2 border-x-2 border-white/30" />
            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-20 h-6 border-t-2 border-white/30 rounded-t-full border-b-0" />
          </div>

          <div className="absolute inset-0 pointer-events-none z-40 font-black text-[9px] italic">
             <div className="absolute top-[20%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-lg text-white">DEL</div>
             <div className="absolute top-[45%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-lg text-white">MED</div>
             <div className="absolute top-[70%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-lg text-white">DEF</div>
             <div className="absolute top-[90%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-lg text-black">POR</div>
          </div>

          <div className="absolute top-[20%] w-full -translate-y-1/2 flex justify-center gap-6 px-16 z-30">
             {[1,2,3].map(i => <Slot key={i} active={(step===2 || isEditing) && !selected[`DEL-${i}`]} p={selected[`DEL-${i}`]} on={() => (step === 2 || step === 3 || isEditing) && setActiveSlot({id: `DEL-${i}`, type:'titular', pos:'DEL'})} cap={captain === selected[`DEL-${i}`]?.id} setCap={() => setCaptain(selected[`DEL-${i}`].id)} showCap={step >= 3} />)}
          </div>
          <div className="absolute top-[45%] w-full -translate-y-1/2 flex justify-between px-16 z-30">
             {[1,2,3,4,5].map(i => <Slot key={i} active={(step===2 || isEditing) && !selected[`MED-${i}`]} p={selected[`MED-${i}`]} on={() => (step === 2 || step === 3 || isEditing) && setActiveSlot({id: `MED-${i}`, type:'titular', pos:'MED'})} cap={captain === selected[`MED-${i}`]?.id} setCap={() => setCaptain(selected[`MED-${i}`].id)} showCap={step >= 3} />)}
          </div>
          <div className="absolute top-[70%] w-full -translate-y-1/2 flex justify-between px-16 z-30">
             {[1,2,3,4,5].map(i => <Slot key={i} active={(step===2 || isEditing) && !selected[`DEF-${i}`]} p={selected[`DEF-${i}`]} on={() => (step === 2 || step === 3 || isEditing) && setActiveSlot({id: `DEF-${i}`, type:'titular', pos:'DEF'})} cap={captain === selected[`DEF-${i}`]?.id} setCap={() => setCaptain(selected[`DEF-${i}`].id)} showCap={step >= 3} />)}
          </div>
          <div className="absolute top-[90%] w-full -translate-y-1/2 flex justify-center z-30">
             <Slot active={(step===2 || isEditing) && !selected["POR-1"]} p={selected["POR-1"]} on={() => (step === 2 || step === 3 || isEditing) && setActiveSlot({id: "POR-1", type:'titular', pos:'POR'})} cap={captain === selected["POR-1"]?.id} setCap={() => setCaptain(selected["POR-1"].id)} showCap={step >= 3} />
          </div>
        </div>

        <div className={`mt-8 p-4 rounded-[2.5rem] bg-sky-400/10 border-2 transition-all duration-300 ${(step === 4 || isEditing) ? 'border-white' : 'border-white/5'}`}>
          <p className="text-center font-black italic text-[10px] text-sky-400 mb-3 uppercase tracking-widest">BANQUILLO</p>
          <div className="grid grid-cols-3 gap-3">
             {["S1", "S2", "S3", "S4", "S5", "S6"].map(id => (
               <div key={id} onClick={() => (step === 4 || isEditing) && setActiveSlot({id, type:'bench', pos: 'TODOS'})} 
                 className={`aspect-[1.5/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all cursor-pointer
                 ${bench[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-4'}`}>
                 {bench[id] ? (
                   <>
                    <div className="flex-1 flex items-center justify-center p-2 text-center text-black font-black uppercase text-[10px] italic leading-tight">{bench[id].nombre.split(' ').pop()}</div>
                    <div className={`w-full py-1 text-center text-[10px] font-black uppercase ${posColors[bench[id].posicion]}`}>{bench[id].posicion}</div>
                   </>
                 ) : <span className="text-white/10 font-black text-xs">{id}</span>}
               </div>
             ))}
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-[2.5rem] border-2 bg-[#2a3b5a]/30 transition-all duration-300 ${(step === 5 || isEditing) ? 'border-white' : 'border-white/5'}`}>
          <p className="text-center font-black italic text-[10px] text-white/40 mb-3 uppercase tracking-widest">NO CONVOCADOS</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
             {["NC1", "NC2", "NC3"].map(id => (
               <div key={id} onClick={() => (step === 5 || isEditing) && setActiveSlot({id, type:'extras', pos: 'TODOS'})} 
                 className={`aspect-[1.5/1] rounded-2xl flex flex-col items-center justify-between border-2 overflow-hidden transition-all cursor-pointer
                 ${extras[id] ? 'bg-white border-white' : 'bg-[#1c2a45]/50 border-white/5 p-4'}`}>
                 {extras[id] ? (
                   <>
                    <div className="flex-1 flex items-center justify-center p-2 text-center text-black font-black uppercase text-[10px] italic">{extras[id].nombre.split(' ').pop()}</div>
                    <div className={`w-full py-1 text-center text-[10px] font-black uppercase ${posColors[extras[id].posicion]}`}>{extras[id].posicion}</div>
                   </>
                 ) : <span className="text-white/10 font-black text-xs">NC</span>}
               </div>
             ))}
          </div>
          {(step === 5 && !isEditing) && (
            <button onClick={() => setStep(6)} className="w-full bg-red-600/20 text-red-500 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-[10px] uppercase border border-red-500/30">
              <Ban size={14}/> NO QUIERO NO CONVOCADOS
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30 space-y-3">
        {(step >= 6 && !isEditing && !isOverBudget) && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-[#facc15] text-black p-4 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2"
            >
              <Edit3 size={24}/> EDITAR PLANTILLA
            </button>
        )}
        
        {isEditing && (
          <button 
            onClick={handleValidateAndSave}
            className="w-full bg-[#22c55e] text-black p-4 rounded-2xl font-black italic text-lg uppercase shadow-xl flex items-center justify-center gap-2"
          >
            <Save size={24}/> GUARDAR CAMBIOS
          </button>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
        <div className="bg-[#0d1526]/95 border border-white/10 p-5 rounded-[2.5rem] flex justify-between items-center shadow-2xl backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-[#22c55e]"><Timer size={22}/><Countdown /></div>
            <p className="text-[9px] font-black italic text-[#22c55e]/70 uppercase tracking-tight">TIEMPO RESTANTE PARA EDITAR MI EQUIPO</p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-lg bg-[#facc15] cursor-pointer">
             <Lock size={28} />
          </div>
        </div>
      </div>

      {activeSlot && (
        <SelectionModal 
          activeSlot={activeSlot} 
          onClose={() => setActiveSlot(null)}
          sortValue={sortValue} setSortValue={setSortValue}
          sortAlpha={sortAlpha} setSortAlpha={setSortAlpha}
          activeSortType={activeSortType} setActiveSortType={setActiveSortType}
          onSelect={(p: any) => {
            const isTitular = activeSlot.type === 'titular';
            const currentTitulares = Object.keys(selected).length;
            const isEmptySlot = !selected[activeSlot.id];
            
            if (isTitular && isEmptySlot && currentTitulares >= 11) {
              alert("¡Ya tienes 11 titulares! No puedes añadir más. Elimina uno primero o reemplaza.");
              return;
            }

            if (isTitular) setSelected({...selected, [activeSlot.id]: p});
            else if (activeSlot.type === 'bench') setBench({...bench, [activeSlot.id]: p});
            else if (activeSlot.type === 'extras') setExtras({...extras, [activeSlot.id]: p});
            setActiveSlot(null);
          }}
          onRemove={() => {
            if (activeSlot.type === 'titular') { const n = {...selected}; delete n[activeSlot.id]; setSelected(n); }
            else if (activeSlot.type === 'bench') { const n = {...bench}; delete n[activeSlot.id]; setBench(n); }
            else { const n = {...extras}; delete n[activeSlot.id]; setExtras(n); }
            setActiveSlot(null);
          }}
          currentSelection={activeSlot.type === 'titular' ? selected[activeSlot.id] : (activeSlot.type === 'bench' ? bench[activeSlot.id] : extras[activeSlot.id])}
          selectedIds={allPlayers.map((p: any) => p.id)}
          allPlayersSelected={allPlayers}
        />
      )}
    </div>
  );
}

// ... SUBCOMPONENTES Slot y SelectionModal se mantienen igual ...
function Slot({ p, on, cap, setCap, showCap, active }: any) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div 
        onClick={on} 
        className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all cursor-pointer relative z-30 
        ${p ? 'bg-white border-[#22c55e]' : 'bg-black/40 border-white/20'}
        ${active ? 'animate-pulse ring-4 ring-white/50 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
      >
        {p ? <span className="text-[9px] font-black text-black text-center leading-none uppercase italic">{p.nombre.split(' ').pop()}</span> : <Plus size={18} className="text-white/20"/>}
      </div>
      {p && showCap && (
        <button onClick={(e) => { e.stopPropagation(); setCap(); }} className={`w-6 h-6 rounded-full border-2 font-black text-[10px] flex items-center justify-center transition-all z-50 ${cap ? 'bg-[#facc15] text-black border-white scale-110' : 'bg-black/60 text-white/30 border-white/10'}`}>
          {cap ? <Check size={10} strokeWidth={4}/> : 'C'}
        </button>
      )}
    </div>
  );
}

function SelectionModal({ activeSlot, onClose, onSelect, onRemove, selectedIds, sortValue, setSortValue, sortAlpha, setSortAlpha, activeSortType, setActiveSortType, currentSelection, allPlayersSelected }: any) {
  const isTitular = activeSlot.type === 'titular';
  const forcedPos = isTitular ? activeSlot.pos : "TODOS";
  
  const [filterCountry, setFilterCountry] = useState("TODOS");
  const [filterPos, setFilterPos] = useState(forcedPos);

  const filteredPlayers = useMemo(() => {
    let result = PLAYERS_DB.filter(p => !selectedIds.includes(p.id));
    if (filterCountry !== "TODOS") result = result.filter(p => p.seleccion === filterCountry);
    if (filterPos !== "TODOS") result = result.filter(p => p.posicion === filterPos);
    
    result.sort((a, b) => {
      if (activeSortType === 'value') return sortValue === 'desc' ? b.precio - a.precio : a.precio - b.precio;
      return sortAlpha === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
    });
    return result;
  }, [selectedIds, filterCountry, filterPos, sortValue, sortAlpha, activeSortType]);

  const countryCounts = allPlayersSelected.reduce((acc: any, p: any) => {
    acc[p.seleccion] = (acc[p.seleccion] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] bg-[#05080f] p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">ELEGIR JUGADOR</h2>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-full"><X/></button>
      </div>
      
      {currentSelection && (
        <button onClick={onRemove} className="mb-6 w-full bg-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-xs uppercase">
          <Trash2 size={16}/> ELIMINAR JUGADOR
        </button>
      )}

      {/* FILTROS */}
      <div className="flex gap-2 mb-4">
        {["POR", "DEF", "MED", "DEL"].map(pos => (
          <button key={pos} disabled={isTitular} onClick={() => setFilterPos(pos)} 
            className={`flex-1 py-2.5 rounded-xl font-black text-[10px] border-2 transition-all 
            ${filterPos === pos ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'}
            ${isTitular && filterPos !== pos ? 'opacity-20' : ''}`}>
            {pos}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setFilterCountry("TODOS")} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] italic whitespace-nowrap ${filterCountry === "TODOS" ? 'bg-[#22c55e] text-black' : 'bg-[#162136] text-white/40'}`}>
          TODOS
        </button>
        {["ESPAÑA", "ALEMANIA", "FRANCIA", "ESCOCIA", "TURQUÍA"].map(s => (
          <button key={s} onClick={() => setFilterCountry(s)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] italic whitespace-nowrap ${filterCountry === s ? 'bg-[#22c55e] text-black' : 'bg-[#162136] text-white/40'}`}>
             <span>{getFlag(s)}</span> {s} ({countryCounts[s] || 0}/7)
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => { setSortValue(prev => prev === 'desc' ? 'asc' : 'desc'); setActiveSortType('value'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'value' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}>
          <ArrowUpDown size={14}/> {sortValue === 'desc' ? '€ MAX' : '€ MIN'}
        </button>
        <button onClick={() => { setSortAlpha(prev => prev === 'asc' ? 'desc' : 'asc'); setActiveSortType('alpha'); }} className={`border border-white/10 p-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] italic uppercase ${activeSortType === 'alpha' ? 'bg-[#162136] text-[#22c55e] border-[#22c55e]/50' : 'text-white/30'}`}>
          <ArrowDownUp size={14}/> {sortAlpha === 'asc' ? 'A-Z' : 'Z-A'}
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto">
        {filteredPlayers.map(p => (
          <div key={p.id} onClick={() => onSelect(p)} className="p-4 rounded-2xl flex justify-between items-center border bg-[#162136] border-white/5 active:scale-95 cursor-pointer">
            <div className="flex items-center gap-3 font-black italic uppercase tracking-tighter">
              <span className="text-2xl">{getFlag(p.seleccion)}</span>
              <div className="flex flex-col text-left">
                <span className="text-sm">{p.nombre}</span>
                <span className="text-[8px] text-white/40 tracking-widest">{p.posicion}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[#22c55e] font-black text-lg block">{p.precio}M</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
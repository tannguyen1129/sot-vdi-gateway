"use client";

import { useEffect, useState, useMemo } from "react";
import api from "./../../../utils/axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// --- INTERFACES ---
interface LiveStudent {
  student: {
    id: number;
    fullName: string;
    username: string;
    className: string;
  };
  vm: {
    ip: string;
    username: string;
    port: number;
  } | null;
  client: {
    ip: string;
    lastAction: string;
    lastSeen: string;
  };
  isViolation: boolean;
}

interface ExamLog {
  id: number;
  action: string;
  details: string;
  clientIp: string;
  createdAt: string;
  user: { fullName: string; username: string; };
}

export default function ExamMonitorDetailPage() {
  const params = useParams();
  const examId = (params as any)?.examId;

  // States
  const [liveData, setLiveData] = useState<LiveStudent[]>([]);
  const [logs, setLogs] = useState<ExamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!examId) return;
    try {
      const [resLive, resLogs] = await Promise.all([
        api.get(`/monitoring/${examId}/live`),
        api.get(`/monitoring/${examId}/logs`)
      ]);
      setLiveData(resLive.data);
      setLogs(resLogs.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Monitoring Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (autoRefresh) fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [examId, autoRefresh]);

  // --- HELPER: STATUS STYLES (Cyberpunk / Tech Style) ---
  const getCardStyle = (st: LiveStudent) => {
    if (st.isViolation) return "border-red-500 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.5)]"; 
    if (!st.vm) return "border-slate-700 bg-slate-800/50 opacity-60 grayscale";
    if (st.client.lastAction === 'LEAVE' || st.client.lastAction === 'DISCONNECT') return "border-amber-500 bg-amber-950/30 border-dashed";
    return "border-emerald-500/50 bg-slate-800 hover:border-emerald-400 hover:bg-slate-750 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]";
  };

  const getStatusBadge = (st: LiveStudent) => {
     if (st.isViolation) return <span className="text-red-500 font-bold animate-pulse">⚠️ VIOLATION</span>;
     if (!st.vm) return <span className="text-slate-500 font-mono">WAITING...</span>;
     if (st.client.lastAction === 'LEAVE') return <span className="text-amber-500 font-bold">⚠️ OFFLINE</span>;
     return <span className="text-emerald-400 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> LIVE</span>;
  };

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
     return {
        total: liveData.length,
        online: liveData.filter(s => s.vm && s.client.lastAction !== 'LEAVE').length,
        violation: liveData.filter(s => s.isViolation).length,
        submitted: liveData.filter(s => s.client.lastAction === 'SUBMIT').length
     };
  }, [liveData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans selection:bg-emerald-500/30">
      
      {/* --- HUD HEADER --- */}
      <header className="mb-6 border-b border-slate-800 pb-6 sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Title Block */}
            <div>
               <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  <Link href="/admin/monitor" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     Admin Center
                  </Link>
                  <span className="text-slate-700">/</span>
                  <span>Exam Monitor</span>
                  <span className="text-slate-700">/</span>
                  <span className="text-emerald-500">Live Feed</span>
               </div>
               <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  MONITOR <span className="text-emerald-500">#{examId}</span>
                  {autoRefresh && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span></span>}
               </h1>
            </div>

            {/* Quick Stats Widget */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
               <div className="px-4 py-2 text-center border-r border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Online</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">{stats.online}/{stats.total}</div>
               </div>
               <div className="px-4 py-2 text-center border-r border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Violations</div>
                  <div className={`text-xl font-mono font-bold ${stats.violation > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>{stats.violation}</div>
               </div>
               <div className="px-4 py-2 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Submitted</div>
                  <div className="text-xl font-mono font-bold text-blue-400">{stats.submitted}</div>
               </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
               <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button onClick={() => setViewMode('GRID')} className={`p-2 rounded transition-all ${viewMode==='GRID' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button onClick={() => setViewMode('LIST')} className={`p-2 rounded transition-all ${viewMode==='LIST' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
               </div>
               
               <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all flex items-center gap-2 ${autoRefresh ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
               >
                  {autoRefresh ? 'AUTO SYNC: ON' : 'AUTO SYNC: PAUSED'}
               </button>
            </div>
         </div>
      </header>

      {/* --- MAIN MONITOR AREA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
         
         {/* LEFT: LIVE GRID (Chiếm 3/4) */}
         <div className={`lg:col-span-3 overflow-y-auto pr-2 custom-scrollbar ${viewMode === 'GRID' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min' : 'flex flex-col gap-2'}`}>
            {liveData.map((st) => (
               <div key={st.student.id} className={`group relative p-4 rounded bg-slate-900 border transition-all duration-200 ${getCardStyle(st)}`}>
                  
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${st.isViolation ? 'bg-red-500' : st.vm ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>

                  <div className="pl-3">
                     {/* Header */}
                     <div className="flex justify-between items-start mb-3">
                        <div>
                           <div className="font-bold text-slate-200 truncate pr-2 text-sm md:text-base">{st.student.fullName}</div>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1 rounded border border-slate-800">{st.student.username}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{st.student.className}</span>
                           </div>
                        </div>
                        <div className="text-[10px]">{getStatusBadge(st)}</div>
                     </div>

                     {/* Network Info (Terminal Style) */}
                     <div className="bg-black/40 rounded p-2 font-mono text-xs space-y-1 border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                        <div className="flex justify-between">
                           <span className="text-slate-500">CLIENT:</span>
                           <span className={st.client.ip ? "text-blue-400" : "text-slate-600"}>{st.client.ip || "---"}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">VM IP:</span>
                           <span className={st.vm ? "text-emerald-400" : "text-slate-600"}>{st.vm?.ip || "---"}</span>
                        </div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-slate-800/50">
                           <span className="text-slate-500">ACTION:</span>
                           <span className={`uppercase font-bold ${st.isViolation ? 'text-red-500' : 'text-slate-300'}`}>{st.client.lastAction || "NONE"}</span>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* RIGHT: LOG TERMINAL (Chiếm 1/4) */}
         <div className="lg:col-span-1 bg-black rounded-lg border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-600 rounded-full"></span> SYSTEM LOGS
               </span>
               <span className="text-[10px] font-mono text-slate-600">{logs.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar">
               {logs.map((log) => (
                  <div key={log.id} className="p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-colors group">
                     <div className="flex gap-2 text-[10px] text-slate-500 mb-0.5">
                        <span>[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                        <span className="text-blue-500 group-hover:underline cursor-pointer">{log.clientIp}</span>
                     </div>
                     <div className="flex gap-2">
                        <span className={`font-bold ${log.action.includes('VIOLATION') ? 'text-red-500' : log.action === 'SUBMIT' ? 'text-blue-400' : 'text-emerald-500'}`}>
                           {log.action}
                        </span>
                        <span className="text-slate-300 truncate">{log.user?.username}</span>
                     </div>
                     <div className="text-slate-500 pl-4 border-l border-slate-800 mt-1 italic text-[10px] truncate">
                        {log.details}
                     </div>
                  </div>
               ))}
               {logs.length === 0 && <div className="text-slate-600 text-center italic mt-10">Waiting for events...</div>}
            </div>
         </div>

      </div>
    </div>
  );
}
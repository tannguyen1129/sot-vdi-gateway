"use client";

import { useEffect, useState, useMemo } from "react";
import api from "./../../../utils/axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx"; // Import thư viện Excel

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
  
  // Loading states cho buttons
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  // --- EXPORT HANDLER ---
  const handleExport = async () => {
    if (logs.length === 0) return alert("Không có dữ liệu để xuất!");
    setIsExporting(true);

    try {
        // Gọi API lấy toàn bộ logs (không phân trang) để export đầy đủ
        const res = await api.get(`/monitoring/${examId}/all`);
        const fullLogs = res.data;

        // Map dữ liệu sang format Excel
        const dataToExport = fullLogs.map((log: any) => ({
            "Thời gian": new Date(log.createdAt).toLocaleString('vi-VN'),
            "MSSV": log.user?.username || "N/A",
            "Họ tên": log.user?.fullName || "N/A",
            "Hành động": log.action,
            "Chi tiết": log.details,
            "IP Máy": log.clientIp
        }));

        // Tạo Sheet & Workbook
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SystemLogs");

        // Xuất file
        XLSX.writeFile(workbook, `Logs_KyThi_${examId}_${new Date().getTime()}.xlsx`);
    } catch (err) {
        alert("Lỗi xuất file excel!");
        console.error(err);
    } finally {
        setIsExporting(false);
    }
  };

  // --- CLEAR LOGS HANDLER ---
  const handleClearLogs = async () => {
    const confirm = window.confirm("CẢNH BÁO NGUY HIỂM:\nBạn có chắc chắn muốn XÓA TOÀN BỘ logs của kỳ thi này không?\nHành động này KHÔNG THỂ hoàn tác!");
    if (!confirm) return;

    setIsClearing(true);
    try {
        await api.delete(`/monitoring/${examId}/clear`);
        setLogs([]); // Xóa state ngay lập tức
        alert("Đã xóa sạch nhật ký giám sát.");
    } catch (err) {
        alert("Lỗi khi xóa logs!");
        console.error(err);
    } finally {
        setIsClearing(false);
    }
  };

  // --- HELPER: STATUS STYLES ---
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
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
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

         {/* PANEL BÊN PHẢI: LOG HỆ THỐNG (CONSOLE STYLE) */}
        <div className="lg:col-span-1 bg-[#0f1117] rounded-xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl h-[600px] lg:h-[calc(100vh-140px)]">
            
            {/* Header Logs */}
            <div className="bg-[#161b22] px-4 py-3 border-b border-gray-800 flex justify-between items-center sticky top-0 z-10 shadow-sm">
               
               {/* Log Title */}
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l6-6-6-6M12 19h8" />
                  </svg>
                  LIVE EVENTS
               </span>

               {/* Action Buttons Group */}
               <div className="flex items-center gap-2">
                  {/* Export Button */}
                  <button 
                    onClick={handleExport}
                    disabled={isExporting || logs.length === 0}
                    title="Export to Excel"
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                     {isExporting ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     )}
                  </button>

                  {/* Clear Button */}
                  <button 
                    onClick={handleClearLogs}
                    disabled={isClearing || logs.length === 0}
                    title="Clear All Logs"
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                     {isClearing ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     )}
                  </button>

                  {/* Divider */}
                  <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>

                  {/* Counter Badge */}
                  <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-mono text-blue-400 font-bold min-w-[24px] text-center">
                    {logs.length}
                  </span>
               </div>
            </div>

            {/* Body Logs */}
            <div className="flex-1 overflow-y-auto p-0 font-mono text-xs custom-scrollbar bg-[#0d1117]">
               {logs.map((log) => {
                  const isViolation = log.action.includes('VIOLATION');
                  const isSubmit = log.action === 'SUBMIT';
                  const isJoin = log.action === 'JOIN';
                  
                  // Config màu sắc & Icon
                  let borderClass = 'border-l-2 border-transparent';
                  let bgHoverClass = 'hover:bg-white/5';
                  let badgeClass = 'bg-gray-800 text-gray-400 border-gray-700';
                  let Icon = null;

                  if (isViolation) {
                      borderClass = 'border-l-2 border-red-600 bg-red-900/10';
                      bgHoverClass = 'hover:bg-red-900/20';
                      badgeClass = 'bg-red-950 text-red-400 border-red-900';
                      Icon = (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      );
                  } else if (isSubmit) {
                      borderClass = 'border-l-2 border-blue-500 bg-blue-900/10';
                      badgeClass = 'bg-blue-950 text-blue-400 border-blue-900';
                      Icon = (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                  } else if (isJoin) {
                      badgeClass = 'bg-green-950 text-green-400 border-green-900';
                      Icon = (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      );
                  } else {
                      Icon = (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                  }

                  return (
                      <div key={log.id} className={`p-3 border-b border-gray-800/50 transition-all ${borderClass} ${bgHoverClass} group`}>
                         
                         {/* Dòng 1: Thời gian & IP */}
                         <div className="flex justify-between items-center mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               {new Date(log.createdAt).toLocaleString('vi-VN', {
                                  day: '2-digit', month: '2-digit', 
                                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                               })}
                            </span>
                            <span className="text-[10px] text-blue-500/80 font-mono flex items-center gap-1">
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                               </svg>
                               {log.clientIp}
                            </span>
                         </div>

                         {/* Dòng 2: User & Action Badge */}
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider flex items-center gap-1 ${badgeClass}`}>
                               {Icon}
                               {log.action}
                            </span>
                            <span className={`font-bold text-sm ${isViolation ? 'text-red-200' : 'text-gray-300'}`}>
                               {log.user?.username || 'Unknown'}
                            </span>
                         </div>

                         {/* Dòng 3: Details */}
                         {log.details && (
                            <div className="text-gray-500 text-[11px] pl-2 ml-1 border-l border-gray-700 leading-tight flex gap-1.5 pt-0.5">
                               <svg className="w-3 h-3 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" transform="scale(-1, 1) translate(-24, 0)" /> 
                               </svg>
                               {log.details}
                            </div>
                         )}
                      </div>
                  );
               })}

               {/* Empty State */}
               {logs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-700 space-y-3 mt-10">
                     <svg className="w-12 h-12 animate-pulse text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                     </svg>
                     <div className="text-xs italic font-mono">System listening for events...</div>
                  </div>
               )}
               
               <div className="h-4"></div>
            </div>
        </div>

      </div>
    </div>
  );
}
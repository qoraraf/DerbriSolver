import React, { useMemo, useState, useRef } from 'react';
import { CdmEvent, TriageLane } from '../types';
import { formatSci, formatDist } from '../constants';
import { Search, Filter, Activity, ChevronRight, Upload, Loader2, Zap, Globe, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  events: CdmEvent[];
  onSelectEvent: (id: string) => void;
  onImport: (file: File) => void;
  isImporting?: boolean;
  importProgress?: number;
}

const LaneBadge = ({ lane }: { lane: TriageLane }) => {
  switch (lane) {
    case TriageLane.ANALYTIC_OK:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">Safe</span>;
    case TriageLane.MC_REQUIRED:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-tighter">Analysis</span>;
    case TriageLane.ACTION_NOW:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-tighter animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.2)]">Critical</span>;
  }
};

const KpiCard = ({ title, value, subtext, color, icon: Icon }: { title: string, value: string | number, subtext: string, color: string, icon: any }) => (
  <div className="glass-panel cyber-border p-5 rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] group">
    <div className="flex justify-between items-start mb-2">
        <p className="text-space-700 text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <Icon size={14} className={color} />
    </div>
    <div className="flex items-baseline gap-2">
        <h3 className={`text-3xl font-black tracking-tighter ${color} drop-shadow-[0_0_10px_currentColor]`}>{value}</h3>
    </div>
    <p className="text-space-700 text-[10px] mt-2 font-mono">{subtext}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ events, onSelectEvent, onImport, isImporting, importProgress = 0 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLane, setFilterLane] = useState<TriageLane | 'ALL'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.object1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.object2.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLane = filterLane === 'ALL' || e.lane === filterLane;
      return matchesSearch && matchesLane;
    });
  }, [events, searchTerm, filterLane]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      action: events.filter(e => e.lane === TriageLane.ACTION_NOW).length,
      mc: events.filter(e => e.lane === TriageLane.MC_REQUIRED).length,
      ok: events.filter(e => e.lane === TriageLane.ANALYTIC_OK).length,
    };
  }, [events]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onImport(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden relative">
      {/* High-tech ticker */}
      <div className="absolute top-0 left-0 w-full overflow-hidden bg-indigo-900/10 border-b border-indigo-500/20 py-1">
        <div className="flex gap-10 animate-glimmer whitespace-nowrap text-[9px] font-mono text-indigo-400 tracking-tighter px-6">
            <span>[DATA STREAM: LEO-TRACKER-NORTH-V2]</span>
            <span>SYSTEM_OK: 102.4ms LATENCY</span>
            <span>LAST_INJEST: {new Date().toLocaleTimeString()}</span>
            <span>THREAT_LEVEL: NOMINAL</span>
            <span>ACTIVE_CONJUNCTIONS: {stats.total}</span>
            <span>MCR_QUEUE: {stats.mc}</span>
        </div>
      </div>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Total Inventory" value={stats.total} subtext="Global Catalog Sync" color="text-white" icon={Globe} />
        <KpiCard title="Immediate Threat" value={stats.action} subtext="Critical Lane" color="text-rose-500" icon={ShieldAlert} />
        <KpiCard title="Gate Failures" value={stats.mc} subtext="Pending MC Analysis" color="text-amber-400" icon={Zap} />
        <KpiCard title="Nominal" value={stats.ok} subtext="Clearance Confirmed" color="text-emerald-400" icon={Activity} />
      </div>

      <div className="flex items-center justify-between glass-panel p-3 rounded border border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-space-700" size={14} />
            <input 
              type="text" 
              placeholder="Filter Event ID or Object..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-space-100 focus:outline-none focus:border-indigo-500 w-64 transition-all"
            />
          </div>
          <div className="flex bg-black/40 p-1 rounded border border-white/5">
            {(['ALL', TriageLane.ACTION_NOW, TriageLane.MC_REQUIRED, TriageLane.ANALYTIC_OK] as const).map(lane => (
              <button
                key={lane}
                onClick={() => setFilterLane(lane)}
                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all ${
                  filterLane === lane 
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                  : 'text-space-700 hover:text-white'
                }`}
              >
                {lane === 'ALL' ? 'Global' : lane.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileChange} />
            {isImporting ? (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-900/20 rounded border border-indigo-500/40 w-48">
                 <Loader2 size={12} className="animate-spin text-indigo-400" />
                 <div className="flex-1">
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                        <div className="bg-indigo-500 h-1 transition-all duration-300 shadow-[0_0_8px_#6366f1]" style={{ width: `${importProgress}%` }}></div>
                    </div>
                 </div>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold uppercase tracking-tight transition-all border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Upload size={14} /> Import CDM
              </button>
            )}
        </div>
      </div>

      <div className="flex-1 glass-panel border border-white/5 rounded shadow-2xl overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-black/60 sticky top-0 z-10">
              <tr>
                <th className="w-24 px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest">Lane</th>
                <th className="px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest">Objects (Primary/Secondary)</th>
                <th className="w-32 px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest text-right">TCA</th>
                <th className="w-32 px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest text-right">Miss (m)</th>
                <th className="w-32 px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest text-right">Pc (Analytic)</th>
                <th className="w-28 px-6 py-4 text-[10px] font-black text-space-700 uppercase tracking-widest text-center">G-Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-indigo-500/10 transition-colors group cursor-pointer" onClick={() => onSelectEvent(event.id)}>
                  <td className="px-6 py-4"><LaneBadge lane={event.lane} /></td>
                  <td className="px-6 py-4 text-xs font-bold font-mono text-indigo-400 group-hover:text-white">{event.id}</td>
                  <td className="px-6 py-4 truncate">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-space-100">{event.object1}</span>
                      <span className="text-[10px] text-space-700 font-mono tracking-tighter">{event.object2}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-right font-mono">
                    {(() => {
                        const val = event.tca || '';
                        const [d, t] = val.includes('T') ? val.split('T') : val.split(' ');
                        return (
                            <>
                                <span className="text-white block">{t?.substring(0, 8)}</span>
                                <span className="text-space-700 text-[9px] block">{d}</span>
                            </>
                        )
                    })()}
                  </td>
                  <td className="px-6 py-4 text-xs text-right font-mono text-space-100 font-bold">
                    {formatDist(event.missDistance)}
                  </td>
                  <td className="px-6 py-4 text-xs text-right font-mono">
                    <span className={event.pcAnalytic > 1e-4 ? 'text-rose-400 font-bold glow-text-rose' : 'text-space-100'}>
                      {formatSci(event.pcAnalytic)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1.5">
                       <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${event.gates.eta.passed ? 'bg-space-800 text-space-600' : 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}>η</span>
                       <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${event.gates.tangency.passed ? 'bg-space-800 text-space-600' : 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}>T</span>
                       <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${event.gates.conditioning.passed ? 'bg-space-800 text-space-600' : 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}>ρ</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
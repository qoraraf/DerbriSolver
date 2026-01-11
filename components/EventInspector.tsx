import React, { useState } from 'react';
import { CdmEvent, SimulationResult, TriageLane } from '../types';
import { formatSci, formatDist } from '../constants';
import { runMonteCarlo } from '../services/dataService';
import { Play, ArrowLeft, AlertOctagon, Check, Download, Zap, Database } from 'lucide-react';
import EncounterPlane from './EncounterPlane';

interface EventInspectorProps {
  event: CdmEvent | null;
  onBack: () => void;
  onUpdateEvent: (updated: CdmEvent) => void;
}

const EventInspector: React.FC<EventInspectorProps> = ({ event, onBack, onUpdateEvent }) => {
  const [mcLoading, setMcLoading] = useState(false);
  const [mcResult, setMcResult] = useState<SimulationResult | null>(event?.pcMc ? null : null);

  if (!event) return null;

  const handleRunMc = async () => {
    setMcLoading(true);
    try {
      const result = await runMonteCarlo(event);
      setMcResult(result);
      onUpdateEvent({ ...event, pcMc: result.pc });
    } finally {
      setMcLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-space-950/20">
      {/* Top Bar */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between glass-panel shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-space-700 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-black text-white tracking-tighter glow-text-indigo">{event.id}</h2>
               {event.lane === TriageLane.ACTION_NOW && <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded animate-pulse shadow-[0_0_10px_#e11d48]">PRIORITY 1</span>}
            </div>
            <p className="text-[10px] text-space-700 font-mono font-bold uppercase tracking-widest mt-1">
                TCA CONJ_WINDOW: <span className="text-indigo-400">{event.tca}</span>
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-black/40 hover:bg-indigo-600/10 text-space-100 rounded border border-white/10 transition-all">
            <Download size={14} /> Export Packet
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="space-y-6">
            <div className="glass-panel cyber-border p-5 rounded">
              <h3 className="text-[10px] font-black text-space-700 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Telemetry Summary</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded border border-white/5">
                    <span className="text-[9px] text-space-700 block font-bold uppercase mb-1">Obj-A [PR]</span>
                    <span className="text-xs font-black text-indigo-400">{event.object1}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded border border-white/5">
                    <span className="text-[9px] text-space-700 block font-bold uppercase mb-1">Obj-B [SC]</span>
                    <span className="text-xs font-black text-indigo-400">{event.object2}</span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-900/10 rounded border border-indigo-500/20">
                     <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[9px] text-indigo-300 font-bold uppercase">Miss Distance</span>
                        <span className="text-[9px] text-space-600">Metric [m]</span>
                     </div>
                     <span className="text-3xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{formatDist(event.missDistance)}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel cyber-border p-5 rounded">
              <h3 className="text-[10px] font-black text-space-700 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Diagnostic Gates</h3>
              <div className="space-y-2">
                 {[
                    { label: 'η [Size Ratio]', val: event.gates.eta.value.toFixed(1), pass: event.gates.eta.passed },
                    { label: 'T [Tangency]', val: event.gates.tangency.value.toFixed(3), pass: event.gates.tangency.passed },
                    { label: 'ρ [Cond.]', val: event.gates.conditioning.value.toFixed(1), pass: event.gates.conditioning.passed }
                 ].map(g => (
                    <div key={g.label} className="flex justify-between items-center p-3 rounded bg-black/30 border border-white/5 group hover:border-indigo-500/30 transition-all">
                        <span className="text-[10px] font-bold text-space-100 uppercase">{g.label}</span>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono font-black ${g.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{g.val}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${g.pass ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                        </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel cyber-border p-6 rounded relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
               
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                      <Zap size={14} className="text-indigo-400" />
                      <h3 className="text-[10px] font-black text-space-700 uppercase tracking-widest">Pc Evolution Analysis</h3>
                  </div>
                  <button 
                    onClick={handleRunMc}
                    disabled={mcLoading}
                    className={`flex items-center gap-2 px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                        mcLoading ? 'bg-white/5 text-space-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                    }`}
                  >
                    {mcLoading ? 'Processing Telemetry...' : 'Engage MC-Sim'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="p-4 bg-black/40 rounded border border-white/5">
                     <span className="text-[9px] text-space-700 uppercase font-bold tracking-widest block mb-1">Provider Pc</span>
                     <span className="text-2xl font-black text-white font-mono glow-text-indigo">{formatSci(event.pcAnalytic)}</span>
                  </div>

                  <div className={`p-4 rounded border transition-all ${mcResult ? 'bg-black/40 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-white/5 border-dashed border-white/10'}`}>
                     {mcResult ? (
                        <>
                           <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">MC-Pc Confirmed</span>
                                <span className="text-[8px] text-space-700 font-mono bg-white/5 px-2 py-0.5 rounded">{mcResult.samples} ITER</span>
                           </div>
                           <span className="text-2xl font-black text-white font-mono drop-shadow-[0_0_10px_#10b981]">{formatSci(mcResult.pc)}</span>
                           <div className="text-[9px] text-space-700 mt-2 font-mono uppercase">95% CI: [{formatSci(mcResult.ciLower)}..{formatSci(mcResult.ciUpper)}]</div>
                        </>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-space-700">
                             <Database size={16} className="mb-2 opacity-20" />
                             <span className="text-[10px] font-bold uppercase">Waiting for Compute</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="mt-8 relative z-10">
                    <EncounterPlane event={event} mcResult={mcResult} />
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventInspector;
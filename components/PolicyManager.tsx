import React from 'react';
import { PolicyConfig } from '../types';
import { Save, RotateCcw } from 'lucide-react';
import { formatSci } from '../constants';

interface PolicyManagerProps {
  policy: PolicyConfig;
  setPolicy: (p: PolicyConfig) => void;
  onApply: () => void;
}

const Slider = ({ label, value, min, max, step, onChange, format }: any) => (
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <label className="text-sm font-medium text-space-100">{label}</label>
      <span className="text-sm font-mono text-indigo-400">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
    />
  </div>
);

const PolicyManager: React.FC<PolicyManagerProps> = ({ policy, setPolicy, onApply }) => {
  
  const handleChange = (key: keyof PolicyConfig, val: number) => {
      setPolicy({ ...policy, [key]: val });
  };

  return (
    <div className="h-full p-8 flex flex-col items-center justify-start overflow-auto">
      <div className="w-full max-w-2xl bg-space-900 border border-space-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-space-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Triage Policy</h2>
            <p className="text-sm text-space-700 mt-1">Adjust thresholds for automated lane assignment.</p>
          </div>
          <SettingsIcon />
        </div>

        <div className="space-y-2">
            <h3 className="text-xs uppercase text-space-700 font-bold tracking-wider mb-4">Risk Thresholds</h3>
            
            <Slider 
                label="Pc Red Threshold (Analytic)" 
                value={policy.pcRedThreshold} 
                min={0.00001} max={0.01} step={0.00001} 
                onChange={(v: number) => handleChange('pcRedThreshold', v)}
                format={formatSci}
            />

            <h3 className="text-xs uppercase text-space-700 font-bold tracking-wider mb-4 mt-8">Gate Logic</h3>
            
            <Slider 
                label="Max Size Ratio (η)" 
                value={policy.etaThreshold} 
                min={1} max={50} step={1} 
                onChange={(v: number) => handleChange('etaThreshold', v)}
            />

            <Slider 
                label="Tangency Limit (T)" 
                value={policy.tangencyThreshold} 
                min={0.9} max={0.999} step={0.001} 
                onChange={(v: number) => handleChange('tangencyThreshold', v)}
            />
             
             <Slider 
                label="Conditioning (ρ)" 
                value={policy.conditioningThreshold} 
                min={1} max={20} step={0.5} 
                onChange={(v: number) => handleChange('conditioningThreshold', v)}
            />

            <h3 className="text-xs uppercase text-space-700 font-bold tracking-wider mb-4 mt-8">Operational</h3>
            <Slider 
                label="Warning Time Cutoff (Hours)" 
                value={policy.warningTimeThreshold} 
                min={1} max={72} step={1} 
                onChange={(v: number) => handleChange('warningTimeThreshold', v)}
            />
        </div>

        <div className="mt-8 pt-6 border-t border-space-800 flex gap-4">
            <button onClick={onApply} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                <Save size={18} /> Apply Policy & Re-Triage
            </button>
             <button className="px-4 py-3 bg-space-800 hover:bg-space-700 text-space-400 hover:text-white rounded-lg transition-all">
                <RotateCcw size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = () => (
    <div className="p-3 bg-space-950 rounded-lg border border-space-800 text-indigo-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    </div>
)

export default PolicyManager;
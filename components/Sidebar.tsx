import React from 'react';
import { LayoutDashboard, Microscope, ShieldAlert, Settings, Database, LogOut, Cpu, Radio } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'inspector', label: 'Event Inspector', icon: Microscope },
    { id: 'nightmare', label: 'Nightmare Watch', icon: ShieldAlert },
    { id: 'policy', label: 'Policy Manager', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen glass-panel border-r border-white/5 flex flex-col shadow-2xl z-20 relative">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2 glow-text-indigo">
           <Database className="text-indigo-500 fill-indigo-500/20" />
           DEBRI<span className="text-indigo-500">SOLVER</span>
        </h1>
        <div className="flex items-center gap-2 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-space-700 uppercase tracking-widest font-bold">System Online: Node 7</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative group ${
                        isActive 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                        : 'text-space-700 hover:bg-white/5 hover:text-space-100'
                    }`}
                >
                    {isActive && <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_8px_#6366f1]"></div>}
                    <Icon size={18} className={`${isActive ? 'text-indigo-400' : 'group-hover:text-white'}`} />
                    {item.label}
                </button>
            )
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="bg-black/20 rounded-lg p-3 space-y-2 border border-white/5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-space-700">
                <span>CPU Load</span>
                <span className="text-indigo-400">12%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-1/6"></div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-space-700">
                <Radio size={10} className="text-emerald-500 animate-pulse" />
                <span>Uplink Active</span>
            </div>
        </div>

        <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                FS
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-space-100 truncate">F. Sammar</p>
                <p className="text-[10px] text-space-700">DebriSolver Flight Director</p>
            </div>
            <LogOut size={16} className="text-space-700 hover:text-rose-400 cursor-pointer transition-colors" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
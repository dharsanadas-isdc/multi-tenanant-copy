
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Smartphone, RotateCcw, Maximize2 } from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { profile } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-100 px-10 h-20 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
          T
        </div>
        <span className="text-xl font-black text-slate-900 tracking-tight uppercase">Task First</span>
      </div>

      <div className="hidden md:flex items-center space-x-12">
        <button className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Workspace</button>
        <button className="text-[11px] font-black uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-600 pb-1">Insights</button>
      </div>

      <div className="flex items-center space-x-8 text-slate-400">
        <div className="flex items-center space-x-5">
          <button className="hover:text-slate-900 transition-colors flex items-center space-x-2">
             <Smartphone size={16} />
             <span className="text-[11px] font-bold">Device</span>
          </button>
          <button className="hover:text-slate-900 transition-colors">
             <RotateCcw size={16} />
          </button>
          <button className="hover:text-slate-900 transition-colors">
             <Maximize2 size={16} />
          </button>
        </div>
        
        <div className="flex items-center">
           <span className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
             {profile?.role || 'Member'}
           </span>
        </div>
      </div>
    </nav>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToGlobalCollection } from '../services/firestore';
import { Company, UserProfile, Task, UserRole } from '../types';
import { 
  Globe, 
  Building2, 
  Users, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Database,
  ArrowUpRight,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

const GlobalStat = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <h3 className="text-4xl font-black text-slate-900 tracking-tight relative z-10">{value}</h3>
    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-700 ${color}`}></div>
  </div>
);

export const SuperAdmin: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsubC = subscribeToGlobalCollection<Company>('companies', setCompanies);
    const unsubU = subscribeToGlobalCollection<UserProfile>('users', setUsers);
    const unsubT = subscribeToGlobalCollection<Task>('tasks', setTasks);
    return () => { unsubC(); unsubU(); unsubT(); };
  }, [isSuperAdmin]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  if (!isSuperAdmin) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="text-center">
          <ShieldAlert size={48} className="mx-auto text-rose-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 uppercase">Access Denied</h2>
          <p className="text-slate-500 mt-2">Elevated privileges required for Nexus access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Global Admin</span>
            <div className="h-px w-8 bg-slate-200"></div>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Nexus Console</h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4 flex items-center">
            <Globe size={12} className="mr-2 text-indigo-500" />
            Platform Operational Registry
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[20px] shadow-2xl shadow-slate-200 flex items-center space-x-4">
             <Activity size={20} className="text-indigo-400" />
             <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">System State</p>
                <p className="text-[11px] font-bold">ALL NODES NOMINAL</p>
             </div>
          </div>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlobalStat label="Active Tenants" value={companies.length} icon={Building2} color="bg-indigo-600" />
        <GlobalStat label="Total Operators" value={users.length} icon={Users} color="bg-emerald-600" />
        <GlobalStat label="Global Tasks" value={tasks.length} icon={Zap} color="bg-amber-600" />
        <GlobalStat label="Avg Load" value={`${(tasks.length / (companies.length || 1)).toFixed(1)} T/C`} icon={Database} color="bg-rose-600" />
      </div>

      {/* Company Management */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tenant Registry</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Workspace Directory</p>
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Find Tenant..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-[11px] uppercase tracking-widest w-full md:w-64"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant ID</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operators</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-10 py-6">
                    <span className="font-mono text-[11px] text-slate-400">{company.id.substring(0, 12)}...</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                         {company.name.charAt(0)}
                       </div>
                       <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      company.plan === 'enterprise' ? 'bg-indigo-900 text-white' : 
                      company.plan === 'pro' ? 'bg-indigo-100 text-indigo-600' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center space-x-2">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {tasks.filter(t => t.companyId === company.id).length} Active
                        </span>
                     </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center -space-x-2">
                      {users.filter(u => u.companyId === company.id).slice(0, 3).map((u, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                           {u.displayName.charAt(0)}
                        </div>
                      ))}
                      {users.filter(u => u.companyId === company.id).length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500">
                           +{users.filter(u => u.companyId === company.id).length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                        <ArrowUpRight size={18} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Health Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-8 rounded-[32px] text-white space-y-4">
           <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Auth Services</span>
           </div>
           <p className="text-slate-400 text-xs font-medium">Global authentication endpoint fully functional. Latency: 42ms.</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4">
           <div className="flex items-center space-x-3 text-indigo-600">
              <Clock size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Backup Status</span>
           </div>
           <p className="text-slate-500 text-xs font-medium">Last automated snapshots completed 4 hours ago. 100% data integrity.</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4">
           <div className="flex items-center space-x-3 text-amber-600">
              <Settings size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Configuration</span>
           </div>
           <p className="text-slate-500 text-xs font-medium">Nexus v2.4.0 stable. Real-time multi-tenant relay active.</p>
        </div>
      </div>
    </div>
  );
};

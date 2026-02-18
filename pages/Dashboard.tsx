
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollection } from '../services/firestore';
import { Project, Task, TaskStatus, UserProfile } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Zap, Activity, Users, FolderKanban } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!profile?.companyId) return;
    const unsubP = subscribeToCollection<Project>('projects', profile.companyId, setProjects);
    const unsubT = subscribeToCollection<Task>('tasks', profile.companyId, setTasks);
    const unsubU = subscribeToCollection<UserProfile>('users', profile.companyId, setTeam);
    return () => { unsubP(); unsubT(); unsubU(); };
  }, [profile?.companyId]);

  const stats = useMemo(() => {
    const data = [
      { name: 'To Do', value: tasks.filter(t => t.status === TaskStatus.TODO).length },
      { name: 'Doing', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
      { name: 'Review', value: tasks.filter(t => t.status === TaskStatus.REVIEW).length },
      { name: 'Done', value: tasks.filter(t => t.status === TaskStatus.DONE).length },
    ];
    return data;
  }, [tasks]);

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Intelligence Hub</h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-3">Live Operational State</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm flex items-center space-x-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: Zap, color: 'text-indigo-600' },
          { label: 'Active Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-600' },
          { label: 'Team Size', value: team.length, icon: Users, color: 'text-emerald-600' },
          { label: 'Load Factor', value: (tasks.length / (team.length || 1)).toFixed(1), icon: Activity, color: 'text-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <stat.icon size={18} className="text-slate-200" />
            </div>
            <h3 className={`text-5xl font-black ${stat.color} tracking-tight`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-10">Productivity Distribution</h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: '900', fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: '900', fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={50} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-10">Status Precision</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={stats} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={8} animationDuration={1000}>
                    {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-4 w-full mt-6">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{s.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

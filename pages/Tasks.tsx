
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollection, updateTaskStatus, createTask, updateTask } from '../services/firestore';
import { Project, Task, TaskStatus, TaskPriority, UserProfile } from '../types';
import { ChevronDown, Calendar, MoreHorizontal, ChevronRight, Plus, X, AlertCircle, Edit2, Check, X as CloseIcon } from 'lucide-react';

const StatCard = ({ label, value }: { label: string, value: number | string }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-3 flex-1 min-h-[120px]">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className="text-4xl font-black text-slate-900">{value}</h3>
  </div>
);

export const Tasks: React.FC = () => {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [viewRole, setViewRole] = useState<'MEMBER' | 'MANAGER'>('MEMBER');
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  
  // Modal states (kept for full description/complex edits if needed, but primary focus is inline)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    status: TaskStatus.TODO
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.companyId) return;
    const unsubTasks = subscribeToCollection<Task>('tasks', profile.companyId, setTasks);
    const unsubProj = subscribeToCollection<Project>('projects', profile.companyId, setProjects);
    const unsubTeam = subscribeToCollection<UserProfile>('users', profile.companyId, setTeam);
    return () => { unsubTasks(); unsubProj(); unsubTeam(); };
  }, [profile?.companyId]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const review = tasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return { total, todo, inProgress, review, done };
  }, [tasks]);

  const handleInlineSave = async (taskId: string, field: string, value: any) => {
    if (!profile?.companyId || !user) return;
    try {
      await updateTask(taskId, { [field]: value }, profile.companyId, user.uid);
      setEditingCell(null);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const startEditing = (id: string, field: string, initialValue: any) => {
    setEditingCell({ id, field });
    setTempValue(initialValue || '');
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!profile?.companyId || !user) return;
    await updateTaskStatus(taskId, newStatus, profile.companyId, user.uid);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !form.projectId) return;
    setLoading(true);
    try {
      const taskData = {
        companyId: profile.companyId,
        projectId: form.projectId,
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assignedTo: form.assignedTo || user.uid,
        dueDate: form.dueDate ? new Date(form.dueDate) : null
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData, profile.companyId, user.uid);
      } else {
        await createTask(taskData, user.uid);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.IN_PROGRESS: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case TaskStatus.DONE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case TaskStatus.REVIEW: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'NOT STARTED';
      case TaskStatus.IN_PROGRESS: return 'IN PROGRESS';
      case TaskStatus.REVIEW: return 'AWAITING CLARITY';
      case TaskStatus.DONE: return 'FINISHED';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 max-w-full animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Task Matrix</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Operational Resource Queue</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-1.5 flex items-center">
            <button 
              onClick={() => setViewRole('MEMBER')}
              className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewRole === 'MEMBER' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Member
            </button>
            <button 
              onClick={() => setViewRole('MANAGER')}
              className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewRole === 'MANAGER' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Manager
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingTask(null);
              setForm({
                title: '',
                description: '',
                projectId: projects[0]?.id || '',
                assignedTo: user?.uid || '',
                priority: TaskPriority.MEDIUM,
                dueDate: '',
                status: TaskStatus.TODO
              });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center space-x-2 transition-all"
          >
            <Plus size={16} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard label="Total Items" value={stats.total} />
        <StatCard label="Not Started" value={stats.todo} />
        <StatCard label="On Going" value={stats.inProgress} />
        <StatCard label="Awaiting Clarity" value={stats.review} />
        <StatCard label="Finished" value={stats.done} />
      </div>

      {/* Spreadsheet Table */}
      <div className="space-y-6">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px]">Description</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Est. Hrs</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Type</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-28 text-center">
                      <span className="text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-md border border-slate-100 shadow-sm">
                        No tasks initialized
                      </span>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, idx) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 text-[12px] font-bold text-slate-400 text-center">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                           <button className="text-slate-300 hover:text-slate-900 transition-colors">
                              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                           </button>
                           {editingCell?.id === task.id && editingCell?.field === 'title' ? (
                             <input 
                               ref={inputRef}
                               value={tempValue}
                               onChange={(e) => setTempValue(e.target.value)}
                               onBlur={() => handleInlineSave(task.id, 'title', tempValue)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleInlineSave(task.id, 'title', tempValue);
                                 if (e.key === 'Escape') setEditingCell(null);
                               }}
                               className="bg-white border border-indigo-200 rounded px-2 py-1 text-sm font-black text-slate-900 outline-none ring-2 ring-indigo-50 w-full"
                             />
                           ) : (
                             <span 
                               onClick={() => startEditing(task.id, 'title', task.title)}
                               className="text-sm font-black text-slate-900 tracking-tight cursor-text hover:bg-slate-100 px-2 py-1 rounded transition-colors block w-full"
                             >
                               {task.title}
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative group/select">
                          {editingCell?.id === task.id && editingCell?.field === 'projectId' ? (
                            <select 
                              ref={inputRef as any}
                              value={tempValue}
                              onChange={(e) => handleInlineSave(task.id, 'projectId', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              className="w-full bg-white border border-indigo-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-indigo-400 tracking-widest outline-none ring-2 ring-indigo-50"
                            >
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                            </select>
                          ) : (
                            <div 
                              onClick={() => startEditing(task.id, 'projectId', task.projectId)}
                              className="flex items-center justify-between border border-slate-100 px-3 py-1.5 rounded-lg bg-white cursor-pointer hover:border-indigo-200 transition-all min-w-[140px]"
                            >
                              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest truncate">
                                {projects.find(p => p.id === task.projectId)?.name || 'ATTACHED'}
                              </span>
                              <ChevronDown size={12} className="text-slate-300 group-hover/select:text-indigo-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {editingCell?.id === task.id && editingCell?.field === 'dueDate' ? (
                          <input 
                            ref={inputRef}
                            type="date"
                            value={tempValue}
                            onChange={(e) => handleInlineSave(task.id, 'dueDate', new Date(e.target.value))}
                            onBlur={() => setEditingCell(null)}
                            className="w-full bg-white border border-indigo-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-900 outline-none ring-2 ring-indigo-50"
                          />
                        ) : (
                          <div 
                            onClick={() => startEditing(task.id, 'dueDate', task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toISOString().split('T')[0] : '')}
                            className="flex items-center justify-between border border-slate-100 px-3 py-1.5 rounded-lg bg-white cursor-pointer hover:border-indigo-200 transition-all min-w-[120px]"
                          >
                            <span className="text-[11px] font-bold text-slate-900">
                              {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-GB').replace(/\//g, '-') : 'SET DATE'}
                            </span>
                            <Calendar size={12} className="text-slate-300 group-hover:text-indigo-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[11px] font-black text-indigo-600">40H</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-between border border-slate-100 px-3 py-1.5 rounded-lg bg-white group cursor-pointer hover:border-indigo-200 transition-all min-w-[120px]">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">UI DESIGN</span>
                          <ChevronDown size={12} className="text-slate-300 group-hover:text-indigo-400" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {editingCell?.id === task.id && editingCell?.field === 'assignedTo' ? (
                          <select 
                            ref={inputRef as any}
                            value={tempValue}
                            onChange={(e) => handleInlineSave(task.id, 'assignedTo', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="w-full bg-white border border-indigo-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 outline-none ring-2 ring-indigo-50"
                          >
                            <option value="">UNASSIGNED</option>
                            {team.map(u => <option key={u.uid} value={u.uid}>{u.displayName.toUpperCase()}</option>)}
                          </select>
                        ) : (
                          <div 
                            onClick={() => startEditing(task.id, 'assignedTo', task.assignedTo)}
                            className="flex items-center justify-between border border-slate-100 px-3 py-1.5 rounded-lg bg-white cursor-pointer hover:border-indigo-200 transition-all min-w-[140px]"
                          >
                            <span className="text-[11px] font-bold text-slate-500 truncate">
                              {team.find(u => u.uid === task.assignedTo)?.displayName || 'UNASSIGNED'}
                            </span>
                            <ChevronDown size={12} className="text-slate-300 group-hover:text-indigo-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                         <div 
                           onClick={() => {
                             const statuses = Object.values(TaskStatus);
                             const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
                             handleStatusChange(task.id, next);
                           }}
                           className={`flex items-center justify-between border px-3 py-1.5 rounded-lg min-w-[140px] group cursor-pointer transition-all ${getStatusColor(task.status)}`}
                          >
                          <span className="text-[10px] font-black uppercase tracking-widest truncate">
                            {getStatusLabel(task.status)}
                          </span>
                          <ChevronDown size={12} className="opacity-50" />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right pr-10">
                         <button 
                           onClick={() => {
                             setEditingTask(task);
                             setForm({
                               title: task.title,
                               description: task.description,
                               projectId: task.projectId,
                               assignedTo: task.assignedTo,
                               priority: task.priority,
                               dueDate: task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toISOString().split('T')[0] : '',
                               status: task.status
                             });
                             setIsModalOpen(true);
                           }}
                           className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                          >
                           <MoreHorizontal size={18} />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Task Button Below Table */}
        <div className="flex justify-center pt-2">
           <button 
             onClick={() => {
              setEditingTask(null);
              setForm({
                title: '',
                description: '',
                projectId: projects[0]?.id || '',
                assignedTo: user?.uid || '',
                priority: TaskPriority.MEDIUM,
                dueDate: '',
                status: TaskStatus.TODO
              });
              setIsModalOpen(true);
            }}
             className="group flex items-center space-x-3 px-10 py-4 bg-white hover:bg-slate-900 border border-slate-100 hover:border-slate-900 rounded-[24px] shadow-lg shadow-slate-100 transition-all hover:scale-105 active:scale-95"
           >
              <div className="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                <Plus size={18} className="text-indigo-600 group-hover:text-white" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white">Initialize New Task</span>
           </button>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{editingTask ? 'Update Protocol' : 'Protocol: Add Task'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Allocation System</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-xl border border-slate-100">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description / Objective</label>
                  <input 
                    required
                    type="text" 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-lg"
                    placeholder="e.g. Design core design system"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Project</label>
                  <select 
                    required
                    value={form.projectId}
                    onChange={e => setForm({...form, projectId: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm appearance-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resource (Assignee)</label>
                  <select 
                    value={form.assignedTo}
                    onChange={e => setForm({...form, assignedTo: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm appearance-none"
                  >
                    <option value="">Auto-Assign to Self</option>
                    {team.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Deadline</label>
                  <input 
                    type="date" 
                    value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                  <select 
                    value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value as TaskPriority})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm appearance-none"
                  >
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>

                {editingTask && (
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                    <select 
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value as TaskStatus})}
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm appearance-none"
                    >
                      {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace('-', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {projects.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start space-x-3">
                  <AlertCircle size={18} className="text-amber-500 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                    You must initialize at least one project before allocating tasks.
                  </p>
                </div>
              )}

              <div className="flex space-x-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  disabled={loading || projects.length === 0}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingTask ? 'Commit Updates' : 'Deploy Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

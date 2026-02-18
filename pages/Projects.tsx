
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollection, createProject, updateProject } from '../services/firestore';
import { Project, ProjectStatus } from '../types';
import { Plus, MoreVertical, Calendar, Users, FolderOpen, Search, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export const Projects: React.FC = () => {
  const { profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: ProjectStatus.ACTIVE });

  useEffect(() => {
    if (!profile?.companyId) return;
    return subscribeToCollection<Project>('projects', profile.companyId, setProjects);
  }, [profile?.companyId]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', status: ProjectStatus.ACTIVE });
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setForm({ name: project.name, description: project.description, status: project.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setLoading(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: form.name,
          description: form.description,
          status: form.status
        }, profile.companyId, user.uid);
      } else {
        await createProject({
          companyId: profile.companyId,
          name: form.name,
          description: form.description,
          status: form.status,
          members: [user.uid]
        }, user.uid);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'bg-blue-50 text-blue-600';
      case ProjectStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600';
      case ProjectStatus.ON_HOLD: return 'bg-amber-50 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 font-medium italic">"Great things are done by a series of small things brought together."</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 whitespace-nowrap active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-28 bg-white border border-dashed border-slate-300 rounded-[32px] flex flex-col items-center justify-center text-slate-500 shadow-sm">
            <FolderOpen size={64} className="mb-6 opacity-10 text-slate-900" />
            <p className="text-xl font-black text-slate-900">Workspace is empty</p>
            <p className="text-sm font-medium mt-1">Start by creating your first organizational project.</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 border-b-4 hover:border-b-blue-500 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusConfig(project.status)}`}>
                  {project.status.replace('-', ' ')}
                </span>
                <button 
                  onClick={() => openEditModal(project)}
                  className="p-2 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-3 truncate group-hover:text-blue-600 transition-colors leading-tight">
                {project.name}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3 h-[63px]">
                {project.description || "No description provided for this project."}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <Calendar size={14} className="mr-2 text-blue-400" />
                  <span>{project.createdAt?.seconds ? format(new Date(project.createdAt.seconds * 1000), 'MMM yyyy') : 'Recently'}</span>
                </div>
                <div className="flex items-center space-x-1">
                   <div className="flex -space-x-2">
                      {[1, 2].map((i) => (
                         <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                           {i === 2 ? `+${(project.members?.length || 1) - 1}` : 'U'}
                         </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-12 -mt-12 group-hover:bg-blue-100/40 transition-colors duration-500"></div>
            </div>
          ))
        )}
      </div>

      {/* Project Modal (Create/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900">{editingProject ? 'Modify Project' : 'Start Project'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Title</label>
                <input 
                  required
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none font-bold text-lg"
                  placeholder="e.g. Q3 Growth Strategy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Objective / Description</label>
                <textarea 
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none font-medium leading-relaxed"
                  placeholder="What is the primary goal of this initiative?"
                />
              </div>
              
              {editingProject && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value as ProjectStatus})}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none font-bold appearance-none"
                  >
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s.replace('-', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              )}

              <div className="flex space-x-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingProject ? 'Update Project' : 'Launch Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

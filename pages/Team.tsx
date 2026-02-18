
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollection, createInvite } from '../services/firestore';
import { UserProfile, UserRole } from '../types';
import { UserPlus, Mail, Shield, MoreHorizontal, Search, X, ShieldCheck, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { auth as firebaseAuth } from '../firebase';

export const Team: React.FC = () => {
  const { profile, user, isManager } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: UserRole.MEMBER
  });

  useEffect(() => {
    if (!profile?.companyId) return;
    const unsubscribe = subscribeToCollection<UserProfile>('users', profile.companyId, setMembers);
    return () => unsubscribe && unsubscribe();
  }, [profile?.companyId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !user?.uid) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await createInvite(
        profile.companyId,
        inviteForm.email,
        inviteForm.role,
        user.uid
      );
      
      setSuccess(`Secure invitation dispatched to ${inviteForm.email}`);
      setInviteForm({ email: '', role: UserRole.MEMBER });
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Invitation protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">Team Directory</h1>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3">Operational Personnel Registry</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Query directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all shadow-sm"
            />
          </div>
          {isManager && (
            <button 
              onClick={() => {
                setError('');
                setSuccess('');
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Invite Personnel</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredMembers.map((member) => (
          <div 
            key={member.uid || member.email} 
            className="bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-xl transition-all group relative overflow-hidden border-b-4 border-b-indigo-500"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="relative">
                  <img 
                    src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || 'User')}&background=4f46e5&bold=true&color=fff`} 
                    className="w-16 h-16 rounded-[20px] bg-slate-100 border-2 border-white shadow-sm object-cover" 
                    alt={member.displayName} 
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white bg-emerald-500"></div>
               </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                {member.displayName}
              </h3>
              <div className="flex items-center text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <Mail size={12} className="mr-2 text-indigo-400" />
                <span className="truncate">{member.email}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center space-x-2">
                <Shield size={16} className={member.role === UserRole.ADMIN ? 'text-indigo-600' : 'text-slate-300'} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {member.role}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                Operational
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Invitation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Invite Personnel</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Allocation System</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-xl border border-slate-100">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleInvite} className="p-10 space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start space-x-3">
                  <AlertCircle size={18} className="text-rose-500 mt-0.5" />
                  <p className="text-[11px] font-black uppercase text-rose-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start space-x-3">
                  <ShieldCheck size={18} className="text-emerald-500 mt-0.5" />
                  <p className="text-[11px] font-black uppercase text-emerald-700">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Endpoint</label>
                <input 
                  required
                  type="email" 
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                  placeholder="user@system-node.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Authority Level</label>
                <select 
                  value={inviteForm.role}
                  onChange={e => setInviteForm({...inviteForm, role: e.target.value as UserRole})}
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-black text-sm appearance-none"
                >
                  <option value={UserRole.MEMBER}>MEMBER</option>
                  <option value={UserRole.MANAGER}>MANAGER</option>
                  <option value={UserRole.ADMIN}>ADMIN</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                  <span>{loading ? 'Transmitting...' : 'Dispatch Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

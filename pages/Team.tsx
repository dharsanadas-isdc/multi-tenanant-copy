
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollection, createInvite } from '../services/firestore';
import { UserProfile, UserRole, Invite, InviteStatus } from '../types';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Search, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Clock, 
  Copy, 
  Check, 
  Info,
  Share2,
  ExternalLink
} from 'lucide-react';

export const Team: React.FC = () => {
  const { profile, user, isManager } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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
    
    const unsubscribeMembers = subscribeToCollection<UserProfile>(
      'users', 
      profile.companyId, 
      setMembers
    );
    
    const unsubscribeInvites = subscribeToCollection<Invite>(
      'invites', 
      profile.companyId, 
      (data) => setInvites(data.filter(i => i.status === InviteStatus.PENDING))
    );

    return () => {
      unsubscribeMembers && unsubscribeMembers();
      unsubscribeInvites && unsubscribeInvites();
    };
  }, [profile?.companyId]);

  const generateInviteLink = (invite: any) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/login?token=${invite.token}&email=${encodeURIComponent(invite.email)}`;
  };

  const dispatchInvitation = async (person: any) => {
    const inviteUrl = generateInviteLink(person);
    const companyName = profile?.companyId ? (await (import('../services/firestore')).then(m => m.getCompanyUsers)).name : 'our team'; // Fallback
    
    const subject = encodeURIComponent(`Invitation to join ${profile?.companyId ? 'our team' : 'Syncro'}`);
    const body = encodeURIComponent(
      `Hi there,\n\nYou've been invited to join our workspace on Syncro.\n\nClick the link below to accept your invitation and set up your account:\n${inviteUrl}\n\nWelcome aboard!`
    );

    // Try Web Share API first (better for mobile/modern apps)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our team on Syncro',
          text: `Accept your invitation to join our workspace.`,
          url: inviteUrl,
        });
        return;
      } catch (err) {
        console.log('Share cancelled or failed, falling back to mailto');
      }
    }

    // Fallback to mailto:
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
  };

  const copyInviteLink = (invite: any) => {
    const inviteUrl = generateInviteLink(invite);
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(invite.uid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !user?.uid) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { id, token } = await createInvite(
        profile.companyId,
        inviteForm.email,
        inviteForm.role,
        user.uid
      );
      
      setSuccess(`Invite registered. Dispatching...`);
      
      // Auto-trigger dispatch for convenience
      setTimeout(() => {
        dispatchInvitation({ email: inviteForm.email, token, uid: id });
        setIsModalOpen(false);
        setSuccess('');
        setInviteForm({ email: '', role: UserRole.MEMBER });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invitation failed.');
    } finally {
      setLoading(false);
    }
  };

  const combinedList = useMemo(() => {
    const list = [
      ...members.map(m => ({ ...m, isPending: false })),
      ...invites.map(i => ({
        uid: i.id,
        displayName: 'Pending Member',
        email: i.email,
        role: i.role,
        isPending: true,
        photoURL: null,
        token: i.token
      }))
    ];

    return list.filter(item => 
      (item.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, invites, searchTerm]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">Team Directory</h1>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3">Operational Personnel & Invites</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or email..."
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
        {combinedList.map((person) => (
          <div 
            key={person.uid} 
            className={`bg-white rounded-[32px] border p-8 hover:shadow-xl transition-all group relative overflow-hidden border-b-4 ${person.isPending ? 'border-amber-200 border-dashed bg-slate-50/30' : 'border-indigo-500 border-solid'}`}
          >
            <div className="flex justify-between items-start mb-6">
               <div className="relative">
                  <div className={`w-16 h-16 rounded-[20px] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden bg-slate-100`}>
                    {person.photoURL ? (
                      <img src={person.photoURL} className="w-full h-full object-cover" alt={person.displayName} />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-black text-xl ${person.isPending ? 'text-slate-300 bg-slate-100' : 'text-white bg-indigo-600'}`}>
                        {(person.displayName || person.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {!person.isPending && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white bg-emerald-500"></div>
                  )}
                  {person.isPending && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white bg-amber-400 animate-pulse"></div>
                  )}
               </div>
               
               {person.isPending && (
                 <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-1 text-amber-500 animate-pulse mb-1">
                       <Clock size={14} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">Pending</span>
                    </div>
                    {isManager && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => dispatchInvitation(person)}
                          title="Send Invitation via Email/Apps"
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-90"
                        >
                          {typeof navigator.share !== 'undefined' ? <Share2 size={12} /> : <Send size={12} />}
                        </button>
                        <button 
                          onClick={() => copyInviteLink(person)}
                          title="Copy Link"
                          className={`p-2 rounded-lg transition-all shadow-md active:scale-90 ${copiedId === person.uid ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'}`}
                        >
                          {copiedId === person.uid ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                 </div>
               )}
            </div>
            
            <div className="space-y-1">
              <h3 className={`text-xl font-black truncate tracking-tight ${person.isPending ? 'text-slate-500' : 'text-slate-900'}`}>
                {person.displayName}
              </h3>
              <div className="flex items-center text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <Mail size={12} className={`mr-2 ${person.isPending ? 'text-amber-400' : 'text-indigo-400'}`} />
                <span className="truncate">{person.email}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Shield size={16} className={person.role === UserRole.ADMIN ? 'text-indigo-600' : 'text-slate-300'} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {person.role}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${person.isPending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {person.isPending ? 'Invited' : 'Active'}
              </span>
            </div>
          </div>
        ))}

        {combinedList.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
             <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No team members found</p>
          </div>
        )}
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
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start space-x-3">
                 <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                 <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700 leading-normal">
                    This will create a unique protocol for the user and prompt you to send it via your preferred email or messaging app.
                 </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start space-x-3">
                  <AlertCircle size={18} className="text-rose-500 mt-0.5" />
                  <p className="text-[11px] font-black uppercase text-rose-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start space-x-3">
                  <RefreshCw size={18} className="text-emerald-500 mt-0.5 animate-spin" />
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
                  <span>{loading ? 'Transmitting...' : 'Register & Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

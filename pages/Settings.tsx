
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Company } from '../types';
import { Save, Building2, CreditCard, ShieldCheck, Globe, Zap, ArrowUpRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchCompany = async () => {
      if (!profile?.companyId) return;
      const snap = await getDoc(doc(db, 'companies', profile.companyId));
      if (snap.exists()) {
        const data = snap.data() as Company;
        setCompany(data);
        setName(data.name);
      }
      setLoading(false);
    };
    fetchCompany();
  }, [profile?.companyId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !isAdmin) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', profile.companyId), { name });
      alert('Settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'integrations', label: 'Integrations', icon: Globe },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Fine-tune your workspace configuration and billing.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Workspace Identity</h2>
                <p className="text-sm text-slate-500 font-medium">This is how your team sees the workspace.</p>
              </div>
              <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600">
                <Building2 size={32} />
              </div>
            </div>

            <form onSubmit={handleUpdate} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Organization Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none font-bold text-lg disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Workspace ID (Read-only)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={profile?.companyId}
                    className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-[28px] p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Plan</p>
                    <h4 className="text-xl font-black text-slate-900 capitalize">{company?.plan || 'Basic'} Edition</h4>
                  </div>
                </div>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                   <button type="button" className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">Manage Billing</button>
                   <button type="button" className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center space-x-2">
                     <span>Upgrade</span>
                     <ArrowUpRight size={16} />
                   </button>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-6 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center space-x-3 bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-[20px] font-black transition-all disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
                  >
                    <Save size={20} />
                    <span>{saving ? 'Syncing Changes...' : 'Save Workspace Changes'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="bg-rose-50 rounded-[32px] p-10 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                <h4 className="text-lg font-black text-rose-900">Danger Zone</h4>
                <p className="text-sm text-rose-700 font-medium">Irreversibly delete this workspace and all its data.</p>
             </div>
             <button type="button" className="px-8 py-3 bg-white border border-rose-200 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
                Terminate Workspace
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

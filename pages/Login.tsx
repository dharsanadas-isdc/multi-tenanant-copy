
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole, Invite } from '../types';
import { validateInviteToken, acceptInvite } from '../services/firestore';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [validatingInvite, setValidatingInvite] = useState(!!token);
  
  const [form, setForm] = useState({ 
    email: '', password: '', name: '', companyName: '' 
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setIsLogin(false); // Force signup mode if token exists
    }
  }, [token]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user has an existing profile
      const inviteData = token ? await validateInviteToken(token, user.email || '') : null;

      if (inviteData) {
        // ACTIVATION VIA GOOGLE
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email?.toLowerCase(),
          displayName: user.displayName || form.name,
          companyId: inviteData.companyId,
          role: inviteData.role,
          status: 'active',
          createdAt: serverTimestamp()
        });
        await acceptInvite(inviteData.id);
      } else if (!isLogin) {
        // NEW ACCOUNT WITHOUT INVITE
        const companyRef = await addDoc(collection(db, 'companies'), {
          name: form.companyName || `${user.displayName}'s Workspace`,
          ownerId: user.uid,
          plan: 'basic',
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email?.toLowerCase(),
          displayName: user.displayName || form.name,
          companyId: companyRef.id,
          role: UserRole.ADMIN,
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        // VALIDATE INVITE IF TOKEN EXISTS
        let finalRole = UserRole.ADMIN;
        let finalCompanyId = '';
        let inviteIdToClear = '';

        if (token) {
          const inviteData = await validateInviteToken(token, form.email);
          if (!inviteData) {
            throw new Error("Invalid or mismatched invitation token for this email endpoint.");
          }
          finalRole = inviteData.role;
          finalCompanyId = inviteData.companyId;
          inviteIdToClear = inviteData.id;
        }

        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const { user } = userCred;

        if (!token) {
          // CREATE NEW TENANT
          const companyRef = await addDoc(collection(db, 'companies'), {
            name: form.companyName || `${form.name}'s Workspace`,
            ownerId: user.uid,
            plan: 'basic',
            createdAt: serverTimestamp()
          });
          finalCompanyId = companyRef.id;
        }

        // Create Official Profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: form.email.toLowerCase(),
          displayName: form.name,
          companyId: finalCompanyId,
          role: finalRole,
          status: 'active',
          createdAt: serverTimestamp()
        });

        if (inviteIdToClear) {
          await acceptInvite(inviteIdToClear);
        }

        await updateProfile(user, { displayName: form.name });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-xl shadow-slate-100">S</div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            {token ? 'Activate Access' : (isLogin ? 'Authorization' : 'Establish Hub')}
          </h1>
          {token && (
            <div className="mt-4 flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100">
               <ShieldCheck size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Invitation Verified</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 flex items-start space-x-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Identity Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="e.g. Rick Sanchez" />
            </div>
          )}
          
          {!isLogin && !token && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Workspace Hub Name</label>
              <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="e.g. Citadel Operations" />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Network Endpoint (Email)</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="user@system.com" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Access Cipher (Password)</label>
            <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-slate-100 disabled:opacity-50 active:scale-95 mt-4">
            {loading ? <RefreshCw className="mx-auto animate-spin" size={18} /> : (token ? 'Activate Node' : (isLogin ? 'Initiate Link' : 'Register Identity'))}
          </button>
        </form>

        <div className="relative my-8">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
           <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300"><span className="bg-white px-4 tracking-widest">External Identity</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-4 h-4" alt="Google" />
          <span>Sync with Google Hub</span>
        </button>

        {!token && (
          <div className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isLogin ? "No identity established?" : "Already verified?"}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-indigo-600 hover:underline transition-colors">
              {isLogin ? 'Register' : 'Identify'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

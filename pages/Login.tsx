
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole, Invite, Company } from '../types';
import { validateInviteToken, acceptInvite } from '../services/firestore';
import { ShieldCheck, AlertCircle, RefreshCw, Building2, User, Key, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'JOIN';

// Fix: Correctly returning JSX to satisfy the React.FC type definition which requires a return of ReactNode.
export const Login: React.FC = () => {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');
  
  const [mode, setMode] = useState<AuthMode>(urlToken ? 'JOIN' : 'LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitedCompany, setInvitedCompany] = useState<Company | null>(null);
  
  const [form, setForm] = useState({ 
    email: urlEmail || '', 
    password: '', 
    name: '', 
    companyName: '',
    manualToken: urlToken || ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser && !loading) {
      navigate('/');
    }
  }, [authUser, navigate, loading]);

  useEffect(() => {
    const checkToken = async () => {
      const tokenToVerify = form.manualToken || urlToken;
      if (tokenToVerify && (urlToken || form.manualToken.length > 5)) {
        try {
          const emailToCheck = authUser?.email || form.email.trim().toLowerCase() || urlEmail;
          if (emailToCheck && emailToCheck.includes('@')) {
            const inviteData = await validateInviteToken(tokenToVerify, emailToCheck);
            if (inviteData) {
              const companySnap = await getDoc(doc(db, 'companies', inviteData.companyId));
              if (companySnap.exists()) {
                setInvitedCompany({ id: companySnap.id, ...companySnap.data() } as Company);
              }
            }
          }
        } catch (e) {
          console.debug("Invite validation context check failed:", e);
        }
      }
    };
    const timer = setTimeout(checkToken, 500);
    return () => clearTimeout(timer);
  }, [form.manualToken, urlToken, form.email, authUser, urlEmail]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const activeToken = form.manualToken || urlToken;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (mode === 'JOIN' || (activeToken && !userDoc.exists())) {
        const inviteData = await validateInviteToken(activeToken || '', user.email || '');
        if (!inviteData) {
          throw new Error(`The invitation for ${user.email} is not valid or has already been used.`);
        }
        
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || form.name,
            companyId: inviteData.companyId,
            role: inviteData.role,
            status: 'active',
            createdAt: serverTimestamp()
          });
          await acceptInvite(inviteData.id);
        }
      } else if (mode === 'SIGNUP' && !userDoc.exists()) {
        const companyRef = await addDoc(collection(db, 'companies'), {
          name: form.companyName || `${user.displayName}'s Team`,
          ownerId: user.uid,
          plan: 'basic',
          createdAt: serverTimestamp()
        });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else if (mode === 'SIGNUP') {
        const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(user, { displayName: form.name });
        
        const companyRef = await addDoc(collection(db, 'companies'), {
          name: form.companyName,
          ownerId: user.uid,
          plan: 'basic',
          createdAt: serverTimestamp()
        });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: form.name,
          companyId: companyRef.id,
          role: UserRole.ADMIN,
          status: 'active',
          createdAt: serverTimestamp()
        });
      } else if (mode === 'JOIN') {
        const activeToken = form.manualToken || urlToken;
        const inviteData = await validateInviteToken(activeToken || '', form.email);
        
        if (!inviteData) {
          throw new Error("Invalid or expired invitation token.");
        }

        const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(user, { displayName: form.name });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: form.name,
          companyId: inviteData.companyId,
          role: inviteData.role,
          status: 'active',
          createdAt: serverTimestamp()
        });
        
        await acceptInvite(inviteData.id);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-slate-200 mx-auto mb-6">
            T
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Syncro Protocol</h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-3">Node Authentication System</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)]">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-700 leading-tight">{error}</p>
            </div>
          )}

          {mode === 'JOIN' && invitedCompany && (
            <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center space-x-4">
              <Building2 className="text-indigo-600" size={24} />
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Joining Organization</p>
                <p className="text-sm font-black text-indigo-900">{invitedCompany.name}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {(mode === 'SIGNUP' || mode === 'JOIN') && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Operator Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Endpoint</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {mode === 'SIGNUP' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    type="text"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Security Token (Password)</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none font-bold text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <span>Execute {mode === 'LOGIN' ? 'Login' : mode === 'SIGNUP' ? 'Onboarding' : 'Join'}</span>}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-300">Alternate Access</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center space-x-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span>Identity Provider</span>
          </button>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setError('');
                setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
              }}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
            >
              {mode === 'LOGIN' ? 'Initialize New Workspace?' : 'Return to Node Login?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

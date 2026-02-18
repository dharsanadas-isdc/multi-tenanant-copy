
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
import { ShieldCheck, AlertCircle, RefreshCw, Link2, Fingerprint, LogIn, Sparkles, Building2, Settings2, User } from 'lucide-react';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'JOIN';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  
  const [mode, setMode] = useState<AuthMode>(urlToken ? 'JOIN' : 'LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState(false);
  const [validatedInvite, setValidatedInvite] = useState<Invite | null>(null);
  const [invitedCompany, setInvitedCompany] = useState<Company | null>(null);
  
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    companyName: '',
    manualToken: urlToken || ''
  });
  
  const navigate = useNavigate();

  // Validate invite code and fetch company info
  useEffect(() => {
    const checkToken = async () => {
      const tokenToVerify = form.manualToken || urlToken;
      if (tokenToVerify && (urlToken || form.manualToken.length > 5)) {
        try {
          if (form.email.includes('@')) {
            const inviteData = await validateInviteToken(tokenToVerify, form.email);
            if (inviteData) {
              setValidatedInvite(inviteData);
              const companySnap = await getDoc(doc(db, 'companies', inviteData.companyId));
              if (companySnap.exists()) {
                setInvitedCompany({ id: companySnap.id, ...companySnap.data() } as Company);
              }
            }
          }
        } catch (e) {
          console.error("Token validation error:", e);
        }
      }
    };
    const timer = setTimeout(checkToken, 500);
    return () => clearTimeout(timer);
  }, [form.manualToken, urlToken, form.email]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setConfigError(false);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const activeToken = form.manualToken || urlToken;
      
      if (mode === 'JOIN' || activeToken) {
        // Check if the Google email matches the invitation email
        const inviteData = await validateInviteToken(activeToken || '', user.email || '');
        if (!inviteData) {
          throw new Error(`Sorry, the invitation for ${user.email} is not valid or has expired.`);
        }

        // Set up the new user profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email?.toLowerCase(),
          displayName: user.displayName || 'Team Member',
          companyId: inviteData.companyId,
          role: inviteData.role,
          status: 'active',
          createdAt: serverTimestamp()
        }, { merge: true });

        await acceptInvite(inviteData.id);
      } else {
        // Standard Google login for company owners
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() && mode === 'SIGNUP') {
          const companyRef = await addDoc(collection(db, 'companies'), {
            name: form.companyName || `${user.displayName}'s Company`,
            ownerId: user.uid,
            plan: 'basic',
            createdAt: serverTimestamp()
          });
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email?.toLowerCase(),
            displayName: user.displayName || 'Owner',
            companyId: companyRef.id,
            role: UserRole.ADMIN,
            status: 'active',
            createdAt: serverTimestamp()
          });
        }
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setConfigError(true);
        setError("System Error: Google Login is not enabled. Please enable it in your Firebase console.");
      } else {
        setError(err.message || "Something went wrong while logging in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'JOIN') return; // Join mode is Google only

    setLoading(true);
    setError('');

    try {
      if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        // Manual Sign Up for Owners
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const { user } = userCred;

        const companyRef = await addDoc(collection(db, 'companies'), {
          name: form.companyName || `${form.name}'s Company`,
          ownerId: user.uid,
          plan: 'basic',
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: form.email.toLowerCase(),
          displayName: form.name,
          companyId: companyRef.id,
          role: UserRole.ADMIN,
          status: 'active',
          createdAt: serverTimestamp()
        });

        await updateProfile(user, { displayName: form.name });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || "We couldn't log you in. Please check your details.");
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
            {mode === 'JOIN' ? 'Join Team' : (mode === 'LOGIN' ? 'Welcome Back' : 'Create Account')}
          </h1>
          
          {invitedCompany && (
            <div className="mt-6 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center space-y-2">
                <Building2 size={24} className="text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">You've been invited to</p>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{invitedCompany.name}</h2>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 flex items-start space-x-3 ${configError ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
            {configError ? <Settings2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {mode === 'JOIN' ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <ShieldCheck className="text-indigo-500" size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Verification</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                To join this team, please sign in with the Google account that matches the email you were invited with.
              </p>
              
              {!urlToken && (
                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Invite Code</label>
                  <input 
                    type="text" 
                    value={form.manualToken} 
                    onChange={e => setForm({...form, manualToken: e.target.value})} 
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-mono text-center text-[10px]" 
                    placeholder="Enter your invite code..." 
                  />
                </div>
              )}
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading || (!urlToken && !form.manualToken)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-slate-100 flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-30"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-5 h-5" alt="Google" />
                  <span>Sign in with Google to Join</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => setMode('LOGIN')}
              className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors py-2"
            >
              Cancel and Go Back
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'SIGNUP' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="e.g. Rick Sanchez" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Company Name</label>
                    <input required type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="e.g. Acme Corp" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="name@email.com" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-bold" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-slate-100 disabled:opacity-50 active:scale-95 mt-4">
                {loading ? <RefreshCw className="mx-auto animate-spin" size={18} /> : (mode === 'LOGIN' ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="relative my-8">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
               <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300"><span className="bg-white px-4 tracking-widest">or use</span></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 active:scale-95"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-4 h-4" alt="Google" />
              <span>Log in with Google</span>
            </button>

            <div className="mt-10 flex flex-col items-center space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {mode === 'LOGIN' ? "Need a workspace?" : "Already have an account?"}
                <button onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="ml-2 text-indigo-600 hover:underline">
                  {mode === 'LOGIN' ? 'Register Now' : 'Log In'}
                </button>
              </div>
              <button 
                onClick={() => setMode('JOIN')}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>Invited to a team? Join here</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  Search,
  Bell,
  ChevronRight,
  Globe
} from 'lucide-react';
import { auth } from '../../firebase';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center space-x-3">
      <Icon size={18} className={`${active ? (color || 'text-indigo-400') : 'text-slate-300 group-hover:text-slate-500'}`} />
      <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
    </div>
    {active && <ChevronRight size={14} className="text-slate-500" />}
  </button>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isSuperAdmin } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Analytics', path: '/' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CheckSquare, label: 'Matrix', path: '/tasks' },
    { icon: Users, label: 'Directory', path: '/team' },
    { icon: Settings, label: 'Protocol', path: '/settings' },
  ];

  if (isSuperAdmin) {
    menuItems.unshift({ icon: Globe, label: 'Nexus', path: '/nexus' });
  }

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col px-6 py-10">
          <div className="flex items-center space-x-4 mb-16 px-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">
              T
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Syncro</span>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.path}
                color={item.label === 'Nexus' ? 'text-rose-400' : undefined}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </nav>

          <div className="pt-8 border-t border-slate-50">
             <SidebarItem icon={LogOut} label="Shutdown" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-6">
            <button className="lg:hidden p-2 text-slate-400 hover:text-slate-900" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
               <Search size={16} className="text-slate-400 mr-3" />
               <input type="text" placeholder="Query system..." className="bg-transparent text-[11px] font-bold outline-none uppercase tracking-widest w-48" />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="p-2 text-slate-400 hover:text-slate-900 relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                isSuperAdmin ? 'bg-slate-900 text-white border-slate-900' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {profile?.role || 'Member'}
              </span>
              <img 
                src={`https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=${isSuperAdmin ? 'ef4444' : '0f172a'}&color=fff&bold=true`} 
                className="w-10 h-10 rounded-xl shadow-sm border border-slate-100"
                alt="Profile"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

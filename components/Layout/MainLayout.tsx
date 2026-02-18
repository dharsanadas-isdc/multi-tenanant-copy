
import React from 'react';
import { TopNavbar } from './TopNavbar';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <TopNavbar />
      <main className="flex-1 px-8 py-8 max-w-[1800px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

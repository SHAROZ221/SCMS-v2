import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    receptionist: 'bg-blue-100 text-blue-800 border-blue-200',
    technician: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-samsung-blue flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
            SC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-samsung-blue tracking-tight text-base leading-none">
                SAMSUNG
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Care
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight hidden sm:block">
              Service Center Management
            </p>
          </div>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
              <span
                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border mt-0.5 ${
                  roleColors[user.role] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

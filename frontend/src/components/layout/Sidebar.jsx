import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Smartphone,
  Wrench,
  Boxes,
  Receipt,
  BarChart3,
  ShieldCheck,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      label: 'Service Tickets',
      path: '/tickets',
      icon: Ticket,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
      roles: ['admin', 'receptionist'],
    },
    {
      label: 'Devices',
      path: '/devices',
      icon: Smartphone,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      label: 'Technicians',
      path: '/technicians',
      icon: Wrench,
      roles: ['admin', 'receptionist'],
    },
    {
      label: 'Spare Parts Inventory',
      path: '/inventory',
      icon: Boxes,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      label: 'Billing & Invoices',
      path: '/billing',
      icon: Receipt,
      roles: ['admin', 'receptionist'],
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      label: 'Staff Management',
      path: '/users',
      icon: ShieldCheck,
      roles: ['admin'],
    },
  ];

  const allowedNav = navItems.filter((item) => hasRole(...item.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-samsung-blue text-white flex items-center justify-center font-bold text-xs">
              SC
            </div>
            <span className="font-bold text-slate-800 text-sm">Navigation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operations
          </p>
          {allowedNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-samsung-subtle text-samsung-blue font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer Info Box */}
        <div className="p-3 m-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">SCMS v1.0 Connected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized Service Portal</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

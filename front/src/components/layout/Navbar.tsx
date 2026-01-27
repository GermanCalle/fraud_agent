"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, LayoutDashboard, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'HITL Queue', href: '/hitl', icon: Users },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden md:flex flex-col">
      <div className="p-6 flex items-center space-x-2 text-white">
        <ShieldAlert className="h-8 w-8 text-blue-500" />
        <span className="text-xl font-bold tracking-tight">Trace Fraud</span>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Admin Account</p>
            <p className="text-xs text-slate-500 truncate text-emerald-500">System Connected</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

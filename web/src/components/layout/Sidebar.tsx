/**
 * Sidebar - Navegação lateral
 */

import { NavLink } from 'react-router-dom';
import { Home, Building2, Users, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/condominiums', icon: Building2, label: 'Condomínios' },
  { to: '/assemblies', icon: Users, label: 'Assembleias' },
  { to: '/qr-codes', icon: QrCode, label: 'QR Codes' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

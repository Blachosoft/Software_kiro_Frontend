/**
 * Quick Access Sidebar - Barra lateral con accesos rápidos
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface QuickAccessItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

const quickAccessItems: QuickAccessItem[] = [
  {
    id: 'sales',
    label: 'Nueva Venta',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    href: '/sales',
  },
  {
    id: 'history',
    label: 'Historial',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    href: '/reports',
  },
  {
    id: 'returns',
    label: 'Devoluciones',
    icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
    href: '/sales',
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    href: '/reports',
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    href: '/inventory',
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    href: '/customers',
  },
];

export function QuickAccessSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname?.includes(href);
  };

  return (
    <aside className="w-20 bg-white border-r border-neutral-border flex flex-col items-center py-4 space-y-2">
      {quickAccessItems.map((item) => {
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`relative w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all ${
              active
                ? 'bg-corporate-primary text-white shadow-lg'
                : 'text-gray-600 hover:bg-neutral-bg hover:text-corporate-primary'
            }`}
            title={item.label}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-xs font-medium text-center leading-tight">
              {item.label.split(' ')[0]}
            </span>
            
            {item.badge && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}

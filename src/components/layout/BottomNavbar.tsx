'use client';

import Link from 'next/link';
import { Home, Film, Tv, Bookmark } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: ElementType;
    highlight?: boolean;
}

// Simple static navbar data
const navItems: NavItem[] = [
    { title: "الرئيسية", href: "/", icon: Home },
    { title: "أفلام", href: "/movies", icon: Film },
    { title: "مسلسلات", href: "/tv", icon: Tv },
    { title: "قائمتي", href: "/watchlist", icon: Bookmark },
    
];

export default function BottomNavbar() {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-lg lg:hidden" 
         style={{
           zIndex: 9999,
           paddingBottom: 'env(safe-area-inset-bottom, 0px)',
         }}>
      <div className="grid grid-cols-4 w-full">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 text-center transition-colors ${
                active 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              } ${item.highlight ? 'font-semibold' : ''}`}
            >
              <Icon className={`h-6 w-6 mb-1 ${active ? 'fill-current' : ''} ${item.highlight && !active ? 'text-blue-500 dark:text-blue-300' : ''}`} />
              <span className={`text-xs font-medium ${item.highlight && !active ? 'text-blue-500 dark:text-blue-300' : ''}`}>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 
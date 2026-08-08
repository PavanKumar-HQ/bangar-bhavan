import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, BarChart3, History, UtensilsCrossed, Settings as SettingsIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Billing', icon: ShoppingBag },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/history', label: 'History', icon: History },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="bg-cream-100 border-t-2 border-cream-300 sm:border-t-0 sm:border-b border-cream-300 py-1.5 px-2 flex justify-around sm:justify-start sm:gap-2 shadow-inner z-30">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-deepred-800 text-cream-50 shadow-md ring-2 ring-deepred-600'
                  : 'text-darkbrown-800 hover:bg-cream-200/80 hover:text-deepred-800'
              }`
            }
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

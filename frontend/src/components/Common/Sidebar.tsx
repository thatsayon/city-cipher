// components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Package,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      name: 'Map',
      href: '/dashboard/map',
      icon: <Users size={20} />
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <Package size={20} />,
    },
    {
      name: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: <BarChart3 size={20} />
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: <CreditCard size={20} />
    }
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const active = isActive(item.href);

    return (
      <div key={item.name}>
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
            active
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          } ${level > 0 ? 'ml-6' : ''}`}
          onClick={() => {
            if (hasChildren && !isCollapsed) {
              toggleExpanded(item.name);
            }
          }}
        >
          <Link href={item.href} className="flex items-center flex-1">
            <div className="flex items-center space-x-3">
              <span className={`transition-colors duration-200 ${active ? 'text-white' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
            </div>
            {!isCollapsed && item.badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                active 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-600 text-gray-200'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
          {!isCollapsed && hasChildren && (
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
        
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gray-800 border-r border-gray-700 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Admin</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-3">
          <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}>
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
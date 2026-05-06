// app/components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, X, User, LogOut, LayoutDashboard, Dumbbell, CreditCard, 
  Home, ChevronDown, Shield, Building, Crown, Calendar, 
  Activity, Users, BarChart3, Settings, Clock, Award, MapPin
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isAdmin, isGymManager } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
    setDropdownOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Нүүр', icon: <Home size={18} /> },
    { href: '/dashboard/gyms', label: 'Фитнес төвүүд', icon: <Dumbbell size={18} /> },
    { href: '/plans', label: 'Үнийн багц', icon: <CreditCard size={18} /> },
  ];

  const adminMenuItems = [
    { href: '/admin/dashboard', label: 'Хянах самбар', icon: <LayoutDashboard size={16} /> },
    { href: '/admin/dashboard/users', label: 'Хэрэглэгчид', icon: <Users size={16} /> },
    { href: '/admin/dashboard/gyms', label: 'Фитнес төвүүд', icon: <Building size={16} /> },
    { href: '/admin/dashboard/plans', label: 'Төлөвлөгөө', icon: <CreditCard size={16} /> },
  ];

  const gymOwnerMenuItems = [
    { href: '/gym-owner/dashboard', label: 'Хянах самбар', icon: <LayoutDashboard size={16} /> },
    { href: '/gym-owner/checkins', label: 'Check-in бүртгэл', icon: <Activity size={16} /> },
    { href: '/gym-owner/active-users', label: 'Хэрэглэгч хянах', icon: <LayoutDashboard size={16} /> },
  ];

  const userMenuItems = [
    { href: '/dashboard', label: 'Хянах самбар', icon: <LayoutDashboard size={16} /> },
    { href: '/dashboard/gyms', label: 'Фитнес төвүүд', icon: <Dumbbell size={16} /> },
    { href: '/dashboard/membership', label: 'Миний гишүүнчлэл', icon: <CreditCard size={16} /> },
    { href: '/dashboard/profile', label: 'Профайл', icon: <User size={16} /> },
  ];

  const getDropdownMenuItems = () => {
    if (isAdmin()) return adminMenuItems;
    if (isGymManager()) return gymOwnerMenuItems;
    return userMenuItems;
  };

  const getRoleInfo = () => {
    if (isAdmin()) {
      return { name: 'Админ', icon: <Crown size={14} />, color: 'bg-purple-100 text-purple-700' };
    }
    if (isGymManager()) {
      return { name: 'Gym эзэмшигч', icon: <Building size={14} />, color: 'bg-blue-100 text-blue-700' };
    }
    return { name: 'Хэрэглэгч', icon: <User size={14} />, color: 'bg-green-100 text-green-700' };
  };

  const roleInfo = getRoleInfo();
  const dropdownItems = getDropdownMenuItems();
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg md:text-xl">G</span>
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              GymHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all ${
                  isActive(link.href)
                    ? 'bg-green-50 text-green-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-green-600'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 lg:px-4 py-2 rounded-lg transition"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.split(' ')[0] || 'Хэрэглэгч'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 mb-2">
                      <p className="text-xs text-gray-500">Нэвтэрсэн</p>
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-2 ${roleInfo.color}`}>
                        {roleInfo.icon}
                        <span>{roleInfo.name}</span>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={16} />
                        <span>Гарах</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-green-600 transition">
                  Нэвтрэх
                </Link>
                <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md">
                  Бүртгүүлэх
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(link.href)
                      ? 'bg-green-50 text-green-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${roleInfo.color}`}>
                          {roleInfo.icon}
                          <span>{roleInfo.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isAdmin() ? 'Админ хэсэг' : isGymManager() ? 'Gym удирдлага' : 'Хянах самбар'}
                    </p>
                  </div>
                  
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-2"
                  >
                    <LogOut size={18} />
                    <span>Гарах</span>
                  </button>
                </>
              ) : (
                <div className="pt-4 space-y-2">
                  <Link 
                    href="/login" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Нэвтрэх
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold"
                  >
                    Бүртгүүлэх
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
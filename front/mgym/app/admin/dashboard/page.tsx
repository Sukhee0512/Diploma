// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { Users, Building, CreditCard, Activity, Calendar, TrendingUp, Shield, Settings, BarChart3, Award, Loader2 } from 'lucide-react';
import { getDashboardStats } from '@/app/lib/api';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    total_users: 0,
    total_gyms: 0,
    active_memberships: 0,
    today_checkins: 0,
    total_plans: 0,
    total_checkins: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getDashboardStats();
      console.log('Dashboard stats:', response);
      
      if (response.resultCode === 200 && response.data) {
        setStats({
          total_users: response.data.total_users || 0,
          total_gyms: response.data.total_gyms || 0,
          active_memberships: response.data.active_memberships || 0,
          today_checkins: response.data.today_checkins || 0,
          total_plans: response.data.total_plans || 0,
          total_checkins: response.data.total_checkins || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-800 mx-auto mb-4" />
          <p className="text-gray-700">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const statCards = [
    { label: 'Нийт хэрэглэгчид', value: stats.total_users, icon: <Users size={24} />, color: 'bg-gray-800' },
    { label: 'Фитнес төвүүд', value: stats.total_gyms, icon: <Building size={24} />, color: 'bg-gray-700' },
    { label: 'Идэвхтэй гишүүнчлэл', value: stats.active_memberships, icon: <CreditCard size={24} />, color: 'bg-gray-600' },
    { label: 'Өнөөдрийн check-in', value: stats.today_checkins, icon: <Activity size={24} />, color: 'bg-gray-800' },
  ];

  const adminMenus = [
    { href: '/admin/users', label: 'Хэрэглэгчид', icon: <Users size={20} />, description: 'Хэрэглэгчдийн эрхийг өөрчлөх, gym эзэмшигч томилох' },
    { href: '/admin/gyms', label: 'Фитнес төвүүд', icon: <Building size={20} />, description: 'Фитнес төвүүдийг нэмэх, засварлах, устгах' },
    { href: '/admin/plans', label: 'Төлөвлөгөө', icon: <Award size={20} />, description: 'Гишүүнчлэлийн төлөвлөгөөг удирдах, CRUD үйлдэл' },
    { href: '/admin/memberships', label: 'Гишүүнчлэл', icon: <CreditCard size={20} />, description: 'Бүх гишүүнчлэлийн жагсаалт, төлөв харах' },
    { href: '/admin/checkins', label: 'Check-in түүх', icon: <Calendar size={20} />, description: 'Бүх gym-уудын check-in түүхийг харах' },
    { href: '/admin/statistics', label: 'Аналитик', icon: <BarChart3 size={20} />, description: 'Статистик мэдээлэл, график үзүүлэлтүүд' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Тавтай морил, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Та admin эрхээр нэвтэрлээ. Системийг бүрэн удирдах боломжтой.
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            <Shield size={12} />
            <span>Админ эрх</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Menus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-xl text-gray-700 group-hover:bg-gray-800 group-hover:text-white transition-all">
                  {menu.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition">
                    {menu.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {menu.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Сүүлийн үйл ажиллагаа</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Хэрэглэгчдийн тоо {stats.total_users} болж өссөн</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Өнөөдөр {stats.today_checkins} удаа check-in хийгдсэн</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Нийт {stats.active_memberships} идэвхтэй гишүүнчлэл байна</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
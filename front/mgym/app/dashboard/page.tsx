// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, CreditCard, MapPin, Calendar, 
  User, Clock, Award, ChevronRight, Dumbbell
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getUserMemberships, getUserCheckins } from '@/app/lib/api';

export default function UserDashboardPage() {
  const { user, isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [membership, setMembership] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    visitedGyms: 0,
    daysLeft: 0
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not regular user
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (userRole === 'gym_manager') {
        router.push('/gym-owner/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, userRole, router]);

  useEffect(() => {
    if (user && userRole === 'user') {
      fetchDashboardData();
    }
  }, [user, userRole]);

  const fetchDashboardData = async () => {
    try {
      const membershipsRes = await getUserMemberships(user!.id);
      if (membershipsRes.resultCode === 200 && membershipsRes.data?.length > 0) {
        const activeMembership = membershipsRes.data.find((m: any) => m.status === 'active');
        setMembership(activeMembership);
        
        if (activeMembership?.end_date) {
          const endDate = new Date(activeMembership.end_date);
          const today = new Date();
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          setStats(prev => ({ ...prev, daysLeft: Math.max(0, daysLeft) }));
        }
      }
      
      const checkinsRes = await getUserCheckins(user!.id);
      if (checkinsRes.resultCode === 200 && checkinsRes.data) {
        setRecentCheckins(checkinsRes.data.slice(0, 5));
        setStats(prev => ({ 
          ...prev, 
          totalWorkouts: checkinsRes.data.length,
          visitedGyms: new Set(checkinsRes.data.map((c: any) => c.gym_id)).size
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (userRole !== 'user') return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Сайн уу, {user?.name?.split(' ')[0] || 'Гишүүн'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Өнөөдрийн дасгалын төлөвлөгөөнд тавтай морил</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.daysLeft}</span>
            </div>
            <p className="text-sm text-gray-600">Үлдсэн өдөр</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Dumbbell className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.totalWorkouts}</span>
            </div>
            <p className="text-sm text-gray-600">Дасгал хийсэн</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="text-purple-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.visitedGyms}</span>
            </div>
            <p className="text-sm text-gray-600">Орсон фитнес</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="text-yellow-600" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-800 truncate">
                {membership?.plan_name?.split(' ')[0] || 'Premium'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Төлөвлөгөө</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Түргэн үйлдлүүд</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/gyms" className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all border border-gray-100 group">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition">
                <MapPin size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">Фитнес хайх</span>
            </Link>
            <Link href="/dashboard/history" className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all border border-gray-100 group">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition">
                <Calendar size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">Түүх харах</span>
            </Link>
            <Link href="/dashboard/membership" className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all border border-gray-100 group">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition">
                <CreditCard size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">Гишүүнчлэл сунгах</span>
            </Link>
            <Link href="/dashboard/profile" className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all border border-gray-100 group">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition">
                <User size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">Профайл засах</span>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Check-ins */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Сүүлийн Check-in-ууд</h2>
              <Link href="/dashboard/history" className="text-sm text-green-600 hover:underline">
                Бүгдийг харах
              </Link>
            </div>
            
            {recentCheckins.length > 0 ? (
              <div className="space-y-3">
                {recentCheckins.map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Dumbbell size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{checkin.gym_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(checkin.checkin_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Check-in түүх байхгүй</p>
                <Link href="/gyms" className="text-green-600 text-sm hover:underline mt-2 inline-block">
                  Фитнес руу явах
                </Link>
              </div>
            )}
          </div>

          {/* Membership Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Гишүүнчлэлийн мэдээлэл</h2>
              <Link href="/dashboard/membership" className="text-sm text-green-600 hover:underline">
                Дэлгэрэнгүй
              </Link>
            </div>
            
            {membership ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Төлөвлөгөө</span>
                  <span className="font-semibold text-gray-800">{membership.plan_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Эхэлсэн огноо</span>
                  <span className="text-gray-800">{new Date(membership.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Дуусах огноо</span>
                  <span className="text-gray-800">{new Date(membership.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Статус</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    membership.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {membership.status === 'active' ? 'Идэвхтэй' : 'Дууссан'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Award size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Идэвхтэй гишүүнчлэл байхгүй</p>
                <Link href="/plans" className="text-green-600 text-sm hover:underline mt-2 inline-block">
                  Гишүүнчлэл авах
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Membership Status Bar */}
        {membership && membership.status === 'active' && (
          <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={24} />
                  <h3 className="text-xl font-bold">{membership.plan_name} Гишүүнчлэл</h3>
                </div>
                <p className="text-green-100">
                  Таны гишүүнчлэл {new Date(membership.end_date).toLocaleDateString()} хүртэл хүчинтэй
                </p>
              </div>
              <Link
                href="/dashboard/membership"
                className="mt-4 md:mt-0 bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
              >
                Сунгах
              </Link>
            </div>
            <div className="mt-4">
              <div className="bg-green-400/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (membership.duration_days - stats.daysLeft) / membership.duration_days * 100)}%` }}
                />
              </div>
              <p className="text-sm text-green-100 mt-2">
                {Math.round((membership.duration_days - stats.daysLeft) / membership.duration_days * 100)}% ашигласан
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
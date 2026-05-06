// app/gym-owner/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, MapPin, CalendarDays, Users, Activity, Settings } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getMyGym, getMyGymStats } from '@/app/lib/api';

export default function GymOwnerDashboardPage() {
  const { user, isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const [gym, setGym] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (userRole !== 'gym_manager') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, userRole, router]);

  useEffect(() => {
    if (user && userRole === 'gym_manager') {
      fetchGymData();
    }
  }, [user, userRole]);

  const fetchGymData = async () => {
    setLoading(true);
    try {
      // Get gym owned by this user
      const gymResponse = await getMyGym(user!.id);
      console.log('My gym response:', gymResponse);
      
      if (gymResponse.resultCode === 200 && gymResponse.data && gymResponse.data.length > 0) {
        const gymData = gymResponse.data[0];
        setGym(gymData);
        
        // Get stats
        const statsResponse = await getMyGymStats(user!.id);
        if (statsResponse.resultCode === 200 && statsResponse.data) {
          setStats(statsResponse.data);
        }
      } else {
        // No gym assigned yet
        setGym(null);
      }
    } catch (error) {
      console.error('Error fetching gym data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Building size={64} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Gym оноогоогүй байна</h1>
          <p className="text-gray-600 mb-6">
            Таны бүртгэлд gym оноогоогүй байна. Админ холбогдож gym оноолгоорой.
          </p>
          <button
            onClick={() => router.push('/contact')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Админтай холбогдох
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Тавтай морил, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">Таны gym-ын удирдлагын самбар</p>
        </div>

        {/* Gym Info Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building size={24} />
                <h2 className="text-xl font-bold">{gym.name}</h2>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <MapPin size={16} />
                <span>{gym.location}</span>
              </div>
              <div className="text-sm text-green-100 mt-2">
                Бүртгүүлсэн: {new Date(gym.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => router.push('/gym-owner/dashboard/settings')}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
            >
              <Settings size={16} />
              Тохиргоо
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarDays size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Өнөөдрийн check-in</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.today_checkins || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Энэ долоо хоног</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.week_checkins || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Нийт check-in</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.total_checkins || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/gym-owner/dashboard/checkins')}
            className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDays size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Check-in түүх</h3>
              <p className="text-sm text-gray-500">Өдрийн check-in бүртгэл, түүх</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/gym-owner/dashboard/attendance')}
            className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Ирцийн тайлан</h3>
              <p className="text-sm text-gray-500">Статистик мэдээлэл</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
// app/gym-owner/dashboard/attendance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getMyGym, getGymAttendance, getAttendanceReport, getMyGymStats } from '@/app/lib/api';

interface AttendanceRecord {
  id: number;
  user_name: string;
  user_email: string;
  checkin_time: string;
  verified_at?: string;
  verified_by_name?: string;
  plan_name?: string;
}

interface DailyStats {
  date: string;
  count: number;
  verified_count: number;
  pending_count: number;
}

export default function AttendancePage() {
  const { user, isAuthenticated, isLoading, isGymManager } = useAuth();
  const router = useRouter();
  
  const [gymId, setGymId] = useState<number | null>(null);
  const [gymName, setGymName] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [stats, setStats] = useState({
    today_count: 0,
    week_count: 0,
    month_count: 0,
    total_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isGymManager())) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isGymManager, router]);

  useEffect(() => {
    if (user && isGymManager()) {
      fetchGymInfo();
    }
  }, [user]);

  useEffect(() => {
    if (gymId) {
      fetchAttendance();
      fetchStats();
      fetchDailyStats();
    }
  }, [gymId, selectedDate, period]);

  const fetchGymInfo = async () => {
    try {
      const response = await getMyGym(user!.id);
      console.log('Gym info:', response);
      
      if (response.resultCode === 200 && response.data) {
        const gym = response.data[0];
        setGymId(gym.id);
        setGymName(gym.name);
      }
    } catch (error) {
      console.error('Error fetching gym info:', error);
    }
  };

  const fetchAttendance = async () => {
    if (!gymId) return;
    
    setLoading(true);
    try {
      const response = await getGymAttendance(gymId, selectedDate, selectedDate);
      console.log('Attendance response:', response);
      
      if (response.resultCode === 200 && response.data) {
        setAttendance(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!gymId) return;
    
    try {
      const response = await getMyGymStats(user!.id);
      console.log('Stats response:', response);
      
      if (response.resultCode === 200 && response.data) {
        setStats({
          today_count: response.data.today_checkins || 0,
          week_count: response.data.week_checkins || 0,
          month_count: response.data.month_checkins || 0,
          total_count: response.data.total_checkins || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDailyStats = async () => {
    if (!gymId) return;
    
    try {
      const response = await getAttendanceReport(gymId, period);
      console.log('Daily stats response:', response);
      
      if (response.resultCode === 200 && response.data) {
        setDailyStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    const headers = ['Огноо', 'Хэрэглэгч', 'Имэйл', 'Check-in цаг', 'Төлөв', 'Баталгаажуулсан'];
    const rows = attendance.map(record => [
      new Date(record.checkin_time).toLocaleDateString(),
      record.user_name,
      record.user_email,
      new Date(record.checkin_time).toLocaleTimeString(),
      record.verified_at ? 'Баталгаажсан' : 'Хүлээгдэж байна',
      record.verified_by_name || '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.verified_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle size={12} />
          Баталгаажсан
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
        <Clock size={12} />
        Хүлээгдэж байна
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gray-800" />
      </div>
    );
  }

  if (!gymId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <Building size={48} className="mx-auto mb-3 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Гимнастик олдсонгүй</h2>
            <p className="text-gray-600">Танд гишүүнчлэл олгогдоогүй байна. Админтай холбогдоно уу.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ирцийн тайлан</h1>
          <p className="text-gray-600 mt-1">
            {gymName} - Гишүүдийн ирцийн бүрэн статистик
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Өнөөдрийн ирц</p>
                <p className="text-3xl font-bold text-gray-900">{stats.today_count}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <Calendar size={24} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">7 хоногийн ирц</p>
                <p className="text-3xl font-bold text-gray-900">{stats.week_count}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <TrendingUp size={24} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Сарын ирц</p>
                <p className="text-3xl font-bold text-gray-900">{stats.month_count}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <BarChart3 size={24} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Нийт ирц</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_count}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <Users size={24} className="text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ирцийн график</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('daily')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    period === 'daily' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Өдөр
                </button>
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    period === 'weekly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Долоо хоног
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    period === 'monthly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Сар
                </button>
              </div>
            </div>
            <div className="h-64 flex items-end gap-2">
              {dailyStats.length > 0 ? (
                dailyStats.map((stat, index) => {
                  const maxCount = Math.max(...dailyStats.map(s => s.count), 1);
                  const height = (stat.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full group">
                        <div 
                          className="bg-gray-700 rounded-t-lg transition-all duration-300 hover:bg-gray-800"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {stat.count} ирц
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 rotate-45 origin-left">
                        {new Date(stat.date).getDate()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-gray-500 py-8">
                  Мэдээлэл байхгүй байна
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ирцийн хураангуй</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Нийт ирц</span>
                <span className="text-2xl font-bold text-gray-900">{stats.total_count}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Өдрийн дундаж ирц</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.total_count > 0 ? Math.round(stats.total_count / 30) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Хамгийн их ирцтэй өдөр</span>
                <span className="text-2xl font-bold text-gray-900">
                  {dailyStats.length > 0 ? Math.max(...dailyStats.map(s => s.count)) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Ирцийн дэлгэрэнгүй мэдээлэл</h2>
              <div className="flex items-center gap-3">
                {/* Date Navigation */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleDateChange(-1)}
                    className="p-1.5 rounded-lg hover:bg-white transition"
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm text-gray-800"
                    >
                      <Calendar size={16} />
                      {new Date(selectedDate).toLocaleDateString()}
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border p-2 z-10">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setShowDatePicker(false);
                          }}
                          className="px-3 py-2 border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDateChange(1)}
                    className="p-1.5 rounded-lg hover:bg-white transition"
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">Энэ өдөр ирцийн мэдээлэл байхгүй байна</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Хэрэглэгч
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имэйл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in цаг
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлөв
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Баталгаажуулсан
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.user_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{record.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(record.checkin_time).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {record.verified_by_name || '-'}
                        </div>
                        {record.verified_at && (
                          <div className="text-xs text-gray-400">
                            {new Date(record.verified_at).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing import for Building
import { Building } from 'lucide-react';
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Dumbbell,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  Download,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Award,
  Info,
  LogOut
} from 'lucide-react';
import { getUserCheckins } from '@/app/lib/api';

interface CheckinRecord {
  id: number;
  user_id: number;
  gym_id: number;
  checkin_time: string;
  gym_name: string;
  gym_location: string;
  verification_status?: string;
  verified_at?: string;
  verified_by_name?: string;
  notes?: string;
  checkout_time?: string;
  duration_minutes?: number;
  duration_formatted?: string;
  checkout_status?: string;
}

export default function CheckinHistoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [filteredCheckins, setFilteredCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [uniqueGyms, setUniqueGyms] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CheckinRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    mostVisitedGym: '',
    totalDuration: 0,
    averageDuration: 0,
    totalWorkouts: 0
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'user')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user && user.role === 'user') {
      fetchCheckinHistory();
    }
  }, [user]);

  useEffect(() => {
    filterCheckins();
  }, [searchTerm, selectedMonth, selectedGym, checkins]);

  const fetchCheckinHistory = async () => {
    setLoading(true);
    try {
      const response = await getUserCheckins(user!.id);
      console.log('Checkin history:', response);
      
      if (response.resultCode === 200 && response.data) {
        let checkinsData = [];
        if (Array.isArray(response.data)) {
          checkinsData = response.data;
        } else if (response.data.checkins) {
          checkinsData = response.data.checkins;
        } else {
          checkinsData = [];
        }
        
        // Transform data to include checkout info
        const transformedData = checkinsData.map((record: any) => ({
          ...record,
          checkout_time: record.checkout_time || null,
          duration_minutes: record.duration_minutes || 0,
          duration_formatted: record.duration_formatted || formatDuration(record.duration_minutes),
          checkout_status: record.checkout_status || (record.checkout_time ? 'checked_out' : 'active')
        }));
        
        setCheckins(transformedData);
        setFilteredCheckins(transformedData);
        
        // Extract unique gyms
        const gyms = [...new Set(transformedData.map((c: CheckinRecord) => c.gym_name))];
        setUniqueGyms(gyms);
        
        // Calculate stats
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        
        const thisMonthCount = transformedData.filter((c: CheckinRecord) => {
          const date = new Date(c.checkin_time);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        
        const lastMonthCount = transformedData.filter((c: CheckinRecord) => {
          const date = new Date(c.checkin_time);
          return date.getMonth() === lastMonthDate.getMonth() && 
                 date.getFullYear() === lastMonthDate.getFullYear();
        }).length;
        
        // Find most visited gym
        const gymCount: Record<string, number> = {};
        transformedData.forEach((c: CheckinRecord) => {
          gymCount[c.gym_name] = (gymCount[c.gym_name] || 0) + 1;
        });
        let mostVisited = '';
        let maxCount = 0;
        for (const [gym, count] of Object.entries(gymCount)) {
          if (count > maxCount) {
            maxCount = count;
            mostVisited = gym;
          }
        }
        
        // Calculate total and average duration
        let totalDuration = 0;
        let durationCount = 0;
        let totalWorkouts = 0;
        transformedData.forEach((c: CheckinRecord) => {
          if (c.duration_minutes && c.duration_minutes > 0) {
            totalDuration += c.duration_minutes;
            durationCount++;
          }
          if (c.checkout_time) {
            totalWorkouts++;
          }
        });
        
        setStats({
          total: transformedData.length,
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount,
          mostVisitedGym: mostVisited,
          totalDuration: totalDuration,
          averageDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
          totalWorkouts: totalWorkouts
        });
      }
    } catch (error) {
      console.error('Error fetching checkin history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCheckins = () => {
    let filtered = [...checkins];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.gym_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.gym_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGym) {
      filtered = filtered.filter(c => c.gym_name === selectedGym);
    }
    
    if (selectedMonth) {
      filtered = filtered.filter(c => {
        const date = new Date(c.checkin_time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });
    }
    
    setFilteredCheckins(filtered);
  };

  

  const getStatusBadge = (status?: string, checkoutTime?: string) => {
    if (checkoutTime) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
          <LogOut size={12} />
          Гарсан
        </span>
      );
    }
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle size={12} />
          Орсон
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
        <ClockIcon size={12} />
        Хүлээгдэж байна
      </span>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes || minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ц ${mins}мин`;
    }
    return `${mins}мин`;
  };

  const getDurationColor = (minutes?: number) => {
    if (!minutes || minutes === 0) return 'text-gray-400';
    if (minutes < 30) return 'text-yellow-600';
    if (minutes < 90) return 'text-blue-600';
    return 'text-green-600';
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()} оны ${date.getMonth() + 1} сар`;
      options.push({ value, label });
    }
    return options;
  };

  const openDetailModal = (record: CheckinRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={18} />
              <span>Буцах</span>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gym-д орсон түүх</h1>
          <p className="text-gray-600 mt-1">Таны фитнес төвүүдэд хийсэн Gym-д орсон дэлгэрэнгүй түүх</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Нийт check-in</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <Dumbbell size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Энэ сард</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <Calendar size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Өнгөрсөн сард</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lastMonth}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <Calendar size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Дасгал хийсэн</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <TrendingUp size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Нийт дасгал цаг</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(stats.totalDuration)}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <Clock size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Дундаж дасгал</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(stats.averageDuration)}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-xl">
                <Award size={20} className="text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Most Visited Gym Card */}
        {stats.mostVisitedGym && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center gap-3">
              <Award size={24} className="text-yellow-400" />
              <div>
                <p className="text-sm opacity-80">Хамгийн их явсан фитнес төв</p>
                <p className="text-lg font-semibold">{stats.mostVisitedGym}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                <input
                  type="text"
                  placeholder="Фитнес нэр, байршлаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-gray-800"
                />
              </div>
            </div>
            <div className="w-40">
              <select
                value={selectedGym}
                onChange={(e) => setSelectedGym(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-black"
              >
                <option value="">Бүх фитнес</option>
                {uniqueGyms.map((gym) => (
                  <option key={gym} value={gym}>{gym}</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-black"
              >
                <option value="">Бүх сар</option>
                {getMonthOptions().map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
          </div>
        </div>

        {/* Checkin List */}
        {filteredCheckins.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <ClockIcon size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check-in түүх байхгүй байна</h3>
            <p className="text-gray-500 mb-4">Та фитнес төвүүдэд check-in хийгээгүй байна</p>
            <Link
              href="/dashboard/gyms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              <Dumbbell size={18} />
              Фитнес төвүүд үзэх
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Орсон цаг</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гарсан цаг</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фитнес төв</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байршил</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дасгал хийсэн</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCheckins.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openDetailModal(record)}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.checkin_time).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.checkin_time).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Dumbbell size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{record.gym_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 truncate max-w-[120px]">{record.gym_location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(record.verification_status, record.checkout_time)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.duration_minutes && record.duration_minutes > 0 ? (
                          <span className={`text-sm font-medium ${getDurationColor(record.duration_minutes)}`}>
                            {record.duration_formatted || formatDuration(record.duration_minutes)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button className="text-gray-400 hover:text-gray-600 transition">
                          <Info size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Нийт <span className="font-semibold text-gray-900">{filteredCheckins.length}</span> check-in
                {filteredCheckins.length !== checkins.length && (
                  <span className="text-gray-500 ml-1">(нийт {checkins.length}-оос)</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Check-in дэлгэрэнгүй</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Gym Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <Dumbbell size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedRecord.gym_name}</p>
                    <p className="text-xs text-gray-500">{selectedRecord.gym_location}</p>
                  </div>
                </div>
              </div>

              {/* Checkin Time */}
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Орсон цаг</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(selectedRecord.checkin_time).toLocaleString()}
                </p>
              </div>

              {/* Checkout Time */}
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Гарсан цаг</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedRecord.checkout_time ? new Date(selectedRecord.checkout_time).toLocaleString() : '-'}
                </p>
              </div>

              {/* Duration */}
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Дасгал хийсэн хугацаа</p>
                <p className={`text-lg font-semibold ${getDurationColor(selectedRecord.duration_minutes)}`}>
                  {selectedRecord.duration_formatted || formatDuration(selectedRecord.duration_minutes) || '-'}
                </p>
              </div>

              {/* Status */}
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Төлөв</p>
                <div>{getStatusBadge(selectedRecord.verification_status, selectedRecord.checkout_time)}</div>
              </div>

              {/* Verified By */}
              {selectedRecord.verified_by_name && (
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Баталгаажуулсан</p>
                  <p className="text-sm text-gray-900">{selectedRecord.verified_by_name}</p>
                  {selectedRecord.verified_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(selectedRecord.verified_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedRecord.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Тайлбар</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// app/gym-owner/active-users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getGymActiveCheckins, createCheckout, getGymAttendance } from '@/app/lib/api';
import { 
  Users, Clock, RefreshCw, Loader2, ArrowLeft, 
  Search, LogOut, X, CheckCircle, XCircle, History,
  Calendar, MapPin, Dumbbell
} from 'lucide-react';
import Link from 'next/link';

interface ActiveUser {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  checkin_time: string;
  duration_minutes: number;
  duration_formatted: string;
}

interface HistoryRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  checkin_time: string;
  checkout_time?: string;
  duration_minutes: number;
  duration_formatted: string;
  verified_by_name?: string;
}

export default function ActiveUsersPage() {
  const { user, isAuthenticated, isLoading, isGymManager } = useAuth();
  const router = useRouter();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ActiveUser[]>([]);
  const [historyUsers, setHistoryUsers] = useState<HistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isGymManager())) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isGymManager, router]);

  useEffect(() => {
    if (user && isGymManager()) {
      fetchActiveUsers();
      fetchHistoryUsers();
      
      const interval = setInterval(() => {
        fetchActiveUsers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(activeUsers);
    } else {
      const filtered = activeUsers.filter(u => 
        u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.user_phone && u.user_phone.includes(searchTerm))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, activeUsers]);

  useEffect(() => {
    if (historySearchTerm.trim() === '') {
      setFilteredHistory(historyUsers);
    } else {
      const filtered = historyUsers.filter(u => 
        u.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        u.user_email.toLowerCase().includes(historySearchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [historySearchTerm, historyUsers]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchActiveUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getGymActiveCheckins(user.id);
      console.log('Active users response:', response);
      
      if (response.resultCode === 200 && response.data) {
        let usersData = [];
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data.checkins) {
          usersData = response.data.checkins;
        } else {
          usersData = [];
        }
        setActiveUsers(usersData);
        setFilteredUsers(usersData);
      } else if (response.resultCode === 404) {
        setActiveUsers([]);
        setFilteredUsers([]);
        setError(response.resultMessage || 'Гимнастик олдсонгүй');
      } else {
        setActiveUsers([]);
        setFilteredUsers([]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching active users:', error);
      setActiveUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryUsers = async () => {
    if (!user) return;
    
    setHistoryLoading(true);
    
    try {
      const response = await getGymAttendance(user.id);
      console.log('History users response:', response);
      
      if (response.resultCode === 200 && response.data) {
        // Handle the response structure correctly
        let historyData = [];
        
        // Response data structure: { gym_id, gym_name, history: [], total }
        if (response.data.history && Array.isArray(response.data.history)) {
          historyData = response.data.history;
        } else if (Array.isArray(response.data)) {
          historyData = response.data;
        } else {
          historyData = [];
        }
        
        console.log('History data array:', historyData);
        
        const transformedData = historyData.map((record: any) => {
          const duration = record.duration_minutes || 0;
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          return {
            id: record.id,
            user_id: record.user_id,
            user_name: record.user_name || 'Хэрэглэгч',
            user_email: record.user_email || '',
            checkin_time: record.checkin_time,
            checkout_time: record.checkout_time,
            duration_minutes: duration,
            duration_formatted: hours > 0 ? `${hours}ц ${minutes}мин` : `${minutes}мин`,
            verified_by_name: record.verified_by_name
          };
        });
        
        console.log('Transformed history data:', transformedData);
        setHistoryUsers(transformedData);
        setFilteredHistory(transformedData);
      } else {
        console.log('No history data or error:', response.resultMessage);
        setHistoryUsers([]);
        setFilteredHistory([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryUsers([]);
      setFilteredHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedUser) return;
    
    setCheckoutLoading(true);
    
    try {
      const response = await createCheckout(selectedUser.user_id, user!.id);
      console.log('Checkout response:', response);
      
      if (response.resultCode === 200) {
        showToast(`${selectedUser.user_name} амжилттай гарлаа.`, 'success');
        
        setShowCheckoutModal(false);
        setSelectedUser(null);
        
        await fetchActiveUsers();
        await fetchHistoryUsers();
      } else {
        showToast(response.resultMessage || 'Гарахад алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Сервертэй холбогдоход алдаа гарлаа', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCheckoutModal = (selected: ActiveUser) => {
    setSelectedUser(selected);
    setShowCheckoutModal(true);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
      </div>
    );
  }

  if (!isGymManager()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white min-w-[280px] max-w-md ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="text-white/70 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link 
                href="/gym-owner/dashboard" 
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft size={18} />
                <span>Буцах</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Хэрэглэгчийн удирдлага</h1>
            <p className="text-gray-600 mt-1">Идэвхтэй хэрэглэгчдийг харах, гарах үйлдэл хийх, түүхийг харах</p>
          </div>
          <button
            onClick={() => {
              fetchActiveUsers();
              fetchHistoryUsers();
            }}
            disabled={loading || historyLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={(loading || historyLoading) ? 'animate-spin' : ''} />
            Шинэчлэх
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'active'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={18} />
            Идэвхтэй хэрэглэгчид
            {activeUsers.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {activeUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={18} />
            Түүх
            {historyUsers.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {historyUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Users Tab */}
        {activeTab === 'active' && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Нэр, имэйл эсвэл утасны дугаараар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                {searchTerm ? (
                  <>
                    <Search size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Хайлтанд тохирох хэрэглэгч олдсонгүй</h3>
                    <p className="text-gray-500">"{searchTerm}" -тай тохирох хэрэглэгч байхгүй байна</p>
                  </>
                ) : (
                  <>
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Идэвхтэй хэрэглэгч байхгүй</h3>
                    <p className="text-gray-500">Одоогоор таны gym-д идэвхтэй хэрэглэгч байхгүй байна</p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хэрэглэгч</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Холбоо барих</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Орсон цаг</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дасгал хийсэн хугацаа</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((activeUser) => (
                        <tr key={activeUser.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {activeUser.user_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{activeUser.user_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{activeUser.user_email}</div>
                            {activeUser.user_phone && (
                              <div className="text-xs text-gray-400 mt-1">{activeUser.user_phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock size={14} />
                              {new Date(activeUser.checkin_time).toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(activeUser.checkin_time).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              <Clock size={12} />
                              {activeUser.duration_formatted || '0мин'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => openCheckoutModal(activeUser)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              <LogOut size={14} />
                              Гарах
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Нийт идэвхтэй хэрэглэгч: <span className="font-semibold">{filteredUsers.length}</span>
                    {activeUsers.length !== filteredUsers.length && (
                      <span className="text-gray-400 ml-1">(нийт {activeUsers.length}-оос)</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Нэр, имэйлээр хайх..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <History size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Түүх байхгүй</h3>
                <p className="text-gray-500">Одоогоор гарсан хэрэглэгчийн түүх байхгүй байна</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хэрэглэгч</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Холбоо барих</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Орсон цаг</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гарсан цаг</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дасгал хийсэн хугацаа</th>
                        
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {record.user_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{record.user_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{record.user_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDateTime(record.checkin_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.checkout_time ? formatDateTime(record.checkout_time) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <Clock size={12} />
                              {record.duration_formatted}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.verified_by_name || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Нийт түүх: <span className="font-semibold">{filteredHistory.length}</span>
                    {historyUsers.length !== filteredHistory.length && (
                      <span className="text-gray-400 ml-1">(нийт {historyUsers.length}-оос)</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Хэрэглэгч гарах</h2>
              <button 
                onClick={() => {
                  setShowCheckoutModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.user_name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.user_email}</p>
                  {selectedUser.user_phone && (
                    <p className="text-sm text-gray-500">{selectedUser.user_phone}</p>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Орсон цаг:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedUser.checkin_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Дасгал хийсэн хугацаа:</span>
                  <span className="font-medium text-blue-600">
                    {selectedUser.duration_formatted || '0мин'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-center">
              {selectedUser.user_name} гарахыг баталгаажуулах уу?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setSelectedUser(null);
                }}
                disabled={checkoutLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                Цуцлах
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
                Гарах
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
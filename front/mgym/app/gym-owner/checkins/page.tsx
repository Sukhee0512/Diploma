// app/gym-owner/checkins/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  getTodayUnverifiedCheckins, 
  verifyCheckin,
  getVerifiedCheckinsHistory
} from '@/app/lib/api';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Calendar,
  User,
  Mail,
  Phone,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

export default function GymCheckinsPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [gymInfo, setGymInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchPendingCheckins();
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [historyPage]);

  const fetchPendingCheckins = async () => {
    setLoading(true);
    try {
      const response = await getTodayUnverifiedCheckins(user!.id);
      if (response.resultCode === 200 && response.data) {
        setGymInfo(response.data.gym);
        setCheckins(response.data.checkins || []);
      }
    } catch (error) {
      console.error('Error fetching checkins:', error);
      setMessage({ type: 'error', text: 'Check-in хүсэлтүүдийг татахад алдаа гарлаа' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await getVerifiedCheckinsHistory(user!.id, historyPage);
      if (response.resultCode === 200 && response.data) {
        setHistory(response.data.checkins || []);
        setHistoryTotal(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleVerify = async (checkinId: number) => {
    setVerifyingId(checkinId);
    setMessage(null);

    try {
      const response = await verifyCheckin(checkinId, user!.id);
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: 'Check-in амжилттай баталгаажлаа' });
        fetchPendingCheckins();
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Алдаа гарлаа' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredCheckins = checkins.filter(c => 
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_phone?.includes(searchTerm)
  );

  const getPlanBadge = (planName: string) => {
    if (planName.includes('Алтан') || planName.includes('Gold')) {
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Алтан</span>;
    }
    if (planName.includes('Мөнгөн') || planName.includes('Silver')) {
      return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">Мөнгөн</span>;
    }
    return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Стандарт</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check-in баталгаажуулалт</h1>
          {gymInfo && (
            <p className="text-gray-600 mt-1">
              {gymInfo.name} - {gymInfo.location}
            </p>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={18} />
            Хүлээгдэж буй ({checkins.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle size={18} />
            Түүх
          </button>
          <button
            onClick={fetchPendingCheckins}
            className="ml-auto px-4 py-2 text-gray-600 hover:text-green-600 transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Дахин ачаалах
          </button>
        </div>

        {/* Pending Checkins Tab */}
        {activeTab === 'pending' && (
          <>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Нэр, имэйл эсвэл утасаар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg  text-black focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Checkins List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredCheckins.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Өнөөдөр баталгаажуулах check-in байхгүй байна</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCheckins.map((checkin) => (
                  <div key={checkin.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {checkin.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{checkin.user_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><Mail size={14} /> {checkin.user_email}</span>
                              {checkin.user_phone && (
                                <span className="flex items-center gap-1"><Phone size={14} /> {checkin.user_phone}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-600">Check-in цаг: </span>
                            <span className="font-medium">{new Date(checkin.checkin_time).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Award size={16} className="text-gray-400" />
                            <span className="text-gray-600">Төлөвлөгөө: </span>
                            {getPlanBadge(checkin.plan_name)}
                          </div>
                          {checkin.membership_expiry && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">Дуусах хугацаа: </span>
                              <span className="font-medium">{new Date(checkin.membership_expiry).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {checkin.notes && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-2 text-sm text-gray-600">
                            <span className="font-medium">Тайлбар:</span> {checkin.notes}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleVerify(checkin.id)}
                          disabled={verifyingId === checkin.id}
                          className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifyingId === checkin.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Баталгаажуулж байна...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Баталгаажуулах
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хэрэглэгч</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in цаг</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Баталгаажуулсан</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Баталгаажуулсан цаг</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Баталгаажсан check-in түүх байхгүй байна
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.user_name}</p>
                          <p className="text-sm text-gray-500">{item.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.checkin_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.verified_by_name || 'Gym Manager'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.verified_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {historyTotal > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Өмнөх
                </button>
                <span className="text-sm text-gray-600">
                  {historyPage} / {Math.ceil(historyTotal / 50)}
                </span>
                <button
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={historyPage >= Math.ceil(historyTotal / 50)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Дараах
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
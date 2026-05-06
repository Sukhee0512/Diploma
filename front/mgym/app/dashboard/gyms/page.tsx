'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Dumbbell, Star, Heart, Search, CheckCircle, XCircle, ArrowLeft, Award, Send, X } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getGyms, checkUserAccess, createCheckin, getUserMemberships, getGymImages, getUserCheckins } from '@/app/lib/api';

interface Gym {
  id: number;
  name: string;
  location: string;
  image: string | null;
  rating?: number;
  hours?: string;
  amenities?: string[];
  area?: string;
}

interface Toast {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function GymsPage() {
  const { user, isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [activePlanName, setActivePlanName] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [requestStatus, setRequestStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({ loading: false });
  const [hasTodayRequest, setHasTodayRequest] = useState(false);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/media/')) return `${API_BASE_URL}${url}`;
    return `${API_BASE_URL}/media/${url}`;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Redirect if not authenticated or not regular user
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (userRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (userRole === 'gym_manager') {
      router.push('/gym-owner/dashboard');
    }
  }, [isAuthenticated, userRole, router]);

  useEffect(() => {
    if (user && userRole === 'user') {
      fetchGyms();
      fetchUserMembership();
      checkTodayRequestStatus();
      loadFavorites();
    }
  }, [user, userRole]);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favoriteGyms');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const checkTodayRequestStatus = async () => {
    if (!user) return;
    
    try {
      const response = await getUserCheckins(user.id);
      
      if (response.resultCode === 200 && response.data) {
        let checkins = Array.isArray(response.data) ? response.data : (response.data.checkins || []);
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const hasToday = checkins.some((req: any) => {
          const timeField = req.checkin_time || req.created_at;
          if (!timeField) return false;
          const dateStr = timeField.split(' ')[0].split('T')[0];
          return dateStr === todayStr;
        });
        
        setHasTodayRequest(hasToday);
      } else {
        setHasTodayRequest(false);
      }
    } catch (error) {
      console.error('Error checking today requests:', error);
      setHasTodayRequest(false);
    }
  };

  const fetchUserMembership = async () => {
    try {
      const response = await getUserMemberships(user!.id);
      
      if (response.resultCode === 200 && response.data) {
        const activeMembership = response.data.find((m: any) => m.status === 'active');
        if (activeMembership) {
          setHasActiveMembership(true);
          setActivePlanName(activeMembership.plan_name);
        } else {
          setHasActiveMembership(false);
        }
      } else {
        setHasActiveMembership(false);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setHasActiveMembership(false);
    }
  };

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await getGyms();
      
      if (response.resultCode === 200 && response.data && response.data.length > 0) {
        const gymsWithImages = await Promise.all(
          response.data.map(async (gym: any) => {
            let imageUrl = null;
            try {
              const imagesResponse = await getGymImages(gym.id);
              if (imagesResponse.resultCode === 200 && imagesResponse.data?.length > 0) {
                const mainImage = imagesResponse.data.find((img: any) => img.is_main) || imagesResponse.data[0];
                imageUrl = mainImage.image_url;
              }
            } catch (error) {
              console.error(`Error fetching image for gym ${gym.id}:`, error);
            }
            
            return {
              id: gym.id,
              name: gym.name,
              location: gym.location,
              image: imageUrl || gym.image || null,
              rating: gym.average_rating || 4.5,
              hours: '06:00 - 22:00',
              amenities: ['Үнэгүй WiFi', 'Шүршүүр', 'Зогсоол'],
              area: getAreaFromLocation(gym.location)
            };
          })
        );
        
        setGyms(gymsWithImages);
        setFilteredGyms(gymsWithImages);
      } else {
        setGyms(fallbackGyms);
        setFilteredGyms(fallbackGyms);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms(fallbackGyms);
      setFilteredGyms(fallbackGyms);
    } finally {
      setLoading(false);
    }
  };

  const getAreaFromLocation = (location: string): string => {
    const areas = ['Сүхбаатар', 'Чингэлтэй', 'Хан-Уул', 'Баянзүрх', 'Сонгинохайрхан'];
    for (const area of areas) {
      if (location.includes(area)) return area;
    }
    return 'Сүхбаатар';
  };

  useEffect(() => {
    filterGyms();
  }, [searchTerm, selectedArea, gyms]);

  const filterGyms = () => {
    let filtered = [...gyms];
    if (searchTerm) {
      filtered = filtered.filter(gym => 
        gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedArea !== 'all') {
      filtered = filtered.filter(gym => gym.area === selectedArea);
    }
    setFilteredGyms(filtered);
  };

  const toggleFavorite = (gymId: number) => {
    let newFavorites;
    if (favorites.includes(gymId)) {
      newFavorites = favorites.filter(id => id !== gymId);
    } else {
      newFavorites = [...favorites, gymId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteGyms', JSON.stringify(newFavorites));
    
    const gym = gyms.find(g => g.id === gymId);
    if (gym) {
      showToast(
        favorites.includes(gymId) ? `${gym.name} - Дуртайгаас хасагдлаа` : `${gym.name} - Дуртай болголоо`,
        'info'
      );
    }
  };

  const openRequestModal = (gym: Gym) => {
    if (!hasActiveMembership) {
      showToast('Та идэвхтэй гишүүнчлэлгүй байна. Төлөвлөгөө сонгоно уу!', 'error');
      return;
    }

    if (hasTodayRequest) {
      showToast('Та өнөөдөр аль хэдийн нэг удаа хүсэлт илгээсэн байна. Маргааш дахин оролдоно уу.', 'error');
      return;
    }

    setSelectedGym(gym);
    setRequestNotes('');
    setShowRequestModal(true);
  };

  const handleSendRequest = async () => {
    if (!user || !selectedGym) return;

    setRequestStatus({ loading: true });

    try {
      const accessRes = await checkUserAccess(user.id, selectedGym.id);
      
      if (accessRes.resultCode === 200 && accessRes.data) {
        if (!accessRes.data.has_access) {
          const msg = accessRes.data.reason || 'Таны төлөвлөгөө энэ фитнес төвд хүчинтэй биш байна';
          showToast(msg, 'error');
          setRequestStatus({ loading: false, success: false, message: msg });
          setTimeout(() => setRequestStatus({ loading: false }), 3000);
          return;
        }
      }

      const checkinRes = await createCheckin(user.id, selectedGym.id, requestNotes);
      
      if (checkinRes && checkinRes.resultCode === 200) {
        showToast(`${selectedGym.name} фитнес руу орох хүсэлт амжилттай илгээгдлээ! Салбар дээр очиж баталгаажуулалтаа хийнэ үү.`, 'success');
        
        setRequestStatus({
          loading: false,
          success: true,
          message: `${selectedGym.name} фитнес руу орох хүсэлт амжилттай илгээгдлээ баталгаажуулалтаа хийнэ үү.`
        });
        setShowRequestModal(false);
        setSelectedGym(null);
        setRequestNotes('');
        setHasTodayRequest(true);
      } else {
        const errorMessage = checkinRes?.resultMessage || checkinRes?.message || 'Хүсэлт илгээхэд алдаа гарлаа';
        showToast(errorMessage, 'error');
        setRequestStatus({
          loading: false,
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Request error:', error);
      showToast('Сервертэй холбогдоход алдаа гарлаа', 'error');
      setRequestStatus({
        loading: false,
        success: false,
        message: 'Сервертэй холбогдоход алдаа гарлаа'
      });
    }
    
    setTimeout(() => {
      setRequestStatus({ loading: false });
    }, 3000);
  };

  const areas = ['all', 'Сүхбаатар', 'Чингэлтэй', 'Хан-Уул', 'Баянзүрх', 'Сонгинохайрхан'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Мэдээлэл уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white min-w-[280px] max-w-md ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : toast.type === 'error' ? (
              <XCircle size={20} />
            ) : (
              <Heart size={20} />
            )}
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
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition"
                >
                  <ArrowLeft size={18} />
                  <span>Буцах</span>
                </Link>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Фитнес төвүүд</h1>
              <p className="text-gray-600 mt-1">Таны гишүүнчлэлээр бүх фитнес төвүүдэд орох хүсэлт илгээх боломжтой</p>
            </div>
            
            {hasActiveMembership ? (
              <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-gray-700" />
                  <span className="text-sm text-gray-800">
                    Идэвхтэй гишүүнчлэл: <span className="font-semibold">{activePlanName}</span>
                  </span>
                </div>
              </div>
            ) : (
              <Link 
                href="/plans"
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-200 transition flex items-center gap-2"
              >
                <Award size={18} className="text-gray-700" />
                <span className="text-sm text-gray-800 font-medium">Гишүүнчлэл авах</span>
              </Link>
            )}
          </div>
        </div>

        {/* Today Request Warning */}
        {hasTodayRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Өнөөдөр хүсэлт илгээсэн байна</p>
                <p className="text-sm text-yellow-700">Та өнөөдөр аль хэдийн нэг удаа хүсэлт илгээсэн байна. Маргааш дахин оролдоно уу.</p>
              </div>
            </div>
          </div>
        )}

        {/* No Membership Warning */}
        {!hasActiveMembership && (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-medium text-gray-800">Гишүүнчлэлгүй байна</p>
              <p className="text-sm text-gray-600">Гишүүнчлэл авснаар бүх фитнес төвүүдэд орох хүсэлт илгээх боломжтой</p>
            </div>
            <Link
              href="/plans"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
            >
              Гишүүнчлэл авах
            </Link>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Фитнес нэр, байршлаар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    selectedArea === area ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {area === 'all' ? 'Бүгд' : area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gyms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGyms.map((gym) => {
            const imageUrl = getFullImageUrl(gym.image);
            
            return (
              <div key={gym.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100">
                {/* Card Image */}
                <div className="relative h-40 bg-gray-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center ${imageUrl ? 'hidden' : ''} fallback-icon`}>
                    <Dumbbell size={48} className="text-white/30" />
                  </div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Favorite Button */}
                  <button 
                    onClick={() => toggleFavorite(gym.id)} 
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:scale-105 transition"
                  >
                    <Heart size={18} className={favorites.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
                  </button>
                  
                  {/* Rating Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" /> 
                    <span>{gym.rating}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900">{gym.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1 mb-2">
                    <MapPin size={14} /> {gym.location}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {gym.amenities?.map((amenity, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{amenity}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock size={14} /> {gym.hours}
                  </div>
                  
                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/gyms/${gym.id}`}
                      className="flex-1 text-center border border-gray-400 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Дэлгэрэнгүй
                    </Link>
                    <button
                      onClick={() => openRequestModal(gym)}
                      disabled={!hasActiveMembership || hasTodayRequest}
                      className={`flex-1 text-center px-3 py-2 rounded-lg font-medium transition ${
                        hasActiveMembership && !hasTodayRequest
                          ? 'bg-gray-800 text-white hover:bg-gray-900'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      } disabled:opacity-50`}
                    >
                      Орох хүсэлт
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGyms.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Фитнес төв олдсонгүй</p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Орох хүсэлт илгээх</h2>
              <button 
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedGym(null);
                  setRequestNotes('');
                  setRequestStatus({ loading: false });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-800">
                <strong>Фитнес төв:</strong> {selectedGym.name}
              </p>
              <p className="text-gray-700 mt-1">
                <strong>Байршил:</strong> {selectedGym.location}
              </p>
            </div>

            {requestStatus.message && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                requestStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {requestStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{requestStatus.message}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Нэмэлт мэдээлэл (заавал биш)
              </label>
              <textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                rows={3}
                placeholder="Дасгалжуулагчийн нэр, ирэх цаг гэх мэт..."
                disabled={requestStatus.loading}
              />
            </div>

            <div className="text-xs text-gray-500 text-center mb-4">
              ※ Өдөрт зөвхөн нэг удаа хүсэлт илгээх боломжтой
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedGym(null);
                  setRequestNotes('');
                  setRequestStatus({ loading: false });
                }}
                disabled={requestStatus.loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                Цуцлах
              </button>
              <button
                onClick={handleSendRequest}
                disabled={requestStatus.loading}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {requestStatus.loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Хүсэлт илгээх
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
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

const fallbackGyms: Gym[] = [
  { id: 1, name: "Adrenaline фитнес", location: "Сүхбаатар дүүрэг", area: "Сүхбаатар", image: null, rating: 4.8, hours: "06:00 - 23:00", amenities: ["Үнэгүй WiFi", "Шүршүүр", "Зогсоол"] },
  { id: 2, name: "AMG GYM", location: "Чингэлтэй дүүрэг", area: "Чингэлтэй", image: null, rating: 4.6, hours: "07:00 - 22:00", amenities: ["Үнэгүй WiFi", "Шүршүүр", "Зогсоол"] },
  { id: 3, name: "Apex фитнес", location: "Хан-Уул дүүрэг", area: "Хан-Уул", image: null, rating: 4.7, hours: "06:00 - 22:00", amenities: ["Үнэгүй WiFi", "Шүршүүр", "Зогсоол", "Спорт заал"] },
  { id: 4, name: "Art Fitness Club", location: "Баянзүрх дүүрэг", area: "Баянзүрх", image: null, rating: 4.5, hours: "08:00 - 21:00", amenities: ["Үнэгүй WiFi", "Шүршүүр", "Зогсоол"] },
  { id: 5, name: "Empire Gym", location: "Сүхбаатар дүүрэг", area: "Сүхбаатар", image: null, rating: 4.9, hours: "00:00 - 00:00", amenities: ["Үнэгүй WiFi", "Шүршүүр", "Зогсоол", "Саун"] }
];
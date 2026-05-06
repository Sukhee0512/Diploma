// app/dashboard/gyms/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Clock, Dumbbell, Star, ArrowLeft, 
  CheckCircle, XCircle, Calendar, Users, Award, 
  Phone, Mail, ExternalLink, Building, Loader2,
  Clock as ClockIcon, Send, X, Edit2, Trash2, 
  MessageCircle, ThumbsUp, Flag, Reply
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  getGymById, checkUserAccess, createCheckin, getGymPlans, getGyms, getUserCheckins,
  getGymReviews, createReview, deleteReview, canUserReview, getTopRatedGyms,
  addReplyToReview, getReviewReplies, submitReview, checkReviewEligibility
} from '@/app/lib/api';

interface GymDetail {
  id: number;
  name: string;
  location: string;
  image: string | null;
  description?: string;
  rating?: number;
  total_ratings?: number;
  hours?: string;
  phone?: string;
  email?: string;
  website?: string;
  amenities?: string[];
  created_at?: string;
  member_count?: number;
  today_checkins?: number;
  plans?: Plan[];
  hasActiveMembership?: boolean;
  activePlanName?: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
}

interface ReplyData {
  id: number;
  reply_text: string;
  created_at: string;
  updated_at: string;
  manager: {
    id: number;
    name: string;
  };
}

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const gymId = parseInt(params.id as string);
  
  const [gym, setGym] = useState<GymDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinStatus, setCheckinStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({ loading: false });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [activePlanName, setActivePlanName] = useState('');
  const [hasTodayRequest, setHasTodayRequest] = useState(false);
  
  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [replyData, setReplyData] = useState<Record<number, ReplyData | null>>({});
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/media/')) return `${API_BASE_URL}${url}`;
    return `${API_BASE_URL}/media/${url}`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (gymId && user) {
      fetchGymDetails();
      checkUserMembership();
      checkTodayRequestStatus();
      fetchReviews();
      checkUserReviewEligibility();
    }
  }, [gymId, user]);

  const checkUserMembership = async () => {
    if (!user) return;
    try {
      const { getUserMemberships } = await import('@/app/lib/api');
      const response = await getUserMemberships(user.id);
      if (response.resultCode === 200 && response.data) {
        const active = response.data.find((m: any) => m.status === 'active');
        if (active) {
          setHasActiveMembership(true);
          setActivePlanName(active.plan_name);
        }
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const checkTodayRequestStatus = async () => {
    if (!user) return;
    try {
      const response = await getUserCheckins(user.id);
      if (response.resultCode === 200 && response.data) {
        const today = new Date().toDateString();
        const todayRequests = response.data.filter((req: any) => 
          new Date(req.checkin_time).toDateString() === today
        );
        setHasTodayRequest(todayRequests.length > 0);
      }
    } catch (error) {
      console.error('Error checking today requests:', error);
    }
  };

  const fetchGymDetails = async () => {
    setLoading(true);
    try {
      const gymsResponse = await getGyms();
      console.log('Gyms response:', gymsResponse);
      
      if (gymsResponse.resultCode === 200 && gymsResponse.data) {
        const foundGym = gymsResponse.data.find((gym: any) => gym.id === gymId);
        
        if (foundGym) {
          setGym({
            id: foundGym.id,
            name: foundGym.name,
            location: foundGym.location,
            image: foundGym.image,
            description: foundGym.description || 'Фитнес төв нь орчин үеийн тоног төхөөрөмж, мэргэжлийн дасгалжуулагчидтай.',
            rating: 4.5,
            total_ratings: 128,
            phone: foundGym.phone || '+976 7000 0000',
            email: foundGym.email || 'info@gymhub.mn',
            amenities: ['Үнэгүй WiFi', 'Шүршүүр', 'Зогсоол', 'Хувцас солих өрөө', 'Усны хөргөгч', 'Кондиционер'],
            member_count: foundGym.member_count || 0,
            today_checkins: foundGym.today_checkins || 0,
          });
        } else {
          console.error('Gym not found with id:', gymId);
        }
      }
    } catch (error) {
      console.error('Error fetching gym details:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== REVIEW FUNCTIONS ====================
  
  const fetchReviews = async () => {
    if (!gymId) return;
    setReviewsLoading(true);
    try {
      const response = await getGymReviews(gymId);
      console.log('Reviews response:', response);
      
      if (response.resultCode === 200 && response.data) {
        setReviews(response.data.reviews || []);
        setRatingDistribution(response.data.rating_distribution || {});
        setAverageRating(response.data.gym?.average_rating || 0);
        setTotalReviews(response.data.gym?.total_reviews || 0);
        
        // Fetch replies for each review
        if (response.data.reviews) {
          response.data.reviews.forEach(async (review: Review) => {
            await fetchReplyForReview(review.id);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReplyForReview = async (reviewId: number) => {
    try {
      const response = await getReviewReplies(reviewId);
      if (response.resultCode === 200 && response.data) {
        setReplyData(prev => ({ ...prev, [reviewId]: response.data }));
      }
    } catch (error) {
      console.error('Error fetching reply:', error);
    }
  };

  const checkUserReviewEligibility = async () => {
    if (!user || !gymId) return;
    try {
      const eligibility = await checkReviewEligibility(user.id, gymId);
      setCanReview(eligibility.canReview);
      setHasReviewed(eligibility.hasReviewed);
      if (eligibility.existingReview) {
        setExistingReview(eligibility.existingReview);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !gymId) {
      alert('Нэвтэрч байж сэтгэгдэл үлдээх боломжтой');
      return;
    }
    
    if (reviewComment.trim().length < 3) {
      alert('Сэтгэгдэл хамгийн багадаа 3 тэмдэгт байх ёстой');
      return;
    }
    
    setReviewSubmitting(true);
    try {
      const result = await submitReview(user.id, gymId, reviewRating, reviewComment);
      
      if (result.success) {
        alert('Сэтгэгдэл амжилттай хадгалагдлаа!');
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment('');
        fetchReviews();
        checkUserReviewEligibility();
        fetchGymDetails();
      } else {
        alert(result.message || 'Сэтгэгдэл хадгалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Сэтгэгдэл хадгалахад алдаа гарлаа');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Та энэ сэтгэгдлийг устгахдаа итгэлтэй байна уу?')) return;
    
    try {
      const response = await deleteReview(reviewId, user!.id);
      if (response.resultCode === 200) {
        alert('Сэтгэгдэл амжилттай устгагдлаа');
        fetchReviews();
        checkUserReviewEligibility();
        fetchGymDetails();
      } else {
        alert(response.resultMessage || 'Сэтгэгдэл устгахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Сэтгэгдэл устгахад алдаа гарлаа');
    }
  };

  const handleSendReply = async () => {
    if (!selectedReviewId || !replyText.trim()) return;
    
    setReplySubmitting(true);
    try {
      const result = await addReplyToReview(selectedReviewId, user!.id, replyText);
      if (result.success) {
        alert('Хариу амжилттай илгээгдлээ!');
        setShowReplyModal(false);
        setReplyText('');
        setSelectedReviewId(null);
        await fetchReplyForReview(selectedReviewId);
      } else {
        alert(result.message || 'Хариу илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Хариу илгээхэд алдаа гарлаа');
    } finally {
      setReplySubmitting(false);
    }
  };

  const openReplyModal = (reviewId: number) => {
    setSelectedReviewId(reviewId);
    setReplyText('');
    setShowReplyModal(true);
  };

  const handleSendRequest = async () => {
    if (!user) {
      alert('Нэвтэрч байж хүсэлт илгээх боломжтой');
      return;
    }

    if (!hasActiveMembership) {
      setCheckinStatus({ 
        loading: false, 
        success: false, 
        message: 'Та идэвхтэй гишүүнчлэлгүй байна. Төлөвлөгөө сонгоно уу!' 
      });
      setTimeout(() => setCheckinStatus({ loading: false }), 3000);
      return;
    }

    if (hasTodayRequest) {
      setCheckinStatus({ 
        loading: false, 
        success: false, 
        message: 'Та өнөөдөр аль хэдийн нэг удаа хүсэлт илгээсэн байна. Маргааш дахин оролдоно уу.' 
      });
      setTimeout(() => setCheckinStatus({ loading: false }), 3000);
      return;
    }

    setCheckinStatus({ loading: true });

    try {
      const accessRes = await checkUserAccess(user.id, gymId);
      console.log('Access check:', accessRes);
      
      if (accessRes.resultCode === 200 && accessRes.data) {
        if (!accessRes.data.has_access) {
          setCheckinStatus({ 
            loading: false, 
            success: false, 
            message: accessRes.data.reason || 'Таны төлөвлөгөө энэ фитнес төвд хүчинтэй биш байна' 
          });
          setTimeout(() => setCheckinStatus({ loading: false }), 3000);
          return;
        }
      }

      const checkinRes = await createCheckin(user.id, gymId, requestNotes);
      console.log('Checkin response:', checkinRes);
      
      if (checkinRes.resultCode === 200) {
        setCheckinStatus({ 
          loading: false, 
          success: true, 
          message: `${gym?.name} фитнес руу орох хүсэлт амжилттай илгээгдлээ. Баталгаажуулахыг хүлээнэ үү.` 
        });
        setShowRequestModal(false);
        setRequestNotes('');
        setHasTodayRequest(true);
        if (gym) {
          setGym({ ...gym, today_checkins: (gym.today_checkins || 0) + 1 });
        }
        setTimeout(() => setCheckinStatus({ loading: false }), 5000);
      } else {
        let errorMessage = checkinRes.resultMessage || 'Хүсэлт илгээхэд алдаа гарлаа';
        if (errorMessage.includes('баталгаажсан check-in хийсэн') || errorMessage.includes('аль хэдийн')) {
          errorMessage = 'Та өнөөдөр аль хэдийн нэг удаа хүсэлт илгээсэн байна. Маргааш дахин оролдоно уу.';
          setHasTodayRequest(true);
        }
        setCheckinStatus({ 
          loading: false, 
          success: false, 
          message: errorMessage 
        });
        setTimeout(() => setCheckinStatus({ loading: false }), 3000);
      }
    } catch (error) {
      console.error('Request error:', error);
      setCheckinStatus({ 
        loading: false, 
        success: false, 
        message: 'Сервертэй холбогдоход алдаа гарлаа' 
      });
      setTimeout(() => setCheckinStatus({ loading: false }), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-800 mx-auto mb-4" />
          <p className="text-gray-700">Мэдээлэл уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Building size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700">Фитнес төв олдсонгүй</p>
          <Link href="/dashboard/gyms" className="mt-4 inline-block text-gray-800 hover:underline">
            Буцах
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getFullImageUrl(gym.image);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/dashboard/gyms" 
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} />
            <span>Фитнес төвүүд рүү буцах</span>
          </Link>
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
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-gray-800">Гишүүнчлэлгүй байна</p>
                <p className="text-sm text-gray-600">Гишүүнчлэл авснаар фитнес төвд орох хүсэлт илгээх боломжтой</p>
              </div>
              <Link
                href="/plans"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
              >
                Гишүүнчлэл авах
              </Link>
            </div>
          </div>
        )}

        {/* Hero Section with Image */}
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-gray-800">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl}
                alt={gym.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', imageUrl);
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center fallback">
              <Building size={80} className="text-white/30" />
            </div>
          )}
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{gym.name}</h1>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} />
              <span>{gym.location}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)} ({totalReviews} үнэлгээ)</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Өнөөдөр {gym.today_checkins} хүсэлт</span>
              </div>
              {hasActiveMembership && (
                <div className="flex items-center gap-1 bg-green-600/30 px-2 py-0.5 rounded-full">
                  <Award size={12} />
                  <span className="text-xs">{activePlanName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                activeTab === 'info' 
                  ? 'text-gray-900 border-b-2 border-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Мэдээлэл
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                activeTab === 'reviews' 
                  ? 'text-gray-900 border-b-2 border-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Сэтгэгдэл ({totalReviews})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'info' && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Тухай</h2>
                  <p className="text-gray-700 leading-relaxed">{gym.description}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={20} className="text-gray-700" />
                    Ажиллах цаг
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-800">Даваа - Баасан</span>
                      <span className="font-medium text-gray-800">06:00 - 22:00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-800">Бямба</span>
                      <span className="font-medium text-gray-800">07:00 - 20:00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-800">Ням</span>
                      <span className="font-medium text-gray-800">07:00 - 18:00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Тоног төхөөрөмж & Үйлчилгээ</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {gym.amenities?.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle size={16} className="text-gray-600" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Review Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Сэтгэгдлүүд</h2>
                  {canReview && !hasReviewed && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
                    >
                      Сэтгэгдэл бичих
                    </button>
                  )}
                  {hasReviewed && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Та аль хэдийн сэтгэгдэл үлдээсэн байна
                    </div>
                  )}
                </div>

                {/* Rating Summary */}
                {totalReviews > 0 && (
                  <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg flex-wrap">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                      {renderStars(Math.round(averageRating))}
                      <p className="text-xs text-gray-500 mt-1">{totalReviews} сэтгэгдэл</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingDistribution[star] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-8 text-gray-600">{star} од</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-10 text-gray-500 text-xs">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
                    <p>Хараахан сэтгэгдэл байхгүй байна</p>
                    {canReview && !hasReviewed && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="mt-3 text-gray-700 hover:underline text-sm"
                      >
                                        Эхний сэтгэгдэл үлдээх
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-5">
                                    {reviews.map((review) => (
                                      <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                              <span className="text-gray-700 font-bold text-sm">
                                                {review.user.name.charAt(0)}
                                              </span>
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-900">{review.user.name}</p>
                                              {renderStars(review.rating)}
                                              <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(review.created_at)}
                                                {review.created_at !== review.updated_at && (
                                                  <span className="ml-2">(засварласан)</span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          {/* Delete button for own reviews or admin */}
                                          {(user?.id === review.user.id || userRole === 'admin') && (
                                            <button
                                              onClick={() => handleDeleteReview(review.id)}
                                              className="text-gray-400 hover:text-red-500 transition"
                                              title="Устгах"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          )}
                                        </div>
                                        
                                        <p className="text-gray-700 mt-3 ml-13 pl-13">
                                          {review.comment}
                                        </p>
                                        
                                        {/* Reply from gym manager */}
                                        {replyData[review.id] && (
                                          <div className="mt-3 ml-8 pl-4 border-l-2 border-gray-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                              <Reply size={14} />
                                              <span className="font-medium text-gray-700">
                                                {replyData[review.id]?.manager?.name || 'Менежер'}
                                              </span>
                                              <span className="text-xs">
                                                {replyData[review.id]?.created_at && formatDate(replyData[review.id].created_at)}
                                              </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                              {replyData[review.id]?.reply_text}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Reply button for gym managers */}
                                        {userRole === 'gym_manager' && (
                                          <button
                                            onClick={() => openReplyModal(review.id)}
                                            className="mt-2 ml-8 text-xs text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
                                          >
                                            <Reply size={12} />
                                            {replyData[review.id] ? 'Хариу засварлах' : 'Хариу бичих'}
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sidebar */}
                          <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <h2 className="text-lg font-semibold text-gray-900 mb-4">Орох хүсэлт</h2>
                              {checkinStatus.message && (
                                <div className={`mb-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                                  checkinStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {checkinStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                  <span>{checkinStatus.message}</span>
                                </div>
                              )}
                              <button
                                onClick={() => setShowRequestModal(true)}
                                disabled={checkinStatus.loading || !hasActiveMembership || hasTodayRequest}
                                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                                  hasActiveMembership && !hasTodayRequest
                                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                } disabled:opacity-50`}
                              >
                                {checkinStatus.loading ? (
                                  <Loader2 size={20} className="animate-spin" />
                                ) : (
                                  <>
                                    <Send size={18} />
                                    Орох хүсэлт явуулах
                                  </>
                                )}
                              </button>
                              <p className="text-xs text-gray-500 text-center mt-3">
                                Хүсэлт илгээснээр фитнес төвийн ажилтан таныг тухайн салбар дээр очиход баталгаажуулах болно
                              </p>
                              <p className="text-xs text-gray-400 text-center mt-2">
                                ※ Өдөрт зөвхөн нэг удаа хүсэлт илгээх боломжтой
                              </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <h2 className="text-lg font-semibold text-gray-900 mb-4">Холбоо барих</h2>
                              <div className="space-y-3">
                                {gym.phone && (
                                  <div className="flex items-center gap-3 text-gray-700">
                                    <Phone size={18} className="text-gray-600" />
                                    <span className="text-sm">{gym.phone}</span>
                                  </div>
                                )}
                                {gym.email && (
                                  <div className="flex items-center gap-3 text-gray-700">
                                    <Mail size={18} className="text-gray-600" />
                                    <span className="text-sm">{gym.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <h2 className="text-lg font-semibold text-gray-900 mb-3">Байршил</h2>
                              <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">
                                <div className="text-center text-gray-600">
                                  <MapPin size={32} className="mx-auto mb-2 text-gray-500" />
                                  <p className="text-sm">{gym.location}</p>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <h2 className="text-lg font-semibold text-gray-900 mb-3">Статистик</h2>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Нийт гишүүд</span>
                                  <span className="font-semibold text-gray-900">{gym.member_count}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Өнөөдрийн хүсэлт</span>
                                  <span className="font-semibold text-gray-900">{gym.today_checkins}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Modal */}
                      {showReviewModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold text-gray-900">
                                {hasReviewed ? 'Сэтгэгдэл засварлах' : 'Шинэ сэтгэгдэл'}
                              </h2>
                              <button 
                                onClick={() => setShowReviewModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={24} />
                              </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <p className="text-gray-800">
                                <strong>Фитнес төв:</strong> {gym?.name}
                              </p>
                            </div>

                            {/* Rating Stars */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Үнэлгээ
                              </label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star
                                      size={32}
                                      className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Comment */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Сэтгэгдэл
                              </label>
                              <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                                rows={4}
                                placeholder="Таны сэтгэгдэл..."
                                disabled={reviewSubmitting}
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowReviewModal(false)}
                                disabled={reviewSubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                              >
                                Цуцлах
                              </button>
                              <button
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitting || reviewComment.trim().length < 3}
                                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {reviewSubmitting ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Send size={18} />
                                )}
                                Илгээх
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reply Modal */}
                      {showReplyModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold text-gray-900">Сэтгэгдэлд хариулах</h2>
                              <button 
                                onClick={() => setShowReplyModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={24} />
                              </button>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Хариу
                              </label>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                                rows={3}
                                placeholder="Таны хариу..."
                                disabled={replySubmitting}
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowReplyModal(false)}
                                disabled={replySubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                              >
                                Цуцлах
                              </button>
                              <button
                                onClick={handleSendReply}
                                disabled={replySubmitting || !replyText.trim()}
                                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {replySubmitting ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Send size={18} />
                                )}
                                Илгээх
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Request Modal */}
                      {showRequestModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold text-gray-900">Орох хүсэлт илгээх</h2>
                              <button 
                                onClick={() => setShowRequestModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={24} />
                              </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <p className="text-gray-800">
                                <strong>Фитнес төв:</strong> {gym?.name}
                              </p>
                              <p className="text-gray-700 mt-1">
                                <strong>Байршил:</strong> {gym?.location}
                              </p>
                            </div>

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
                                disabled={checkinStatus.loading}
                              />
                            </div>

                            <div className="text-xs text-gray-500 text-center mb-4">
                              ※ Өдөрт зөвхөн нэг удаа хүсэлт илгээх боломжтой
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowRequestModal(false)}
                                disabled={checkinStatus.loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                              >
                                Цуцлах
                              </button>
                              <button
                                onClick={handleSendRequest}
                                disabled={checkinStatus.loading}
                                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {checkinStatus.loading ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Send size={18} />
                                )}
                                Хүсэлт илгээх
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
// app/plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getAllPlans, createMembership, getUserMemberships } from '@/app/lib/api';
import { CheckCircle, Award, CreditCard, Zap, Shield, Crown, Calendar, Clock, Dumbbell, XCircle } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  description?: string;
  features?: string[];
}

export default function PlansPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated && user) {
      fetchUserMembership();
    }
  }, [isAuthenticated, user]);

  const fetchPlans = async () => {
    try {
      const response = await getAllPlans();
      console.log('Plans response:', response);
      
      if (response.resultCode === 200 && response.data) {
        const plansWithFeatures = response.data.map((plan: any) => ({
          ...plan,
          features: getFeaturesForPlan(plan.name, plan.duration_days)
        }));
        setPlans(plansWithFeatures);
      } else {
        // Fallback plans
        setPlans(fallbackPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  const getFeaturesForPlan = (name: string, days: number) => {
    const commonFeatures = [
      'Бүх фитнес төвүүдэд нэвтрэх',
      'Өдөрт 1 удаа check-in',
      '24/7 дэмжлэг',
      'Гар утасны апп'
    ];
    
    if (days >= 90) {
      return [...commonFeatures, 'Үнэгүй 1 сарын сунгалт', 'Гишүүнээ урих'];
    }
    if (days >= 30) {
      return [...commonFeatures, 'Дасгалжуулагчийн зөвлөгөө'];
    }
    return commonFeatures;
  };

  const fetchUserMembership = async () => {
    try {
      const response = await getUserMemberships(user!.id);
      if (response.resultCode === 200 && response.data) {
        const active = response.data.find((m: any) => m.status === 'active');
        if (active) {
          setHasActiveMembership(true);
          setActiveMembership(active);
        }
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setPurchasing(true);
    setMessage(null);

    try {
      const response = await createMembership(user.id, selectedPlan.id);
      console.log('Purchase response:', response);
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: `${selectedPlan.name} төлөвлөгөөг амжилттай худалдан авлаа!` });
        setShowModal(false);
        await fetchUserMembership();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Худалдан авалт амжилтгүй боллоо' });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setPurchasing(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Алтан') || planName.includes('Gold')) return <Crown size={32} className="text-yellow-500" />;
    if (planName.includes('Мөнгөн') || planName.includes('Silver')) return <Shield size={32} className="text-gray-500" />;
    return <Zap size={32} className="text-green-500" />;
  };

  const getPlanColor = (planName: string) => {
    if (planName.includes('Алтан') || planName.includes('Gold')) return 'from-yellow-500 to-yellow-600';
    if (planName.includes('Мөнгөн') || planName.includes('Silver')) return 'from-gray-400 to-gray-500';
    return 'from-green-500 to-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            GymHub{' '}
            <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Гишүүнчлэл
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Нэг удаагийн гишүүнчлэлээр манай системд бүртгэлтэй бүх фитнес төвүүдэд нэвтрэх эрхтэй болно
          </p>
        </div>

        {/* Active Membership Alert */}
        {hasActiveMembership && activeMembership && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div className="flex-1">
                <p className="font-semibold text-green-800">Та идэвхтэй гишүүнчлэлтэй байна</p>
                <p className="text-sm text-green-700">
                  {activeMembership.plan_name} · {new Date(activeMembership.end_date).toLocaleDateString()} хүртэл
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Хянах самбар
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`max-w-2xl mx-auto mb-6 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border border-green-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                selectedPlan?.id === plan.id ? 'ring-2 ring-green-500 transform scale-105' : ''
              }`}
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${getPlanColor(plan.name)} p-6 text-white text-center`}>
                <div className="flex justify-center mb-3">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price.toLocaleString()}₮</span>
                  <span className="text-sm opacity-90"> / {plan.duration_days} өдөр</span>
                </div>
              </div>

              {/* Plan Features */}
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (hasActiveMembership) {
                      setMessage({ type: 'error', text: 'Та аль хэдийн идэвхтэй гишүүнчлэлтэй байна' });
                      return;
                    }
                    setSelectedPlan(plan);
                    setShowModal(true);
                  }}
                  disabled={hasActiveMembership}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    hasActiveMembership
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
                  }`}
                >
                  {hasActiveMembership ? 'Гишүүнчлэлтэй' : 'Сонгох'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Гишүүнчлэлийн давуу талууд</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">Бүх фитнес төвүүдэд нэвтрэх</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">Өдөрт 1 удаа check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">24/7 дэмжлэг</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">Аюулгүй төлбөр</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        {showModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Гишүүнчлэл худалдан авах</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Төлөвлөгөө</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Хугацаа</span>
                  <span>{selectedPlan.duration_days} өдөр</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold">Нийт төлөх</span>
                  <span className="text-xl font-bold text-green-600">{selectedPlan.price.toLocaleString()}₮</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Цуцлах
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {purchasing ? 'Худалдан авж байна...' : 'Худалдан авах'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const fallbackPlans: Plan[] = [
  { id: 1, name: "Стандарт", price: 99000, duration_days: 30, features: ["Бүх фитнес төвүүдэд нэвтрэх", "Өдөрт 1 удаа check-in", "24/7 дэмжлэг"] },
  { id: 2, name: "Дээд зэрэг", price: 249000, duration_days: 90, features: ["Бүх фитнес төвүүдэд нэвтрэх", "Өдөрт 1 удаа check-in", "24/7 дэмжлэг", "Дасгалжуулагчийн зөвлөгөө", "Үнэгүй 1 сарын сунгалт"] },
  { id: 3, name: "VIP", price: 450000, duration_days: 180, features: ["Бүх фитнес төвүүдэд нэвтрэх", "Өдөрт 1 удаа check-in", "24/7 дэмжлэг", "Дасгалжуулагчийн зөвлөгөө", "Үнэгүй 2 сарын сунгалт", "Гишүүнээ урих"] },
];
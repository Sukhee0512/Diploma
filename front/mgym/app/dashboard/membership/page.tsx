// app/dashboard/membership/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Calendar, Award, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getUserMemberships, createMembership, getGymPlans } from '@/app/lib/api';

export default function MembershipPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const gymId = searchParams.get('gym');
  const planId = searchParams.get('plan');
  
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMemberships();
      if (planId && gymId) {
        fetchPlanDetails();
      }
    }
  }, [user, planId, gymId]);

  const fetchMemberships = async () => {
    const response = await getUserMemberships(user!.id);
    if (response.resultCode === 200 && response.data) {
      setMemberships(response.data);
    }
    setLoading(false);
  };

  const fetchPlanDetails = async () => {
    if (gymId) {
      const response = await getGymPlans(parseInt(gymId));
      if (response.resultCode === 200 && response.data) {
        const plan = response.data.find((p: any) => p.id === parseInt(planId!));
        setSelectedPlan(plan);
      }
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    setPurchasing(true);
    const response = await createMembership(user!.id, selectedPlan.id);
    
    if (response.resultCode === 200) {
      setPurchaseSuccess(true);
      fetchMemberships();
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedPlan(null);
      }, 3000);
    } else {
      alert('Алдаа гарлаа: ' + response.resultMessage);
    }
    setPurchasing(false);
  };

  const activeMembership = memberships.find(m => m.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
            <ArrowLeft size={18} />
            <span>Буцах</span>
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Гишүүнчлэл</h1>
        <p className="text-gray-600 mb-8">Таны гишүүнчлэлийн мэдээлэл, төлөвлөгөө</p>

        {/* Active Membership */}
        {activeMembership && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Award size={24} />
              <h2 className="text-xl font-bold">Идэвхтэй гишүүнчлэл</h2>
            </div>
            <p className="text-green-100 mb-4">{activeMembership.plan_name} төлөвлөгөө</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>Эхэлсэн: {new Date(activeMembership.start_date).toLocaleDateString()}</div>
              <div>Дуусах: {new Date(activeMembership.end_date).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              {purchaseSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Амжилттай!</h3>
                  <p className="text-gray-600">{selectedPlan.name} төлөвлөгөөг амжилттай худалдан авлаа</p>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Хаах
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-4">Гишүүнчлэл худалдан авах</h2>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-semibold">{selectedPlan.name}</p>
                    <p className="text-2xl font-bold text-green-600">{selectedPlan.price.toLocaleString()}₮</p>
                    <p className="text-sm text-gray-500">{selectedPlan.duration_days} өдөр</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {purchasing ? 'Худалдан авж байна...' : 'Баталгаажуулах'}
                    </button>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Цуцлах
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
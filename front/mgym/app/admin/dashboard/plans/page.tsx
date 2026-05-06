// app/admin/plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '@/app/lib/api';
import { Plus, Edit, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  description?: string;
}

export default function AdminPlansPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      window.location.href = '/';
      return;
    }
    fetchPlans();
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await getAllPlans();
      if (response.resultCode === 200 && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setMessage({ type: 'error', text: 'Төлөвлөгөөнүүдийг татахад алдаа гарлаа' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const planData = {
      name: formData.name,
      price: parseFloat(formData.price),
      duration_days: parseInt(formData.duration_days)
    };

    try {
      let response;
      if (editingPlan) {
        response = await updatePlan(editingPlan.id, planData.name, planData.price, planData.duration_days);
      } else {
        response = await createPlan(planData.name, planData.price, planData.duration_days);
      }

      if (response.resultCode === 200) {
        setMessage({ 
          type: 'success', 
          text: editingPlan ? 'Төлөвлөгөө амжилттай шинэчлэгдлээ' : 'Төлөвлөгөө амжилттай үүсгэгдлээ' 
        });
        handleCloseModal();
        fetchPlans();
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Алдаа гарлаа' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`${plan.name} төлөвлөгөөг устгахыг хүсэж байна уу?`)) return;

    try {
      const response = await deletePlan(plan.id);
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: 'Төлөвлөгөө амжилттай устгагдлаа' });
        fetchPlans();
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Устгахад алдаа гарлаа' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString()
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingPlan(null);
    setFormData({ name: '', price: '', duration_days: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({ name: '', price: '', duration_days: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Гишүүнчлэлийн төлөвлөгөө</h1>
            <p className="text-gray-600 mt-1">Төлөвлөгөөнүүдийг удирдах, шинээр нэмэх, засварлах</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={20} />
            Шинэ төлөвлөгөө
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Plans Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нэр</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үнэ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хугацаа</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Төлөвлөгөө байхгүй байна
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{plan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.price.toLocaleString()}₮
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.duration_days} өдөр
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-blue-600 hover:text-blue-800 transition p-1"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        className="text-red-600 hover:text-red-800 transition p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingPlan ? 'Төлөвлөгөө засварлах' : 'Шинэ төлөвлөгөө'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Төлөвлөгөөний нэр
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="Жишээ: Стандарт, Алтан, VIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Үнэ (₮)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="99000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Хугацаа (өдөр)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingPlan ? 'Хадгалах' : 'Үүсгэх'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
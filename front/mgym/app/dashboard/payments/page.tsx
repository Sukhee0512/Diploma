// app/dashboard/payments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, QrCode, Wallet, Banknote,
  Check, Clock, AlertCircle, Download
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('qpay');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 200) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'qpay', name: 'Qpay', icon: <QrCode size={24} />, color: 'bg-blue-500' },
    { id: 'socialpay', name: 'SocialPay', icon: <Wallet size={24} />, color: 'bg-green-500' },
    { id: 'pocket', name: 'Pocket', icon: <Banknote size={24} />, color: 'bg-purple-500' },
    { id: 'card', name: 'Банкны карт', icon: <CreditCard size={24} />, color: 'bg-orange-500' }
  ];

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          amount: parseInt(amount)
        })
      });
      const data = await response.json();
      if (data.status === 200) {
        // Redirect to payment gateway
        window.location.href = data.data.paymentUrl;
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Төлбөрүүд</h1>
          <p className="text-gray-600 mt-1">Төлбөр хийх, түүхээ харах</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Төлбөр хийх</h2>
              
              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дүн (₮)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="780,000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Төлбөрийн арга
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                        selectedMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${method.color} text-white p-2 rounded-lg`}>
                        {method.icon}
                      </div>
                      <span className="font-medium">{method.name}</span>
                      {selectedMethod === method.id && (
                        <Check size={18} className="text-green-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition"
              >
                Төлбөр хийх
              </button>
            </div>
          </div>

          {/* Payment History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Сүүлийн төлбөрүүд</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">
                          {payment.amount?.toLocaleString()}₮
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'success' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {payment.status === 'success' ? 'Амжилттай' : 'Хүлээгдэж байна'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                        <span>{payment.method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Төлбөр байхгүй</p>
                </div>
              )}

              <button className="w-full mt-4 text-center text-green-600 text-sm hover:underline">
                Бүх түүхийг харах
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-blue-600" />
              <h3 className="font-semibold text-blue-900">Автомат сунгалт</h3>
            </div>
            <p className="text-sm text-blue-700">Автомат сунгалтыг тохиргооноос идэвхжүүлэх боломжтой</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download size={18} className="text-green-600" />
              <h3 className="font-semibold text-green-900">Нэхэмжлэх</h3>
            </div>
            <p className="text-sm text-green-700">Төлбөрийн баримтаа татаж авах</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-purple-600" />
              <h3 className="font-semibold text-purple-900">Тусламж</h3>
            </div>
            <p className="text-sm text-purple-700">Төлбөрийн асуудал гарвал холбогдох</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
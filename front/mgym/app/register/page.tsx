// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Dumbbell, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Нэрээ оруулна уу';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Нэр 2-оос дээш тэмдэгт байх ёстой';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Имэйл хаягаа оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Имэйл хаяг буруу байна';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Утасны дугаараа оруулна уу';
    } else if (!/^\d{8}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Утасны дугаар 8 оронтой байх ёстой';
    }
    
    if (!formData.password) {
      newErrors.password = 'Нууц үгээ оруулна уу';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Нууц үг 6-аас дээш тэмдэгт байх ёстой';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Үйлчилгээний нөхцөлийг зөвшөөрөх ёстой';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await register(formData.fullName, formData.email, formData.password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setErrors({ submit: result.message || 'Бүртгүүлэхэд алдаа гарлаа' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10">
          
          {/* Left Side - Branding with Green Theme */}
          <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 p-8 md:p-12 flex flex-col justify-between">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="text-green-600" size={22} />
                </div>
                <span className="text-white text-xl font-bold tracking-tight">GymHub</span>
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-sm">
                  <Sparkles size={14} />
                  <span>Үнэгүй бүртгүүлэх</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Фитнесийн амьдралаа<br />
                  <span className="text-green-200">өнөөдөр эхлүүлээрэй!</span>
                </h2>
                
                <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                  14 хоног үнэгүй туршилт. Зээлийн картын мэдээлэл шаардахгүй.
                </p>
              </div>
            </div>
            
            <div className="relative z-10 mt-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle size={14} className="text-green-300" />
                  <span>14 өдрийн буцаан олголт</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle size={14} className="text-green-300" />
                  <span>Аюулгүй төлбөр</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle size={14} className="text-green-300" />
                  <span>24/7 дэмжлэг</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Register Form */}
          <div className="bg-white p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="flex md:hidden justify-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="text-white" size={24} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Бүртгүүлэх</h1>
              <p className="text-gray-500 text-sm mt-1">GymHub-ийн гишүүн болоорой</p>
            </div>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm">{errors.submit}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Бүтэн нэр
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition ${
                      errors.fullName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Жишээ: Баттулга Ганбаатар"
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Имэйл хаяг
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Утасны дугаар
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition ${
                      errors.phone ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="99119911"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Нууц үг
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition ${
                      errors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Нууц үг баталгаажуулах
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Үйлчилгээний нөхцөл, Нууцлалын бодлогыг уншиж зөвшөөрч байна
                </label>
              </div>
              {errors.agreeTerms && <p className="text-red-500 text-xs">{errors.agreeTerms}</p>}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Бүртгүүлж байна...
                  </>
                ) : (
                  <>
                    Бүртгүүлэх
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Бүртгэлтэй юу?{' '}
                <Link href="/login" className="text-green-600 font-semibold hover:text-green-700 transition">
                  Нэвтрэх
                </Link>
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400 mb-3">
                Бүртгүүлснээр та дараах боломжуудыг авах болно
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>25+ фитнес төвүүдээр үйлчлүүлэх</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Уян хатан гишүүнчлэлийн багцууд</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Дасгалын түүх, статистик хянах</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Dumbbell, Building, Crown, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(''); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role;
      
      switch (role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'gym_manager':
          router.push('/gym-owner/dashboard');
          break;
        default:
          router.push('/dashboard');
          break;
      }
    } else {
      setError(result.message || 'Нэвтрэхэд алдаа гарлаа');
    }
  };

  const demoAccounts = [
    { name: 'Админ', role: 'admin', email: 'admin@gymhub.com', password: 'admin123', icon: <Crown size={16} /> },
    { name: 'Gym эзэмшигч', role: 'gym_manager', email: 'gymowner@gymhub.com', password: 'gym123', icon: <Building size={16} /> },
    { name: 'Хэрэглэгч', role: 'user', email: 'user@gymhub.com', password: 'user123', icon: <User size={16} /> },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setFormData({ email, password });
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
                  <span>Монголын №1 фитнес сүлжээ</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Нэг гишүүнчлэл —<br />
                  <span className="text-green-200">Олон боломж!</span>
                </h2>
                
                <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                  25+ фитнес төвүүд, 6000+ итгэлтэй гишүүд. 
                  Өөрт ойрхон хүссэн газраа, хүссэн үедээ хичээллээрэй.
                </p>
              </div>
            </div>
            
            <div className="relative z-10 mt-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>24/7 Үйлчилгээ</span>
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Аюулгүй төлбөр</span>
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>14 хоногийн буцаан олголт</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                <div>
                  <div className="text-2xl font-bold text-white">25+</div>
                  <div className="text-xs text-white/60">Фитнес төвүүд</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">6,000+</div>
                  <div className="text-xs text-white/60">Идэвхтэй гишүүд</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50k+</div>
                  <div className="text-xs text-white/60">Дасгал хийсэн</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="bg-white p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="flex md:hidden justify-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="text-white" size={24} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Тавтай морил</h1>
              <p className="text-gray-500 text-sm mt-1">GymHub-д нэвтрэх</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>
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
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-400 outline-none transition"
                    placeholder="••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-600">Санаж байх</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 transition">
                  Нууц үг мартсан?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg shadow-green-500/20"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Нэвтэрч байна...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Нэвтрэх
                    <ArrowRight size={18} />
                  </div>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Бүртгэлгүй юу?{' '}
                <Link href="/register" className="text-green-600 font-semibold hover:text-green-700 transition">
                  Бүртгүүлэх
                </Link>
              </p>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
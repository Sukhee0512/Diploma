// app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Edit2, ArrowLeft, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getUserProfile, changePassword, updateUserProfile } from '@/app/lib/api';

export default function ProfilePage() {
  const { user, isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      fetchProfile();
    }
  }, [user, userRole]);

  const fetchProfile = async () => {
    try {
      const response = await getUserProfile(user!.id);
      console.log('Profile response:', response);
      
      if (response.resultCode === 200 && response.data?.length > 0) {
        const userData = response.data[0];
        setProfile(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          birthDate: userData.birth_date || '',
          gender: userData.gender || ''
        }));
      } else {
        // Use user from auth context as fallback
        setProfile(prev => ({
          ...prev,
          name: user?.name || '',
          email: user?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use user from auth context as fallback
      setProfile(prev => ({
        ...prev,
        name: user?.name || '',
        email: user?.email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Update profile API call
      const response = await updateUserProfile(user!.id, {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        birth_date: profile.birthDate,
        gender: profile.gender
      });
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: 'Профайл амжилттай шинэчлэгдлээ' });
        setIsEditing(false);
        // Update local storage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.name = profile.name;
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('userName', profile.name);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Алдаа гарлаа' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Нууц үг таарахгүй байна' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await changePassword(profile.email, passwordData.oldPassword, passwordData.newPassword);
      console.log('Password change response:', response);
      
      if (response.resultCode === 3022) {
        setMessage({ type: 'success', text: 'Нууц үг амжилттай солигдлоо' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else if (response.resultCode === 3023) {
        setMessage({ type: 'error', text: 'Хуучин нууц үг буруу байна' });
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Алдаа гарлаа' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition"
          >
            <ArrowLeft size={18} />
            <span>Хянах самбар руу буцах</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Профайл</h1>
            <p className="text-gray-600 mt-1">Таны хувийн мэдээлэл</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
            {isEditing ? 'Хадгалах' : 'Засах'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border border-green-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-green-600 to-green-500 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                  <div className="w-full h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profile.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-green-600 text-white p-1.5 rounded-full shadow-md hover:bg-green-700 transition">
                    <Camera size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-16 p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Бүтэн нэр
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent' 
                          : 'border-transparent bg-gray-50 text-gray-700'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имэйл хаяг
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-transparent bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Имэйл хаяг өөрчлөх боломжгүй</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Утасны дугаар
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="99119911"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent' 
                          : 'border-transparent bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Хүйс
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg transition ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent' 
                        : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <option value="">Сонгох</option>
                    <option value="male">Эрэгтэй</option>
                    <option value="female">Эмэгтэй</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Төрсөн огноо
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={profile.birthDate}
                      onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent' 
                          : 'border-transparent bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Хаяг
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Таны хаяг..."
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition resize-none ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent' 
                          : 'border-transparent bg-gray-50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset form data
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Хадгалж байна...' : 'Хадгалах'}
                  </button>
                </div>
              )}
            </form>

            {/* Change Password Section */}
            <div className="border-t mt-6 pt-6">
              <button
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setMessage(null);
                }}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 transition font-medium"
              >
                <Lock size={16} />
                {showPasswordForm ? 'Хаах' : 'Нууц үг солих'}
              </button>
              
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Хуучин нууц үг
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Шинэ нууц үг
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Хамгийн багадаа 6 тэмдэгт</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Шинэ нууц үг баталгаажуулах
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Солиж байна...' : 'Нууц үг солих'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Бүртгэлийн мэдээлэл</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Бүртгүүлсэн огноо</span>
              <span className="text-gray-800">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2024-01-01'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Хэрэглэгчийн эрх</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                {userRole === 'user' ? 'Хэрэглэгч' : userRole === 'gym_manager' ? 'Gym эзэмшигч' : 'Админ'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Хэрэглэгчийн ID</span>
              <span className="text-gray-800">#{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
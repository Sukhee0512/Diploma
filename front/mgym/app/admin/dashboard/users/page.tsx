// app/admin/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Building, Crown, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getAllUsers, updateUserRole, getGyms, assignGymToManager } from '@/app/lib/api';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'gym_manager' | 'admin';
  created_at: string;
}

interface Gym {
  id: number;
  name: string;
  location: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (userRole !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, userRole, router]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
      fetchGyms();
    }
  }, [userRole, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      console.log('Users response:', response);
      
      if (response.resultCode === 200 && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Хэрэглэгчдийн жагсаалтыг ачаалахад алдаа гарлаа' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGyms = async () => {
    try {
      const response = await getGyms();
      if (response.resultCode === 200 && response.data) {
        setGyms(response.data);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const confirmMsg = newRole === 'gym_manager' 
      ? `"${user.name}" хэрэглэгчийг Gym эзэмшигч болгох уу?`
      : `"${user.name}" хэрэглэгчийн эрхийг "${newRole}" болгон өөрчлөх үү?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      const response = await updateUserRole(userId, newRole);
      console.log('Update role response:', response);
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: `"${user.name}" хэрэглэгчийн эрх амжилттай өөрчлөгдлөө` });
        fetchUsers();
        
        // If changed to gym_manager, show assign modal
        if (newRole === 'gym_manager') {
          const updatedUser = { ...user, role: 'gym_manager' as const };
          setSelectedUser(updatedUser);
          setShowAssignModal(true);
        }
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Эрх өөрчлөхөд алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    }
  };

  const handleAssignGym = async () => {
    if (!selectedUser || !selectedGymId) {
      setMessage({ type: 'error', text: 'Gym сонгоно уу' });
      return;
    }
    
    try {
      const response = await assignGymToManager(selectedUser.id, selectedGymId);
      console.log('Assign gym response:', response);
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: `"${selectedUser.name}" хэрэглэгчдэд gym амжилттай оноогдлоо` });
        setShowAssignModal(false);
        setSelectedUser(null);
        setSelectedGymId(null);
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Gym онооход алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Error assigning gym:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Crown size={12} /> Админ</span>;
      case 'gym_manager':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Building size={12} /> Gym эзэмшигч</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><User size={12} /> Хэрэглэгч</span>;
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleFilteredUsers = selectedRole 
    ? filteredUsers.filter(user => user.role === selectedRole)
    : filteredUsers;

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Хэрэглэгчдийн удирдлага</h1>
          <p className="text-gray-600 mt-1">Хэрэглэгчдийн эрхийг өөрчлөх, gym эзэмшигч томилох</p>
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
              <input
                type="text"
                placeholder="Нэр, имэйлээр хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
            >
              <option value="">Бүх хэрэглэгчид</option>
              <option value="user">Энгийн хэрэглэгчид</option>
              <option value="gym_manager">Gym эзэмшигчид</option>
              <option value="admin">Админууд</option>
            </select>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Шинэчлэх
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roleFilteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Хэрэглэгч олдсонгүй</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Хэрэглэгч</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Имэйл</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Эрх</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Бүртгүүлсэн</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roleFilteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">{user.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {user.role !== 'admin' && currentUser?.id !== user.id && (
                          <select
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            defaultValue={user.role}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 text-black"
                          >
                            <option value="user">Хэрэглэгч</option>
                            <option value="gym_manager">Gym эзэмшигч</option>
                            {currentUser?.role === 'admin' && (
                              <option value="admin">Админ</option>
                            )}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Gym Modal */}
        {showAssignModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-2">Gym оноох</h2>
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">{selectedUser.name}</span> хэрэглэгчдэд gym оноох
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gym сонгох *
                </label>
                <select
                  value={selectedGymId || ''}
                  onChange={(e) => setSelectedGymId(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Gym сонгоно уу</option>
                  {gyms.map((gym) => (
                    <option key={gym.id} value={gym.id}>
                      {gym.name} - {gym.location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedGymId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Цуцлах
                </button>
                <button
                  onClick={handleAssignGym}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Оноох
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
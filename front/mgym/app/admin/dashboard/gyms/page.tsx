// app/admin/dashboard/gyms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, MapPin, Plus, Edit2, Trash2, 
  Search, X, CheckCircle, XCircle, CalendarDays,
  Upload, ImageIcon, Loader2
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  getGyms, createGym, updateGym, deleteGym, 
  uploadGymImage, deleteGymImage, getGymImages 
} from '@/app/lib/api';

interface Gym {
  id: number;
  name: string;
  location: string;
  image: string | null;
  created_at: string;
}

interface GymImage {
  id: number;
  image_url: string;
  is_main: boolean;
  created_at: string;
}

export default function AdminGymsPage() {
  const { user, isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [gymImages, setGymImages] = useState<GymImage[]>([]);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    } else if (userRole !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, userRole, router]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchGyms();
    }
  }, [userRole]);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await getGyms();
      console.log('Gyms API Response:', response);
      
      if (response.resultCode === 200 && response.data) {
        const gymsData = response.data.map((gym: any) => ({
          id: gym.id,
          name: gym.name,
          location: gym.location,
          image: gym.image || null,
          created_at: gym.created_at
        }));
        setGyms(gymsData);
      } else {
        setGyms([]);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setMessage({ type: 'error', text: 'Фитнес төвүүдийг ачаалахад алдаа гарлаа' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGymImages = async (gymId: number) => {
    try {
      const response = await getGymImages(gymId);
      if (response.resultCode === 200 && response.data) {
        setGymImages(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching gym images:', error);
      return [];
    }
  };

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      setMessage({ type: 'error', text: 'Бүх талбарыг бөглөнө үү' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await createGym(formData.name.trim(), formData.location.trim());
      
      if (response.resultCode === 200 && response.data && response.data[0]) {
        setMessage({ type: 'success', text: 'Фитнес төв амжилттай үүсгэгдлээ' });
        setFormData({ name: '', location: '' });
        setShowModal(false);
        fetchGyms();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Фитнес төв үүсгэхэд алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Error creating gym:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym) return;
    
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await updateGym(editingGym.id, formData.name, formData.location);
      
      if (response.resultCode === 200 && response.data && response.data[0]) {
        setMessage({ type: 'success', text: 'Фитнес төв амжилттай шинэчлэгдлээ' });
        setEditingGym(null);
        setFormData({ name: '', location: '' });
        setShowModal(false);
        fetchGyms();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Фитнес төв шинэчлэхэд алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Error updating gym:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGym = async (gym: Gym) => {
    if (!confirm(`"${gym.name}" фитнес төвийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await deleteGym(gym.id);
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: 'Фитнес төв амжилттай устгагдлаа' });
        fetchGyms();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Фитнес төв устгахад алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!selectedGym) return;
    
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Зөвхөн зураг файл сонгоно уу' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Зурагны хэмжээ 5MB-с бага байх ёстой' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const response = await uploadGymImage(selectedGym.id, file);
      
      if (response.resultCode === 200 && response.data) {
        setMessage({ type: 'success', text: 'Зураг амжилттай хадгалагдлаа' });
        await fetchGyms();
        await fetchGymImages(selectedGym.id);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Зураг хадгалахад алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Энэ зургийг устгах уу?')) return;

    setUploading(true);
    setMessage(null);

    try {
      const response = await deleteGymImage(imageId);
      
      if (response.resultCode === 200) {
        setMessage({ type: 'success', text: 'Зураг амжилттай устгагдлаа' });
        await fetchGyms();
        await fetchGymImages(selectedGym!.id);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.resultMessage || 'Зураг устгахад алдаа гарлаа' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Сервертэй холбогдоход алдаа гарлаа' });
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGym(null);
    setFormData({ name: '', location: '' });
    setShowModal(true);
  };

  const openEditModal = (gym: Gym) => {
    setEditingGym(gym);
    setFormData({ name: gym.name, location: gym.location });
    setShowModal(true);
  };

  const openImageModal = async (gym: Gym) => {
    setSelectedGym(gym);
    setGymImages([]);
    setShowImageModal(true);
    await fetchGymImages(gym.id);
  };

  const filteredGyms = gyms.filter(gym =>
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gym.location && gym.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Фитнес төвүүд</h1>
            <p className="text-gray-600 mt-1">Фитнес төвүүдийг удирдах</p>
          </div>
          <button
            onClick={openCreateModal}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={18} />
            Шинэ фитнес төв
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

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray600" size={18} />
            <input
              type="text"
              placeholder="Фитнес нэр, байршлаар хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Gyms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : filteredGyms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12">
            <Building size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Фитнес төв олдсонгүй</p>
            <button onClick={openCreateModal} className="mt-4 text-green-600 hover:underline">
              Шинэ фитнес төв үүсгэх
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGyms.map((gym) => {
              const imageUrl = getFullImageUrl(gym.image);
              
              return (
                <div key={gym.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  {/* Card Image - SIMPLIFIED VERSION */}
                  <div 
                    className="relative h-48 cursor-pointer overflow-hidden bg-gray-100"
                    onClick={() => openImageModal(gym)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={gym.name}
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center">
                        <Building size={48} className="text-white/50" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(gym);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition z-10"
                    >
                      <Upload size={14} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{gym.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(gym)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGym(gym)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <MapPin size={14} />
                      {gym.location || 'Байршил заагаагүй'}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarDays size={12} />
                        {gym.created_at ? new Date(gym.created_at).toLocaleDateString() : 'Саяхан'}
                      </div>
                      <button
                        onClick={() => openImageModal(gym)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        {gym.image ? 'Зураг солих' : 'Зураг нэмэх'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingGym ? 'Фитнес төв засварлах' : 'Шинэ фитнес төв'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={editingGym ? handleUpdateGym : handleCreateGym}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Фитнес нэр *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Жишээ: Adrenaline фитнес"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Байршил *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Жишээ: Сүхбаатар дүүрэг, 1-р хороо"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Хадгалж байна...' : (editingGym ? 'Шинэчлэх' : 'Үүсгэх')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageModal && selectedGym && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedGym.name} - Зураг удирдах
                </h2>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedGym(null);
                    setGymImages([]);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Current Images Grid */}
              {gymImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Бүртгэлтэй зургууд</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gymImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={getFullImageUrl(image.image_url) || undefined}
                          alt="Gym"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {image.is_main && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Гол
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={uploading}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 opacity-0 group-hover:opacity-100"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Шинэ зураг нэмэх</h3>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Зураг дээр дарж эсвэл чирж оруулах</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (MAX 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUploadImage(e.target.files[0]);
                      }
                    }}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploading && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Хадгалж байна...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedGym(null);
                    setGymImages([]);
                    fetchGyms();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
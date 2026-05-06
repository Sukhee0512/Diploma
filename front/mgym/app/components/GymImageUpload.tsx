// app/components/GymImageUpload.tsx
'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadGymImage, getGymImages, deleteGymImage } from '@/app/lib/api';

interface GymImage {
  id: number;
  image_url: string;
  is_main: boolean;
  created_at: string;
}

interface GymImageUploadProps {
  gymId: number;
  onImagesUpdate?: (images: GymImage[]) => void;
  isAdmin?: boolean;
}

export default function GymImageUpload({ gymId, onImagesUpdate, isAdmin = false }: GymImageUploadProps) {
  const [images, setImages] = useState<GymImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Зургуудыг ачаалах
  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await getGymImages(gymId);
      if (response.resultCode === 200 && response.data) {
        setImages(response.data);
        onImagesUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Зургуудыг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gymId) {
      loadImages();
    }
  }, [gymId]);

  // Зураг upload хийх
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Зөвхөн зураг файл сонгоно уу');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Зурагны хэмжээ 5MB-с бага байх ёстой');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const response = await uploadGymImage(gymId, file);
      
      if (response.resultCode === 200 && response.data) {
        await loadImages();
        alert('Зураг амжилттай хадгалагдлаа');
        e.target.value = '';
      } else {
        setError(response.resultMessage || 'Зураг хадгалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  // Зураг устгах
  const handleDelete = async (imageId: number) => {
    if (!confirm('Энэ зургийг устгах уу?')) return;
    
    setDeletingId(imageId);
    setError(null);
    
    try {
      const response = await deleteGymImage(imageId);
      if (response.resultCode === 200) {
        await loadImages();
        alert('Зураг амжилттай устгагдлаа');
      } else {
        setError(response.resultMessage || 'Зураг устгахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setDeletingId(null);
    }
  };

  // Image URL-ийг бүрэн болгох
  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Gym-ын зураг</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {/* Upload хэсэг */}
      {isAdmin && (
        <div className="mb-6">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Хадгалж байна...' : 'Зураг нэмэх'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
      
      {/* Зургуудын жагсаалт */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={getFullImageUrl(image.image_url)}
                alt="Gym"
                className="w-full h-40 object-cover rounded-lg"
              />
              {image.is_main && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Гол зураг
                </div>
              )}
              {isAdmin && (
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={deletingId === image.id}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {deletingId === image.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Зураг байхгүй байна</p>
          {isAdmin && (
            <p className="text-sm text-gray-400 mt-2">"Зураг нэмэх" товч дарж зураг нэмнэ үү</p>
          )}
        </div>
      )}
    </div>
  );
}
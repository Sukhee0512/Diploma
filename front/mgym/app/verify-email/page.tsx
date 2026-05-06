// app/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail, Dumbbell } from 'lucide-react';
import { apiRequest } from '@/app/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Баталгаажуулах токен олдсонгүй');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiRequest('verify_email', { token });
        
        if (response.resultCode === 3010) {
          setStatus('success');
          setMessage('Таны имэйл хаяг амжилттай баталгаажлаа! Та одоо нэвтрэх боломжтой.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.resultMessage || 'Имэйл баталгаажуулахад алдаа гарлаа');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Сервертэй холбогдоход алдаа гарлаа');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              {status === 'loading' && <Loader2 size={40} className="text-green-600 animate-spin" />}
              {status === 'success' && <CheckCircle size={40} className="text-green-600" />}
              {status === 'error' && <XCircle size={40} className="text-red-500" />}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Баталгаажуулж байна...'}
            {status === 'success' && 'Амжилттай!'}
            {status === 'error' && 'Алдаа гарлаа'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {status === 'success' && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition"
            >
              Нэвтрэх
            </Link>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition"
              >
                Дахин бүртгүүлэх
              </Link>
              <p className="text-sm text-gray-500">
                Эсвэл{' '}
                <Link href="/login" className="text-green-600 hover:underline">
                  нэвтрэх
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
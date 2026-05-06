// components/Footer.tsx
'use client';

import Link from 'next/link';
import { 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaYoutube,
  FaApple,
  FaGooglePlay
} from 'react-icons/fa';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiClock 
} from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                GymHub
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Нэг гишүүнчлэл - Олон боломж! Бид танд олон фитнес клубуудыг нэг гишүүнчлэлийн эрхээр хичээллэх боломжийг олгодог.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Холбоосууд</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-green-400 transition-colors">
                  Бидний тухай
                </Link>
              </li>
              <li>
                <Link href="/gyms" className="text-gray-400 hover:text-green-400 transition-colors">
                  Фитнес төвүүд
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-gray-400 hover:text-green-400 transition-colors">
                  Үнийн багц
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-green-400 transition-colors">
                  Мэдээ мэдээлэл
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-green-400 transition-colors">
                  Түгээмэл асуултууд
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Тусламж</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-green-400 transition-colors">
                  Үйлчилгээний нөхцөл
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">
                  Нууцлалын бодлого
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-green-400 transition-colors">
                  Буцаан олголт
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-green-400 transition-colors">
                  Холбоо барих
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-green-400 transition-colors">
                  Дэмжлэг
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Холбоо барих</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <FiMapPin className="text-green-400 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400 text-sm">
                  Улаанбаатар хот, Чингэлтэй дүүрэг,<br />
                  Фитнес төвүүдийн холбоо
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <FiPhone className="text-green-400" size={18} />
                <a href="tel:+97612345678" className="text-gray-400 hover:text-green-400 transition-colors">
                  +976 1234 5678
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FiMail className="text-green-400" size={18} />
                <a href="mailto:info@gymhub.mn" className="text-gray-400 hover:text-green-400 transition-colors">
                  info@gymhub.mn
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FiClock className="text-green-400" size={18} />
                <span className="text-gray-400">Даваа - Ням: 06:00 - 23:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* App Download Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-2">Аппыг татаж авах</h4>
              <p className="text-gray-400 text-sm">GymHub аппаар илүү хялбар, хурдан</p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors">
                <FaApple size={24} />
                <div>
                  <div className="text-xs text-gray-400">App Store</div>
                  <div className="font-semibold">iOS App</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors">
                <FaGooglePlay size={24} />
                <div>
                  <div className="text-xs text-gray-400">Google Play</div>
                  <div className="font-semibold">Android App</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <h4 className="text-center text-sm text-gray-400 mb-4">Хамтрагч байгууллагууд</h4>
          <div className="flex flex-wrap justify-center gap-8">
            {['QPay', 'Sono', 'Pocket', 'Golomt', 'Khan Bank'].map((partner, index) => (
              <span key={index} className="text-gray-500 text-sm hover:text-gray-300 transition-colors cursor-pointer">
                {partner}
              </span>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} GymHub. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            GymHub нь Монгол улсын хууль тогтоомжийн дагуу үйл ажиллагаагаа явуулдаг.
          </p>
        </div>
      </div>
    </footer>
  );
}
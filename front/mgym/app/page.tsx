// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  CreditCard, 
  MapPin, 
  User, 
  Calendar, 
  Bell,
  ArrowRight,
  Building2,
  Wallet,
  Users,
  Clock,
  LayoutDashboard,
  CheckCircle,
  Star,
  Shield
} from 'lucide-react';
import Footer from './components/Footer';

export default function HomePage() {
  const [stats, setStats] = useState({
    gyms: 0,
    activeMembers: 0,
    partners: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_dashboard_stats' })
      });
      const data = await response.json();
      if (data.status === 200) {
        setStats({
          gyms: data.data.total_gyms || 25,
          activeMembers: data.data.active_memberships || 6000,
          partners: data.data.total_gyms || 25
        });
      } else {
        // Fallback stats if API fails
        setStats({
          gyms: 25,
          activeMembers: 5847,
          partners: 25
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback stats
      setStats({
        gyms: 25,
        activeMembers: 5847,
        partners: 25
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-white to-green-50 py-12 md:py-16 lg:py-20">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl lg:max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star size={16} />
              Монголын хамгийн том фитнес сүлжээ
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Нэг гишүүнчлэл -
              </span>
              <br />
              <span className="text-gray-800">Олон боломж!</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-800 mb-6 md:mb-10 leading-relaxed">
              Бид танд олон фитнес клубуудыг нэг гишүүнчлэлийн эрхээр өөрт ойрхон хүссэн газраа, 
              хүссэн үедээ хичээллэх боломжийг олгодог.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl"
              >
                Үнэгүй бүртгүүлэх <ArrowRight size={18} />
              </Link>
              <Link 
                href="/plans" 
                className="inline-flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-green-50 transition-all"
              >
                Үнийн багц үзэх
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-green-500" />
                <span>14 өдрийн буцаан олголт</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Shield size={16} className="text-green-500" />
                <span>Аюулгүй төлбөр</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users size={16} className="text-green-500" />
                <span>6000+ итгэлтэй гишүүн</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with animation */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-green-500 transition-colors duration-300">
                <Building2 className="text-green-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div className="text-xl md:text-3xl font-bold text-gray-800">{loading ? '...' : `${stats.partners}+`}</div>
              <div className="text-xs md:text-sm text-gray-700">Фитнес Төвүүд</div>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-green-500 transition-colors duration-300">
                <Users className="text-green-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div className="text-xl md:text-3xl font-bold text-gray-800">{loading ? '...' : `${stats.activeMembers.toLocaleString()}+`}</div>
              <div className="text-xs md:text-sm text-gray-700">Идэвхтэй Гишүүн</div>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-green-500 transition-colors duration-300">
                <Activity className="text-green-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div className="text-xl md:text-3xl font-bold text-gray-800">18+</div>
              <div className="text-xs md:text-sm text-gray-700">Байгууллага</div>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-green-500 transition-colors duration-300">
                <Clock className="text-green-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div className="text-xl md:text-3xl font-bold text-gray-800">24/7</div>
              <div className="text-xs md:text-sm text-gray-700">Үйлчилгээ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-black">
              Нэг бүртгэл — <span className="text-green-600">бүх боломж</span>
            </h2>
            <p className="text-gray-800 max-w-2xl mx-auto">
              Бид танд дараах боломжуудыг санал болгож байна
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 md:p-6 text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-green-500 transition-all duration-300">
                  <div className="text-green-600 group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - New */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-black">
              Хэрхэн <span className="text-green-600">ажилладаг</span> вэ?
            </h2>
            <p className="text-gray-800 max-w-2xl mx-auto">
              3 энгийн алхамаар фитнесийн амьдралаа эхлүүлээрэй
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[30%] h-0.5 bg-gradient-to-r from-green-300 to-green-500"></div>
                )}
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-black">Гишүүнчлэлийн багцууд</h2>
            <p className="text-center text-sm md:text-base text-gray-800 max-w-2xl mx-auto">
              Бид таны фитнесийн хэв маягийг хязгаарлахгүйгээр, хамгийн өргөн сонголтыг санал болгож байна!
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-green-500 shadow-2xl' : 'border border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-6 py-1.5 rounded-bl-2xl text-xs md:text-sm font-semibold">
                      Хамгийн сонголттой
                    </div>
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                  <div className="text-3xl md:text-4xl font-bold text-green-600 mb-3 md:mb-4">{plan.price} ₮</div>
                  <p className="text-sm text-gray-700 mb-4">{plan.description}</p>
                  <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm md:text-base text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/register" 
                    className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-md'
                        : 'border-2 border-green-600 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    Эхлэх
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Gyms Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-black">
              Манай хамтрагч <span className="text-green-600">фитнес клубууд</span>
            </h2>
            <p className="text-gray-800">25 гаруй фитнес төвүүд таныг хүлээж байна</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {partnerGyms.map((gym, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-3 md:p-4 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-500 transition-colors">
                  <Activity className="text-green-600 group-hover:text-white transition-colors" size={20} />
                </div>
                <p className="font-medium text-xs md:text-sm text-gray-700 group-hover:text-green-600 transition-colors">{gym}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/gyms" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all">
              Бүх фитнес төвүүдийг харах
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container-custom mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-black">
              Гишүүдийн <span className="text-green-600">сэтгэгдэл</span>
            </h2>
            <p className="text-gray-800">Биднийг сонгосон гишүүдийн сэтгэгдэл</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-xs text-gray-700">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-black">Түгээмэл асуултууд</h2>
            <p className="text-gray-800">Танд туслах хариултууд</p>
          </div>
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-gray-50 rounded-xl p-3 md:p-4 cursor-pointer group transition-all">
                <summary className="font-semibold text-sm md:text-base text-gray-800 group-open:text-green-600 list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-green-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 md:mt-3 text-sm md:text-base text-gray-700 pl-2 md:pl-4 pt-2 border-t border-gray-200">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      
      <Footer/>
    </div>
    
  );
}

// Updated features with proper icons
const features = [
  {
    icon: <LayoutDashboard size={24} />,
    title: "Хянах самбар",
    description: "Гишүүнчлэлийн эрх, хугацаа, түүхийг нэг цонхноос хянах."
  },
  {
    icon: <CreditCard size={24} />,
    title: "Төлбөр ба идэвхжүүлэлт",
    description: "Qpay, SocialPay, Pocket зэргээр төлөөд гишүүнчлэлээ шууд идэвхжүүлнэ."
  },
  {
    icon: <MapPin size={24} />,
    title: "Фитнес сонголт",
    description: "Хамтрагч төвөөс сонгож, очих хүсэлт илгээж бэлтгэлээ эхлүүлнэ."
  },
  {
    icon: <User size={24} />,
    title: "Профайл",
    description: "Өөрийн мэдээлэл, зураг — зөвхөн танд зориулсан аюулгүй бүртгэл."
  },
  {
    icon: <Calendar size={24} />,
    title: "Хуваарь ба захиалга",
    description: "Өдрийн хуваарь, ангийн цагуудыг хараад өөрт тохирох цагтаа бүртгүүлнэ."
  },
  {
    icon: <Bell size={24} />,
    title: "Мэдэгдэл",
    description: "Гишүүнчлэл, хичээл, сануулгын чухал мэдээллийг шууд хүлээн авна."
  }
];

const pricingPlans = [
  {
    name: "EARLY",
    price: "480,000",
    description: "Жилийн гишүүнчлэлээ нэг дор төлж, бүх хамтрагч фитнес клубуудаар хичээллэх эрхтэй.",
    features: ["1 жил хүчинтэй", "≈ 40,000 ₮ / сар", "Бүх фитнес төвүүдэд"],
    popular: false
  },
  {
    name: "PREMIUM",
    price: "780,000",
    description: "Олон фитнес клубуудаар нэг гишүүнчлэлийн эрхээр хүссэн газартаа, хүссэн үедээ хичээллэх бүрэн боломж.",
    features: ["1 жил хүчинтэй", "Бүх фитнес төвүүдэд", "Дээд зэргийн үйлчилгээ", "VIP дэмжлэг"],
    popular: true
  }
];

const partnerGyms = [
  "Adrenaline фитнес", "AMG GYM", "Apex фитнес", "Art Fitness Club",
  "Avengers фитнес", "Captain Gym", "Empire Gym", "Encanto Fitness",
  "GOT fitness", "Land Fitness", "LEVEL UP Fitness", "Modun Fitness",
  "Monster Фитнес", "Super Fitness", "Viva Villa Fitness"
];

const faqs = [
  {
    question: "GymHub гэж юу вэ?",
    answer: "Нэг гишүүнчлэлийн эрхээр олон фитнес төвөөр үйлчлүүлэх боломж олгодог уян хатан, дижитал систем юм."
  },
  {
    question: "Хэрхэн гишүүнчлэл авах вэ?",
    answer: "Веб сайтаар бүртгүүлж, хүссэн багцаа сонгон, төлбөрөө төлөөд шууд идэвхжүүлнэ."
  },
  {
    question: "Хэдэн фитнес төвөөр үйлчлүүлэх боломжтой вэ?",
    answer: "25 гаруй хамтрагч фитнес төвүүдээр нэг гишүүнчлэлээр үйлчлүүлэх боломжтой."
  },
  {
    question: "Гишүүнчлэлээ хэрхэн цуцлах вэ?",
    answer: "Хянах самбараас эсвэл бидэнтэй холбогдож гишүүнчлэлээ хүссэн үедээ цуцлах боломжтой."
  },
  {
    question: "Хэрэглээгүй хугацааны мөнгийг буцааж авах боломжтой юу?",
    answer: "Тийм, 14 хоногийн дотор хэрэглээгүй бол бүрэн мөнгийг буцаан олгоно."
  }
];

const steps = [
  {
    number: "1",
    title: "Бүртгүүлэх",
    description: "Өөрийн мэдээллээ оруулан үнэгүй бүртгүүлээрэй"
  },
  {
    number: "2",
    title: "Багц сонгох",
    description: "Өөрт тохирох гишүүнчлэлийн багцаа сонгоно уу"
  },
  {
    number: "3",
    title: "Дасгал хийх",
    description: "Хамтрагч фитнес төвүүдээр дасгал хийж эхлээрэй"
  }
];

const testimonials = [
  {
    name: "Баттулга Г.",
    role: "Premium гишүүн",
    text: "Маш их таалагдлаа! Нэг гишүүнчлэлээр олон фитнес төвөөр үйлчлүүлэх боломжтой болсон нь үнэхээр тохиромжтой."
  },
  {
    name: "Номин Э.",
    role: "Early гишүүн",
    text: "Ажлын дараа ойрхон фитнес төвөөр дасгал хийх боломж гарсан. Цаг хэмнэлттэй, үр дүнтэй."
  },
  {
    name: "Төмөрбаатар Б.",
    role: "Корпоратик гишүүн",
    text: "Манай компанийн ажилтнууд бүгд энэ системд шилжсэн. Маш уян хатан, хямд үнэтэй."
  }
];
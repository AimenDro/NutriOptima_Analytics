import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '🤖', title: 'AI Diet Plans', desc: 'Generates personalized meal plans based on your BMI, goals & cuisine.', grad: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  { icon: '📸', title: 'Food Recognition', desc: 'Snap a photo of your meal and instantly get full nutritional breakdown.', grad: 'from-blue-500 to-cyan-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { icon: '📊', title: 'Smart Tracking', desc: 'Log calories, macros, and water intake with real-time dashboard updates.', grad: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { icon: '🔔', title: 'Health Alerts', desc: 'Smart notifications when your nutrition falls below healthy thresholds.', grad: 'from-orange-500 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { icon: '💧', title: 'Water Tracker', desc: 'Personalized hydration goals based on your weight and activity level.', grad: 'from-sky-500 to-blue-600', light: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  { icon: '📅', title: 'Weekly Reports', desc: 'Automated email summaries of your nutrition progress every week.', grad: 'from-pink-500 to-rose-600', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
];

const mockScreens = [
  {
    label: 'Dashboard', icon: '📊',
    bg: 'from-emerald-400 to-green-600',
    content: (
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/70 text-xs">Daily Calories</p>
            <p className="text-white font-bold text-lg">1,840 <span className="text-white/60 text-sm">/ 2,200</span></p>
          </div>
          <div className="w-11 h-11 rounded-full border-4 border-white/40 flex items-center justify-center">
            <span className="text-white font-bold text-xs">84%</span>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full w-5/6"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['🥩','Protein','142g','bg-blue-400/40'],['🌾','Carbs','210g','bg-yellow-400/40'],['🥑','Fats','65g','bg-red-400/40']].map(([e,l,v,c])=>(
            <div key={l} className={`${c} rounded-xl p-2 text-center`}>
              <div className="text-base">{e}</div>
              <div className="text-white font-bold text-xs">{v}</div>
              <div className="text-white/70 text-xs">{l}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/15 rounded-xl p-2 flex items-center gap-2">
          <span>💧</span>
          <div className="flex-1">
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-cyan-300 h-1.5 rounded-full w-3/5"></div>
            </div>
          </div>
          <span className="text-white text-xs font-bold">1.5L/2.5L</span>
        </div>
      </div>
    ),
  },
  {
    label: 'AI Meal Plan', icon: '🤖',
    bg: 'from-blue-500 to-indigo-600',
    content: (
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-sm">Today's Plan</span>
          <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Pakistani</span>
        </div>
        {[
          {t:'🌅 Breakfast',f:'Paratha + Egg + Chai',c:'480 kcal',w:'w-1/2'},
          {t:'☀️ Lunch',f:'Chicken Karahi + Roti',c:'620 kcal',w:'w-2/3'},
          {t:'🌙 Dinner',f:'Daal + Rice + Salad',c:'540 kcal',w:'w-3/5'},
        ].map(({t,f,c,w})=>(
          <div key={t} className="bg-white/15 rounded-xl p-2">
            <div className="flex justify-between">
              <span className="text-white text-xs font-bold">{t}</span>
              <span className="text-white/80 text-xs">{c}</span>
            </div>
            <p className="text-white/60 text-xs">{f}</p>
            <div className="w-full bg-white/10 rounded-full h-1 mt-1">
              <div className={`bg-white/50 h-1 rounded-full ${w}`}></div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'Food Scan', icon: '📸',
    bg: 'from-purple-500 to-pink-600',
    content: (
      <div className="p-4 space-y-3">
        <div className="bg-white/15 rounded-2xl p-3 text-center">
          <div className="text-4xl mb-1">🥦</div>
          <div className="text-white font-bold text-sm">Broccoli Detected</div>
          <div className="text-white/60 text-xs">94% confidence</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[['🔥','Calories','55 kcal'],['💪','Protein','3.7g'],['🌾','Carbs','11g'],['🌿','Fiber','2.6g']].map(([e,k,v])=>(
            <div key={k} className="bg-white/15 rounded-xl p-2 flex items-center gap-2">
              <span className="text-sm">{e}</span>
              <div>
                <div className="text-white font-bold text-xs">{v}</div>
                <div className="text-white/60 text-xs">{k}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      const res = await fetch('http://localhost:5001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (data.success) {
        setContactStatus('success');
        setContactForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  };

  useEffect(() => {
    const t = setInterval(() => setActiveScreen(p => (p + 1) % mockScreens.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 shadow-lg shadow-green-900/20'
          : 'bg-gradient-to-r from-green-600/95 via-emerald-600/95 to-teal-600/95 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg shadow-md border border-white/30">🥗</div>
            <div>
              <span className="text-xl font-bold text-white">NutriOptima</span>
              <div className="text-xs text-green-100/70 -mt-0.5 leading-none">AI Nutrition</div>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {[
              { href: '#features', label: 'Features' },
              { href: '#how', label: 'How it works' },
              { href: '#about', label: 'About Us' },
              { href: '#contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all duration-200"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-white font-semibold text-sm border border-white/30 rounded-xl hover:bg-white/15 transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 bg-white text-emerald-700 font-bold text-sm rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Colorful blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-48 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              AI-Powered Nutrition Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Eat Smarter,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Live Better</span>
            </h1>
            <p className="text-gray-500 text-xl leading-relaxed mb-8 max-w-lg">
              Get AI-generated personalized diet plans, track meals with food image recognition, and monitor your health goals — all in one platform.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-xl shadow-green-200 hover:-translate-y-0.5 transform">
                Start Free Today →
              </button>
              <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white text-gray-700 font-bold text-lg rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:text-green-600 transition-all shadow-md">
                Sign In
              </button>
            </div>
            <div className="flex items-center gap-8">
              {[['500+','Active Users'],['1,200+','Diet Plans'],['4.8★','Rating']].map(([v,l])=>(
                <div key={l}>
                  <div className="text-gray-900 font-bold text-xl">{v}</div>
                  <div className="text-gray-400 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Phone */}
          <div className="relative flex justify-center">
            <div className="relative w-64">
              <div className="bg-gray-800 rounded-[3rem] p-3 shadow-2xl border border-gray-700">
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-700 rounded-full z-10"></div>
                <div className="rounded-[2.5rem] overflow-hidden">
                  {mockScreens.map((screen, i) => (
                    <div key={i} className={`transition-all duration-700 ${i === activeScreen ? 'block' : 'hidden'}`}>
                      <div className={`bg-gradient-to-br ${screen.bg} min-h-72`}>
                        <div className="px-4 pt-8 pb-2 flex items-center justify-between">
                          <span className="text-white font-bold text-sm">{screen.label}</span>
                          <span className="text-white/50 text-xs">NutriOptima</span>
                        </div>
                        {screen.content}
                        <div className="h-3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-20 top-12 bg-white rounded-2xl px-3 py-2 shadow-xl border border-gray-100 animate-bounce" style={{animationDuration:'3s'}}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <div className="text-gray-800 text-xs font-bold">Goal Reached!</div>
                    <div className="text-gray-400 text-xs">2,200 kcal</div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 bottom-20 bg-white rounded-2xl px-3 py-2 shadow-xl border border-gray-100 animate-bounce" style={{animationDuration:'4s',animationDelay:'1s'}}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="text-gray-800 text-xs font-bold">AI Plan Ready</div>
                    <div className="text-gray-400 text-xs">Personalized</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {mockScreens.map((_, i) => (
                <button key={i} onClick={() => setActiveScreen(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === activeScreen ? 'bg-green-500 w-6' : 'bg-gray-300 w-1.5'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why NutriOptima - replaces boring stats bar */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-purple-200">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold mb-2">Smart AI Engine</h3>
              <p className="text-purple-100 text-sm leading-relaxed">Powered by LLaMA model — generates diet plans in seconds, tailored to your exact health profile.</p>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-pink-600 rounded-3xl p-8 text-white shadow-xl shadow-pink-200">
              <div className="text-5xl mb-4">🇵🇰</div>
              <h3 className="text-2xl font-bold mb-2">Pakistani Cuisine</h3>
              <p className="text-orange-100 text-sm leading-relaxed">First nutrition platform with full support for Pakistani dishes — Karahi, Daal, Paratha and more.</p>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-2">Instant Results</h3>
              <p className="text-cyan-100 text-sm leading-relaxed">Upload a food photo and get full nutrition data in under 3 seconds using our ML recognition model.</p>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Eat Better</h2>
            <p className="text-gray-500 text-xl">Powerful features designed for your health journey</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc, grad, light, border, text }, i) => (
              <div
                key={title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`${light} border ${border} rounded-2xl p-6 transition-all duration-300 cursor-default ${hovered === i ? 'shadow-xl -translate-y-1' : 'shadow-sm'}`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-md`}>
                  {icon}
                </div>
                <h3 className={`${text} font-bold text-lg mb-2`}>{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-gray-500 text-xl">Simple, fast, and effective</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-green-300 to-blue-300"></div>
            {[
              {n:'01',icon:'📝',title:'Create Profile',desc:'Enter your age, weight, height, health goals, and dietary preferences.',color:'from-green-400 to-emerald-500'},
              {n:'02',icon:'🤖',title:'Get AI Plan',desc:'Our AI generates a personalized diet plan tailored to your exact needs.',color:'from-blue-400 to-indigo-500'},
              {n:'03',icon:'📊',title:'Track & Improve',desc:'Log meals, upload food photos, and monitor your progress daily.',color:'from-purple-400 to-pink-500'},
            ].map(({n,icon,title,desc,color})=>(
              <div key={n} className="text-center relative z-10">
                <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl`}>
                  {icon}
                </div>
                <div className="text-green-600 font-bold text-xs tracking-widest mb-2">STEP {n}</div>
                <h3 className="text-gray-900 font-bold text-xl mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Nutrition?</h2>
            <p className="text-gray-500 text-xl mb-8">Join NutriOptima today and start your personalized health journey.</p>
            <button onClick={() => navigate('/register')} className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-xl shadow-green-200 hover:-translate-y-0.5 transform">
              Create Free Account →
            </button>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200">
                🌿 About NutriOptima
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Built to Make Healthy Eating
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600"> Accessible for Everyone</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                NutriOptima was created to solve a real problem — most nutrition apps are generic, Western-focused, and ignore the dietary habits of millions of people in South Asia. We built a platform that understands your culture, your food, and your health goals.
              </p>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Powered by Groq AI and a custom-trained EfficientNet machine learning model, NutriOptima delivers personalized diet plans, food image recognition, and real-time health monitoring — all in one place.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎓', title: 'Research-Based', desc: 'Built on WHO and USDA nutrition standards' },
                  { icon: '🤖', title: 'AI-Powered', desc: 'LLaMA 3.3 for intelligent planning' },
                  { icon: '🇵🇰', title: 'Locally Relevant', desc: 'Full Pakistani cuisine support' },
                  { icon: '🔒', title: 'Secure & Private', desc: 'JWT auth, encrypted passwords' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{title}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '500+', label: 'Active Users', icon: '👥', color: 'from-green-400 to-emerald-500' },
                { num: '1,200+', label: 'Diet Plans Generated', icon: '🥗', color: 'from-blue-400 to-indigo-500' },
                { num: '131', label: 'Food Categories', icon: '📸', color: 'from-purple-400 to-pink-500' },
                { num: '4.8★', label: 'User Rating', icon: '⭐', color: 'from-orange-400 to-amber-500' },
              ].map(({ num, label, icon, color }) => (
                <div key={label} className={`bg-gradient-to-br ${color} rounded-3xl p-6 text-white shadow-xl`}>
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-3xl font-bold">{num}</div>
                  <div className="text-white/70 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-200">
              📬 Get In Touch
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-500 text-xl">Have questions or feedback? We'd love to hear from you.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              {[
                { icon: '📧', title: 'Email Us', value: 'aimenm861@gmail.com', desc: 'We reply within 24 hours', color: 'bg-green-50 border-green-200 text-green-700' },
                { icon: '📍', title: 'Location', value: 'University of Education, Lahore', desc: 'Pakistan', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { icon: '🕐', title: 'Support Hours', value: 'Mon – Fri, 9 AM – 6 PM', desc: 'Pakistan Standard Time', color: 'bg-purple-50 border-purple-200 text-purple-700' },
              ].map(({ icon, title, value, desc, color }) => (
                <div key={title} className={`flex items-start gap-4 p-5 rounded-2xl border ${color} bg-opacity-50`}>
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <div className="font-bold text-gray-800">{title}</div>
                    <div className="text-gray-700 font-medium mt-0.5">{value}</div>
                    <div className="text-gray-400 text-sm">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h3>
              {contactStatus === 'success' ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h4>
                  <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setContactStatus('')} className="mt-6 px-6 py-2 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition-all text-sm">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                      <input required type="text" placeholder="John" value={contactForm.firstName} onChange={e => setContactForm(p => ({...p, firstName: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                      <input type="text" placeholder="Doe" value={contactForm.lastName} onChange={e => setContactForm(p => ({...p, lastName: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                    <input required type="email" placeholder="john@example.com" value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <input type="text" placeholder="How can we help?" value={contactForm.subject} onChange={e => setContactForm(p => ({...p, subject: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                    <textarea required rows={4} placeholder="Write your message here..." value={contactForm.message} onChange={e => setContactForm(p => ({...p, message: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm resize-none"></textarea>
                  </div>
                  {contactStatus === 'error' && (
                    <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                      ❌ Failed to send. Please try again or email us directly.
                    </p>
                  )}
                  <button type="submit" disabled={contactStatus === 'sending'} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5 transform disabled:opacity-60 disabled:cursor-not-allowed">
                    {contactStatus === 'sending' ? '⏳ Sending...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-lg">🥗</div>
                <span className="text-white font-bold text-xl">NutriOptima</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                AI-powered nutrition management platform helping users eat smarter, track better, and live healthier.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#how" className="hover:text-green-400 transition-colors">How it works</a></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-green-400 transition-colors">Get Started</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-green-400 transition-colors">Sign In</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#about" className="hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-green-400 transition-colors">Contact</a></li>
                <li><span className="text-gray-500">Privacy Policy</span></li>
                <li><span className="text-gray-500">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2026 NutriOptima. All rights reserved.</p>
            <p className="text-gray-500 text-sm">Built with ❤️ at University of Education, Lahore</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

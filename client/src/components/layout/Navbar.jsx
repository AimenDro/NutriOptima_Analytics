import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NutriBot from '../chatbot/NutriBot';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [botOpen, setBotOpen] = useState(false);
  const toolsRef = useRef(null);
  const userRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setToolsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const primaryLinks = [
    { path: '/dashboard',     label: 'Dashboard',    icon: '📊' },
    { path: '/diet-planning', label: 'Diet Planning', icon: '🥗' },
    { path: '/my-diet-plans', label: 'My Plans',      icon: '📋' },
  ];

  const toolLinks = [
    { path: '/upload',             label: 'Food Recognition',   icon: '📷', desc: 'Identify food from photos' },
    { path: '/calorie-calculator', label: 'Calorie Calculator', icon: '🔥', desc: 'Calculate your daily needs' },
  ];

  const isToolActive = toolLinks.some(l => isActive(l.path));
  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Same gradient as landing page navbar */}
      <nav className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-green-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg shadow-md border border-white/30">
                🥗
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-white">NutriOptima</span>
                <div className="text-xs text-white/60 -mt-0.5 leading-none">AI Nutrition</div>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {primaryLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-white/25 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Tools dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setToolsOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isToolActive
                      ? 'bg-white/25 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <span className="text-base">🛠️</span>
                  <span>Tools</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {toolsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tools</p>
                    </div>
                    {toolLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setToolsOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          isActive(link.path) ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          isActive(link.path) ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {link.icon}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${isActive(link.path) ? 'text-green-700' : 'text-gray-800'}`}>
                            {link.label}
                          </div>
                          <div className="text-xs text-gray-400">{link.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">

              {/* NutriBot button */}
              <button
                onClick={() => setBotOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  botOpen
                    ? 'bg-white text-emerald-700 border-white shadow-md'
                    : 'bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50'
                }`}
                title="Ask NutriBot"
              >
                <span className="text-base">🤖</span>
                <span>NutriBot</span>
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              </button>

              {/* User dropdown */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen(o => !o)}
                  className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl px-3 py-2 transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-white/30 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white/40">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <span className="text-sm text-white font-medium max-w-[130px] truncate">{user?.email}</span>
                  <svg className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">{initials}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{user?.email}</div>
                          <div className="text-xs text-green-600 font-medium">Active Account</div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link to="/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link to="/my-diet-plans" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>📋</span> My Diet Plans
                      </Link>
                    </div>
                    <div className="border-t border-gray-50 pt-1">
                      <button
                        onClick={() => { setUserOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/20 bg-gradient-to-b from-emerald-700 to-teal-700 px-4 py-3 space-y-1 shadow-xl">
            {[...primaryLinks, ...toolLinks].map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-white/25 text-white shadow-md'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Mobile NutriBot button */}
            <button
              onClick={() => { setMobileOpen(false); setBotOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/15 hover:text-white transition-all"
            >
              <span className="text-base">🤖</span>
              NutriBot AI
              <span className="ml-auto w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            </button>

            <div className="border-t border-white/20 pt-3 mt-2">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-8 h-8 bg-white/25 rounded-lg flex items-center justify-center border border-white/30">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                <span className="text-sm text-white/80 truncate">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-900/30 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* NutriBot chat window — controlled by navbar button */}
      <NutriBot externalOpen={botOpen} onClose={() => setBotOpen(false)} />
    </>
  );
};

export default Navbar;

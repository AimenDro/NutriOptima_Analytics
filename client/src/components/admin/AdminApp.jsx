import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminDebug from './AdminDebug';
import UserManagement from './UserManagement';
import FoodDatabase from './FoodDatabase';
import ContentModeration from './ContentModeration';
import Analytics from './Analytics';
import HealthAlerts from './HealthAlerts';
import Support from './Support';

const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      // Verify token with server
      const response = await fetch('/api/admin/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAuthenticated(true);
          setAdminUser(data.data.admin);
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear storage on error
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, user) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    setIsAuthenticated(true);
    setAdminUser(user);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAuthenticated(false);
      setAdminUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show debug page if URL contains 'debug'
  if (window.location.pathname.includes('debug')) {
    return <AdminDebug />;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Bar */}
      <nav className="bg-indigo-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">

            {/* Left — logo + nav */}
            <div className="flex items-center gap-1">
              <h1 className="text-base font-bold text-white mr-4 whitespace-nowrap">NutriOptima Admin</h1>

              {[
                { key: 'dashboard',     label: 'Dashboard' },
                { key: 'users',         label: 'Users' },
                { key: 'food',          label: 'Food DB' },
                { key: 'moderation',    label: 'Moderation' },
                { key: 'analytics',     label: 'Analytics' },
                { key: 'health-alerts', label: 'Alerts' },
                { key: 'support',       label: 'Support' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCurrentView(key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    currentView === key
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Right — email + logout */}
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <div className="flex items-center gap-2 bg-indigo-700 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {adminUser?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-indigo-100 text-xs max-w-[140px] truncate">
                  {adminUser?.email}
                </span>
                <span className="text-indigo-300 text-xs hidden lg:block">
                  ({adminUser?.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'dashboard' ? (
        <AdminDashboard onNavigate={setCurrentView} />
      ) : currentView === 'users' ? (
        <UserManagement />
      ) : currentView === 'food' ? (
        <FoodDatabase />
      ) : currentView === 'moderation' ? (
        <ContentModeration />
      ) : currentView === 'analytics' ? (
        <Analytics />
      ) : currentView === 'health-alerts' ? (
        <HealthAlerts />
      ) : currentView === 'support' ? (
        <Support />
      ) : (
        <UserManagement />
      )}
    </div>
  );
};

export default AdminApp;
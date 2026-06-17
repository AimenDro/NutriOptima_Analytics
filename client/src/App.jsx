import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EnhancedDashboard from './components/dashboard/EnhancedDashboard';
import FoodUpload from './components/food/FoodUpload';
import DietPlanningNew from './components/diet/DietPlanningNew';
import MyDietPlans from './components/diet/MyDietPlans';
import CalorieCalculator from './components/diet/CalorieCalculator';
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/ui/LoadingSpinner';
import AdminApp from './components/admin/AdminApp';
import LandingPage from './components/landing/LandingPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return <LoadingSpinner />;
  }

  // Render admin app separately without main app layout
  if (isAdminRoute) {
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      
      <main className={user ? "pt-16" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <EnhancedDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <FoodUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/diet-planning" 
            element={
              <ProtectedRoute>
                <DietPlanningNew />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-diet-plans" 
            element={
              <ProtectedRoute>
                <MyDietPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calorie-calculator" 
            element={
              <ProtectedRoute>
                <CalorieCalculator />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route - Always show Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <a 
                    href="/" 
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </main>

      {/* NutriBot is now embedded in the Navbar */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
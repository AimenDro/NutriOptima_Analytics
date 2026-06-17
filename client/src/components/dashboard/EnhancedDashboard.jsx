import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const [tracking, setTracking] = useState(null);
  const [progress, setProgress] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddWater, setShowAddWater] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showWaterInfo, setShowWaterInfo] = useState(false);
  const [waterRecommendation, setWaterRecommendation] = useState(null);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    mealReminders: true, waterReminders: true, dietRecommendations: true,
    dailySummary: true, weeklySummary: true, monthlySummary: true
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [dismissingAlert, setDismissingAlert] = useState(null);
  const [analyticsView, setAnalyticsView] = useState('today'); // today, week, month
  const [filterView, setFilterView] = useState('all'); // all, calories, macros, water

  // Simplified food entry - only name and quantity
  const [foodForm, setFoodForm] = useState({
    name: '',
    quantity: '100g'
  });
  const [lookingUpFood, setLookingUpFood] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);

  // Water entry
  const [waterAmount, setWaterAmount] = useState(0.25); // 250ml default

  // Image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Load today's tracking
  useEffect(() => {
    if (user?.id) {
      loadTracking();
      loadAnalytics('week');
      loadWaterRecommendation();
      loadNotifPrefs();
      loadHealthAlerts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && analyticsView !== 'today') {
      loadAnalytics(analyticsView);
    }
  }, [analyticsView]);

  const loadAnalytics = async (period) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/tracking/analytics/${user.id}?period=${period}`);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const loadWaterRecommendation = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/water/recommendation/${user.id || user.email}`);
      if (response.data.success) {
        setWaterRecommendation(response.data.data.recommendation);
      }
    } catch (error) {
      console.error('Load water recommendation error:', error);
    }
  };

  const loadNotifPrefs = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/auth/me`);
      if (response.data.success && response.data.data?.user?.emailNotifications) {
        setNotifPrefs(prev => ({ ...prev, ...response.data.data.user.emailNotifications }));
      }
    } catch (error) {
      console.error('Load notif prefs error:', error);
    }
  };

  const loadHealthAlerts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/health/alerts/${user.id}`);
      if (res.data.success) setHealthAlerts(res.data.data.alerts || []);
    } catch (e) { console.error('Load health alerts error:', e); }
  };

  const dismissHealthAlert = async (alertId) => {
    try {
      setDismissingAlert(alertId);
      await axios.delete(`http://localhost:5001/api/health/alerts/${alertId}`);
      setHealthAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (e) { console.error('Dismiss alert error:', e); }
    finally { setDismissingAlert(null); }
  };

  const acknowledgeHealthAlert = async (alertId) => {
    try {
      await axios.post(`http://localhost:5001/api/health/alerts/${alertId}/acknowledge`);
      setHealthAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (e) { console.error('Acknowledge alert error:', e); }
  };

  const saveNotifPrefs = async () => {
    try {
      setSavingNotifs(true);
      await axios.put('http://localhost:5001/api/auth/email-notifications', notifPrefs);
      setShowNotifSettings(false);
    } catch (error) {
      console.error('Save notif prefs error:', error);
      alert('Failed to save preferences: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSavingNotifs(false);
    }
  };

  const loadTracking = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/tracking/today/${user.id}`);
      
      if (response.data.success) {
        if (response.data.data.needsInitialization) {
          // Initialize tracking from latest diet plan
          await initializeTracking();
        } else {
          setTracking(response.data.data.tracking);
          setProgress(response.data.data.progress);
        }
      }
    } catch (error) {
      console.error('Load tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeTracking = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/tracking/initialize', {
        userId: user.id,
        userEmail: user.email
      });

      if (response.data.success) {
        setTracking(response.data.data.tracking);
        setProgress(response.data.data.tracking.getProgress ? response.data.data.tracking.getProgress() : null);
      }
    } catch (error) {
      console.error('Initialize tracking error:', error);
      if (error.response?.data?.error?.code === 'NO_DIET_PLAN') {
        // Show message to generate diet plan first
        alert('Please generate a diet plan first from the Diet Planning page');
      }
    }
  };

  const handleLookupFood = async () => {
    if (!foodForm.name.trim()) {
      alert('Please enter a food name');
      return;
    }

    try {
      setLookingUpFood(true);
      const response = await axios.post('http://localhost:5001/api/tracking/lookup-food', {
        foodName: foodForm.name,
        quantity: foodForm.quantity
      });

      if (response.data.success) {
        setNutritionData(response.data.data);
      }
    } catch (error) {
      console.error('Food lookup error:', error);
      alert('Failed to lookup food nutrition');
    } finally {
      setLookingUpFood(false);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    
    if (!nutritionData) {
      await handleLookupFood();
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/tracking/add-food', {
        userId: user.id,
        foodEntry: {
          name: nutritionData.foodName,
          quantity: nutritionData.quantity,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fats: nutritionData.fats,
          fiber: nutritionData.fiber || 0,
          sugar: nutritionData.sugar || 0,
          sodium: nutritionData.sodium || 0,
          cholesterol: nutritionData.cholesterol || 0,
          saturatedFat: nutritionData.saturatedFat || 0,
          source: 'manual'
        }
      });

      if (response.data.success) {
        setTracking(response.data.data.tracking);
        setProgress(response.data.data.progress);
        setShowAddFood(false);
        setFoodForm({ name: '', quantity: '100g' });
        setNutritionData(null);
        loadAnalytics(analyticsView); // Refresh analytics
        loadHealthAlerts(); // Refresh health alerts
        
        // Check for health alerts
        const healthAlerts = response.data.data.healthAlerts;
        if (healthAlerts && healthAlerts.length > 0) {
          // Show health alerts
          const alertMessages = healthAlerts.map(alert => 
            `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.message}\n${alert.details || ''}`
          ).join('\n\n');
          
          alert(`⚠️ HEALTH ALERT!\n\n${alertMessages}\n\nFood has been added to your tracking, but please be cautious.`);
        }
      }
    } catch (error) {
      console.error('Add food error:', error);
      alert(error.response?.data?.error?.message || 'Failed to add food');
    }
  };

  const handleAddWater = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/tracking/add-water', {
        userId: user.id,
        amount: waterAmount
      });

      if (response.data.success) {
        setTracking(response.data.data.tracking);
        setProgress(response.data.data.progress);
        setShowAddWater(false);
        loadAnalytics(analyticsView); // Refresh analytics
      }
    } catch (error) {
      console.error('Add water error:', error);
      alert(error.response?.data?.error?.message || 'Failed to add water');
    }
  };

  const handleDeleteWater = async (entryId) => {
    if (!confirm('Delete this water entry?')) return;

    try {
      const response = await axios.delete(`http://localhost:5001/api/tracking/water/${user.id}/${entryId}`);
      
      if (response.data.success) {
        setTracking(response.data.data.tracking);
        setProgress(response.data.data.progress);
        loadAnalytics(analyticsView); // Refresh analytics
      }
    } catch (error) {
      console.error('Delete water error:', error);
      alert('Failed to delete water entry');
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    try {
      setAnalyzingImage(true);
      
      const formData = new FormData();
      formData.append('image', selectedImage);

      console.log('📤 Uploading image for analysis...');

      // Analyze image with AI - using the same endpoint as Food Upload page
      const analyzeResponse = await axios.post('http://localhost:5001/api/ml/analyze', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'user-id': user.id,
          'user-email': user.email
        }
      });

      console.log('📊 Analysis response:', analyzeResponse.data);

      // Check if non-food image was detected
      if (analyzeResponse.data.isNonFood || analyzeResponse.data.error?.code === 'NON_FOOD_IMAGE') {
        setUploadError('⚠️ ' + (analyzeResponse.data.error?.message || 'Please upload a food image only.'));
        setIsUploading(false);
        return;
      }

      if (analyzeResponse.data.success) {
        const responseData = analyzeResponse.data.data;
        
        // Extract nutrition data - handle both formats
        const nutrition = responseData.nutrition || {};
        const topPrediction = responseData.topPrediction || {};
        
        // Get food name from various possible sources
        const foodName = topPrediction.fruit || 
                        responseData.foodName || 
                        responseData.detectedFood || 
                        'Detected Food';
        
        // Get weight - default to 100g if not specified
        const weight = responseData.estimatedWeight || 
                      responseData.weight || 
                      100;
        
        console.log('🍎 Extracted data:', { foodName, weight, nutrition });
        
        // If no calories from ML, estimate using food name
        if (!nutrition.calories || nutrition.calories === 0) {
          const fallbackNutrition = {
            'broccoli': { calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
            'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
            'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
            'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
            'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
            'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
            'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
            'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
          };
          const key = Object.keys(fallbackNutrition).find(k => foodName.toLowerCase().includes(k));
          if (key) {
            Object.assign(nutrition, fallbackNutrition[key]);
          } else {
            // Generic estimate: 100 kcal per 100g
            nutrition.calories = 100;
            nutrition.protein = 5;
            nutrition.carbs = 15;
            nutrition.fat = 3;
          }
        }
        
        // Add to tracking with the analyzed data
        const trackingResponse = await axios.post('http://localhost:5001/api/tracking/add-food', {
          userId: user.id,
          foodEntry: {
            name: foodName,
            quantity: `${weight}g`,
            calories: Math.round(nutrition.calories || 0),
            protein: Math.round(nutrition.protein || 0),
            carbs: Math.round(nutrition.carbs || 0),
            fats: Math.round(nutrition.fat || nutrition.fats || 0),
            fiber: Math.round(nutrition.fiber || 0),
            sugar: Math.round(nutrition.sugar || 0),
            sodium: Math.round(nutrition.sodium || 0),
            cholesterol: Math.round(nutrition.cholesterol || 0),
            saturatedFat: Math.round(nutrition.saturatedFat || nutrition.saturated_fat || 0),
            source: 'image_ai',
            imageUrl: responseData.imageUrl
          }
        });

        console.log('✅ Tracking response:', trackingResponse.data);

        if (trackingResponse.data.success) {
          setTracking(trackingResponse.data.data.tracking);
          setProgress(trackingResponse.data.data.progress);
          setShowImageUpload(false);
          setSelectedImage(null);
          setImagePreview(null);
          loadAnalytics(analyticsView); // Refresh analytics
          loadHealthAlerts(); // Refresh health alerts
          
          // Check for health alerts
          const healthAlerts = trackingResponse.data.data.healthAlerts;
          console.log('🔍 Health alerts received:', healthAlerts);
          
          if (healthAlerts && healthAlerts.length > 0) {
            console.log('⚠️ Displaying health alerts:', healthAlerts);
            // Show health alerts
            const alertMessages = healthAlerts.map(alert => 
              `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.message}\n${alert.details || ''}`
            ).join('\n\n');
            
            alert(`⚠️ HEALTH ALERT!\n\n${alertMessages}\n\nFood has been added to your tracking, but please be cautious.`);
          } else {
            console.log('✅ No health alerts, showing success message');
            // Show success message with detected food
            alert(`✅ Successfully added: ${foodName} (${Math.round(nutrition.calories || 0)} kcal)`);
          }
        }
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMsg = error.response?.data?.error?.message || error.message || 'Failed to analyze image';
      alert(`❌ Error: ${errorMsg}\n\nPlease check the browser console for details.`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setUploadError(null); // clear any previous error
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFood = async (entryId) => {
    if (!confirm('Delete this food entry?')) return;

    try {
      const response = await axios.delete(`http://localhost:5001/api/tracking/food/${user.id}/${entryId}`);
      
      if (response.data.success) {
        setTracking(response.data.data.tracking);
        setProgress(response.data.data.progress);
      }
    } catch (error) {
      console.error('Delete food error:', error);
      alert('Failed to delete food entry');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Tracking Data</h2>
          <p className="text-gray-600 mb-6">
            Please generate a diet plan first to start tracking your daily nutrition goals.
          </p>
          <a
            href="/diet-planning"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            Generate Diet Plan
          </a>
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    if (percentage <= 110) return 'bg-green-500';
    return 'bg-orange-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage < 50) return 'text-red-700';
    if (percentage < 80) return 'text-yellow-700';
    if (percentage <= 110) return 'text-green-700';
    return 'text-orange-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Daily Nutrition</h1>
          <p className="text-gray-600">Track your progress towards your health goals</p>
        </div>

        {/* Main Progress Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Calorie Progress */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Daily Calories</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {progress?.calories.consumed} / {progress?.calories.goal}
                  <span className="text-lg text-gray-600 ml-2">kcal</span>
                </p>
              </div>
              <div className="text-5xl">🍽️</div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{progress?.calories.percentage}% Complete</span>
                <span className={getProgressTextColor(progress?.calories.percentage)}>
                  {progress?.calories.remaining > 0 ? `${progress?.calories.remaining} kcal remaining` : 'Goal achieved!'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(progress?.calories.percentage)} transition-all duration-500`}
                  style={{ width: `${Math.min(progress?.calories.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-700 font-medium mb-1">Protein</div>
                <div className="text-lg font-bold text-blue-900">{progress?.protein.consumed}g</div>
                <div className="text-xs text-blue-600">/ {progress?.protein.goal}g</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-xs text-orange-700 font-medium mb-1">Carbs</div>
                <div className="text-lg font-bold text-orange-900">{progress?.carbs.consumed}g</div>
                <div className="text-xs text-orange-600">/ {progress?.carbs.goal}g</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-700 font-medium mb-1">Fats</div>
                <div className="text-lg font-bold text-purple-900">{progress?.fats.consumed}g</div>
                <div className="text-xs text-purple-600">/ {progress?.fats.goal}g</div>
              </div>
            </div>
          </div>

          {/* Water Progress */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-cyan-100">Water Intake</h3>
                <p className="text-3xl font-bold mt-1">
                  {progress?.water.consumed.toFixed(1)} / {progress?.water.goal}
                  <span className="text-lg text-cyan-100 ml-2">L</span>
                </p>
              </div>
              <div className="text-5xl">💧</div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-cyan-100 mb-2">
                <span>{progress?.water.percentage}% Complete</span>
                <span>
                  {progress?.water.remaining > 0 ? `${progress?.water.remaining.toFixed(1)}L remaining` : 'Goal achieved!'}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(progress?.water.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => setShowAddWater(true)}
              className="w-full bg-white text-cyan-600 py-3 rounded-xl font-semibold hover:bg-cyan-50 transition-all mt-2"
            >
              + Add Water
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowAddFood(true)}
            className="bg-white border-2 border-green-200 text-green-700 py-4 rounded-xl font-semibold hover:bg-green-50 hover:border-green-400 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="text-2xl">✏️</span>
            <span>Add Food</span>
          </button>
          
          <button
            onClick={() => setShowImageUpload(true)}
            className="bg-white border-2 border-purple-200 text-purple-700 py-4 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="text-2xl">📸</span>
            <span>Upload Image</span>
          </button>
          
          <button
            onClick={() => {
              loadTracking();
              loadAnalytics(analyticsView);
            }}
            className="bg-white border-2 border-blue-200 text-blue-700 py-4 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📊</span> Nutrition Analytics
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAnalyticsView('today')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${analyticsView === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setAnalyticsView('week')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${analyticsView === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setAnalyticsView('month')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${analyticsView === 'month' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterView('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filterView === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Nutrients
              </button>
              <button
                onClick={() => setFilterView('calories')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filterView === 'calories' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Calories
              </button>
              <button
                onClick={() => setFilterView('macros')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filterView === 'macros' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Macros
              </button>
              <button
                onClick={() => setFilterView('water')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filterView === 'water' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Hydration
              </button>
            </div>

            {analyticsView === 'today' ? (
              /* Today's View - Show Pie Charts */
              <div className="grid md:grid-cols-2 gap-6">
                {(filterView === 'all' || filterView === 'macros') && progress && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Macro Distribution</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Protein', value: progress.protein.consumed, color: '#3b82f6' },
                            { name: 'Carbs', value: progress.carbs.consumed, color: '#f97316' },
                            { name: 'Fats', value: progress.fats.consumed, color: '#a855f7' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Protein', value: progress.protein.consumed, color: '#3b82f6' },
                            { name: 'Carbs', value: progress.carbs.consumed, color: '#f97316' },
                            { name: 'Fats', value: progress.fats.consumed, color: '#a855f7' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(filterView === 'all' || filterView === 'calories') && progress && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Calorie Progress</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { name: 'Consumed', value: progress.calories.consumed, color: progress.calories.percentage > 110 ? '#f97316' : progress.calories.percentage >= 80 ? '#10b981' : '#eab308' },
                        { name: 'Goal', value: progress.calories.goal, color: '#6b7280' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4">
                      <div className={`text-2xl font-bold ${progress.calories.percentage >= 80 && progress.calories.percentage <= 110 ? 'text-green-600' : progress.calories.percentage > 110 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {progress.calories.percentage}%
                      </div>
                      <div className="text-sm text-gray-600">of daily goal</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Week/Month View - Show Line Charts */
              <div className="space-y-6">
                {(filterView === 'all' || filterView === 'calories') && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Calorie Trend</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.nutrientTrends.calories.map(item => ({
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        calories: item.value
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{analytics.averages.calories}</div>
                        <div className="text-xs text-gray-600">Avg/Day</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analytics.goalAchievement.caloriesAchieved}</div>
                        <div className="text-xs text-gray-600">Days Achieved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{analytics.totalDays}</div>
                        <div className="text-xs text-gray-600">Total Days</div>
                      </div>
                    </div>
                  </div>
                )}

                {(filterView === 'all' || filterView === 'macros') && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Macronutrient Trends</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.dailyData.map(item => ({
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        protein: item.consumed.protein,
                        carbs: item.consumed.carbs,
                        fats: item.consumed.fats
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} name="Protein (g)" />
                        <Line type="monotone" dataKey="carbs" stroke="#f97316" strokeWidth={2} name="Carbs (g)" />
                        <Line type="monotone" dataKey="fats" stroke="#a855f7" strokeWidth={2} name="Fats (g)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(filterView === 'all' || filterView === 'water') && (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Hydration Trend</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.nutrientTrends.water.map(item => ({
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        water: item.value
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} name="Water (L)" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">{analytics.averages.water}L</div>
                        <div className="text-xs text-gray-600">Avg/Day</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">{analytics.goalAchievement.waterAchieved}</div>
                        <div className="text-xs text-gray-600">Days Achieved</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visual Indicators for Deficiencies/Excesses */}
            {analyticsView !== 'today' && analytics.averages && (
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {analytics.averages.protein < (analytics.dailyData[0]?.goals.protein * 0.8) && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                      <span>⚠️</span> Protein Deficiency
                    </div>
                    <p className="text-sm text-red-600">Average protein intake is below target</p>
                  </div>
                )}
                {analytics.averages.calories > (analytics.dailyData[0]?.goals.calories * 1.2) && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
                      <span>⚠️</span> Calorie Excess
                    </div>
                    <p className="text-sm text-orange-600">Average calorie intake exceeds target</p>
                  </div>
                )}
                {analytics.averages.water < (analytics.dailyData[0]?.goals.water * 0.8) && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-1">
                      <span>💧</span> Hydration Alert
                    </div>
                    <p className="text-sm text-yellow-600">Average water intake is below target</p>
                  </div>
                )}
                {analytics.goalAchievement.caloriesAchieved === analytics.totalDays && analytics.totalDays > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                      <span>🎉</span> Perfect Streak!
                    </div>
                    <p className="text-sm text-green-600">All daily goals achieved this period</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Today's Food Entries */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📝</span> Today's Food Log
          </h3>
          
          {tracking.foodEntries && tracking.foodEntries.length > 0 ? (
            <div className="space-y-3">
              {tracking.foodEntries.map((entry, idx) => (
                <div key={entry._id || idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {entry.source === 'image_ai' ? '📸' : entry.source === 'meal_plan' ? '📋' : '✏️'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                        <p className="text-sm text-gray-600">{entry.quantity}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{entry.calories} kcal</div>
                      <div className="text-xs text-gray-600">
                        P: {entry.protein}g | C: {entry.carbs}g | F: {entry.fats}g
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFood(entry._id)}
                      className="text-red-600 hover:text-red-800 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🍽️</div>
              <p>No food entries yet. Start logging your meals!</p>
            </div>
          )}
        </div>

        {/* Water Intake History with Charts */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-xl p-6 mb-8 border-2 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>💧</span> Water Intake Analytics
            </h3>
            <button
              onClick={() => setShowWaterInfo(!showWaterInfo)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
            >
              <span>ℹ️</span>
              {showWaterInfo ? 'Hide Info' : 'Why This Goal?'}
            </button>
          </div>

          {/* Water Goal Information */}
          {showWaterInfo && waterRecommendation && (
            <div className="bg-white rounded-xl p-6 mb-6 border-2 border-cyan-300">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Your Personalized Water Goal</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Daily Recommendation</div>
                  <div className="text-2xl font-bold text-cyan-600">{waterRecommendation.dailyGoalLiters}L</div>
                  <div className="text-xs text-gray-500">({waterRecommendation.dailyGoal}ml)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Glasses Per Day</div>
                  <div className="text-2xl font-bold text-blue-600">{waterRecommendation.glassesPerDay}</div>
                  <div className="text-xs text-gray-500">(250ml per glass)</div>
                </div>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 mb-3">
                <div className="text-sm font-semibold text-gray-700 mb-2">Calculation Breakdown:</div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Base (33ml × weight):</span>
                    <span className="font-semibold">{waterRecommendation.breakdown.baseIntake}ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activity Bonus:</span>
                    <span className="font-semibold">+{waterRecommendation.breakdown.activityBonus}ml</span>
                  </div>
                  <div className="flex justify-between border-t border-cyan-200 pt-1 mt-1">
                    <span className="font-bold">Total Recommended:</span>
                    <span className="font-bold text-cyan-600">{waterRecommendation.breakdown.totalRecommended}ml</span>
                  </div>
                </div>
              </div>
              {waterRecommendation.tips && waterRecommendation.tips.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">💡 Hydration Tips:</div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {waterRecommendation.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-cyan-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {tracking.waterEntries && tracking.waterEntries.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-cyan-200">
                  <div className="text-sm text-gray-600 mb-1">Total Today</div>
                  <div className="text-3xl font-bold text-cyan-600">{tracking.consumed.water.toFixed(1)}L</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-cyan-200">
                  <div className="text-sm text-gray-600 mb-1">Daily Goal</div>
                  <div className="text-3xl font-bold text-blue-600">{tracking.goals.water}L</div>
                  {user?.recommendedWaterIntake && (
                    <div className="text-xs text-gray-500 mt-1">Based on your profile</div>
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 border border-cyan-200">
                  <div className="text-sm text-gray-600 mb-1">Remaining</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.max(0, tracking.goals.water - tracking.consumed.water).toFixed(1)}L
                  </div>
                </div>
              </div>

              {/* Progress Bar Chart */}
              <div className="bg-white rounded-xl p-6 border border-cyan-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Hydration Progress</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Consumed', value: tracking.consumed.water, fill: '#06b6d4' },
                    { name: 'Goal', value: tracking.goals.water, fill: '#94a3b8' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { name: 'Consumed', value: tracking.consumed.water, fill: '#06b6d4' },
                        { name: 'Goal', value: tracking.goals.water, fill: '#94a3b8' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <div className={`text-2xl font-bold ${progress?.water.percentage >= 100 ? 'text-green-600' : progress?.water.percentage >= 80 ? 'text-cyan-600' : 'text-yellow-600'}`}>
                    {progress?.water.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">of daily goal achieved</div>
                </div>
              </div>

              {/* Timeline Chart - Water intake throughout the day */}
              <div className="bg-white rounded-xl p-6 border border-cyan-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Today's Intake Timeline</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tracking.waterEntries.map((entry, idx) => ({
                    time: new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    amount: entry.amount,
                    cumulative: tracking.waterEntries.slice(0, idx + 1).reduce((sum, e) => sum + e.amount, 0)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2} name="Per Entry (L)" dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} name="Cumulative (L)" dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Distribution */}
              <div className="bg-white rounded-xl p-6 border border-cyan-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Intake Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consumed', value: tracking.consumed.water, color: '#06b6d4' },
                        { name: 'Remaining', value: Math.max(0, tracking.goals.water - tracking.consumed.water), color: '#e2e8f0' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Consumed', value: tracking.consumed.water, color: '#06b6d4' },
                        { name: 'Remaining', value: Math.max(0, tracking.goals.water - tracking.consumed.water), color: '#e2e8f0' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Entry List with Delete Option */}
              <div className="bg-white rounded-xl p-6 border border-cyan-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900">Water Entries ({tracking.waterEntries.length})</h4>
                  <button
                    onClick={() => setShowAddWater(true)}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-all text-sm"
                  >
                    + Add Water
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tracking.waterEntries.map((entry, idx) => (
                    <div key={entry._id || idx} className="flex items-center justify-between bg-cyan-50 rounded-lg p-3 hover:bg-cyan-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-200 rounded-full flex items-center justify-center text-xl">
                          💧
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{entry.amount}L</div>
                          <div className="text-xs text-gray-600">
                            {new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWater(entry._id)}
                        className="text-red-600 hover:text-red-800 font-bold text-lg px-2 py-1 hover:bg-red-50 rounded transition-all"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💧</div>
              <p>No water entries yet. Start tracking your hydration!</p>
              <button
                onClick={() => setShowAddWater(true)}
                className="mt-4 bg-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-cyan-700 transition-all"
              >
                Add Water Now
              </button>
            </div>
          )}
        </div>

        {/* Health Alerts & Nutrient Deficiencies */}
        {healthAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-red-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🚨</span> Health Alerts
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{healthAlerts.length}</span>
              </h3>
              <button onClick={loadHealthAlerts} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg">
                🔄 Refresh
              </button>
            </div>

            <div className="space-y-4">
              {healthAlerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                const isWarning  = alert.severity === 'warning';
                const borderColor = isCritical ? 'border-red-300 bg-red-50' : isWarning ? 'border-orange-300 bg-orange-50' : 'border-yellow-200 bg-yellow-50';
                const badgeColor  = isCritical ? 'bg-red-100 text-red-700' : isWarning ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';

                return (
                  <div key={alert._id} className={`rounded-xl border-2 p-4 ${borderColor}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{alert.alertType?.replace(/_/g,' ')}</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{alert.message}</p>
                        {alert.details && <p className="text-xs text-gray-600 mt-1">{alert.details}</p>}

                        {/* Actionable suggestions */}
                        {alert.suggestedFoods?.length > 0 && (
                          <div className="mt-3 bg-white/70 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">💡 Eat more of these:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {alert.suggestedFoods.map((food, i) => (
                                <span key={i} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                  {food}
                                </span>
                              ))}
                            </div>
                            {alert.actionTip && <p className="text-xs text-gray-500 mt-2 italic">→ {alert.actionTip}</p>}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => acknowledgeHealthAlert(alert._id)}
                          className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                        >
                          ✓ Got it
                        </button>
                        <button
                          onClick={() => dismissHealthAlert(alert._id)}
                          disabled={dismissingAlert === alert._id}
                          className="text-xs bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          ✕ Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Email Notification Preferences */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🔔</span> Email Notifications
            </h3>
            <button
              onClick={() => setShowNotifSettings(!showNotifSettings)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {showNotifSettings ? 'Hide' : 'Manage'}
            </button>
          </div>

          {showNotifSettings && (
            <div className="mt-5 space-y-3">
              {[
                { key: 'mealReminders',       label: 'Meal Reminders',          desc: 'Breakfast 8AM · Lunch 12:30PM · Dinner 7PM',         emoji: '🍽️' },
                { key: 'waterReminders',      label: 'Water Reminders',         desc: 'Every 2 hrs (9AM–7PM) when < 80% of goal',           emoji: '💧' },
                { key: 'dietRecommendations', label: 'Diet Recommendations',    desc: 'Daily at 9AM with your plan tips',                   emoji: '🎯' },
                { key: 'dailySummary',        label: 'Daily Summary',           desc: 'Every night at 9PM — macros & goal achievement',     emoji: '📊' },
                { key: 'weeklySummary',       label: 'Weekly Summary',          desc: 'Every Sunday 9AM — performance, achievements & tips', emoji: '📅' },
                { key: 'monthlySummary',      label: 'Monthly Summary',         desc: '1st of month 9AM — trends vs previous month',        emoji: '📈' },
              ].map(({ key, label, desc, emoji }) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[key] ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
              <button
                onClick={saveNotifPrefs}
                disabled={savingNotifs}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 mt-2"
              >
                {savingNotifs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>

        {/* Warnings */}
        {tracking.warnings && tracking.warnings.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-yellow-900 mb-3 flex items-center gap-2">
              <span>⚠️</span> Alerts
            </h3>
            <div className="space-y-2">
              {tracking.warnings.map((warning, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 text-yellow-800">
                  {warning.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Food Modal - Simplified */}
        {showAddFood && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Food Entry</h3>
              <form onSubmit={handleAddFood} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Food Name *</label>
                  <input
                    type="text"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({...foodForm, name: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Chicken Breast, Apple, Rice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <input
                    type="text"
                    value={foodForm.quantity}
                    onChange={(e) => setFoodForm({...foodForm, quantity: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 100g, 1 cup, 150g"
                  />
                </div>

                {!nutritionData && (
                  <button
                    type="button"
                    onClick={handleLookupFood}
                    disabled={lookingUpFood}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {lookingUpFood ? '🔍 Looking up nutrition...' : '🔍 Lookup Nutrition'}
                  </button>
                )}

                {nutritionData && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <h4 className="font-bold text-green-900 mb-2">✅ Nutrition Found</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Food:</strong> {nutritionData.foodName}</p>
                      <p><strong>Quantity:</strong> {nutritionData.quantity}</p>
                      <p><strong>Calories:</strong> {nutritionData.calories} kcal</p>
                      <p><strong>Protein:</strong> {nutritionData.protein}g | <strong>Carbs:</strong> {nutritionData.carbs}g | <strong>Fats:</strong> {nutritionData.fats}g</p>
                      {nutritionData.confidence === 'low' && (
                        <p className="text-yellow-700 mt-2">⚠️ Confidence: Low - Values are estimated</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  {nutritionData && (
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                    >
                      Add to Log
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFood(false);
                      setFoodForm({ name: '', quantity: '100g' });
                      setNutritionData(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Water Modal */}
        {showAddWater && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>💧</span> Add Water Intake
              </h3>

              {/* Personalized goal info */}
              {waterRecommendation && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 mb-5 text-sm text-cyan-800">
                  <div className="font-semibold mb-1">Your personalized daily goal: {waterRecommendation.dailyGoalLiters}L ({waterRecommendation.glassesPerDay} glasses)</div>
                  <div className="text-xs text-cyan-600">Based on your weight, activity level, gender &amp; age</div>
                </div>
              )}

              {/* Hydration status */}
              {progress?.water && (
                <div className={`rounded-xl p-3 mb-5 text-sm font-medium ${
                  progress.water.percentage >= 100 ? 'bg-green-50 text-green-800 border border-green-200' :
                  progress.water.percentage >= 80  ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  progress.water.percentage >= 50  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  progress.water.percentage >= 25  ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                  'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span>Today: {progress.water.consumed.toFixed(2)}L / {progress.water.goal}L</span>
                    <span className="font-bold">{progress.water.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2">
                    <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min(progress.water.percentage, 100)}%` }}></div>
                  </div>
                  <div className="mt-1 text-xs">
                    {progress.water.percentage >= 100 ? '🎉 Goal achieved!' :
                     progress.water.percentage >= 80  ? '💧 Almost there!' :
                     progress.water.percentage >= 50  ? '👍 Halfway there, keep going!' :
                     progress.water.percentage >= 25  ? '⚠️ Need more water!' :
                     '🚨 Hydration critical — drink now!'}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (250ml increments)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[0.25, 0.5, 0.75, 1.0].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setWaterAmount(amount)}
                        className={`py-3 rounded-xl font-semibold transition-all text-sm ${
                          waterAmount === amount
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                        }`}
                      >
                        <div>{amount * 1000}ml</div>
                        <div className="text-xs opacity-75">{amount}L</div>
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(parseFloat(e.target.value))}
                    step="0.25"
                    min="0.25"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg text-center"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">= {Math.round(waterAmount * 1000)}ml</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddWater}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all"
                  >
                    Add Water
                  </button>
                  <button
                    onClick={() => setShowAddWater(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📸</span> Upload Food Image
              </h3>
              <form onSubmit={handleImageUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    📷 Take a photo or upload an image of your food
                  </p>
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl border-2 border-gray-200" />
                  </div>
                )}
                {/* Non-food / error message */}
                {uploadError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🚫</span>
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Invalid Image</p>
                      <p className="text-red-600 text-sm mt-0.5">Please upload a food or drink image only. Non-food images cannot be analyzed.</p>
                    </div>
                  </div>
                )}
                {analyzingImage && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <div>
                        <p className="font-semibold text-purple-900">Analyzing image...</p>
                        <p className="text-sm text-purple-700">AI is detecting food and calculating nutrition</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={!selectedImage || analyzingImage}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {analyzingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>Analyze & Add</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageUpload(false);
                      setSelectedImage(null);
                      setImagePreview(null);
                      setUploadError(null);
                    }}
                    disabled={analyzingImage}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;

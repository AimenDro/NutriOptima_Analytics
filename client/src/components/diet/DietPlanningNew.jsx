import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MealPlanDisplay from './MealPlanDisplay';

const DietPlanningNew = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activityLevel: 'moderately_active',
    goal: 'maintain',
    diseases: [],
    allergies: [],
    dietaryRestrictions: [],
    cuisinePreference: 'pakistani',
    mealsPerDay: 3
  });

  const [calculations, setCalculations] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleArrayInput = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Sending request with:', {
        userId: user?.id || 'guest',
        userEmail: user?.email || 'guest@example.com',
        formData
      });

      const response = await axios.post('http://localhost:5001/api/diet/generate-plan', {
        userId: user?.id || 'guest',
        userEmail: user?.email || 'guest@example.com',
        userProfile: formData
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        setCalculations(response.data.data.calculations);
        let dp = response.data.data.dietPlan;
        // If plan is a string, parse it
        if (dp && typeof dp.plan === 'string') {
          try { dp = { ...dp, plan: JSON.parse(dp.plan) }; } catch(e) {}
        }
        setDietPlan(dp);
        setStep(2);
      }
    } catch (err) {
      console.error('❌ Error details:', err);
      console.error('❌ Error response:', err.response);
      setError(err.response?.data?.error?.message || err.message || 'Failed to generate diet plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
            <span className="text-green-800 font-semibold text-sm">AI-POWERED NUTRITION</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Personalized Diet Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get a scientifically-backed meal plan tailored to your health goals, powered by advanced AI
          </p>
        </div>

        {step === 1 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Progress Indicator */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                      📋
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Health Assessment</h2>
                      <p className="text-green-100 text-sm">Step 1 of 2 - Tell us about yourself</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-white rounded-full"></div>
                    </div>
                    <span className="text-white font-medium text-sm">50%</span>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <div className="space-y-10">
                  {/* Basic Information */}
                  <div className="border-l-4 border-blue-500 pl-6 bg-blue-50/50 py-4 rounded-r-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <span className="text-2xl">👤</span> Basic Information
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">Your physical characteristics</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg) *</label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          required
                          step="0.1"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="e.g., 70"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm) *</label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          required
                          step="0.1"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="e.g., 170"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activity & Goals */}
                  <div className="border-l-4 border-purple-500 pl-6 bg-purple-50/50 py-4 rounded-r-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <span className="text-2xl">🎯</span> Activity & Goals
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">Your lifestyle and objectives</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Level</label>
                        <select
                          name="activityLevel"
                          value={formData.activityLevel}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="sedentary">Sedentary (Little/no exercise)</option>
                          <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                          <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                          <option value="very_active">Very Active (6-7 days/week)</option>
                          <option value="extra_active">Extra Active (Athlete)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Health Goal</label>
                        <select
                          name="goal"
                          value={formData.goal}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="weight_loss">Weight Loss</option>
                          <option value="extreme_weight_loss">Extreme Weight Loss</option>
                          <option value="maintain">Maintain Weight</option>
                          <option value="weight_gain">Weight Gain</option>
                          <option value="muscle_gain">Muscle Gain</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Health Information */}
                  <div className="border-l-4 border-red-500 pl-6 bg-red-50/50 py-4 rounded-r-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <span className="text-2xl">🏥</span> Health Information
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">Medical conditions and restrictions</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Diseases/Health Conditions
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="Type condition and press Enter (e.g., diabetes, hypertension)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayInput('diseases', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.diseases.map((disease, index) => (
                            <span key={index} className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                              {disease}
                              <button onClick={() => removeArrayItem('diseases', index)} className="text-red-600 hover:text-red-800 font-bold">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Allergies</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="Type allergy and press Enter (e.g., peanuts, shellfish)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayInput('allergies', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.allergies.map((allergy, index) => (
                            <span key={index} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                              {allergy}
                              <button onClick={() => removeArrayItem('allergies', index)} className="text-yellow-600 hover:text-yellow-800 font-bold">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Dietary Restrictions</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="Type restriction and press Enter (e.g., vegetarian, halal, vegan)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayInput('dietaryRestrictions', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.dietaryRestrictions.map((restriction, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                              {restriction}
                              <button onClick={() => removeArrayItem('dietaryRestrictions', index)} className="text-blue-600 hover:text-blue-800 font-bold">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="border-l-4 border-orange-500 pl-6 bg-orange-50/50 py-4 rounded-r-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <span className="text-2xl">🍽️</span> Food Preferences
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">Your culinary preferences</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine Preference</label>
                        <select
                          name="cuisinePreference"
                          value={formData.cuisinePreference}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="pakistani">Pakistani</option>
                          <option value="indian">Indian</option>
                          <option value="mediterranean">Mediterranean</option>
                          <option value="asian">Asian</option>
                          <option value="western">Western</option>
                          <option value="international">International</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meals Per Day</label>
                        <select
                          name="mealsPerDay"
                          value={formData.mealsPerDay}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="2">2 meals</option>
                          <option value="3">3 meals</option>
                          <option value="4">4 meals</option>
                          <option value="5">5 meals</option>
                          <option value="6">6 meals</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGeneratePlan}
                    disabled={loading || !formData.age || !formData.weight || !formData.height}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating Your Personalized Plan...</span>
                      </>
                    ) : (
                      <>
                        <span>🎯</span>
                        <span>Generate My Diet Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && dietPlan && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="inline-block bg-green-100 rounded-full px-4 py-1 mb-2">
                    <span className="text-green-800 font-semibold text-xs">COMPLETED</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Your Personalized Diet Plan</h2>
                  <p className="text-gray-600 mt-1">Generated on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>🖨️</span> Print
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md"
                  >
                    ← New Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Nutritional Targets Card */}
            {calculations && (
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white border border-blue-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Daily Nutritional Targets</h3>
                    <p className="text-blue-100">Scientifically calculated for your goals</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-blue-100 text-sm font-medium mb-1">Daily Calories</div>
                    <div className="text-4xl font-bold">{calculations.targetCalories}</div>
                    <div className="text-blue-200 text-xs mt-1">kcal/day</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-blue-100 text-sm font-medium mb-1">Protein</div>
                    <div className="text-4xl font-bold">{calculations.macros.protein}g</div>
                    <div className="text-blue-200 text-xs mt-1">{Math.round((calculations.macros.protein * 4 / calculations.targetCalories) * 100)}% of calories</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-blue-100 text-sm font-medium mb-1">Carbohydrates</div>
                    <div className="text-4xl font-bold">{calculations.macros.carbs}g</div>
                    <div className="text-blue-200 text-xs mt-1">{Math.round((calculations.macros.carbs * 4 / calculations.targetCalories) * 100)}% of calories</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-blue-100 text-sm font-medium mb-1">Fats</div>
                    <div className="text-4xl font-bold">{calculations.macros.fat}g</div>
                    <div className="text-blue-200 text-xs mt-1">{Math.round((calculations.macros.fat * 9 / calculations.targetCalories) * 100)}% of calories</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-blue-100 text-xs font-medium mb-1">BMR</div>
                    <div className="text-2xl font-bold">{calculations.bmr}</div>
                    <div className="text-blue-200 text-xs">Base metabolic rate</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-blue-100 text-xs font-medium mb-1">TDEE</div>
                    <div className="text-2xl font-bold">{calculations.tdee}</div>
                    <div className="text-blue-200 text-xs">Total daily expenditure</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-blue-100 text-xs font-medium mb-1">Water Intake</div>
                    <div className="text-2xl font-bold">{calculations.waterIntake}L</div>
                    <div className="text-blue-200 text-xs">Daily hydration goal</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-blue-100 text-xs font-medium mb-1">BMI</div>
                    <div className="text-2xl font-bold">{calculations.bmi}</div>
                    <div className="text-blue-200 text-xs">{calculations.bmiCategory}</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI-Generated Diet Plan */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI-Powered Meal Plan</h3>
                    <p className="text-green-100">Personalized by Gemini AI based on your health profile</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:p-10">
                <MealPlanDisplay planData={dietPlan} />
              </div>
            </div>

            {/* Footer Info */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="text-3xl">ℹ️</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Important Disclaimer</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>This diet plan is AI-generated and should be used as a guideline only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Always consult with a licensed healthcare professional or registered dietitian before making significant dietary changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Individual results may vary based on metabolism, lifestyle, genetics, and adherence to the plan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Monitor your progress regularly and adjust as needed with professional guidance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietPlanningNew;

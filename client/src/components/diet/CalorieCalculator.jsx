import { useState } from 'react';
import axios from 'axios';

const CalorieCalculator = () => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activityLevel: 'moderately_active',
    goal: 'maintain'
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/diet/calculate-calories', formData);
      
      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🔥 Calorie Calculator
          </h1>
          <p className="text-xl text-gray-600">
            Discover your personalized daily calorie needs for optimal health
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age (years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="10"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  min="20"
                  max="300"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="70"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="100"
                  max="250"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="170"
                />
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level
                </label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extra_active">Extra Active (physical job)</option>
                </select>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal
                </label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weight_loss">Weight Loss (-0.5kg/week)</option>
                  <option value="extreme_weight_loss">Extreme Weight Loss (-1kg/week)</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="weight_gain">Weight Gain (+0.5kg/week)</option>
                  <option value="muscle_gain">Muscle Gain (Lean Bulk)</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Calculating...' : '🔍 Calculate My Needs'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="space-y-6">
            {results ? (
              <>
                {/* Main Calorie Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
                  <div className="text-center">
                    <p className="text-blue-100 text-lg mb-2">You need</p>
                    <div className="text-6xl font-bold mb-2">
                      {results.targetCalories}
                    </div>
                    <p className="text-2xl text-blue-100">calories daily</p>
                    <p className="text-blue-200 mt-4">for good health and your goals</p>
                  </div>
                </div>

                {/* BMI Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Body Mass Index</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-gray-900">{results.bmi}</div>
                      <div className="text-sm text-gray-600 mt-1">{results.bmiCategory}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      results.bmiCategory === 'Normal weight' ? 'bg-green-100 text-green-800' :
                      results.bmiCategory === 'Underweight' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {results.bmiCategory}
                    </div>
                  </div>
                </div>

                {/* Metabolism Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">BMR</div>
                    <div className="text-3xl font-bold text-gray-900">{results.bmr}</div>
                    <div className="text-xs text-gray-500 mt-1">Base metabolism</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">TDEE</div>
                    <div className="text-3xl font-bold text-gray-900">{results.tdee}</div>
                    <div className="text-xs text-gray-500 mt-1">Daily expenditure</div>
                  </div>
                </div>

                {/* Water Intake */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-3">💧 Daily Water Intake</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-5xl font-bold">{results.waterIntake}L</div>
                      <div className="text-cyan-100 mt-2">Stay hydrated!</div>
                    </div>
                    <div className="text-6xl">💦</div>
                  </div>
                </div>

                {/* Macros */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🍽️ Daily Macros</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Protein</span>
                        <span className="font-bold text-red-600">{results.macros.protein}g</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-red-500 h-3 rounded-full" style={{width: '35%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Carbs</span>
                        <span className="font-bold text-yellow-600">{results.macros.carbs}g</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-yellow-500 h-3 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Fats</span>
                        <span className="font-bold text-orange-600">{results.macros.fat}g</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-orange-500 h-3 rounded-full" style={{width: '25%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">💡 Health Tips</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Eat balanced meals throughout the day</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Stay consistent with your calorie target</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Drink water regularly, not just when thirsty</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Adjust portions based on your hunger and energy</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Calculate?
                </h3>
                <p className="text-gray-600">
                  Fill in your information on the left to discover your personalized calorie needs
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator;

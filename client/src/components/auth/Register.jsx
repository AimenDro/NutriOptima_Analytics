import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    healthGoals: [],
    dietaryPreferences: [],
    allergies: [],
    cuisinePreference: '',
    healthConditions: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const { register, loading, error, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked 
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear email error and availability when user types
    if (name === 'email') {
      setEmailError(null);
      setEmailAvailable(false);
    }
    
    if (error) clearError();
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      return false;
    }

    try {
      setEmailCheckLoading(true);
      setEmailError(null);
      setEmailAvailable(false);
      
      const response = await axios.post('/api/auth/check-email', { email });
      
      // Email is available
      setEmailAvailable(true);
      return false;
    } catch (error) {
      if (error.response?.status === 409) {
        setEmailError('This email is already registered. Try logging in instead!');
        return true;
      }
      return false;
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result?.success) {
      navigate('/dashboard');
    }
  };

  const nextStep = () => {
    if (step === 1) {
      checkEmailExists(formData.email).then((exists) => {
        if (!exists && step < 3) {
          setStep(step + 1);
        }
      });
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStep1Valid = () => {
    return formData.email && formData.password && formData.confirmPassword && 
           formData.password === formData.confirmPassword && formData.password.length >= 6;
  };

  const isStep2Valid = () => {
    return formData.age && formData.gender && formData.height && formData.weight;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl mb-4 shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <span className="text-4xl">🥗</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Join NutriOptima
          </h1>
          <p className="text-gray-600 text-lg">Your personalized nutrition journey starts here</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`relative transition-all duration-500 ${
                  step >= stepNumber ? 'scale-110' : 'scale-100'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= stepNumber 
                      ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/50' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {step > stepNumber ? '✓' : stepNumber}
                  </div>
                  {step === stepNumber && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 animate-ping opacity-20"></div>
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-1 rounded-full transition-all duration-500 ${
                    step > stepNumber 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <span className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-sm">
              {step === 1 ? '📧 Account Details' : step === 2 ? '👤 Personal Info' : '🎯 Preferences'}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-slide-up">
          {/* Error Display */}
          {(error || emailError) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-xl animate-shake">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-700 font-medium">{emailError || error}</p>
                  {emailError && (
                    <Link to="/login" className="text-sm text-red-600 hover:text-red-700 underline mt-1 inline-block">
                      Go to login →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Email Available Success */}
          {emailAvailable && !emailError && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 rounded-xl animate-slide-down">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✓</span>
                <p className="text-emerald-700 font-medium">Great! This email is available</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Account Details */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                      placeholder="your@email.com"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      {emailCheckLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                      ) : emailAvailable ? (
                        <span className="text-2xl animate-bounce">✓</span>
                      ) : (
                        <span className="text-2xl opacity-40">📧</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900 pr-12"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors text-xl"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {formData.password && formData.password.length < 6 && (
                    <p className="text-xs text-amber-600 flex items-center mt-1">
                      <span className="mr-1">⚡</span>
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900 pr-12 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors text-xl"
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center mt-1 animate-shake">
                      <span className="mr-1">❌</span>
                      Passwords don't match
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                    <p className="text-xs text-emerald-600 flex items-center mt-1">
                      <span className="mr-1">✓</span>
                      Passwords match!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      min="13"
                      max="120"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      required
                      min="100"
                      max="250"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="170"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                      min="30"
                      max="300"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700">
                    Activity Level
                  </label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="">Select Activity Level</option>
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="light">Light (light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                    <option value="active">Active (hard exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (very hard exercise, physical job)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Health Goals (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['weight_loss', 'weight_gain', 'muscle_building', 'maintenance', 'better_health', 'more_energy'].map((goal) => (
                      <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="healthGoals"
                          value={goal}
                          checked={formData.healthGoals.includes(goal)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {goal.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Dietary Preferences (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low_carb'].map((diet) => (
                      <label key={diet} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="dietaryPreferences"
                          value={diet}
                          checked={formData.dietaryPreferences.includes(diet)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {diet.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="allergiesInput" className="block text-sm font-medium text-gray-700">
                    Allergies (optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    id="allergiesInput"
                    placeholder="e.g., nuts, dairy, shellfish"
                    onChange={(e) => {
                      const allergies = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                      setFormData(prev => ({ ...prev, allergies }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 ? !isStep1Valid() || emailCheckLoading : step === 2 ? !isStep2Valid() : false}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {emailCheckLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Checking email...
                    </div>
                  ) : (
                    'Next Step'
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
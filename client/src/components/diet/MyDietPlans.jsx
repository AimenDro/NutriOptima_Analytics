import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MealPlanDisplay from './MealPlanDisplay';

const MyDietPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {
    if (user?.id) loadPlans();
  }, [user]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/diet/plans/${user.id}`);
      if (res.data.success) {
        setPlans(res.data.data.plans);
        // Check which plan is currently active (most recently initialized)
        const trackRes = await axios.get(`http://localhost:5001/api/tracking/today/${user.id}`);
        if (trackRes.data.success && trackRes.data.data?.tracking?.dietPlanId) {
          setActivePlanId(trackRes.data.data.tracking.dietPlanId);
        }
      }
    } catch (e) {
      console.error('Load plans error:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async (plan) => {
    try {
      setApplyingId(plan._id);
      setMessage(null);
      const res = await axios.post('http://localhost:5001/api/tracking/initialize', {
        userId: user.id,
        userEmail: user.email,
        dietPlanId: plan._id,
        forceReinit: true
      });
      if (res.data.success) {
        setActivePlanId(plan._id);
        setMessage({ type: 'success', text: `"${plan.planName}" is now your active diet plan!` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error?.message || 'Failed to apply plan' });
    } finally {
      setApplyingId(null);
    }
  };

  const getGoalLabel = (plan) => {
    const goal = plan.nlpAdvice?.userProfile?.goal || plan.nlpAdvice?.aiPlan?.goal;
    const map = {
      weight_loss: '⬇️ Weight Loss', extreme_weight_loss: '⬇️⬇️ Extreme Loss',
      maintain: '⚖️ Maintain', weight_gain: '⬆️ Weight Gain', muscle_gain: '💪 Muscle Gain'
    };
    return map[goal] || '🎯 Custom';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your diet plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Diet Plans</h1>
            <p className="text-gray-500 mt-1">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} generated — select one to apply to your dashboard
            </p>
          </div>
          <a
            href="/diet-planning"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
          >
            <span>➕</span> Generate New Plan
          </a>
        </div>

        {/* Status message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl font-medium flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-2 border-green-200 text-green-800'
              : 'bg-red-50 border-2 border-red-200 text-red-800'
          }`}>
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Diet Plans Yet</h2>
            <p className="text-gray-500 mb-6">Generate your first personalized diet plan to get started.</p>
            <a
              href="/diet-planning"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              🎯 Generate My First Plan
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const isActive = activePlanId === plan._id || activePlanId === plan._id?.toString();
              const isExpanded = expandedId === plan._id;
              const isApplying = applyingId === plan._id;
              const targets = plan.targets || {};
              const calc = plan.nlpAdvice?.calculations || {};

              return (
                <div
                  key={plan._id}
                  className={`bg-white rounded-2xl shadow-lg border-2 transition-all ${
                    isActive ? 'border-green-400 shadow-green-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Plan Header */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          #{plan.planNumber || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {plan.planName || `Diet Plan #${plan.planNumber}`}
                            </h3>
                            {isActive && (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                ✅ ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                            <span>📅 {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>{getGoalLabel(plan)}</span>
                            {plan.nlpAdvice?.userProfile?.cuisinePreference && (
                              <span>🍽️ {plan.nlpAdvice.userProfile.cuisinePreference}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Macro summary */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {targets.calories && (
                          <div className="text-center bg-orange-50 rounded-lg px-3 py-2">
                            <div className="text-lg font-bold text-orange-600">{Math.round(targets.calories)}</div>
                            <div className="text-xs text-gray-500">kcal</div>
                          </div>
                        )}
                        {targets.protein && (
                          <div className="text-center bg-blue-50 rounded-lg px-3 py-2">
                            <div className="text-lg font-bold text-blue-600">{Math.round(targets.protein)}g</div>
                            <div className="text-xs text-gray-500">protein</div>
                          </div>
                        )}
                        {targets.carbs && (
                          <div className="text-center bg-yellow-50 rounded-lg px-3 py-2">
                            <div className="text-lg font-bold text-yellow-600">{Math.round(targets.carbs)}g</div>
                            <div className="text-xs text-gray-500">carbs</div>
                          </div>
                        )}
                        {targets.fat && (
                          <div className="text-center bg-purple-50 rounded-lg px-3 py-2">
                            <div className="text-lg font-bold text-purple-600">{Math.round(targets.fat)}g</div>
                            <div className="text-xs text-gray-500">fats</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      {!isActive && (
                        <button
                          onClick={() => applyPlan(plan)}
                          disabled={isApplying}
                          className="flex-1 md:flex-none bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isApplying ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Applying...</>
                          ) : (
                            <><span>✅</span> Apply This Plan</>
                          )}
                        </button>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-2 text-green-700 font-semibold text-sm bg-green-50 px-4 py-2.5 rounded-xl">
                          ✅ Currently active on your dashboard
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : plan._id)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
                      >
                        {isExpanded ? '▲ Hide Plan' : '▼ View Plan'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded meal plan */}
                  {isExpanded && (
                    <div className="border-t-2 border-gray-100 p-6">
                      {plan.nlpAdvice?.aiPlan?.plan ? (
                        <MealPlanDisplay planData={plan.nlpAdvice.aiPlan.plan} />
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">📄</div>
                          <p>Meal plan details not available for this plan.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDietPlans;

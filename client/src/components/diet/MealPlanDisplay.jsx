const MealPlanDisplay = ({ planData }) => {
  // DEBUG - remove after fix
  console.log('MealPlanDisplay received planData type:', typeof planData);
  console.log('MealPlanDisplay planData:', JSON.stringify(planData)?.substring(0, 200));

  // Handle if planData is a raw string (unparsed JSON)
  let resolved = planData;
  if (typeof planData === 'string') {
    try { resolved = JSON.parse(planData); } catch (e) { resolved = { plainText: planData }; }
  }

  // Unwrap all possible nesting levels until we find meals/healthAssessment
  let data = resolved;
  for (let i = 0; i < 4; i++) {
    if (data?.meals || data?.healthAssessment || data?.plainText) break;
    // If plan field is a string, parse it
    if (data?.plan && typeof data.plan === 'string') {
      try { data = JSON.parse(data.plan); } catch(e) { data = { plainText: data.plan }; }
      continue;
    }
    if (data?.plan && typeof data.plan === 'object') { data = data.plan; continue; }
    if (data?.aiPlan && typeof data.aiPlan === 'string') {
      try { data = JSON.parse(data.aiPlan); } catch(e) { data = { plainText: data.aiPlan }; }
      continue;
    }
    if (data?.aiPlan && typeof data.aiPlan === 'object') { data = data.aiPlan; continue; }
    break;
  }

  // If data ended up as plainText, try to parse it as JSON
  if (data?.plainText && typeof data.plainText === 'string') {
    try {
      const parsed = JSON.parse(data.plainText);
      if (parsed?.meals || parsed?.healthAssessment) {
        data = parsed;
      }
    } catch(e) {
      // keep as plainText
    }
  }
  if (data?.plainText) {
    return (
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        {data.plainText}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Assessment */}
      {data.healthAssessment && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏥</span> Health Assessment
          </h3>
          <p className="text-gray-700 mb-4 leading-relaxed">{data.healthAssessment.bmiAnalysis}</p>
          {data.healthAssessment.keyConsiderations?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Key Considerations:</h4>
              <ul className="space-y-2">
                {data.healthAssessment.keyConsiderations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.healthAssessment.recommendations?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
              <ul className="space-y-2">
                {data.healthAssessment.recommendations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Daily Meal Plan */}
      {data.meals?.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🍽️</span> Daily Meal Plan
          </h3>
          <div className="grid gap-4">
            {data.meals.map((meal, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold text-white">{meal.name}</h4>
                      <p className="text-green-100 text-sm">{meal.time}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{meal.totalCalories}</div>
                      <div className="text-green-100 text-xs">calories</div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 font-semibold text-gray-700">Food Item</th>
                          <th className="text-center py-2 font-semibold text-gray-700">Portion</th>
                          <th className="text-center py-2 font-semibold text-gray-700">Cal</th>
                          <th className="text-center py-2 font-semibold text-gray-700">P</th>
                          <th className="text-center py-2 font-semibold text-gray-700">C</th>
                          <th className="text-center py-2 font-semibold text-gray-700">F</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.foods?.map((food, foodIdx) => (
                          <tr key={foodIdx} className="border-b border-gray-100">
                            <td className="py-3 text-gray-800">{food.item}</td>
                            <td className="text-center py-3 text-gray-600">{food.portion}</td>
                            <td className="text-center py-3 text-gray-800 font-medium">{food.calories}</td>
                            <td className="text-center py-3 text-blue-600">{food.protein}g</td>
                            <td className="text-center py-3 text-orange-600">{food.carbs}g</td>
                            <td className="text-center py-3 text-purple-600">{food.fats}g</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="py-3 text-gray-900">Total</td>
                          <td className="text-center py-3">-</td>
                          <td className="text-center py-3 text-gray-900">{meal.totalCalories}</td>
                          <td className="text-center py-3 text-blue-700">{meal.totalProtein}g</td>
                          <td className="text-center py-3 text-orange-700">{meal.totalCarbs}g</td>
                          <td className="text-center py-3 text-purple-700">{meal.totalFats}g</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {meal.benefits && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 font-bold">💡</span>
                        <span><strong>Benefits:</strong> {meal.benefits}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Tips */}
      {data.healthTips?.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span> Health Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.healthTips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  {tip.title}
                </h4>
                <p className="text-sm text-gray-700">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foods to Avoid & Prioritize */}
      <div className="grid md:grid-cols-2 gap-6">
        {data.foodsToAvoid?.length > 0 && (
          <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚠️</span> Foods to Avoid
            </h3>
            <div className="space-y-3">
              {data.foodsToAvoid.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-700 mb-1">{item.food}</h4>
                  <p className="text-sm text-gray-700">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.foodsToPrioritize?.length > 0 && (
          <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⭐</span> Foods to Prioritize
            </h3>
            <div className="space-y-3">
              {data.foodsToPrioritize.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-700 mb-1">{item.food}</h4>
                  <p className="text-sm text-gray-700">{item.benefits}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hydration Plan */}
      {data.hydrationPlan && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border-l-4 border-cyan-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💧</span> Hydration Plan
          </h3>
          {data.hydrationPlan.schedule && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Daily Schedule:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {data.hydrationPlan.schedule.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg px-4 py-3 border border-cyan-200 flex items-center gap-3">
                    <span className="text-2xl">💧</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.hydrationPlan.tips?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Hydration Tips:</h4>
              <ul className="space-y-2">
                {data.hydrationPlan.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-cyan-600 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealPlanDisplay;

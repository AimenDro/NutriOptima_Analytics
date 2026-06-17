import { useState, useEffect } from 'react';

const FoodEditor = ({ food, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    commonNames: [],
    category: 'other',
    subcategory: '',
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0
    },
    micronutrients: {
      vitaminA_mcg: 0,
      vitaminC_mg: 0,
      vitaminD_mcg: 0,
      vitaminE_mg: 0,
      vitaminK_mcg: 0,
      vitaminB1_mg: 0,
      vitaminB2_mg: 0,
      vitaminB3_mg: 0,
      vitaminB6_mg: 0,
      vitaminB12_mcg: 0,
      folate_mcg: 0,
      calcium_mg: 0,
      iron_mg: 0,
      magnesium_mg: 0,
      phosphorus_mg: 0,
      potassium_mg: 0,
      zinc_mg: 0,
      copper_mg: 0,
      manganese_mg: 0,
      selenium_mcg: 0
    },
    servingInfo: {
      defaultServing: 100,
      servingUnit: 'g',
      commonServings: []
    },
    healthInfo: {
      glycemicIndex: '',
      allergens: [],
      healthBenefits: [],
      warnings: [],
      suitableFor: []
    },
    searchKeywords: [],
    tags: [],
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commonNameInput, setCommonNameInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (food) {
      setFormData({
        ...food,
        commonNames: food.commonNames || [],
        searchKeywords: food.searchKeywords || [],
        tags: food.tags || [],
        healthInfo: {
          glycemicIndex: food.healthInfo?.glycemicIndex || '',
          allergens: food.healthInfo?.allergens || [],
          healthBenefits: food.healthInfo?.healthBenefits || [],
          warnings: food.healthInfo?.warnings || [],
          suitableFor: food.healthInfo?.suitableFor || []
        }
      });
    }
  }, [food]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleArrayAdd = (arrayName, value, inputSetter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()]
      }));
      inputSetter('');
    }
  };

  const handleArrayRemove = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const url = food ? `/api/admin/food/${food._id}` : '/api/admin/food';
      const method = food ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.data.food);
      } else {
        setError(data.error.message || 'Failed to save food item');
      }
    } catch (error) {
      console.error('Save food error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'fruits', label: 'Fruits' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'grains', label: 'Grains' },
    { value: 'proteins', label: 'Proteins' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'nuts_seeds', label: 'Nuts & Seeds' },
    { value: 'legumes', label: 'Legumes' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'oils_fats', label: 'Oils & Fats' },
    { value: 'herbs_spices', label: 'Herbs & Spices' },
    { value: 'processed_foods', label: 'Processed Foods' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {food ? 'Edit Food Item' : 'Add New Food Item'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Common Names */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Common Names
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={commonNameInput}
                onChange={(e) => setCommonNameInput(e.target.value)}
                placeholder="Add alternative name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleArrayAdd('commonNames', commonNameInput, setCommonNameInput)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.commonNames.map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('commonNames', index)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Nutrition Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Nutrition (per 100g)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories *
              </label>
              <input
                type="number"
                name="nutrition.calories"
                value={formData.nutrition.calories}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protein (g) *
              </label>
              <input
                type="number"
                name="nutrition.protein"
                value={formData.nutrition.protein}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carbs (g) *
              </label>
              <input
                type="number"
                name="nutrition.carbs"
                value={formData.nutrition.carbs}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fat (g) *
              </label>
              <input
                type="number"
                name="nutrition.fat"
                value={formData.nutrition.fat}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiber (g)
              </label>
              <input
                type="number"
                name="nutrition.fiber"
                value={formData.nutrition.fiber}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sugar (g)
              </label>
              <input
                type="number"
                name="nutrition.sugar"
                value={formData.nutrition.sugar}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sodium (mg)
              </label>
              <input
                type="number"
                name="nutrition.sodium"
                value={formData.nutrition.sodium}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cholesterol (mg)
              </label>
              <input
                type="number"
                name="nutrition.cholesterol"
                value={formData.nutrition.cholesterol}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saturated Fat (g)
              </label>
              <input
                type="number"
                name="nutrition.saturatedFat"
                value={formData.nutrition.saturatedFat}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Key Micronutrients */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Key Micronutrients</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vitamin C (mg)
              </label>
              <input
                type="number"
                name="micronutrients.vitaminC_mg"
                value={formData.micronutrients.vitaminC_mg}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calcium (mg)
              </label>
              <input
                type="number"
                name="micronutrients.calcium_mg"
                value={formData.micronutrients.calcium_mg}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iron (mg)
              </label>
              <input
                type="number"
                name="micronutrients.iron_mg"
                value={formData.micronutrients.iron_mg}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potassium (mg)
              </label>
              <input
                type="number"
                name="micronutrients.potassium_mg"
                value={formData.micronutrients.potassium_mg}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Search Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Keywords
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add search keyword..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleArrayAdd('searchKeywords', keywordInput, setKeywordInput)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.searchKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleArrayRemove('searchKeywords', index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (food ? 'Update Food' : 'Create Food')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodEditor;
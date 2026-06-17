/**
 * Micronutrient Estimator
 * Estimates vitamins/minerals per 100g based on food name keywords.
 * Values are approximate averages from nutrition databases.
 * All values per 100g unless noted.
 */

const FOOD_MICRONUTRIENTS = [
  // Fruits
  { keywords: ['orange', 'citrus'], vitaminC: 53, vitaminA: 11, calcium: 40, iron: 0.1, fiber: 2.4 },
  { keywords: ['lemon', 'lime'],    vitaminC: 53, vitaminA: 3,  calcium: 26, iron: 0.6, fiber: 2.8 },
  { keywords: ['kiwi'],             vitaminC: 93, vitaminA: 4,  calcium: 34, iron: 0.3, fiber: 3.0 },
  { keywords: ['strawberr'],        vitaminC: 59, vitaminA: 1,  calcium: 16, iron: 0.4, fiber: 2.0 },
  { keywords: ['mango'],            vitaminC: 36, vitaminA: 54, calcium: 11, iron: 0.2, fiber: 1.6 },
  { keywords: ['banana'],           vitaminC: 9,  vitaminA: 3,  calcium: 5,  iron: 0.3, fiber: 2.6, magnesium: 27 },
  { keywords: ['apple'],            vitaminC: 5,  vitaminA: 3,  calcium: 6,  iron: 0.1, fiber: 2.4 },
  { keywords: ['grape'],            vitaminC: 4,  vitaminA: 3,  calcium: 10, iron: 0.4, fiber: 0.9 },
  { keywords: ['watermelon'],       vitaminC: 8,  vitaminA: 28, calcium: 7,  iron: 0.2, fiber: 0.4 },
  { keywords: ['papaya'],           vitaminC: 62, vitaminA: 47, calcium: 20, iron: 0.3, fiber: 1.8 },
  { keywords: ['guava'],            vitaminC: 228,vitaminA: 31, calcium: 18, iron: 0.3, fiber: 5.4 },
  { keywords: ['pomegranate'],      vitaminC: 10, vitaminA: 0,  calcium: 10, iron: 0.3, fiber: 4.0 },

  // Vegetables
  { keywords: ['spinach', 'palak'], vitaminC: 28, vitaminA: 469, vitaminK: 483, calcium: 99, iron: 2.7, magnesium: 79, fiber: 2.2 },
  { keywords: ['broccoli'],         vitaminC: 89, vitaminA: 31,  vitaminK: 102, calcium: 47, iron: 0.7, fiber: 2.6 },
  { keywords: ['carrot', 'gajar'],  vitaminC: 6,  vitaminA: 835, vitaminK: 13,  calcium: 33, iron: 0.3, fiber: 2.8 },
  { keywords: ['tomato'],           vitaminC: 14, vitaminA: 42,  vitaminK: 8,   calcium: 10, iron: 0.3, fiber: 1.2 },
  { keywords: ['potato', 'aloo'],   vitaminC: 20, vitaminA: 0,   vitaminK: 2,   calcium: 12, iron: 0.8, fiber: 2.2, magnesium: 23 },
  { keywords: ['onion', 'pyaz'],    vitaminC: 7,  vitaminA: 0,   vitaminK: 0.4, calcium: 23, iron: 0.2, fiber: 1.7 },
  { keywords: ['garlic', 'lehsan'], vitaminC: 31, vitaminA: 0,   vitaminK: 1.7, calcium: 181,iron: 1.7, magnesium: 25 },
  { keywords: ['cucumber', 'kheera'],vitaminC: 3, vitaminA: 5,   vitaminK: 16,  calcium: 16, iron: 0.3, fiber: 0.5 },
  { keywords: ['capsicum', 'bell pepper'], vitaminC: 128, vitaminA: 157, vitaminK: 7, calcium: 10, iron: 0.4, fiber: 2.1 },
  { keywords: ['cabbage', 'gobhi'], vitaminC: 36, vitaminA: 5,   vitaminK: 76,  calcium: 40, iron: 0.5, fiber: 2.5 },
  { keywords: ['peas', 'matar'],    vitaminC: 40, vitaminA: 38,  vitaminK: 25,  calcium: 25, iron: 1.5, fiber: 5.1, magnesium: 33 },
  { keywords: ['lentil', 'daal', 'dal', 'masoor', 'moong', 'chana'],
                                    vitaminC: 2,  vitaminA: 1,   vitaminK: 5,   calcium: 35, iron: 3.3, fiber: 8.0, magnesium: 47, zinc: 1.3 },

  // Proteins
  { keywords: ['egg'],              vitaminA: 149, vitaminD: 2, vitaminB12: 1.1, vitaminE: 1.0, calcium: 56, iron: 1.8, zinc: 1.3 },
  { keywords: ['chicken'],          vitaminB12: 0.3, vitaminD: 0.1, calcium: 15, iron: 1.0, zinc: 1.9, magnesium: 25 },
  { keywords: ['beef', 'mutton', 'gosht'], vitaminB12: 2.6, vitaminD: 0.1, calcium: 18, iron: 2.6, zinc: 4.8, magnesium: 21 },
  { keywords: ['fish', 'salmon', 'tuna', 'mackerel'], vitaminD: 11, vitaminB12: 3.0, calcium: 15, iron: 0.9, zinc: 0.6, magnesium: 27 },
  { keywords: ['milk', 'doodh'],    vitaminA: 46, vitaminD: 1.2, vitaminB12: 0.4, calcium: 125, magnesium: 11, zinc: 0.4 },
  { keywords: ['yogurt', 'dahi', 'curd'], vitaminB12: 0.4, calcium: 121, magnesium: 12, zinc: 0.6 },
  { keywords: ['cheese', 'paneer'], vitaminA: 265, vitaminD: 0.5, vitaminB12: 0.8, calcium: 720, zinc: 3.1 },

  // Grains
  { keywords: ['oat', 'oatmeal'],   vitaminB12: 0, calcium: 54, iron: 4.7, magnesium: 177, zinc: 4.0, fiber: 10.6 },
  { keywords: ['rice', 'chawal'],   vitaminB12: 0, calcium: 10, iron: 0.8, magnesium: 25,  zinc: 1.1, fiber: 0.4 },
  { keywords: ['wheat', 'roti', 'chapati', 'paratha', 'bread', 'atta'],
                                    vitaminB12: 0, calcium: 34, iron: 3.6, magnesium: 138, zinc: 2.8, fiber: 12.2 },
  { keywords: ['nuts', 'almond', 'badam', 'walnut', 'akhrot'],
                                    vitaminE: 26, calcium: 264, iron: 3.7, magnesium: 270, zinc: 3.1, fiber: 12.5 },
];

const MICRONUTRIENT_KEYS = ['vitaminC','vitaminA','vitaminD','vitaminE','vitaminK','vitaminB12','calcium','iron','magnesium','zinc','fiber'];

/**
 * Estimate micronutrients for a food entry
 * @param {string} foodName
 * @param {number} calories - used to estimate serving size relative to 100g
 * @returns {object} micronutrient values
 */
function estimateMicronutrients(foodName, calories = 100) {
  if (!foodName) return {};

  const name = foodName.toLowerCase();

  // Find matching food profile
  let profile = null;
  for (const food of FOOD_MICRONUTRIENTS) {
    if (food.keywords.some(k => name.includes(k))) {
      profile = food;
      break;
    }
  }

  if (!profile) return {};

  // Scale by approximate serving size
  // Assume 100 kcal ≈ 100g for most foods (rough estimate)
  const scaleFactor = Math.max(0.3, Math.min(3, calories / 100));

  const result = {};
  for (const key of MICRONUTRIENT_KEYS) {
    if (profile[key] !== undefined) {
      result[key] = Math.round(profile[key] * scaleFactor * 10) / 10;
    }
  }

  return result;
}

module.exports = { estimateMicronutrients, MICRONUTRIENT_KEYS };

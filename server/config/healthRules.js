/**
 * Health Rules Configuration
 * Defines dietary restrictions and limits for various health conditions
 */

const HEALTH_RULES = {
  diabetes: {
    name: 'Diabetes',
    description: 'Blood sugar management',
    avoid: {
      sugar: {
        threshold: 20,
        unit: 'g',
        severity: 'critical',
        message: 'High sugar content - not recommended for diabetes'
      },
      carbs: {
        threshold: 60,
        unit: 'g',
        severity: 'warning',
        message: 'High carbohydrate content - monitor blood sugar'
      }
    },
    dailyLimits: {
      sugar: {
        max: 25,
        unit: 'g',
        message: 'Daily sugar limit exceeded'
      },
      carbs: {
        max: 130,
        unit: 'g',
        message: 'Daily carbohydrate limit exceeded'
      }
    }
  },

  high_blood_pressure: {
    name: 'High Blood Pressure',
    description: 'Sodium and salt management',
    avoid: {
      sodium: {
        threshold: 500,
        unit: 'mg',
        severity: 'critical',
        message: 'High sodium content - dangerous for blood pressure'
      }
    },
    dailyLimits: {
      sodium: {
        max: 1500,
        unit: 'mg',
        message: 'Daily sodium limit exceeded - risk of high blood pressure'
      }
    }
  },

  heart_disease: {
    name: 'Heart Disease',
    description: 'Fat and cholesterol management',
    avoid: {
      saturatedFat: {
        threshold: 7,
        unit: 'g',
        severity: 'warning',
        message: 'High saturated fat - not good for heart health'
      },
      cholesterol: {
        threshold: 200,
        unit: 'mg',
        severity: 'warning',
        message: 'High cholesterol content - risk for heart disease'
      }
    },
    dailyLimits: {
      saturatedFat: {
        max: 13,
        unit: 'g',
        message: 'Daily saturated fat limit exceeded'
      },
      cholesterol: {
        max: 300,
        unit: 'mg',
        message: 'Daily cholesterol limit exceeded'
      }
    }
  },

  high_cholesterol: {
    name: 'High Cholesterol',
    description: 'Cholesterol and fat management',
    avoid: {
      cholesterol: {
        threshold: 150,
        unit: 'mg',
        severity: 'warning',
        message: 'High cholesterol content - not recommended'
      },
      saturatedFat: {
        threshold: 5,
        unit: 'g',
        severity: 'warning',
        message: 'High saturated fat - raises cholesterol levels'
      }
    },
    dailyLimits: {
      cholesterol: {
        max: 200,
        unit: 'mg',
        message: 'Daily cholesterol limit exceeded'
      },
      saturatedFat: {
        max: 10,
        unit: 'g',
        message: 'Daily saturated fat limit exceeded'
      }
    }
  },

  kidney_disease: {
    name: 'Kidney Disease',
    description: 'Protein, sodium, and potassium management',
    avoid: {
      sodium: {
        threshold: 400,
        unit: 'mg',
        severity: 'critical',
        message: 'High sodium - harmful for kidney function'
      },
      protein: {
        threshold: 30,
        unit: 'g',
        severity: 'warning',
        message: 'High protein content - may strain kidneys'
      },
      potassium: {
        threshold: 400,
        unit: 'mg',
        severity: 'warning',
        message: 'High potassium - risky for kidney disease'
      }
    },
    dailyLimits: {
      sodium: {
        max: 2000,
        unit: 'mg',
        message: 'Daily sodium limit exceeded'
      },
      protein: {
        max: 50,
        unit: 'g',
        message: 'Daily protein limit exceeded - protect kidney function'
      },
      potassium: {
        max: 2000,
        unit: 'mg',
        message: 'Daily potassium limit exceeded'
      }
    }
  }
};

/**
 * RDA (Recommended Daily Allowance) for nutrients
 * Based on age and gender
 */
const RDA_STANDARDS = {
  // Adult Male (19-50 years)
  adult_male: {
    vitaminA: { min: 900, unit: 'mcg', name: 'Vitamin A' },
    vitaminC: { min: 90, unit: 'mg', name: 'Vitamin C' },
    vitaminD: { min: 15, unit: 'mcg', name: 'Vitamin D' },
    vitaminE: { min: 15, unit: 'mg', name: 'Vitamin E' },
    vitaminK: { min: 120, unit: 'mcg', name: 'Vitamin K' },
    vitaminB12: { min: 2.4, unit: 'mcg', name: 'Vitamin B12' },
    calcium: { min: 1000, unit: 'mg', name: 'Calcium' },
    iron: { min: 8, unit: 'mg', name: 'Iron' },
    magnesium: { min: 400, unit: 'mg', name: 'Magnesium' },
    zinc: { min: 11, unit: 'mg', name: 'Zinc' },
    fiber: { min: 38, unit: 'g', name: 'Fiber' }
  },
  
  // Adult Female (19-50 years)
  adult_female: {
    vitaminA: { min: 700, unit: 'mcg', name: 'Vitamin A' },
    vitaminC: { min: 75, unit: 'mg', name: 'Vitamin C' },
    vitaminD: { min: 15, unit: 'mcg', name: 'Vitamin D' },
    vitaminE: { min: 15, unit: 'mg', name: 'Vitamin E' },
    vitaminK: { min: 90, unit: 'mcg', name: 'Vitamin K' },
    vitaminB12: { min: 2.4, unit: 'mcg', name: 'Vitamin B12' },
    calcium: { min: 1000, unit: 'mg', name: 'Calcium' },
    iron: { min: 18, unit: 'mg', name: 'Iron' },
    magnesium: { min: 310, unit: 'mg', name: 'Magnesium' },
    zinc: { min: 8, unit: 'mg', name: 'Zinc' },
    fiber: { min: 25, unit: 'g', name: 'Fiber' }
  },
  
  // Elderly (50+ years)
  elderly_male: {
    vitaminA: { min: 900, unit: 'mcg', name: 'Vitamin A' },
    vitaminC: { min: 90, unit: 'mg', name: 'Vitamin C' },
    vitaminD: { min: 20, unit: 'mcg', name: 'Vitamin D' },
    vitaminE: { min: 15, unit: 'mg', name: 'Vitamin E' },
    vitaminK: { min: 120, unit: 'mcg', name: 'Vitamin K' },
    vitaminB12: { min: 2.4, unit: 'mcg', name: 'Vitamin B12' },
    calcium: { min: 1200, unit: 'mg', name: 'Calcium' },
    iron: { min: 8, unit: 'mg', name: 'Iron' },
    magnesium: { min: 420, unit: 'mg', name: 'Magnesium' },
    zinc: { min: 11, unit: 'mg', name: 'Zinc' },
    fiber: { min: 30, unit: 'g', name: 'Fiber' }
  },
  
  elderly_female: {
    vitaminA: { min: 700, unit: 'mcg', name: 'Vitamin A' },
    vitaminC: { min: 75, unit: 'mg', name: 'Vitamin C' },
    vitaminD: { min: 20, unit: 'mcg', name: 'Vitamin D' },
    vitaminE: { min: 15, unit: 'mg', name: 'Vitamin E' },
    vitaminK: { min: 90, unit: 'mcg', name: 'Vitamin K' },
    vitaminB12: { min: 2.4, unit: 'mcg', name: 'Vitamin B12' },
    calcium: { min: 1200, unit: 'mg', name: 'Calcium' },
    iron: { min: 8, unit: 'mg', name: 'Iron' },
    magnesium: { min: 320, unit: 'mg', name: 'Magnesium' },
    zinc: { min: 8, unit: 'mg', name: 'Zinc' },
    fiber: { min: 21, unit: 'g', name: 'Fiber' }
  }
};

/**
 * Get RDA standards for a user based on age and gender
 */
function getRDAForUser(user) {
  const age = user.age || 30;
  const gender = user.gender || 'male';
  
  if (age >= 50) {
    return gender === 'female' ? RDA_STANDARDS.elderly_female : RDA_STANDARDS.elderly_male;
  } else {
    return gender === 'female' ? RDA_STANDARDS.adult_female : RDA_STANDARDS.adult_male;
  }
}

/**
 * Deficiency threshold (percentage of RDA)
 */
const DEFICIENCY_THRESHOLDS = {
  critical: 50,  // <50% of RDA
  warning: 70,   // 50-70% of RDA
  low: 90        // 70-90% of RDA
};

module.exports = {
  HEALTH_RULES,
  RDA_STANDARDS,
  getRDAForUser,
  DEFICIENCY_THRESHOLDS
};

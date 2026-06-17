"""
Calorie Calculator - BMR, TDEE, and Water Intake Calculator
Precise mathematical calculations for nutrition planning
"""

import sys
import json
import math

def calculate_bmr(age, gender, weight, height):
    """
    Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    Most accurate formula for modern populations
    
    Args:
        age: Age in years
        gender: 'male' or 'female'
        weight: Weight in kg
        height: Height in cm
    
    Returns:
        BMR in calories/day
    """
    if gender.lower() == 'male':
        # BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:  # female
        # BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    return round(bmr, 2)

def calculate_tdee(bmr, activity_level):
    """
    Calculate Total Daily Energy Expenditure (TDEE)
    
    Activity Level Multipliers:
    - sedentary: 1.2 (little or no exercise)
    - lightly_active: 1.375 (light exercise 1-3 days/week)
    - moderately_active: 1.55 (moderate exercise 3-5 days/week)
    - very_active: 1.725 (hard exercise 6-7 days/week)
    - extra_active: 1.9 (very hard exercise, physical job)
    
    Args:
        bmr: Basal Metabolic Rate
        activity_level: Activity level string
    
    Returns:
        TDEE in calories/day
    """
    activity_multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extra_active': 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level.lower(), 1.55)  # Default to moderate
    tdee = bmr * multiplier
    
    return round(tdee, 2)

def calculate_calorie_target(tdee, goal):
    """
    Calculate target calories based on goal
    
    Goals:
    - weight_loss: -500 cal/day (lose ~0.5kg/week)
    - extreme_weight_loss: -1000 cal/day (lose ~1kg/week)
    - maintain: 0 cal change
    - weight_gain: +500 cal/day (gain ~0.5kg/week)
    - muscle_gain: +300 cal/day (lean bulk)
    
    Args:
        tdee: Total Daily Energy Expenditure
        goal: Goal string
    
    Returns:
        Target calories/day
    """
    goal_adjustments = {
        'weight_loss': -500,
        'extreme_weight_loss': -1000,
        'maintain': 0,
        'weight_gain': 500,
        'muscle_gain': 300
    }
    
    adjustment = goal_adjustments.get(goal.lower(), 0)
    target = tdee + adjustment
    
    # Safety limits
    min_calories = 1200 if goal != 'extreme_weight_loss' else 1000
    target = max(target, min_calories)
    
    return round(target, 2)

def calculate_water_intake(weight, activity_level):
    """
    Calculate daily water intake recommendation
    
    Formula: 
    - Base: 30-35 ml per kg of body weight
    - Activity adjustment: +500ml for active, +1000ml for very active
    
    Args:
        weight: Weight in kg
        activity_level: Activity level string
    
    Returns:
        Water intake in liters/day
    """
    # Base calculation: 35ml per kg
    base_water = weight * 0.035  # Convert to liters
    
    # Activity adjustment
    activity_adjustments = {
        'sedentary': 0,
        'lightly_active': 0.25,
        'moderately_active': 0.5,
        'very_active': 1.0,
        'extra_active': 1.5
    }
    
    adjustment = activity_adjustments.get(activity_level.lower(), 0.5)
    total_water = base_water + adjustment
    
    return round(total_water, 2)

def calculate_macros(target_calories, goal):
    """
    Calculate macronutrient distribution
    
    Args:
        target_calories: Target daily calories
        goal: Goal string
    
    Returns:
        Dictionary with protein, carbs, fats in grams
    """
    # Macro ratios based on goal
    macro_ratios = {
        'weight_loss': {'protein': 0.35, 'carbs': 0.35, 'fat': 0.30},
        'extreme_weight_loss': {'protein': 0.40, 'carbs': 0.30, 'fat': 0.30},
        'maintain': {'protein': 0.30, 'carbs': 0.40, 'fat': 0.30},
        'weight_gain': {'protein': 0.30, 'carbs': 0.45, 'fat': 0.25},
        'muscle_gain': {'protein': 0.35, 'carbs': 0.40, 'fat': 0.25}
    }
    
    ratios = macro_ratios.get(goal.lower(), macro_ratios['maintain'])
    
    # Calculate grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
    protein_grams = round((target_calories * ratios['protein']) / 4, 1)
    carbs_grams = round((target_calories * ratios['carbs']) / 4, 1)
    fat_grams = round((target_calories * ratios['fat']) / 9, 1)
    
    return {
        'protein': protein_grams,
        'carbs': carbs_grams,
        'fat': fat_grams
    }

def calculate_bmi(weight, height):
    """
    Calculate Body Mass Index (BMI)
    
    Args:
        weight: Weight in kg
        height: Height in cm
    
    Returns:
        BMI value and category
    """
    height_m = height / 100  # Convert cm to meters
    bmi = weight / (height_m ** 2)
    
    # Determine category
    if bmi < 18.5:
        category = 'Underweight'
    elif 18.5 <= bmi < 25:
        category = 'Normal weight'
    elif 25 <= bmi < 30:
        category = 'Overweight'
    else:
        category = 'Obese'
    
    return round(bmi, 1), category

def main():
    """Main function to process input and return calculations"""
    try:
        # Read input from command line argument
        if len(sys.argv) < 2:
            raise ValueError("No input data provided")
        
        input_data = json.loads(sys.argv[1])
        
        # Extract user data
        age = int(input_data.get('age', 25))
        gender = input_data.get('gender', 'male')
        weight = float(input_data.get('weight', 70))
        height = float(input_data.get('height', 170))
        activity_level = input_data.get('activityLevel', 'moderately_active')
        goal = input_data.get('goal', 'maintain')
        
        # Perform calculations
        bmr = calculate_bmr(age, gender, weight, height)
        tdee = calculate_tdee(bmr, activity_level)
        target_calories = calculate_calorie_target(tdee, goal)
        water_intake = calculate_water_intake(weight, activity_level)
        macros = calculate_macros(target_calories, goal)
        bmi, bmi_category = calculate_bmi(weight, height)
        
        # Prepare result
        result = {
            'success': True,
            'data': {
                'bmr': bmr,
                'tdee': tdee,
                'targetCalories': target_calories,
                'waterIntake': water_intake,
                'macros': macros,
                'bmi': bmi,
                'bmiCategory': bmi_category,
                'userProfile': {
                    'age': age,
                    'gender': gender,
                    'weight': weight,
                    'height': height,
                    'activityLevel': activity_level,
                    'goal': goal
                }
            }
        }
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()

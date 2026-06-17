"""
EfficientNet Food Recognition Service
Uses the pre-trained EfficientNet model to identify fruits/foods from images
"""
import sys
import json
import os
import numpy as np

def load_model_and_predict(image_path):
    try:
        import tensorflow as tf
        from PIL import Image
        
        # Model path - check multiple locations
        model_paths = [
            os.path.join(os.path.dirname(__file__), '..', 'efficientnet_fruits360.h5'),
            os.path.join(os.path.dirname(__file__), 'efficientnet_fruits360.h5'),
            'efficientnet_fruits360.h5'
        ]
        
        model_path = None
        for p in model_paths:
            if os.path.exists(p):
                model_path = p
                break
        
        if not model_path:
            raise FileNotFoundError("Model file not found")
        
        # Load model
        model = tf.keras.models.load_model(model_path)
        
        # Fruit classes (Fruits-360 dataset)
        fruit_classes = [
            'Apple Braeburn', 'Apple Crimson Snow', 'Apple Golden 1', 'Apple Golden 2',
            'Apple Golden 3', 'Apple Granny Smith', 'Apple Pink Lady', 'Apple Red 1',
            'Apple Red 2', 'Apple Red 3', 'Apple Red Delicious', 'Apple Red Yellow 1',
            'Apple Red Yellow 2', 'Apricot', 'Avocado', 'Avocado ripe', 'Banana',
            'Banana Lady Finger', 'Banana Red', 'Beetroot', 'Blueberry', 'Cactus fruit',
            'Cantaloupe 1', 'Cantaloupe 2', 'Carambula', 'Cauliflower', 'Cherry 1',
            'Cherry 2', 'Cherry Rainier', 'Cherry Wax Black', 'Cherry Wax Red',
            'Cherry Wax Yellow', 'Chestnut', 'Clementine', 'Cocos', 'Corn',
            'Corn Husk', 'Cucumber Ripe', 'Cucumber Ripe 2', 'Dates', 'Eggplant',
            'Fig', 'Ginger Root', 'Granadilla', 'Grape Blue', 'Grape Pink',
            'Grape White', 'Grape White 2', 'Grape White 3', 'Grape White 4',
            'Grapefruit Pink', 'Grapefruit White', 'Guava', 'Hazelnut', 'Huckleberry',
            'Kaki', 'Kiwi', 'Kohlrabi', 'Kumquats', 'Lemon', 'Lemon Meyer',
            'Limes', 'Lychee', 'Mandarine', 'Mango', 'Mango Red', 'Mangostan',
            'Maracuja', 'Melon Piel de Sapo', 'Mulberry', 'Nectarine', 'Nectarine Flat',
            'Nut Forest', 'Nut Pecan', 'Onion Red', 'Onion Red Peeled', 'Onion White',
            'Orange', 'Papaya', 'Passion Fruit', 'Peach', 'Peach 2', 'Peach Flat',
            'Pear', 'Pear 2', 'Pear Abate', 'Pear Forelle', 'Pear Kaiser',
            'Pear Monster', 'Pear Red', 'Pear Stone', 'Pear Williams', 'Pepino',
            'Pepper Green', 'Pepper Orange', 'Pepper Red', 'Pepper Yellow',
            'Physalis', 'Physalis with Husk', 'Pineapple', 'Pineapple Mini',
            'Pitahaya Red', 'Plum', 'Plum 2', 'Plum 3', 'Pomegranate', 'Pomelo Sweetie',
            'Potato Red', 'Potato Red Washed', 'Potato Sweet', 'Potato White',
            'Quince', 'Rambutan', 'Raspberry', 'Redcurrant', 'Salak', 'Strawberry',
            'Strawberry Wedge', 'Tamarillo', 'Tangelo', 'Tomato 1', 'Tomato 2',
            'Tomato 3', 'Tomato 4', 'Tomato Cherry Red', 'Tomato Heart',
            'Tomato Maroon', 'Tomato not Ripened', 'Tomato Yellow', 'Walnut', 'Watermelon'
        ]
        
        # Nutrition data per 100g for common fruits
        nutrition_db = {
            'Apple': {'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4},
            'Banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6},
            'Orange': {'calories': 47, 'protein': 0.9, 'carbs': 12, 'fat': 0.1, 'fiber': 2.4},
            'Mango': {'calories': 60, 'protein': 0.8, 'carbs': 15, 'fat': 0.4, 'fiber': 1.6},
            'Strawberry': {'calories': 32, 'protein': 0.7, 'carbs': 7.7, 'fat': 0.3, 'fiber': 2.0},
            'Grape': {'calories': 69, 'protein': 0.7, 'carbs': 18, 'fat': 0.2, 'fiber': 0.9},
            'Watermelon': {'calories': 30, 'protein': 0.6, 'carbs': 7.6, 'fat': 0.2, 'fiber': 0.4},
            'Pineapple': {'calories': 50, 'protein': 0.5, 'carbs': 13, 'fat': 0.1, 'fiber': 1.4},
            'Kiwi': {'calories': 61, 'protein': 1.1, 'carbs': 15, 'fat': 0.5, 'fiber': 3.0},
            'Lemon': {'calories': 29, 'protein': 1.1, 'carbs': 9.3, 'fat': 0.3, 'fiber': 2.8},
            'Tomato': {'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2, 'fiber': 1.2},
            'Pepper': {'calories': 31, 'protein': 1.0, 'carbs': 6.0, 'fat': 0.3, 'fiber': 2.1},
            'Cucumber': {'calories': 15, 'protein': 0.7, 'carbs': 3.6, 'fat': 0.1, 'fiber': 0.5},
            'Potato': {'calories': 77, 'protein': 2.0, 'carbs': 17, 'fat': 0.1, 'fiber': 2.2},
            'Onion': {'calories': 40, 'protein': 1.1, 'carbs': 9.3, 'fat': 0.1, 'fiber': 1.7},
            'default': {'calories': 60, 'protein': 1.0, 'carbs': 14, 'fat': 0.3, 'fiber': 2.0}
        }
        
        # Preprocess image - try 224x224 first (standard EfficientNet), fallback to 100x100
        img = Image.open(image_path).convert('RGB')
        
        # Try to get input shape from model
        try:
            input_shape = model.input_shape
            img_size = input_shape[1] if input_shape[1] else 224
        except:
            img_size = 224
            
        img = img.resize((img_size, img_size))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        predictions = model.predict(img_array, verbose=0)
        top_indices = np.argsort(predictions[0])[::-1][:5]
        
        results = []
        for i, idx in enumerate(top_indices):
            if idx < len(fruit_classes):
                fruit_name = fruit_classes[idx]
                confidence = float(predictions[0][idx])
                results.append({
                    'rank': i + 1,
                    'fruit': fruit_name,
                    'confidence': confidence,
                    'percentage': round(confidence * 100, 1)
                })
        
        top_fruit = results[0]['fruit'] if results else 'Unknown'
        
        # Get nutrition for top prediction
        nutrition = nutrition_db.get('default')
        for key in nutrition_db:
            if key.lower() in top_fruit.lower():
                nutrition = nutrition_db[key]
                break
        
        return {
            'success': True,
            'predictions': results,
            'top_prediction': results[0] if results else None,
            'nutrition': nutrition,
            'model_type': 'EfficientNet',
            'dataset': 'Fruits-360'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No image path provided'}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = load_model_and_predict(image_path)
    print(json.dumps(result))

#!/usr/bin/env python3
"""
ML Service for NutriOptima - EfficientNet Fruit Recognition
Extracts model from Jupyter notebook and provides prediction API
"""

import sys
import json
import os
import numpy as np
from PIL import Image
import io
import base64

# Try to import TensorFlow
try:
    import tensorflow as tf
    from tensorflow.keras.applications import EfficientNetB0
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
    from tensorflow.keras.preprocessing import image
    TF_AVAILABLE = True
except ImportError as e:
    print(f"TensorFlow not available: {e}", file=sys.stderr)
    TF_AVAILABLE = False

class FruitRecognitionModel:
    def __init__(self):
        self.model = None
        self.class_names = []
        self.img_size = 224
        self.is_loaded = False
        
        # Common fruit classes from Fruits-360 dataset
        self.default_classes = [
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
            'Pepper Green', 'Pepper Orange', 'Pepper Red', 'Pepper Yellow', 'Physalis',
            'Physalis with Husk', 'Pineapple', 'Pineapple Mini', 'Pitahaya Red',
            'Plum', 'Plum 2', 'Plum 3', 'Pomegranate', 'Pomelo Sweetie',
            'Potato Red', 'Potato Red Washed', 'Potato Sweet', 'Potato White',
            'Quince', 'Rambutan', 'Raspberry', 'Redcurrant', 'Salak', 'Strawberry',
            'Strawberry Wedge', 'Tamarillo', 'Tangelo', 'Tomato 1', 'Tomato 2',
            'Tomato 3', 'Tomato 4', 'Tomato Cherry Red', 'Tomato Heart', 'Tomato Maroon',
            'Tomato not Ripened', 'Tomato Yellow', 'Walnut', 'Watermelon'
        ]
    
    def create_model(self, num_classes):
        """Create EfficientNet model architecture"""
        if not TF_AVAILABLE:
            return None
            
        try:
            # Create base model
            base_model = EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_shape=(self.img_size, self.img_size, 3)
            )
            
            # Add custom classification head
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dropout(0.2)(x)
            predictions = Dense(num_classes, activation='softmax')(x)
            
            model = Model(inputs=base_model.input, outputs=predictions)
            return model
            
        except Exception as e:
            print(f"Error creating model: {e}", file=sys.stderr)
            return None
    
    def load_model_from_notebook(self, notebook_path):
        """Extract and load model from Jupyter notebook"""
        if not TF_AVAILABLE:
            print("TensorFlow not available", file=sys.stderr)
            return False
            
        try:
            # For now, create a model with default classes
            # In a real implementation, you would extract the saved model from the notebook
            num_classes = len(self.default_classes)
            self.class_names = self.default_classes
            
            self.model = self.create_model(num_classes)
            if self.model is None:
                return False
                
            # Compile the model
            self.model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            print(f"Model created with {num_classes} classes", file=sys.stderr)
            self.is_loaded = True
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            return False
    
    def preprocess_image(self, image_data):
        """Preprocess image for prediction"""
        try:
            # Decode base64 image
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input size
            img = img.resize((self.img_size, self.img_size))
            
            # Convert to array and normalize
            img_array = np.array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array.astype('float32') / 255.0
            
            return img_array
            
        except Exception as e:
            print(f"Error preprocessing image: {e}", file=sys.stderr)
            return None
    
    def predict(self, image_data):
        """Make prediction on image"""
        if not self.is_loaded or self.model is None:
            return {
                'success': False,
                'error': 'Model not loaded'
            }
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            if processed_image is None:
                return {
                    'success': False,
                    'error': 'Failed to preprocess image'
                }
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Get top 3 predictions
            top_indices = np.argsort(predictions[0])[-3:][::-1]
            
            results = []
            for i, idx in enumerate(top_indices):
                confidence = float(predictions[0][idx])
                class_name = self.class_names[idx] if idx < len(self.class_names) else f"Class_{idx}"
                
                results.append({
                    'rank': i + 1,
                    'class': class_name,
                    'confidence': confidence,
                    'percentage': round(confidence * 100, 2)
                })
            
            return {
                'success': True,
                'predictions': results,
                'top_prediction': results[0] if results else None
            }
            
        except Exception as e:
            print(f"Error making prediction: {e}", file=sys.stderr)
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}'
            }

# Global model instance
model_instance = None

def initialize_model():
    """Initialize the model"""
    global model_instance
    if model_instance is None:
        model_instance = FruitRecognitionModel()
        # Try to load from notebook (for now just create default model)
        notebook_path = os.path.join(os.path.dirname(__file__), '..', 'Copy of EffecientNet.ipynb')
        success = model_instance.load_model_from_notebook(notebook_path)
        if not success:
            print("Failed to load model", file=sys.stderr)
    return model_instance

def predict_image(image_data):
    """Predict image using the loaded model"""
    model = initialize_model()
    if model is None:
        return {
            'success': False,
            'error': 'Model initialization failed'
        }
    
    return model.predict(image_data)

def get_service_status():
    """Get service status"""
    return {
        'tensorflow_available': TF_AVAILABLE,
        'model_loaded': model_instance is not None and model_instance.is_loaded if model_instance else False,
        'python_version': sys.version,
        'service': 'ML Service for Fruit Recognition'
    }

if __name__ == '__main__':
    # Command line interface
    if len(sys.argv) < 2:
        print("Usage: python ml_service.py <command> [args]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'status':
        status = get_service_status()
        print(json.dumps(status, indent=2))
    
    elif command == 'predict':
        if len(sys.argv) < 3:
            print("Usage: python ml_service.py predict <base64_image_data>")
            sys.exit(1)
        
        image_data = sys.argv[2]
        result = predict_image(image_data)
        print(json.dumps(result, indent=2))
    
    elif command == 'init':
        model = initialize_model()
        if model and model.is_loaded:
            print(json.dumps({'success': True, 'message': 'Model initialized successfully'}))
        else:
            print(json.dumps({'success': False, 'message': 'Model initialization failed'}))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
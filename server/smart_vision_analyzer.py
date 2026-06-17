

import sys
import json
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import io
import base64
import math

class SmartVisionAnalyzer:
    def __init__(self):
        self.is_loaded = True
        
       
        self.fruit_database = {
            'Banana': {
                'color_ranges': [
                    {'name': 'yellow', 'h': (20, 30), 's': (40, 100), 'v': (40, 100)},
                    {'name': 'green_yellow', 'h': (30, 60), 's': (30, 80), 'v': (30, 90)}
                ],
                'shape': 'elongated',
                'texture': 'smooth',
                'size_ratio': (2.5, 4.0),  # length/width ratio
                'keywords': ['curved', 'elongated', 'yellow', 'smooth']
            },
            'Apple Red': {
                'color_ranges': [
                    {'name': 'red', 'h': (0, 10), 's': (50, 100), 'v': (30, 100)},
                    {'name': 'dark_red', 'h': (340, 360), 's': (50, 100), 'v': (30, 100)}
                ],
                'shape': 'round',
                'texture': 'smooth',
                'size_ratio': (0.8, 1.2),
                'keywords': ['round', 'red', 'smooth', 'shiny']
            },
            'Apple Green': {
                'color_ranges': [
                    {'name': 'green', 'h': (60, 120), 's': (30, 100), 'v': (30, 100)}
                ],
                'shape': 'round',
                'texture': 'smooth',
                'size_ratio': (0.8, 1.2),
                'keywords': ['round', 'green', 'smooth', 'shiny']
            },
            'Orange': {
                'color_ranges': [
                    {'name': 'orange', 'h': (10, 25), 's': (50, 100), 'v': (40, 100)}
                ],
                'shape': 'round',
                'texture': 'textured',
                'size_ratio': (0.9, 1.1),
                'keywords': ['round', 'orange', 'textured', 'dimpled']
            },
            'Strawberry': {
                'color_ranges': [
                    {'name': 'red', 'h': (0, 15), 's': (60, 100), 'v': (40, 100)}
                ],
                'shape': 'heart',
                'texture': 'seeded',
                'size_ratio': (0.7, 1.3),
                'keywords': ['heart', 'red', 'seeded', 'textured']
            },
            'Lemon': {
                'color_ranges': [
                    {'name': 'yellow', 'h': (15, 35), 's': (50, 100), 'v': (50, 100)}
                ],
                'shape': 'oval',
                'texture': 'textured',
                'size_ratio': (1.2, 1.8),
                'keywords': ['oval', 'yellow', 'textured', 'pointed']
            },
            'Grape': {
                'color_ranges': [
                    {'name': 'purple', 'h': (240, 280), 's': (30, 100), 'v': (20, 80)},
                    {'name': 'green', 'h': (60, 120), 's': (20, 80), 'v': (30, 90)}
                ],
                'shape': 'cluster',
                'texture': 'smooth',
                'size_ratio': (0.8, 1.2),
                'keywords': ['cluster', 'small', 'round', 'bunch']
            }
        }
    
    def rgb_to_hsv(self, r, g, b):
        
        r, g, b = r/255.0, g/255.0, b/255.0
        mx = max(r, g, b)
        mn = min(r, g, b)
        df = mx-mn
        
        if mx == mn:
            h = 0
        elif mx == r:
            h = (60 * ((g-b)/df) + 360) % 360
        elif mx == g:
            h = (60 * ((b-r)/df) + 120) % 360
        elif mx == b:
            h = (60 * ((r-g)/df) + 240) % 360
        
        if mx == 0:
            s = 0
        else:
            s = (df/mx)*100
        
        v = mx*100
        return h, s, v
    
    def analyze_color_distribution(self, img_array):
        """Analyze color distribution in the image"""
        height, width = img_array.shape[:2]
        
        
        center_x, center_y = width // 2, height // 2
        sample_size = min(width, height) // 3
        
        x1 = max(0, center_x - sample_size)
        x2 = min(width, center_x + sample_size)
        y1 = max(0, center_y - sample_size)
        y2 = min(height, center_y + sample_size)
        
        center_region = img_array[y1:y2, x1:x2]
        
       
        colors = []
        for y in range(0, center_region.shape[0], 5):  # Sample every 5th pixel
            for x in range(0, center_region.shape[1], 5):
                r, g, b = center_region[y, x]
                h, s, v = self.rgb_to_hsv(r, g, b)
                if s > 20 and v > 20:  # Ignore very desaturated/dark pixels
                    colors.append((h, s, v))
        
        if not colors:
            return {'dominant_hue': 0, 'saturation': 0, 'brightness': 0}
        
        # Calculate dominant color
        hues = [c[0] for c in colors]
        saturations = [c[1] for c in colors]
        brightnesses = [c[2] for c in colors]
        
        return {
            'dominant_hue': float(np.median(hues)),
            'saturation': float(np.median(saturations)),
            'brightness': float(np.median(brightnesses)),
            'color_variance': float(np.std(hues))
        }
    
    def analyze_shape(self, img_array):
        """Analyze shape characteristics"""
        # Convert to grayscale
        gray = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140])
        
        # Simple edge detection
        height, width = gray.shape
        edges = np.zeros_like(gray)
        
        # Sobel-like edge detection
        for y in range(1, height-1):
            for x in range(1, width-1):
                gx = (-1*gray[y-1,x-1] + 1*gray[y-1,x+1] +
                      -2*gray[y,x-1] + 2*gray[y,x+1] +
                      -1*gray[y+1,x-1] + 1*gray[y+1,x+1])
                
                gy = (-1*gray[y-1,x-1] + -2*gray[y-1,x] + -1*gray[y-1,x+1] +
                      1*gray[y+1,x-1] + 2*gray[y+1,x] + 1*gray[y+1,x+1])
                
                edges[y,x] = min(255, math.sqrt(gx*gx + gy*gy))
        
        # Find bounding box of the object
        threshold = np.mean(edges) + np.std(edges)
        edge_points = np.where(edges > threshold)
        
        if len(edge_points[0]) == 0:
            return {'aspect_ratio': 1.0, 'roundness': 0.5, 'elongation': 0.0}
        
        min_y, max_y = int(np.min(edge_points[0])), int(np.max(edge_points[0]))
        min_x, max_x = int(np.min(edge_points[1])), int(np.max(edge_points[1]))
        
        obj_height = max_y - min_y
        obj_width = max_x - min_x
        
        if obj_width == 0:
            aspect_ratio = 1.0
        else:
            aspect_ratio = float(obj_height / obj_width)
        
        # Calculate roundness (how close to circular)
        area = len(edge_points[0])
        perimeter = int(np.sum(edges > threshold))
        
        if perimeter == 0:
            roundness = 0.0
        else:
            roundness = (4 * math.pi * area) / (perimeter * perimeter)
        
        return {
            'aspect_ratio': aspect_ratio,
            'roundness': float(min(1.0, roundness)),
            'elongation': float(max(0.0, aspect_ratio - 1.0)),
            'width': int(obj_width),
            'height': int(obj_height)
        }
    
    def analyze_texture(self, img_array):
        """Analyze texture characteristics"""
        # Convert to grayscale
        gray = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140])
        
        # Calculate local variance (texture measure)
        height, width = gray.shape
        texture_map = np.zeros_like(gray)
        
        window_size = 5
        for y in range(window_size, height-window_size):
            for x in range(window_size, width-window_size):
                window = gray[y-window_size:y+window_size, x-window_size:x+window_size]
                texture_map[y,x] = np.var(window)
        
        avg_texture = float(np.mean(texture_map))
        texture_variance = float(np.var(texture_map))
        
        return {
            'smoothness': float(max(0.0, 1.0 - (avg_texture / 100.0))),
            'texture_variance': texture_variance,
            'is_smooth': bool(avg_texture < 50),
            'is_textured': bool(avg_texture > 100)
        }
    
    def match_fruit(self, color_analysis, shape_analysis, texture_analysis):
        """Match analyzed features to fruit database"""
        scores = {}
        
        for fruit_name, fruit_data in self.fruit_database.items():
            score = 0.0
            
            # Color matching (40% weight)
            color_score = 0.0
            for color_range in fruit_data['color_ranges']:
                h_min, h_max = color_range['h']
                s_min, s_max = color_range['s']
                v_min, v_max = color_range['v']
                
                h = color_analysis['dominant_hue']
                s = color_analysis['saturation']
                v = color_analysis['brightness']
                
                # Handle hue wraparound (red colors)
                if h_min > h_max:  # Wraparound case (e.g., 340-360 and 0-10 for red)
                    h_match = (h >= h_min) or (h <= h_max)
                else:
                    h_match = h_min <= h <= h_max
                
                if (h_match and s_min <= s <= s_max and v_min <= v <= v_max):
                    color_score = 1.0
                    break
                else:
                    # Partial match based on distance
                    h_dist = min(abs(h - h_min), abs(h - h_max))
                    if h_min > h_max:  # Handle wraparound
                        h_dist = min(h_dist, abs(h - (h_min - 360)), abs(h - (h_max + 360)))
                    
                    s_dist = min(abs(s - s_min), abs(s - s_max))
                    v_dist = min(abs(v - v_min), abs(v - v_max))
                    
                    partial_score = max(0.0, 1.0 - (h_dist/180 + s_dist/100 + v_dist/100)/3)
                    color_score = max(color_score, partial_score)
            
            score += color_score * 0.4
            
            # Shape matching (35% weight)
            shape_score = 0.0
            aspect_ratio = shape_analysis['aspect_ratio']
            roundness = shape_analysis['roundness']
            
            if fruit_data['shape'] == 'elongated':
                shape_score = max(0.0, min(1.0, (aspect_ratio - 1.5) / 2.0))  # Prefer high aspect ratio
            elif fruit_data['shape'] == 'round':
                shape_score = roundness  # Prefer high roundness
            elif fruit_data['shape'] == 'oval':
                shape_score = max(0.0, 1.0 - abs(aspect_ratio - 1.4) / 1.0)  # Prefer moderate elongation
            elif fruit_data['shape'] == 'heart':
                shape_score = max(0.0, 1.0 - abs(aspect_ratio - 1.1) / 0.5)  # Slightly elongated
            elif fruit_data['shape'] == 'cluster':
                shape_score = 1.0 - roundness  # Prefer irregular shapes
            
            score += shape_score * 0.35
            
            # Texture matching (25% weight)
            texture_score = 0.0
            smoothness = texture_analysis['smoothness']
            
            if fruit_data['texture'] == 'smooth':
                texture_score = smoothness
            elif fruit_data['texture'] == 'textured':
                texture_score = 1.0 - smoothness
            elif fruit_data['texture'] == 'seeded':
                texture_score = 0.7 if texture_analysis['texture_variance'] > 50 else 0.3
            
            score += texture_score * 0.25
            
            scores[fruit_name] = float(score)
        
        return scores
    
    def predict(self, image_data):
        """Analyze image and predict fruit type"""
        try:
            # Decode image
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize for analysis
            img = img.resize((224, 224))
            img_array = np.array(img)
            
            print(f"Analyzing image of size {img_array.shape}", file=sys.stderr)
            
            # Perform analysis
            color_analysis = self.analyze_color_distribution(img_array)
            shape_analysis = self.analyze_shape(img_array)
            texture_analysis = self.analyze_texture(img_array)
            
            print(f"Color: H={color_analysis['dominant_hue']:.1f}, S={color_analysis['saturation']:.1f}, V={color_analysis['brightness']:.1f}", file=sys.stderr)
            print(f"Shape: AR={shape_analysis['aspect_ratio']:.2f}, R={shape_analysis['roundness']:.2f}", file=sys.stderr)
            print(f"Texture: S={texture_analysis['smoothness']:.2f}", file=sys.stderr)
            
            # Match to fruits
            scores = self.match_fruit(color_analysis, shape_analysis, texture_analysis)
            
            # Sort by score
            sorted_fruits = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            
            # Create results
            results = []
            for i, (fruit_name, score) in enumerate(sorted_fruits[:3]):
                results.append({
                    'rank': i + 1,
                    'class': fruit_name,
                    'confidence': score,
                    'percentage': round(score * 100, 1)
                })
            
            print(f"Top prediction: {results[0]['class']} ({results[0]['percentage']:.1f}%)", file=sys.stderr)
            
            return {
                'success': True,
                'predictions': results,
                'top_prediction': results[0] if results else None,
                'analysis': {
                    'color': color_analysis,
                    'shape': shape_analysis,
                    'texture': texture_analysis
                }
            }
            
        except Exception as e:
            print(f"Error in vision analysis: {e}", file=sys.stderr)
            return {
                'success': False,
                'error': f'Vision analysis failed: {str(e)}'
            }

# Global analyzer instance
analyzer_instance = None

def initialize_analyzer():
    """Initialize the vision analyzer"""
    global analyzer_instance
    if analyzer_instance is None:
        analyzer_instance = SmartVisionAnalyzer()
        print("Smart Vision Analyzer initialized", file=sys.stderr)
    return analyzer_instance

def predict_image(image_data):
    """Predict image using vision analysis"""
    analyzer = initialize_analyzer()
    return analyzer.predict(image_data)

def get_service_status():
    """Get service status"""
    return {
        'vision_analyzer_available': True,
        'analyzer_loaded': analyzer_instance is not None,
        'python_version': sys.version,
        'service': 'Smart Vision Analyzer for Fruit Recognition',
        'method': 'Computer Vision Analysis',
        'features': ['Color Analysis', 'Shape Detection', 'Texture Analysis', 'Pattern Matching']
    }

if __name__ == '__main__':
   
    if len(sys.argv) < 2:
        print("Usage: python smart_vision_analyzer.py <command> [args]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'status':
        status = get_service_status()
        print(json.dumps(status, indent=2))
    
    elif command == 'predict':
        if len(sys.argv) < 3:
            print("Usage: python smart_vision_analyzer.py predict <base64_image_data>")
            sys.exit(1)
        
        image_data = sys.argv[2]
        result = predict_image(image_data)
        print(json.dumps(result, indent=2))
    
    elif command == 'init':
        analyzer = initialize_analyzer()
        if analyzer:
            print(json.dumps({'success': True, 'message': 'Smart Vision Analyzer initialized successfully'}))
        else:
            print(json.dumps({'success': False, 'message': 'Analyzer initialization failed'}))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
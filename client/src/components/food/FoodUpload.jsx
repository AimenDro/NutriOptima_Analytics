
import React, { useState, useRef } from 'react';
import axios from 'axios';
import LoadingSpinner from '../ui/LoadingSpinner';

const FoodUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      setPrediction(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setError(null);
      setPrediction(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const analyzeFruit = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await axios.post('/api/ml/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.isNonFood || response.data.error?.code === 'NON_FOOD_IMAGE') {
        setError('⚠️ ' + (response.data.error?.message || 'Please upload a food image only. Non-food images cannot be analyzed.'));
      } else if (response.data.success) {
        setPrediction(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(
        error.response?.data?.error?.message || 
        'Failed to analyze image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🍽️ Food Recognition
          </h1>
          <p className="text-gray-600">
            Upload an image of any food to get instant nutrition information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Image
            </h2>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                imagePreview
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Selected fruit"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={analyzeFruit}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Analyzing...' : 'Analyze Food'}
                    </button>
                    <button
                      onClick={clearImage}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📷</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your food image here
                    </p>
                    <p className="text-gray-500 mb-4">
                      or click to browse files
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recognition Results
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {prediction && !loading && (
              <div className="space-y-6">
                {/* Top Prediction */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    🎯 Best Match
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-900 font-medium capitalize">
                      {prediction.topPrediction?.fruit || prediction.topPrediction?.name || 'Unknown Food'}
                    </span>
                    <span className="text-green-700 font-bold">
                      {prediction.topPrediction?.percentage?.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Nutrition Info */}
                  {prediction.nutrition && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Nutrition (per serving)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>🔥 Calories: <strong>{prediction.nutrition.calories || 'N/A'} kcal</strong></div>
                        <div>💪 Protein: <strong>{prediction.nutrition.protein || 'N/A'}g</strong></div>
                        <div>🍞 Carbs: <strong>{prediction.nutrition.carbs || 'N/A'}g</strong></div>
                        <div>🥑 Fat: <strong>{prediction.nutrition.fat || prediction.nutrition.fats || 'N/A'}g</strong></div>
                        <div>🌿 Fiber: <strong>{prediction.nutrition.fiber || 'N/A'}g</strong></div>
                        <div>🍬 Sugar: <strong>{prediction.nutrition.sugar || 'N/A'}g</strong></div>
                      </div>
                      {prediction.healthScore && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm text-gray-600">Health Score: </span>
                          <span className={`font-bold text-sm ${prediction.healthScore >= 7 ? 'text-green-600' : prediction.healthScore >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {prediction.healthScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-1">💡 Tips</p>
                      {prediction.recommendations.slice(0, 2).map((rec, i) => (
                        <p key={i} className="text-xs text-blue-600">• {rec}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Predictions */}
                {prediction.predictions && prediction.predictions.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    All Predictions
                  </h3>
                  <div className="space-y-2">
                    {prediction.predictions?.map((pred, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">
                            #{pred.rank}
                          </span>
                          <span className="text-gray-900 capitalize">
                            {pred.fruit || pred.name}
                          </span>
                        </div>
                        <span className="text-gray-700 font-medium">
                          {pred.percentage?.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add to Meal Log
                  </button>
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    View Full Nutrition
                  </button>
                </div>
              </div>
            )}

            {!prediction && !loading && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-4">🔍</span>
                <p>Upload an image to see recognition results</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📸 Tips for Better Recognition
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Use clear, well-lit photos</li>
            <li>• Center the food in the image</li>
            <li>• Avoid cluttered backgrounds</li>
            <li>• Works with any food — meals, fruits, vegetables, snacks</li>
            <li>• Higher resolution images give better results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FoodUpload;
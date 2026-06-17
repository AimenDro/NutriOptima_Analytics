import { useState } from 'react';

const FoodImport = ({ onComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setImporting(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/admin/food/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const csvTemplate = `name,category,calories,protein,carbs,fat,fiber,sugar,sodium,vitamin_c,calcium,iron
Apple,fruits,52,0.3,14,0.2,2.4,10.4,1,4.6,6,0.12
Banana,fruits,89,1.1,23,0.3,2.6,12.2,1,8.7,5,0.26
Chicken Breast,proteins,165,31,0,3.6,0,0,74,0,15,0.89
Brown Rice,grains,111,2.6,23,0.9,1.8,0.4,5,0,10,0.52`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'food_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Import Food Data</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload a CSV file to bulk import food items into the database
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Import Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• CSV file must include headers: name, category, calories, protein, carbs, fat</li>
            <li>• Optional columns: fiber, sugar, sodium, vitamin_c, calcium, iron</li>
            <li>• Nutrition values should be per 100g</li>
            <li>• Category must be one of: fruits, vegetables, grains, proteins, dairy, etc.</li>
            <li>• Imported items will have status "pending_review"</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV files only</p>
            </div>
          </div>
          
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              Selected file: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Import Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">Import Complete</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div>✅ Processed: {result.processed} rows</div>
              <div>✅ Imported: {result.imported} food items</div>
              {result.errors > 0 && (
                <div>⚠️ Errors: {result.errors} rows failed</div>
              )}
            </div>
            
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-green-900 mb-1">Error Details:</h4>
                <div className="max-h-32 overflow-y-auto">
                  {result.errorDetails.map((error, index) => (
                    <div key={index} className="text-xs text-green-700 mb-1">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={onComplete}
              className="mt-3 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              View Imported Items
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>

        {/* Sample Data Preview */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Sample CSV Format</h3>
          <div className="bg-gray-50 rounded-md p-3 overflow-x-auto">
            <pre className="text-xs text-gray-700 whitespace-pre">
              {csvTemplate}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodImport;
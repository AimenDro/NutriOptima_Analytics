import { useState, useEffect } from 'react';

const AdminDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    currentPath: window.location.pathname,
    currentUrl: window.location.href,
    localStorage: {},
    serverStatus: 'checking...'
  });

  useEffect(() => {
    // Get localStorage info
    const localStorageInfo = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageInfo[key] = localStorage.getItem(key);
    }

    // Check server status
    fetch('http://localhost:5001/api/health')
      .then(response => response.json())
      .then(data => {
        setDebugInfo(prev => ({
          ...prev,
          localStorage: localStorageInfo,
          serverStatus: data.status || 'unknown'
        }));
      })
      .catch(error => {
        setDebugInfo(prev => ({
          ...prev,
          localStorage: localStorageInfo,
          serverStatus: 'error: ' + error.message
        }));
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Admin Debug Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Location */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">📍 Current Location</h2>
              <div className="space-y-2 text-sm">
                <div><strong>Path:</strong> {debugInfo.currentPath}</div>
                <div><strong>Full URL:</strong> {debugInfo.currentUrl}</div>
                <div><strong>Is Admin Route:</strong> {debugInfo.currentPath.startsWith('/admin') ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-3">🖥️ Server Status</h2>
              <div className="space-y-2 text-sm">
                <div><strong>Backend:</strong> {debugInfo.serverStatus}</div>
                <div><strong>Frontend:</strong> ✅ Running</div>
                <div><strong>Port:</strong> 3000 (Frontend), 5001 (Backend)</div>
              </div>
            </div>

            {/* Local Storage */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">💾 Local Storage</h2>
              <div className="space-y-2 text-sm">
                {Object.keys(debugInfo.localStorage).length > 0 ? (
                  Object.entries(debugInfo.localStorage).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No items in localStorage</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 mb-3">⚡ Quick Actions</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = '/admin'}
                  className="block w-full text-left px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  🔄 Reload Admin
                </button>
                <button 
                  onClick={() => localStorage.clear()}
                  className="block w-full text-left px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  🗑️ Clear Storage
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="block w-full text-left px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  🏠 Go to Main App
                </button>
              </div>
            </div>
          </div>

          {/* Component Test */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">🧪 Component Test</h2>
            <div className="text-sm text-gray-600">
              If you can see this debug page, the React routing and component loading is working correctly.
              The admin components are properly imported and rendering.
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-indigo-900 mb-3">📋 Next Steps</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-800">
              <li>Verify the server status shows "OK"</li>
              <li>Check that the current path shows "/admin" or "/admin/debug"</li>
              <li>Try the "Reload Admin" button to test navigation</li>
              <li>If everything looks good, the admin system should be working</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
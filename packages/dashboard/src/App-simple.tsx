import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          🎯 Quiz App Dashboard
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Admin panel for managing quiz questions and sessions
        </p>
        
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <h3 className="font-semibold text-green-800">✅ Backend Status</h3>
            <p className="text-sm text-green-600">API running on http://localhost:3001</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h3 className="font-semibold text-blue-800">🔌 Socket.io</h3>
            <p className="text-sm text-blue-600">Real-time connection ready</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <h3 className="font-semibold text-purple-800">📱 Ready for React Native</h3>
            <p className="text-sm text-purple-600">Backend APIs fully functional</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-medium text-gray-800 mb-2">Test the API:</h4>
          <code className="text-xs text-gray-600 break-all">
            curl http://localhost:3001/health
          </code>
        </div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState('checking...');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [quizStatus, setQuizStatus] = useState<{
    isActive: boolean;
    currentQuestionId: string | null;
    participantCount: number;
  }>({
    isActive: false,
    currentQuestionId: null,
    participantCount: 0
  });
  const [credentials, setCredentials] = useState({
    email: 'admin@example.com',
    password: 'admin123',
    adminKey: 'secret'
  });

  // Check API status and login status on load
  useEffect(() => {
    checkApiStatus();
    checkQuizStatus();
    
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      loadQuestions();
    }
  }, []);

  const checkApiStatus = async () => {
    setIsCheckingApi(true);
    setApiStatus('checking...');
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        setApiStatus('✅ Online');
      } else {
        setApiStatus('❌ Error');
      }
    } catch (error) {
      setApiStatus('❌ Offline');
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.data.token);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        alert('✅ Admin login successful!');
        loadQuestions();
      } else {
        const error = await response.json();
        alert('❌ Login failed: ' + error.error);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const loadQuestions = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/admin/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.data);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
        alert('Session expired. Please login again.');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const checkQuizStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quiz/current');
      if (response.ok) {
        const data = await response.json();
        console.log('Quiz status response:', data); // Debug log
        if (data.success && data.data) {
          setQuizStatus({
            isActive: data.data.isActive || false,
            currentQuestionId: data.data.currentQuestionId || null,
            participantCount: data.data.participantCount || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to check quiz status:', error);
    }
  };

  const createQuestion = async (questionData: any) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });

      if (response.ok) {
        alert('✅ Question created successfully!');
        setShowQuestionForm(false);
        loadQuestions();
      } else {
        const error = await response.json();
        alert('❌ Failed to create question: ' + error.error);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const startQuiz = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/quiz/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId: 'admin_id' })
      });

      if (response.ok) {
        alert('🎯 Quiz started successfully!');
        checkQuizStatus(); // Refresh quiz status after starting
      } else {
        const error = await response.json();
        alert('❌ Failed to start quiz: ' + error.error);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const stopQuiz = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/quiz/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('🛑 Quiz stopped successfully!');
        checkQuizStatus(); // Refresh quiz status after stopping
      } else {
        const error = await response.json();
        alert('❌ Failed to stop quiz: ' + error.error);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Quiz App Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">API Status: {apiStatus}</span>
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Admin Login
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    setIsLoggedIn(false);
                    setQuestions([]);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Server Status</p>
                <p className="text-lg font-bold">{apiStatus}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Admin Status</p>
                <p className="text-lg font-bold">{isLoggedIn ? '✅ Logged In' : '❌ Not Logged In'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                quizStatus.isActive ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                <span className="text-white font-bold">Q</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Quiz Status</p>
                <p className="text-lg font-bold">
                  {quizStatus.isActive ? '� Active' : '⚫ Inactive'}
                </p>
                {quizStatus.isActive && (
                  <p className="text-xs text-gray-500">
                    {quizStatus.participantCount} participants
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={startQuiz}
              disabled={!isLoggedIn}
              className={`px-6 py-3 rounded-md font-medium ${
                isLoggedIn
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              🎯 Start Quiz
            </button>

            <button
              onClick={stopQuiz}
              disabled={!isLoggedIn}
              className={`px-6 py-3 rounded-md font-medium ${
                isLoggedIn
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              🛑 Stop Quiz
            </button>
            
            <button
              onClick={() => setShowQuestionForm(true)}
              disabled={!isLoggedIn}
              className={`px-6 py-3 rounded-md font-medium ${
                isLoggedIn
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              ➕ Add Question
            </button>
            
            <button
              onClick={loadQuestions}
              disabled={!isLoggedIn}
              className={`px-6 py-3 rounded-md font-medium ${
                isLoggedIn
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              📊 Refresh Questions
            </button>

            <button
              onClick={checkQuizStatus}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-medium"
            >
              🔍 Check Quiz Status
            </button>

            <button
              onClick={checkApiStatus}
              disabled={isCheckingApi}
              className={`px-6 py-3 rounded-md font-medium ${
                isCheckingApi 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {isCheckingApi ? '🔄 Checking...' : '🔄 Check API'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        {isLoggedIn && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Questions ({questions.length})
            </h3>
            {questions.length === 0 ? (
              <p className="text-gray-500">No questions created yet. Add some questions to get started!</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={q.$id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {q.text}
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {q.options.map((option: string, optIndex: number) => (
                        <span
                          key={optIndex}
                          className={`px-2 py-1 rounded text-sm ${
                            optIndex === q.correctAnswer
                              ? 'bg-green-100 text-green-800 font-medium'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Time limit: {q.timeLimit}s | Created: {new Date(q.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={credentials.adminKey}
                  onChange={(e) => setCredentials({...credentials, adminKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionForm
          onSubmit={createQuestion}
          onCancel={() => setShowQuestionForm(false)}
        />
      )}
    </div>
  );
}

function QuestionForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 60
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.text.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const filledOptions = formData.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    onSubmit({
      ...formData,
      options: filledOptions
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Question</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({...formData, text: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={formData.correctAnswer === index}
                  onChange={() => setFormData({...formData, correctAnswer: index})}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({...formData, options: newOptions});
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="300"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium"
            >
              Create Question
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

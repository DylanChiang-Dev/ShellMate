import { useState, useEffect } from 'react';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('SSH Terminal App initialized');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SSH Terminal</h1>
        <p className="text-gray-400 mb-8">A modern SSH terminal application</p>
        <div className="space-x-4">
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        {isConnected && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <p className="text-green-400">Connected to server</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

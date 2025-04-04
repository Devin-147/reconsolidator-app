import { useState } from 'react';

export default function MailsterTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mailster/test');
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : 'Failed to test connection');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Mailster API Test</h1>
      <button
        onClick={testConnection}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>
      {testResult && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {testResult}
        </pre>
      )}
    </div>
  );
} 
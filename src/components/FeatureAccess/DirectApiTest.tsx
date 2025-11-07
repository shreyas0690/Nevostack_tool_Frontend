import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

const DirectApiTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testApi();
  }, []);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🧪 Direct API Test - Starting...');
      const response = await apiService.get('/api/companies/features');
      console.log('🧪 Direct API Test - Response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('🧪 Direct API Test - Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-4">Direct API Test (Auto-run)</h3>
      
      {loading && <div className="text-blue-600">Testing API...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {result && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">API Response:</h4>
          <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium mb-2">Features Found:</h4>
            {result.data?.features ? (
              <div className="grid grid-cols-2 gap-1 text-sm">
                {Object.entries(result.data.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className={value ? 'text-green-600' : 'text-red-600'}>
                      {value ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">No features found in response</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectApiTest;

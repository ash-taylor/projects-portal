import { useState, useEffect } from 'react';
import { api } from '../api';

export function ApiExample() {
  const [message, setMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get<{ message: string }>('/');
        setMessage(data.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMessage('Failed to load data');
      }
    }

    fetchData();
  }, []);

  return (
    <div className="api-example">
      <h2>API Response</h2>
      {error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
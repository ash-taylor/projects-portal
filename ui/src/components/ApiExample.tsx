import { Container, Header } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { apiClient } from '../api';

export function ApiExample() {
  const [message, setMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.makeRequest<{ secret: string }>('/auth', { method: 'get' }, true);
        setMessage(response.data.secret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMessage('Failed to load data');
      }
    }

    fetchData();
  }, []);

  return (
    <Container header={<Header variant="h1">API Example</Header>} variant="default">
      {error ? <p className="error">Error: {error}</p> : <p>{message}</p>}
    </Container>
  );
}

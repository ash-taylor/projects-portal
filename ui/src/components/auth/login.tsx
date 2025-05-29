import { Alert, Button, Container, Form, FormField, Header, Input, SpaceBetween } from '@cloudscape-design/components';
import React, { useState } from 'react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Replace this with your actual authentication logic
      // For example: await authService.login(email, password);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // On successful login, redirect or update app state
      // For example: navigate('/dashboard');
      alert('Login successful!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link" disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" loading={loading} formAction="submit">
                Login
              </Button>
            </SpaceBetween>
          }
          header={<Header variant="h1">Login to Projects Portal</Header>}
        >
          <SpaceBetween direction="vertical" size="s">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <Container>
              <SpaceBetween direction="vertical" size="l">
                <FormField label="Email" description="Enter your email address">
                  <Input
                    value={email}
                    onChange={({ detail }) => setEmail(detail.value)}
                    type="email"
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Password" description="Enter your password">
                  <Input
                    value={password}
                    onChange={({ detail }) => setPassword(detail.value)}
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </FormField>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    </div>
  );
};

export default LoginPage;

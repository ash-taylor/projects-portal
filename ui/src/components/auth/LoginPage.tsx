import { Button, Container, Form, FormField, Header, Input, SpaceBetween } from '@cloudscape-design/components';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/authContext';
import { FullPageCenteredBoxLayout } from '../../layouts/FullPageCentredBoxLayout';
import { LoadingLayout } from '../../layouts/LoadingLayout';
import { RoutingButton } from '../../routing/RoutingButton';
import { ErrorBox } from '../global/ErrorBox';

const LoginPage = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setLoading(true);

      // Basic validation
      if (!email || !password) throw new Error('Email and password are required');

      await login({ email, password });

      navigate('/');
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingLayout />;

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <RoutingButton href="/landing" formAction="none" variant="link" disabled={loading}>
              Cancel
            </RoutingButton>
            <Button
              variant="primary"
              loading={loading}
              formAction="submit"
              loadingText="Logging in user"
              disabled={!email || !password}
            >
              Login
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Projects Portal Login</Header>}
      >
        <SpaceBetween direction="vertical" size="s">
          {error && renderError()}
          <Container>
            <SpaceBetween direction="vertical" size="l">
              <FormField label="Email" description="Enter your email address">
                <Input
                  name="email"
                  value={email}
                  onChange={({ detail }) => setEmail(detail.value)}
                  type="email"
                  inputMode="email"
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
  );

  return <FullPageCenteredBoxLayout>{renderLoginForm()}</FullPageCenteredBoxLayout>;
};

export default LoginPage;

import { Button, Container, Form, FormField, Header, Input, SpaceBetween } from '@cloudscape-design/components';
import React, { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/authContext';
import { buildError } from '../../helpers/buildError';
import { FullPageCenteredBoxLayout } from '../../layouts/FullPageCentredBoxLayout';
import { LoadingLayout } from '../../layouts/LoadingLayout';
import { RoutingButton } from '../../routing/RoutingButton';
import { isValidEmail } from '../../validation/validators';
import { ErrorBox } from '../global/ErrorBox';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();

  const resetForm = () => {
    setEmail('');
    setEmailError('');
    resetValidation();
    setError(undefined);
    setAlert(null);
  };

  const resetValidation = () => {
    setEmailError('');
  };

  const validateInput = () => {
    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError('Must be a valid email');
      valid = false;
    }

    if (!valid) throw new Error('Invalid input, please check input values');
    return valid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      validateInput();
      setLoading(true);

      await login({ email, password });

      navigate(from, { replace: true });
    } catch (err) {
      setError(buildError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingLayout />;

  const renderAlert = () => alert;

  const renderError = () =>
    error && (
      <ErrorBox
        error={error}
        onDismiss={() => {
          setError(undefined);
          resetValidation();
        }}
      />
    );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <RoutingButton href="/landing" formAction="none" variant="link" disabled={loading} onClick={resetForm}>
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
          {alert && renderAlert()}
          <Container>
            <SpaceBetween direction="vertical" size="l">
              <FormField
                label="Email"
                description="Enter your email address"
                constraintText={<>Email must be valid and 1 to 30 characters. Character count: {email.length}/30</>}
                errorText={emailError}
              >
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

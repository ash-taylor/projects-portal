import {
  Alert,
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Toggle,
} from '@cloudscape-design/components';
import { AxiosError } from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/AuthContext';
import { buildError } from '../../helpers/buildError';
import { FullPageCenteredBoxLayout } from '../../layouts/FullPageCentredBoxLayout';
import type { User } from '../../models/User';
import { RoutingButton } from '../../routing/RoutingButton';
import { ErrorBox } from '../global/ErrorBox';

const SignupPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [error, setError] = useState<Error>();
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [verify, setVerify] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admin, setAdmin] = useState(false);

  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setLoading(true);

      // Basic validation
      if (!email || !password || !firstName || !lastName) throw new Error('Email and password are required');

      const res = await apiClient.makeRequest(
        '/auth/signup',
        {
          method: 'post',
          data: { firstName, lastName, password, email, admin },
        },
        true,
      );

      if (res.status === 201) setVerify(true);
    } catch (err) {
      if (err instanceof AxiosError && err.status === 409 && err.response?.data.status === 'pending') {
        setAlertMessage('User already exists with verification pending, please enter confirmation code');
        setVerify(true);
      } else if (err instanceof AxiosError && err.status === 409 && err.response?.data.status === 'conflict') {
        setAlertMessage('User already exists, please log in');
      } else {
        setError(buildError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setLoading(true);

      // Basic validation
      if (!email || !confirmationCode) throw new Error('Verification Code Required');

      const verifyResponse = await apiClient.makeRequest<User, { email: string; confirmationCode: string }>(
        '/auth/verify',
        {
          method: 'post',
          data: { email, confirmationCode },
        },
        true,
      );

      updateUser(verifyResponse.data);

      return navigate('/');
    } catch (err) {
      setError(buildError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderAlert = () =>
    alertMessage && (
      <Alert type="info" dismissible onDismiss={() => setAlertMessage('')}>
        {alertMessage}
      </Alert>
    );

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderContent = () =>
    !verify ? (
      <form onSubmit={handleSignup}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <RoutingButton href="/landing" formAction="none" variant="link" disabled={loading}>
                Cancel
              </RoutingButton>
              <Button variant="primary" loading={loading} formAction="submit">
                Signup
              </Button>
            </SpaceBetween>
          }
          header={<Header variant="h1">Create a Projects Portal account</Header>}
        >
          <SpaceBetween direction="vertical" size="s">
            {error && renderError()}
            {alertMessage && renderAlert()}
            <Container>
              <SpaceBetween direction="vertical" size="l">
                <FormField label="First Name" description="Enter your first name">
                  <Input
                    value={firstName}
                    onChange={({ detail }) => setFirstName(detail.value)}
                    type="text"
                    placeholder="First Name"
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Last Name" description="Enter your last name">
                  <Input
                    value={lastName}
                    onChange={({ detail }) => setLastName(detail.value)}
                    type="text"
                    placeholder="Last Name"
                    disabled={loading}
                  />
                </FormField>

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

                <FormField label="Admin" description="Is the account an admin account">
                  <Toggle checked={admin} onChange={({ detail }) => setAdmin(detail.checked)} disabled={loading} />
                </FormField>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    ) : (
      <form onSubmit={handleConfirmationSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <RoutingButton href="/landing" formAction="none" variant="normal" disabled={loading}>
                Cancel
              </RoutingButton>
              <Button variant="primary" loading={loading} formAction="submit" disabled={!confirmationCode}>
                Confirm
              </Button>
            </SpaceBetween>
          }
          secondaryActions={
            <Button formAction="none" variant="link" disabled={loading}>
              Resend Code
            </Button>
          }
          header={<Header variant="h1">Verify Your Account</Header>}
        >
          <SpaceBetween direction="vertical" size="s">
            {error && renderError()}
            {alertMessage && renderAlert()}
            <Container>
              <SpaceBetween direction="vertical" size="l">
                <FormField label="Confirmation Code" description="Enter your email confirmation code">
                  <Input
                    value={confirmationCode}
                    onChange={({ detail }) => setConfirmationCode(detail.value)}
                    type="number"
                    placeholder="Email Confirmation Code"
                    disabled={loading}
                  />
                </FormField>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    );

  return <FullPageCenteredBoxLayout>{renderContent()}</FullPageCenteredBoxLayout>;
};

export default SignupPage;

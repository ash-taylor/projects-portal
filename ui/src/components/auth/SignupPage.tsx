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
import React, { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
import { buildError } from '../../helpers/buildError';
import { FullPageCenteredBoxLayout } from '../../layouts/FullPageCentredBoxLayout';
import type { User } from '../../models/User';
import { RoutingButton } from '../../routing/RoutingButton';
import { isValidEmail, isValidName, isValidPassword } from '../../validation/validators';
import { ErrorBox } from '../global/ErrorBox';

const SignupPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const [verify, setVerify] = useState(false);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastName, setLastName] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [admin, setAdmin] = useState(false);

  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationCodeError, setConfirmationCodeError] = useState('');

  const resetForm = () => {
    setEmail('');
    setEmailError('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setAdmin(false);
    setConfirmationCode('');
    resetValidation();
    setError(undefined);
    setAlert(null);
    setVerify(false);
  };

  const resetValidation = () => {
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');
    setConfirmationCodeError('');
  };

  const validateInput = () => {
    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError('Must be a valid email');
      valid = false;
    }
    if (!isValidPassword(password)) {
      setPasswordError(
        'Password must consist of at least 8 characters and contain at least 1 uppercase, 1 lowercase and 1 special character',
      );
      valid = false;
    }
    if (!isValidName(firstName)) {
      setFirstNameError('First name must be less than 30 characters');
    }
    if (!isValidName(lastName)) {
      setLastNameError('Last name must be less than 30 characters');
    }
    if (verify && !confirmationCode) setConfirmationCodeError('Confirmation Code Required');
    if (!valid) throw new Error('Invalid input, please check input values');
    return valid;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      validateInput();
      setLoading(true);

      const res = await apiClient.makeRequest(
        '/auth/signup',
        {
          method: 'post',
          data: { firstName, lastName, password, email, admin },
        },
        true,
      );

      setAlert(
        <Alert type="success" dismissible onDismiss={() => setAlert(null)}>
          Signup success. Please check your email for the verification code.
        </Alert>,
      );

      if (res.status === 201) setVerify(true);
    } catch (err) {
      if (err instanceof AxiosError && err.status === 409 && err.response?.data.status === 'pending') {
        setAlert(
          <Alert type="info" dismissible onDismiss={() => setAlert(null)}>
            User already exists with verification pending, please enter confirmation code
          </Alert>,
        );
        setVerify(true);
      } else if (err instanceof AxiosError && err.status === 409 && err.response?.data.status === 'conflict') {
        setAlert(
          <Alert
            type="info"
            dismissible
            onDismiss={() => setAlert(null)}
            action={<RoutingButton href="/login">Log In User</RoutingButton>}
          >
            User already exists. Please log in.
          </Alert>,
        );
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

  const renderContent = () =>
    !verify ? (
      <form onSubmit={handleSignupSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <RoutingButton href="/landing" formAction="none" variant="link" disabled={loading} onClick={resetForm}>
                Cancel
              </RoutingButton>
              <Button variant="primary" loading={loading} formAction="submit" loadingText="Signing up user">
                Signup
              </Button>
            </SpaceBetween>
          }
          header={<Header variant="h1">Create a Projects Portal account</Header>}
        >
          <SpaceBetween direction="vertical" size="s">
            {error && renderError()}
            {alert && renderAlert()}
            <Container>
              <SpaceBetween direction="vertical" size="l">
                <FormField
                  label="First Name"
                  description="Enter your first name"
                  constraintText={<>First name must be 1 to 30 characters. Character count: {firstName.length}/30</>}
                  errorText={
                    firstNameError || firstName.length > 30 ? 'First name must be 30 characters or less' : undefined
                  }
                >
                  <Input
                    value={firstName}
                    onChange={({ detail }) => setFirstName(detail.value)}
                    type="text"
                    placeholder="First Name"
                    disabled={loading}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  description="Enter your last name"
                  constraintText={<>Last name must be 1 to 30 characters. Character count: {lastName.length}/30</>}
                  errorText={
                    lastNameError || lastName.length > 30 ? 'Last name must be 30 characters or less' : undefined
                  }
                >
                  <Input
                    value={lastName}
                    onChange={({ detail }) => setLastName(detail.value)}
                    type="text"
                    placeholder="Last Name"
                    disabled={loading}
                  />
                </FormField>

                <FormField
                  label="Email"
                  description="Enter your email address"
                  constraintText={<>Email must be valid and 1 to 30 characters. Character count: {email.length}/30</>}
                  errorText={emailError}
                >
                  <Input
                    value={email}
                    onChange={({ detail }) => setEmail(detail.value)}
                    type="email"
                    inputMode="email"
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </FormField>

                <FormField
                  label="Password"
                  description="Enter your password"
                  constraintText={
                    <>
                      Password must be a minimum length of 8 characters and contain at least 1 uppercase, 1 lowercase
                      and 1 special character.
                    </>
                  }
                  errorText={passwordError}
                >
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
              <RoutingButton href="/landing" formAction="none" variant="normal" disabled={loading} onClick={resetForm}>
                Cancel
              </RoutingButton>
              <Button
                variant="primary"
                loading={loading}
                formAction="submit"
                disabled={!confirmationCode}
                disabledReason="You must provide a confirmation code"
              >
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
            {alert && renderAlert()}
            <Container>
              <SpaceBetween direction="vertical" size="l">
                <FormField
                  label="Confirmation Code"
                  description="Enter your email confirmation code"
                  constraintText={<>You must provide confirmation code sent to provided email address.</>}
                  errorText={confirmationCodeError}
                >
                  <Input
                    value={confirmationCode}
                    onChange={({ detail }) => {
                      if (confirmationCodeError) resetValidation();
                      setConfirmationCode(detail.value);
                    }}
                    type="number"
                    inputMode="text"
                    autoComplete={false}
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

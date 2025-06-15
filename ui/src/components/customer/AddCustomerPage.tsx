import { Button, Form, FormField, Header, Input, SpaceBetween, Textarea } from '@cloudscape-design/components';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
import { Roles } from '../../models/Roles';
import { RoutingButton } from '../../routing/RoutingButton';
import { isUserAuthorized } from '../auth/helpers/helpers';
import { ErrorBox } from '../global/ErrorBox';
import type { ICustomerResponse } from './models/customer-response.interface';

const AddCustomerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setLoading(true);

      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('You are not authorized to create a customer');
      if (!customerName) throw new Error('Customer name is required');

      await apiClient.makeRequest<ICustomerResponse>(
        '/customers',
        {
          method: 'post',
          data: {
            name: customerName,
            details: customerDetails,
          },
        },
        true,
      );

      navigate('/customers');
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderAddCustomerForm = () => (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <RoutingButton href="/" formAction="none" variant="link" disabled={loading}>
              Cancel
            </RoutingButton>
            <Button
              variant="primary"
              loading={loading}
              formAction="submit"
              loadingText="Creating Customer"
              disabled={!customerName}
            >
              Create Customer
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create Customer</Header>}
      >
        <SpaceBetween direction="vertical" size="s">
          {error && renderError()}
          {/* <Container> */}
          <SpaceBetween direction="vertical" size="l">
            <FormField label="Customer Name" description="Enter the name of the customer">
              <Input
                name="customerName"
                value={customerName}
                onChange={({ detail }) => setCustomerName(detail.value)}
                type="text"
                inputMode="text"
                placeholder="Amazon"
                disabled={loading}
              />
            </FormField>

            <FormField label="Customer Details" description="Enter customer details">
              <Textarea
                name="customerDetails"
                value={customerDetails}
                placeholder="Customer details (optional)"
                onChange={({ detail }) => setCustomerDetails(detail.value)}
                disabled={loading}
              />
            </FormField>
          </SpaceBetween>
          {/* </Container> */}
        </SpaceBetween>
      </Form>
    </form>
  );

  return <>{error ? renderError() : renderAddCustomerForm()}</>;
};

export default AddCustomerPage;

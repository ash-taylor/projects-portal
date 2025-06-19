import { Alert, Button, Form, FormField, Header, Input, SpaceBetween } from '@cloudscape-design/components';
import { type FormEvent, type ReactNode, useState } from 'react';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
import { buildError } from '../../helpers/buildError';
import { Roles } from '../../models/Roles';
import { RoutingButton } from '../../routing/RoutingButton';
import { isValidDetails, isValidEntity } from '../../validation/validators';
import { isUserAuthorized } from '../auth/helpers/helpers';
import { ErrorBox } from '../global/ErrorBox';
import type { ICreateCustomer } from './models/ICreateCustomer';
import type { ICustomerResponse } from './models/ICustomerResponse';

const AddCustomerPage = () => {
  const { user } = useAuth();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerNameError, setCustomerNameError] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<string>('');
  const [customerDetailsError, setCustomerDetailsError] = useState<string>('');

  const resetForm = () => {
    setCustomerName('');
    setCustomerDetails('');
    resetValidation();
  };

  const resetValidation = () => {
    setCustomerNameError('');
    setCustomerDetailsError('');
  };

  const validateInput = () => {
    let valid = true;
    if (!isValidEntity(customerName)) {
      setCustomerNameError('Must be a valid customer name');
      valid = false;
    }
    if (!isValidDetails(customerDetails)) {
      setCustomerDetailsError('Customer details must not exceed 60 characters');
      valid = false;
    }
    if (!valid) throw new Error('Invalid input, please check input values');
    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('You are not authorized to create a customer');

      e.preventDefault();
      validateInput();
      setLoading(true);

      await apiClient.makeRequest<ICustomerResponse, ICreateCustomer>(
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

      setAlert(
        <Alert
          type="success"
          dismissible
          onDismiss={() => setAlert(null)}
          action={<RoutingButton href="/customers">View Customers</RoutingButton>}
        >
          {customerName} added successfully
        </Alert>,
      );

      resetForm();
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderAlert = () => alert;

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderAddCustomerForm = () => (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" variant="link" disabled={loading || !customerName} onClick={resetForm}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loading}
              formAction="submit"
              loadingText="Creating Customer"
              disabled={loading || !customerName}
            >
              Create Customer
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create Customer</Header>}
      >
        <SpaceBetween direction="vertical" size="s">
          {error && renderError()}
          {alert && renderAlert()}
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label="Customer Name"
              description="Enter the name of the customer"
              constraintText={<>Name must be 1 to 50 characters. Character count: {customerName.length}/50</>}
              errorText={
                customerNameError || customerName.length > 50 ? 'Name must be 50 characters or less' : undefined
              }
            >
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

            <FormField
              label={
                <span>
                  Customer Details <i>- optional</i>{' '}
                </span>
              }
              description="Enter customer details"
              constraintText={<>Max 60 characters. Character count: {customerDetails.length}/60</>}
              errorText={
                customerDetailsError || customerDetails.length > 60
                  ? 'Details must be 60 characters or less'
                  : undefined
              }
            >
              <Input
                name="customerDetails"
                type="text"
                inputMode="text"
                value={customerDetails}
                placeholder="Customer details (optional)"
                onChange={({ detail }) => setCustomerDetails(detail.value)}
                disabled={loading}
              />
            </FormField>
          </SpaceBetween>
        </SpaceBetween>
      </Form>
    </form>
  );

  return renderAddCustomerForm();
};

export default AddCustomerPage;

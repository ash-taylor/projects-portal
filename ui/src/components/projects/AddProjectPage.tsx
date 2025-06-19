import {
  Alert,
  Button,
  Form,
  FormField,
  Header,
  Input,
  Multiselect,
  type MultiselectProps,
  Select,
  type SelectProps,
  SpaceBetween,
  Textarea,
} from '@cloudscape-design/components';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
import { buildError } from '../../helpers/buildError';
import { parseStatus } from '../../helpers/helpers';
import { Roles } from '../../models/Roles';
import { RoutingButton } from '../../routing/RoutingButton';
import { isValidDetails, isValidEntity } from '../../validation/validators';
import { isUserAuthorized } from '../auth/helpers/helpers';
import type { ICustomerResponse } from '../customers/models/ICustomerResponse';
import { ErrorBox } from '../global/ErrorBox';
import type { IUserResponse } from '../users/models/IUserResponse';
import type { ICreateProject } from './models/ICreateProject';
import type { IProjectResponse } from './models/IProjectResponse';
import { ProjectStatus } from './models/ProjectStatus';

const AddProjectPage = () => {
  const { user } = useAuth();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<ReactNode>(null);

  const [customers, setCustomers] = useState<ICustomerResponse[]>([]);
  const [users, setUsers] = useState<IUserResponse[]>([]);

  const [projectName, setProjectName] = useState<string>('');
  const [projectNameError, setProjectNameError] = useState<string>('');
  const [projectDetails, setProjectDetails] = useState<string>('');
  const [projectDetailsError, setProjectDetailsError] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<SelectProps.Option | null>(null);
  const [selectedCustomerError, setSelectedCustomerError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<SelectProps.Option | null>(null);
  const [selectedStatusError, setSelectedStatusError] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<MultiselectProps.Options>([]);

  const resetForm = () => {
    setProjectName('');
    setProjectDetails('');
    setSelectedCustomer(null);
    setSelectedStatus(null);
    setSelectedUsers([]);
    resetValidation();
  };

  const resetValidation = () => {
    setProjectNameError('');
    setProjectDetailsError('');
    setSelectedCustomerError('');
    setSelectedStatusError('');
  };

  const validateInput = () => {
    let valid = true;
    if (!isValidEntity(projectName)) {
      setProjectNameError('Must be a valid project name');
      valid = false;
    }
    if (!selectedCustomer) {
      setSelectedCustomerError('Customer is required');
      valid = false;
    }
    if (!selectedStatus) {
      setSelectedStatusError('Status is required');
      valid = false;
    }
    if (!isValidDetails(projectDetails)) {
      setProjectDetailsError('Project details must not exceed 60 characters');
      valid = false;
    }

    if (!valid) throw new Error('Invalid input, please check input values');
    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('You are not authorized to create a project');

      e.preventDefault();
      validateInput();
      setLoading(true);

      const selectedUserEmails = selectedUsers.filter((user) => user.value).map((user) => user.value) || [];

      await apiClient.makeRequest<IProjectResponse, ICreateProject>(
        '/projects',
        {
          method: 'post',
          data: {
            customerId: selectedCustomer!.value!,
            name: projectName,
            details: projectDetails,
            status: selectedStatus!.value as ProjectStatus,
            userEmails: selectedUserEmails as string[],
          },
        },
        true,
      );

      setAlert(
        <Alert
          type="success"
          dismissible
          onDismiss={() => setAlert(null)}
          action={<RoutingButton href="/projects">View Projects</RoutingButton>}
        >
          {projectName} created successfully
        </Alert>,
      );

      resetForm();
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await apiClient.makeRequest<ICustomerResponse[]>('/customers', { method: 'get' }, true);
      setCustomers(response.data);
      if (response.data.length === 0)
        setAlert(
          <Alert
            type="warning"
            dismissible
            onDismiss={() => setAlert(null)}
            action={<RoutingButton href="/customers/create">Create a Customer</RoutingButton>}
          >
            No customers found. Please create a customer first.
          </Alert>,
        );
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.makeRequest<IUserResponse[]>('/users', { method: 'get' }, true);
      setUsers(response.data);
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchUsers();
  }, [fetchCustomers, fetchUsers]);

  const renderAlert = () => alert;

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderAddProjectForm = () => (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              formAction="none"
              variant="link"
              disabled={loading || !projectName || !selectedCustomer || !selectedStatus}
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loading}
              formAction="submit"
              loadingText="Creating Project"
              disabled={loading || !projectName || !selectedCustomer || !selectedStatus}
            >
              Create Project
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create Project</Header>}
      >
        <SpaceBetween direction="vertical" size="s">
          {error && renderError()}
          {alert && renderAlert()}
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label="Project Name"
              description="Enter the name of the project"
              constraintText={<>Name must be 1 to 50 characters. Character count: {projectName.length}/50</>}
              errorText={projectNameError || projectName.length > 50 ? 'Name must be 50 characters or less' : undefined}
            >
              <Input
                name="projectName"
                value={projectName}
                onChange={({ detail }) => setProjectName(detail.value)}
                type="text"
                inputMode="text"
                placeholder="Project Name"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Customer"
              description="Select Customer"
              constraintText="Must select a customer to create a new project"
              errorText={selectedCustomerError}
              secondaryControl={<Button iconName="refresh" formAction="none" onClick={fetchCustomers} />}
            >
              <Select
                selectedOption={selectedCustomer}
                onChange={({ detail }) => setSelectedCustomer(detail.selectedOption)}
                options={customers.map((customer) => ({ label: customer.name, value: customer.id }))}
                loadingText="Loading..."
                placeholder="Choose a customer"
              />
            </FormField>

            <FormField
              label={
                <span>
                  Add Users <i>- optional</i>{' '}
                </span>
              }
              description="Select Project Users"
              secondaryControl={<Button iconName="refresh" formAction="none" onClick={fetchUsers} />}
            >
              <Multiselect
                selectedOptions={selectedUsers}
                onChange={({ detail }) => setSelectedUsers(detail.selectedOptions)}
                options={[
                  {
                    label: 'Administrators',
                    options: users
                      .filter((user) => user.userRoles.includes(Roles.ADMIN) && !user.project)
                      .map((user) => ({ label: `${user.firstName} ${user.lastName}`, value: user.email })),
                  },
                  {
                    label: 'Users',
                    options: users
                      .filter((user) => !user.userRoles.includes(Roles.ADMIN) && !user.project)
                      .map((user) => ({ label: `${user.firstName} ${user.lastName}`, value: user.email })),
                  },
                ]}
                keepOpen={true}
                filteringType="auto"
                loadingText="Loading..."
                placeholder="Choose users"
                empty="No available users"
                tokenLimit={4}
              />
            </FormField>

            <FormField
              label="Project Status"
              description="Select Project Status"
              constraintText="Must select a status to create a new project"
              errorText={selectedStatusError}
            >
              <Select
                selectedOption={selectedStatus}
                onChange={({ detail }) => setSelectedStatus(detail.selectedOption)}
                options={Object.values(ProjectStatus).map((value) => ({
                  label: parseStatus(value),
                  value,
                }))}
                loadingText="Loading..."
                placeholder="Choose a project status"
              />
            </FormField>

            <FormField
              label={
                <span>
                  Project Details <i>- optional</i>{' '}
                </span>
              }
              description="Enter project details"
              constraintText={<>Max 60 characters. Character count: {projectDetails.length}/60</>}
              errorText={
                projectDetailsError || projectDetails.length > 60 ? 'Details must be 60 characters or less' : undefined
              }
            >
              <Textarea
                name="customerDetails"
                value={projectDetails}
                placeholder="Customer details (optional)"
                onChange={({ detail }) => setProjectDetails(detail.value)}
                disabled={loading}
              />
            </FormField>
          </SpaceBetween>
        </SpaceBetween>
      </Form>
    </form>
  );

  return renderAddProjectForm();
};

export default AddProjectPage;

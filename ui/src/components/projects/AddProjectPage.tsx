import {
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
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/AuthContext';
import { buildError } from '../../helpers/buildError';
import { parseStatus } from '../../helpers/helpers';
import { Roles } from '../../models/Roles';
import { RoutingButton } from '../../routing/RoutingButton';
import { isUserAuthorized } from '../auth/helpers/helpers';
import type { ICustomerResponse } from '../customers/models/ICustomerResponse';
import { ErrorBox } from '../global/ErrorBox';
import type { IUserResponse } from '../users/models/IUserResponse';
import type { ICreateProject } from './models/ICreateProject';
import type { IProjectResponse } from './models/IProjectResponse';
import { ProjectStatus } from './models/ProjectStatus';

const AddProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<ICustomerResponse[]>([]);
  const [users, setUsers] = useState<IUserResponse[]>([]);

  const [projectName, setProjectName] = useState<string>('');
  const [projectDetails, setProjectDetails] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<SelectProps.Option | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SelectProps.Option | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<MultiselectProps.Options>([]);

  const handleSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setLoading(true);

      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('You are not authorized to create a project');
      if (!projectName || !selectedCustomer?.value || !selectedStatus?.value)
        throw new Error('A project name and associated customer is required');

      const selectedUserEmails = selectedUsers.filter((user) => user.value).map((user) => user.value) || [];

      await apiClient.makeRequest<IProjectResponse, ICreateProject>(
        '/projects',
        {
          method: 'post',
          data: {
            customerId: selectedCustomer.value,
            name: projectName,
            details: projectDetails,
            status: selectedStatus.value as ProjectStatus,
            userEmails: selectedUserEmails as string[],
          },
        },
        true,
      );

      navigate('/projects');
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

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderAddProjectForm = () => (
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
              loadingText="Creating Project"
              disabled={!projectName} // TO DO - validation
            >
              Create Project
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create Project</Header>}
      >
        <SpaceBetween direction="vertical" size="s">
          {error && renderError()}
          <SpaceBetween direction="vertical" size="l">
            <FormField label="Project Name" description="Enter the name of the project">
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
              label="Add Users"
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
                keepOpen={false}
                filteringType="auto"
                loadingText="Loading..."
                placeholder="Choose users"
                empty="No available users"
                tokenLimit={4}
              />
            </FormField>

            <FormField label="Project Status" description="Select Project Status">
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

            <FormField label="Project Details" description="Enter project details">
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

  return <>{error ? renderError() : renderAddProjectForm()}</>;
};

export default AddProjectPage;

import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Badge,
  Button,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  TextFilter,
} from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/AuthContext';
import { useSplitPanel } from '../../context/split-panel/SplitPanelContext';
import { buildError } from '../../helpers/buildError';
import { buildAuthorizedOptions, getMatchesCountText, parseStatus } from '../../helpers/helpers';
import {
  getCollectionPreferencesProps,
  getContentDisplayPreferences,
  paginationLabels,
} from '../../helpers/tablePreferences';
import { Roles } from '../../models/Roles';
import { isUserAuthorized } from '../auth/helpers/helpers';
import EmptyState from '../global/EmptyState';
import { ErrorBox } from '../global/ErrorBox';
import type { IProjectResponse } from '../projects/models/IProjectResponse';
import SplitPanelContent from '../split-panel/SplitPanelContent';
import type { IUserResponse } from './models/IUserResponse';

const ViewUsersPage = () => {
  const { user } = useAuth();
  const { updateHeader, updateContent, openSplitPanel, closeSplitPanel, open } = useSplitPanel();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const [data, setData] = useState<IUserResponse[]>([]);

  const contentDisplay = [
    { id: 'name', visible: true, admin: false },
    { id: 'email', visible: true, admin: false },
    { id: 'active', visible: true, admin: false },
    { id: 'admin', visible: true, admin: false },
    { id: 'project', visible: true, admin: false },
    { id: 'delete', visible: true, admin: true },
  ];
  const authorizedContentDisplay = buildAuthorizedOptions(contentDisplay, user);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 10,
    contentDisplay: authorizedContentDisplay,
    wrapLines: false,
    stripedRows: false,
    contentDensity: 'comfortable',
    stickyColumns: { first: 0, last: 1 },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.makeRequest<IUserResponse[]>('/users', { method: 'get' }, true);
        setData(response.data);
      } catch (error) {
        setError(buildError(error));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: IUserResponse) => <h4>{`${item.firstName} ${item.lastName}`}</h4>,
      sortingField: 'name',
      admin: false,
    },
    {
      id: 'email',
      header: 'Email',
      cell: (item: IUserResponse) => item.email,
      sortingField: 'email',
      admin: false,
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: (item: IUserResponse) => (
        <Badge color={item.userRoles.includes(Roles.ADMIN) ? 'blue' : 'grey'}>
          {item.userRoles.includes(Roles.ADMIN) ? 'Yes' : 'No'}
        </Badge>
      ),
      sortingField: 'role',
      admin: true,
    },
    {
      id: 'active',
      header: 'Active',
      cell: (item: IUserResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'project',
      header: 'Current Project',
      cell: (item: IUserResponse) => item.project?.name || 'No current project',
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'delete',
      header: '',
      cell: (item: IUserResponse) => (
        <Button
          variant="inline-link"
          disabled={item.email === user?.email}
          disabledReason="You can only remove your own account through the profile menu"
          iconName="remove"
          iconAlign="left"
          onClick={() => handleDeleteUser(item.email)}
        />
      ),
      admin: true,
    },
  ];

  const authorizedColumnDefinitions = buildAuthorizedOptions(columnDefinitions, user);
  const contentDisplayPreferences = getContentDisplayPreferences(authorizedColumnDefinitions);
  const collectionPreferencesProps = getCollectionPreferencesProps(contentDisplayPreferences);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(data, {
    filtering: {
      empty: <EmptyState title="No users" />,
    },
    pagination: { pageSize: preferences.pageSize },
    selection: { keepSelection: true, trackBy: 'email' },
    sorting: {
      defaultState: {
        sortingColumn: columnDefinitions[0], // Default - Sort by user name
      },
    },
  });

  const { selectedItems } = collectionProps;

  const handleSelectionChange = (event: { detail: { selectedItems: IUserResponse[] } }) => {
    const { selectedItems } = event.detail;

    if (selectedItems.length === 1) {
      const selectedUser = selectedItems[0];
      const userName = `${selectedUser.firstName} ${selectedUser.lastName}`;
      const userProject: IProjectResponse | undefined = selectedUser.project;

      const keyValueItems = [
        {
          label: 'First Name',
          value: selectedUser.firstName,
        },
        {
          label: 'Last Name',
          value: selectedUser.lastName,
        },
        {
          label: 'E-mail',
          value: selectedUser.email,
          info: (
            <Badge color={selectedUser.active ? 'green' : 'red'}>{selectedUser.active ? 'Active' : 'Inactive'}</Badge>
          ),
        },
        ...(userProject
          ? [
              {
                label: 'Project Name',
                value: userProject.name,
              },
              {
                label: 'Project Status',
                value: parseStatus(userProject.status),
              },
              {
                label: 'Project Details',
                value: userProject.details || 'No details available',
              },
            ]
          : []),
        ...(userProject?.customer
          ? [
              {
                label: 'Customer',
                value: userProject.customer.name,
              },
              {
                label: 'Customer Details',
                value: userProject.customer.details || 'No details available',
              },
            ]
          : []),
      ];

      if (userProject) updateHeader(userName);
      updateContent(
        <SpaceBetween size="s">
          <SplitPanelContent<IUserResponse> keyValueItems={keyValueItems} contentType="users" />
        </SpaceBetween>,
      );
      openSplitPanel();
    } else {
      closeSplitPanel();
    }

    if (collectionProps.onSelectionChange) {
      collectionProps.onSelectionChange(event);
    }
  };

  useEffect(() => {
    if (!open && selectedItems?.length && collectionProps.onSelectionChange) {
      collectionProps.onSelectionChange({ detail: { selectedItems: [] } });
    }
  }, [collectionProps, open, selectedItems?.length]);

  const handleDeleteUser = async (userEmail: string) => {
    try {
      setLoading(true);
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      if (user?.email === userEmail) throw new Error('You cannot delete your own account');
      await apiClient.makeRequest(`/auth/user?email=${encodeURIComponent(userEmail)}`, { method: 'delete' }, true);
      setData(data.filter((item) => item.email !== userEmail));
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderUsersTable = () => (
    <Table
      {...collectionProps}
      onSelectionChange={handleSelectionChange}
      enableKeyboardNavigation={true}
      items={items}
      columnDefinitions={authorizedColumnDefinitions}
      columnDisplay={preferences.contentDisplay}
      stickyHeader={true}
      resizableColumns={true}
      selectionType="single"
      header={
        <Header variant="h1" counter={`(${data.length})`}>
          Users
        </Header>
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Filter customers"
          countText={getMatchesCountText(filteredItemsCount)}
          filteringAriaLabel={'Filter customers'}
        />
      }
      preferences={
        <CollectionPreferences
          {...collectionPreferencesProps}
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
        />
      }
      variant="embedded"
      wrapLines={preferences.wrapLines}
      stripedRows={preferences.stripedRows}
      contentDensity={preferences.contentDensity}
      stickyColumns={preferences.stickyColumns}
      loading={loading}
      loadingText="Loading users..."
    />
  );

  return <>{error ? renderError() : renderUsersTable()}</>;
};

export default ViewUsersPage;

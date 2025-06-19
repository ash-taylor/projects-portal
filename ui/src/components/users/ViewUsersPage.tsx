import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Alert,
  Badge,
  Button,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Input,
  Pagination,
  Select,
  type SelectProps,
  SpaceBetween,
  Table,
  type TableProps,
  TextFilter,
} from '@cloudscape-design/components';
import { type ReactNode, useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
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
import ConfirmModal from '../global/ConfirmModal';
import EmptyState from '../global/EmptyState';
import { ErrorBox } from '../global/ErrorBox';
import type { IProjectResponse } from '../projects/models/IProjectResponse';
import SplitPanelContent from '../split-panel/SplitPanelContent';
import type { IUserResponse } from './models/IUserResponse';
import type { IUserUpdate } from './models/IUserUpdate';

const ViewUsersPage = () => {
  const { user } = useAuth();
  const { updateHeader, updateContent, openSplitPanel, closeSplitPanel, open } = useSplitPanel();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error>();
  const [alert, setAlert] = useState<ReactNode>(null);

  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalItemId, setModalItemId] = useState<string>('');

  const [data, setData] = useState<IUserResponse[]>([]);
  const [projectsData, setProjectsData] = useState<IProjectResponse[]>([]);

  const updateModalVisible = (visible: boolean) => setModalVisible(visible);

  const contentDisplay = [
    { id: 'firstName', visible: true, admin: false },
    { id: 'lastName', visible: true, admin: false },
    { id: 'email', visible: true, admin: false },
    { id: 'project', visible: true, admin: false },
    { id: 'active', visible: true, admin: false },
    { id: 'admin', visible: true, admin: false },
    { id: 'actions', visible: true, admin: true },
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
    async function fetchUserData() {
      try {
        setLoading(true);
        const response = await apiClient.makeRequest<IUserResponse[]>('/users', { method: 'get' }, true);
        setData(response.data);
      } catch (error) {
        setError(buildError(error));
      } finally {
        setLoading(false);
      }
    }

    async function fetchProjectsData() {
      try {
        setLoading(true);
        const response = await apiClient.makeRequest<IProjectResponse[]>('/projects', { method: 'get' }, true);
        setProjectsData(response.data);
      } catch (error) {
        setError(buildError(error));
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    fetchProjectsData();
  }, []);

  const columnDefinitions: (TableProps.ColumnDefinition<IUserResponse> & { admin: boolean })[] = [
    {
      id: 'firstName',
      header: 'First Name',
      cell: (item: IUserResponse) => <strong>{item.firstName}</strong>,
      sortingField: 'name',
      admin: false,
      editConfig: {
        editingCell: (item: IUserResponse, { currentValue, setValue }) => (
          <Input autoFocus value={currentValue ?? item.details} onChange={({ detail }) => setValue(detail.value)} />
        ),
      },
    },
    {
      id: 'lastName',
      header: 'Last Name',
      cell: (item: IUserResponse) => <strong>{item.lastName}</strong>,
      sortingField: 'name',
      admin: false,
      editConfig: {
        editingCell: (item: IUserResponse, { currentValue, setValue }) => (
          <Input autoFocus value={currentValue ?? item.details} onChange={({ detail }) => setValue(detail.value)} />
        ),
      },
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
      maxWidth: 100,
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
      maxWidth: 100,
      cell: (item: IUserResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'project',
      header: 'Current Project',
      minWidth: 200,
      cell: (item: IUserResponse) => item.project?.name || 'No current project',
      sortingField: 'active',
      admin: false,
      editConfig: {
        editingCell: (item: IUserResponse, { currentValue, setValue }) => {
          const options: SelectProps.Option[] = [
            ...projectsData.map((project) => ({
              label: project.name,
              value: project.id,
              iconName: undefined,
            })),
            ...(item.project
              ? [{ label: 'Unassign project', value: 'null', iconName: 'remove' } as SelectProps.Option]
              : []),
          ];

          return (
            <Select
              autoFocus
              expandToViewport
              options={options}
              onChange={({ detail }) => setValue(detail.selectedOption.value)}
              selectedOption={options.find((option) => option.value === (currentValue ?? item.active)) ?? null}
              placeholder="Select a project"
            />
          );
        },
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: IUserResponse) => (
        <Button
          variant="inline-link"
          disabled={item.email === user?.email}
          disabledReason="You can only remove your own account through the profile menu"
          iconName="remove"
          iconAlign="left"
          onClick={() => handleDeleteRequest(item.email, `${item.firstName} ${item.lastName}`)}
        >
          Delete
        </Button>
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

    if (selectedItems.length !== 1 || !selectedItems[0]) return closeSplitPanel();

    const selectedUser = selectedItems[0];
    const userName = `${selectedUser.firstName} ${selectedUser.lastName}`;
    const userProject: IProjectResponse | undefined = selectedUser.project;

    updateHeader(userName);
    updateContent(
      <SpaceBetween size="s" key={`user-${selectedItems[0].email}-${Date.now()}`}>
        <SplitPanelContent<IUserResponse>
          contentType="users"
          keyValueItems={[
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
                <Badge color={selectedUser.active ? 'green' : 'red'}>
                  {selectedUser.active ? 'Active' : 'Inactive'}
                </Badge>
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
          ]}
        />
      </SpaceBetween>,
    );
    openSplitPanel();

    if (collectionProps.onSelectionChange) {
      collectionProps.onSelectionChange(event);
    }
  };

  useEffect(() => {
    if (!open && selectedItems?.length && collectionProps.onSelectionChange) {
      collectionProps.onSelectionChange({ detail: { selectedItems: [] } });
    }
  }, [collectionProps, open, selectedItems?.length]);

  const handleDeleteRequest = (userEmail: string, userName: string) => {
    setModalTitle(`Are you sure you want to delete "${userName}"?`);
    setModalContent(
      <p>
        <strong>This action cannot be undone.</strong>
      </p>,
    );
    setModalItemId(userEmail);
    setModalVisible(true);
  };

  const handleDeleteUser = async (userEmail: string) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      if (user?.email === userEmail) throw new Error('You cannot delete your own account');

      setLoading(true);

      await apiClient.makeRequest(`/auth/user?email=${encodeURIComponent(userEmail)}`, { method: 'delete' }, true);
      setData(data.filter((item) => item.email !== userEmail));
      setAlert(
        <Alert type="success" dismissible onDismiss={() => setAlert(null)}>
          User deleted successfully
        </Alert>,
      );
      closeSplitPanel();
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (
    currentItem: IUserResponse,
    column: TableProps.ColumnDefinition<IUserResponse>,
    value: unknown,
  ) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      if (!column.id) throw new Error('Column ID is undefined');

      closeSplitPanel();
      setSubmitting(true);

      const response = await apiClient.makeRequest<IUserResponse, IUserUpdate>(
        `auth/user/${currentItem.email}`,
        {
          method: 'patch',
          data: {
            [column.id]: value === 'null' ? null : value,
          },
        },
        true,
      );

      const newItem = response.data;
      const fullCollection = data;

      setData(fullCollection.map((item) => (item.email === currentItem.email ? newItem : item)));
      setAlert(
        <Alert type="success" dismissible={true} onDismiss={() => setAlert(null)}>
          User updated successfully
        </Alert>,
      );
    } catch (error) {
      setError(buildError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const renderAlert = () => alert;

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderUsersTable = () => (
    <Table
      {...collectionProps}
      submitEdit={handleEditSubmit}
      onSelectionChange={handleSelectionChange}
      enableKeyboardNavigation
      items={items}
      columnDefinitions={authorizedColumnDefinitions}
      columnDisplay={preferences.contentDisplay}
      stickyHeader
      selectionType="single"
      header={
        <Header variant="h1" counter={`(${data.length})`}>
          Users
        </Header>
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} disabled={loading || submitting} />}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Filter users"
          countText={getMatchesCountText(filteredItemsCount)}
          filteringAriaLabel={'Filter users'}
          disabled={loading || submitting}
        />
      }
      preferences={
        <CollectionPreferences
          {...collectionPreferencesProps}
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
          disabled={loading || submitting}
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

  return (
    <>
      {error && renderError()}
      {alert && renderAlert()}
      <ConfirmModal
        title={modalTitle}
        visible={modalVisible}
        itemId={modalItemId}
        updateVisible={updateModalVisible}
        modalAction={handleDeleteUser}
      >
        {modalContent}
      </ConfirmModal>
      {renderUsersTable()}
    </>
  );
};

export default ViewUsersPage;

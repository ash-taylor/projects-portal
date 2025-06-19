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
import type { IUpdateCustomer } from '../customers/models/IUpdateCustomer';
import ConfirmModal from '../global/ConfirmModal';
import EmptyState from '../global/EmptyState';
import { ErrorBox } from '../global/ErrorBox';
import SplitPanelContent from '../split-panel/SplitPanelContent';
import type { IUserResponse } from '../users/models/IUserResponse';
import type { IProjectResponse } from './models/IProjectResponse';
import { ProjectStatus } from './models/ProjectStatus';

const ViewProjectsPage = () => {
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

  const [data, setData] = useState<IProjectResponse[]>([]);

  const updateModalVisible = (visible: boolean) => setModalVisible(visible);

  const contentDisplay = [
    { id: 'name', visible: true, admin: false },
    { id: 'details', visible: true, admin: false },
    { id: 'active', visible: true, admin: false },
    { id: 'status', visible: true, admin: false },
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
    async function fetchData() {
      try {
        const response = await apiClient.makeRequest<IProjectResponse[]>('/projects', { method: 'get' }, true);
        setData(response.data);
      } catch (error) {
        setError(buildError(error));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const columnDefinitions: (TableProps.ColumnDefinition<IProjectResponse> & { admin: boolean })[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: IProjectResponse) => <strong>{item.name}</strong>,
      sortingField: 'name',
      admin: false,
      editConfig: {
        editingCell: (item: IProjectResponse, { currentValue, setValue }) => (
          <Input autoFocus value={currentValue ?? item.name} onChange={({ detail }) => setValue(detail.value)} />
        ),
      },
    },
    {
      id: 'details',
      header: 'Details',
      cell: (item: IProjectResponse) => item.details,
      sortingField: 'details',
      admin: false,
      editConfig: {
        editingCell: (item: IProjectResponse, { currentValue, setValue }) => (
          <Input autoFocus value={currentValue ?? item.details} onChange={({ detail }) => setValue(detail.value)} />
        ),
      },
    },
    {
      id: 'active',
      header: 'Active',
      cell: (item: IProjectResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
      editConfig: {
        editingCell: (item: IProjectResponse, { currentValue, setValue }) => {
          const options = [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ];
          return (
            <Select
              autoFocus
              expandToViewport
              options={options}
              onChange={({ detail }) => setValue(detail.selectedOption.value)}
              selectedOption={options.find((option) => option.value === (currentValue ?? item.active)) ?? null}
              placeholder="Is project active?"
            />
          );
        },
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: IProjectResponse) => parseStatus(item.status),
      sortingField: 'active',
      admin: false,
      editConfig: {
        editingCell: (item: IProjectResponse, { currentValue, setValue }) => {
          const options = Object.values(ProjectStatus).map((value) => ({
            label: parseStatus(value),
            value,
          }));

          return (
            <Select
              autoFocus
              expandToViewport
              options={options}
              onChange={({ detail }) => setValue(detail.selectedOption.value)}
              selectedOption={options.find((option) => option.value === (currentValue ?? item.active)) ?? null}
              placeholder="Select project status"
            />
          );
        },
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: IProjectResponse) => (
        <Button
          variant="inline-link"
          iconName="remove"
          iconAlign="left"
          onClick={() => handleDeleteRequest(item.id, item.name)}
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
      empty: <EmptyState title="No projects" />,
    },
    pagination: { pageSize: preferences.pageSize },
    selection: { keepSelection: true, trackBy: 'id' },
    sorting: {
      defaultState: {
        sortingColumn: columnDefinitions[0], // Default - Sort by project name
      },
    },
  });

  const { selectedItems } = collectionProps;

  const handleSelectionChange = (event: { detail: { selectedItems: IProjectResponse[] } }) => {
    const { selectedItems } = event.detail;

    if (selectedItems.length !== 1 || !selectedItems[0] || !Array.isArray(selectedItems[0].users))
      return closeSplitPanel();

    updateHeader(selectedItems[0].name);
    updateContent(
      <SpaceBetween size="s" key={`project-${selectedItems[0].id}-${Date.now()}`}>
        <SplitPanelContent<IUserResponse>
          embeddedTable
          contentType="users"
          keyValueItems={[
            {
              label: 'Name',
              value: selectedItems[0].name,
              info: (
                <Badge color={selectedItems[0].active ? 'green' : 'red'}>
                  {selectedItems[0].active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              label: 'Details',
              value: selectedItems[0].details || 'No details available',
            },
            {
              label: 'Customer',
              value: selectedItems[0].customer?.name || '',
            },
            {
              label: 'Status',
              value: parseStatus(selectedItems[0].status),
            },
          ]}
          tableItems={selectedItems[0].users}
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

  const handleDeleteRequest = (userId: string, userName: string) => {
    setModalTitle(`Are you sure you want to delete Project "${userName}"?`);
    setModalContent(
      <p>
        <strong>This action cannot be undone.</strong>
      </p>,
    );
    setModalItemId(userId);
    setModalVisible(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      setLoading(true);

      await apiClient.makeRequest(`/projects/${projectId}`, { method: 'delete' }, true);
      setData(data.filter((item) => item.id !== projectId));
      setAlert(
        <Alert type="success" dismissible onDismiss={() => setAlert(null)}>
          Project deleted successfully
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
    currentItem: IProjectResponse,
    column: TableProps.ColumnDefinition<IProjectResponse>,
    value: unknown,
  ) => {
    try {
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      if (!column.id) throw new Error('Column ID is undefined');

      closeSplitPanel();
      setSubmitting(true);

      const response = await apiClient.makeRequest<IProjectResponse, IUpdateCustomer>(
        `projects/${currentItem.id}`,
        {
          method: 'patch',
          data: {
            [column.id]: value === 'true' ? true : value === 'false' ? false : value,
          },
        },
        true,
      );

      const newItem = response.data;
      const fullCollection = data;

      setData(fullCollection.map((item) => (item.id === currentItem.id ? newItem : item)));
      setAlert(
        <Alert type="success" dismissible={true} onDismiss={() => setAlert(null)}>
          Project updated successfully
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

  const renderProjectsTable = () => (
    <Table
      {...collectionProps}
      submitEdit={handleEditSubmit}
      onSelectionChange={handleSelectionChange}
      enableKeyboardNavigation
      items={items}
      columnDefinitions={authorizedColumnDefinitions}
      columnDisplay={preferences.contentDisplay}
      stickyHeader
      resizableColumns
      selectionType="single"
      header={
        <Header variant="h1" counter={`(${data.length})`}>
          Projects
        </Header>
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} disabled={loading || submitting} />}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Filter projects"
          countText={getMatchesCountText(filteredItemsCount)}
          filteringAriaLabel={'Filter projects'}
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
      loadingText="Loading projects..."
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
        modalAction={handleDeleteProject}
      >
        {modalContent}
      </ConfirmModal>
      {renderProjectsTable()}
    </>
  );
};

export default ViewProjectsPage;

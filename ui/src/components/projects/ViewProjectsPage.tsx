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
import SplitPanelContent from '../split-panel/SplitPanelContent';
import type { IUserResponse } from '../users/models/IUserResponse';
import type { IProjectResponse } from './models/IProjectResponse';

const ViewProjectsPage = () => {
  const { user } = useAuth();
  const { updateHeader, updateContent, openSplitPanel, closeSplitPanel, open } = useSplitPanel();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const [data, setData] = useState<IProjectResponse[]>([]);

  const contentDisplay = [
    { id: 'name', visible: true, admin: false },
    { id: 'details', visible: true, admin: false },
    { id: 'active', visible: true, admin: false },
    { id: 'status', visible: true, admin: false },
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

  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: IProjectResponse) => <h4>{item.name}</h4>,
      sortingField: 'name',
      admin: false,
    },
    {
      id: 'details',
      header: 'Details',
      cell: (item: IProjectResponse) => item.details,
      sortingField: 'details',
      admin: false,
    },
    {
      id: 'active',
      header: 'Active',
      cell: (item: IProjectResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: IProjectResponse) => parseStatus(item.status),
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'delete',
      header: '',
      cell: (item: IProjectResponse) => (
        <Button variant="inline-link" iconName="remove" iconAlign="left" onClick={() => handleDeleteProject(item.id)} />
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
        sortingColumn: columnDefinitions[0], // Default - Sort by customer name
      },
    },
  });

  const { selectedItems } = collectionProps;

  const handleSelectionChange = (event: { detail: { selectedItems: IProjectResponse[] } }) => {
    const { selectedItems } = event.detail;

    if (selectedItems.length === 1) {
      const selectedProject = selectedItems[0];
      updateHeader(selectedProject.name);
      updateContent(
        <SpaceBetween size="s">
          <SplitPanelContent<IUserResponse>
            keyValueItems={[
              {
                label: 'Name',
                value: selectedProject.name,
                info: (
                  <Badge color={selectedProject.active ? 'green' : 'red'}>
                    {selectedProject.active ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                label: 'Details',
                value: selectedProject.details || 'No details available',
              },
              {
                label: 'Customer',
                value: selectedProject.customer?.name || '',
              },
              {
                label: 'Status',
                value: parseStatus(selectedProject.status),
              },
            ]}
            contentType="users"
            tableItems={selectedProject.users || []}
          />
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

  const handleDeleteProject = async (projectId: string) => {
    try {
      setLoading(true);
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      await apiClient.makeRequest(`/projects/${projectId}`, { method: 'delete' }, true);
      setData(data.filter((item) => item.id !== projectId));
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderProjectsTable = () => (
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
          Projects
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
      loadingText="Loading projects..."
    />
  );

  return <>{error ? renderError() : renderProjectsTable()}</>;
};

export default ViewProjectsPage;

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
import { buildAuthorizedOptions, getMatchesCountText } from '../../helpers/helpers';
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
import type { ICustomerResponse } from './models/ICustomerResponse';

const ViewCustomersPage = () => {
  const { user } = useAuth();
  const { updateHeader, updateContent, openSplitPanel, closeSplitPanel, open } = useSplitPanel();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const [data, setData] = useState<ICustomerResponse[]>([]);

  const contentDisplay = [
    { id: 'name', visible: true, admin: false },
    { id: 'details', visible: true, admin: false },
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
        const response = await apiClient.makeRequest<ICustomerResponse[]>('/customers', { method: 'get' }, true);
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
      cell: (item: ICustomerResponse) => <h4>{item.name}</h4>,
      sortingField: 'name',
      admin: false,
    },
    {
      id: 'details',
      header: 'Details',
      cell: (item: ICustomerResponse) => item.details,
      sortingField: 'details',
      admin: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: ICustomerResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
    },
    {
      id: 'delete',
      header: '',
      cell: (item: ICustomerResponse) => (
        <Button
          variant="inline-link"
          iconName="remove"
          iconAlign="left"
          onClick={() => handleDeleteCustomer(item.id)}
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
      empty: <EmptyState title="No customers" />,
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

  const handleSelectionChange = (event: { detail: { selectedItems: ICustomerResponse[] } }) => {
    const { selectedItems } = event.detail;

    if (selectedItems.length === 1) {
      const selectedCustomer = selectedItems[0];
      updateHeader(selectedCustomer.name);
      updateContent(
        <SpaceBetween size="s">
          <SplitPanelContent<IProjectResponse>
            contentType="projects"
            keyValueItems={[
              {
                label: 'Name',
                value: selectedCustomer.name,
                info: (
                  <Badge color={selectedCustomer.active ? 'green' : 'red'}>
                    {selectedCustomer.active ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                label: 'Details',
                value: selectedCustomer.details || 'No details available',
              },
            ]}
            tableItems={selectedCustomer.projects}
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

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      if (!isUserAuthorized(user, [Roles.ADMIN])) throw new Error('Unauthorized');
      await apiClient.makeRequest(`/customers/${customerId}`, { method: 'delete' }, true);
      setData(data.filter((item) => item.id !== customerId));
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  const renderCustomersTable = () => (
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
          Customers
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
      loadingText="Loading customers..."
    />
  );

  return <>{error ? renderError() : renderCustomersTable()}</>;
};

export default ViewCustomersPage;

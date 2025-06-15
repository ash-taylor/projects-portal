import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Badge,
  Button,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Pagination,
  Table,
  TextFilter,
} from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { useAuth } from '../../context/auth/authContext';
import {
  getCollectionPreferencesProps,
  getContentDisplayPreferences,
  paginationLabels,
} from '../../helpers/default-table-preferences';
import { buildAuthorizedOptions, getMatchesCountText } from '../../helpers/helpers';
import { Roles } from '../../models/Roles';
import { isUserAuthorized } from '../auth/helpers/helpers';
import EmptyState from '../global/EmptyState';
import { ErrorBox } from '../global/ErrorBox';
import type { ICustomerResponse } from './models/customer-response.interface';

const ViewCustomersPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const [data, setData] = useState<ICustomerResponse[]>([]);

  const contentDisplay = [
    { id: 'delete', visible: true, admin: true },
    { id: 'name', visible: true, admin: false },
    { id: 'details', visible: true, admin: false },
    { id: 'status', visible: true, admin: false },
  ];
  const authorizedContentDisplay = buildAuthorizedOptions(contentDisplay, user);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 10,
    contentDisplay: authorizedContentDisplay,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.makeRequest<ICustomerResponse[]>('/customers', { method: 'get' }, true);
        setData(response.data);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const columnDefinitions = [
    {
      id: 'delete',
      header: 'Delete Customer',
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
    {
      id: 'name',
      header: 'Customer Name',
      cell: (item: ICustomerResponse) => <h4>{item.name}</h4>,
      sortingField: 'name',
      admin: false,
    },
    {
      id: 'details',
      header: 'Customer Details',
      cell: (item: ICustomerResponse) => item.details,
      sortingField: 'details',
      admin: false,
    },
    {
      id: 'status',
      header: 'Customer Status',
      cell: (item: ICustomerResponse) => (
        <Badge color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ),
      sortingField: 'active',
      admin: false,
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
        sortingColumn: columnDefinitions[1], // Default - Sort by customer name
      },
    },
  });

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
      selectionType="single"
      header={
        <Header variant="h1" counter={`(${data.length})`}>
          Customers
        </Header>
      }
      columnDefinitions={authorizedColumnDefinitions}
      columnDisplay={preferences.contentDisplay}
      items={items}
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
      wrapLines
      loading={loading}
    />
  );

  return <>{error ? renderError() : renderCustomersTable()}</>;
};

export default ViewCustomersPage;

import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Box,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  type TableProps,
  TextFilter,
} from '@cloudscape-design/components';
import { useState } from 'react';
import { getMatchesCountText, parseStatus } from '../../helpers/helpers';
import {
  getCollectionPreferencesProps,
  getContentDisplayPreferences,
  paginationLabels,
} from '../../helpers/tablePreferences';
import EmptyState from '../global/EmptyState';

export interface SplitPanelTableProps<T> {
  header: string;
  data: T[];
  contentType: 'projects' | 'customers' | 'users';
}

function SplitPanelTable<T extends { [key: string]: string | number | boolean | object | undefined }>({
  header,
  data,
  contentType,
}: SplitPanelTableProps<T>) {
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 10,
    contentDisplay: Object.keys(data[0]).map((key) => ({
      id: key.toLowerCase(),
      visible: true,
      admin: false,
    })),
    wrapLines: false,
    stripedRows: false,
    contentDensity: 'comfortable',
    stickyColumns: { first: 0, last: 1 },
  });

  const columnDefinitions: TableProps.ColumnDefinition<T>[] = data.length
    ? Object.entries(data[0])
        .filter(([key, val]) => {
          if (key === 'id' || typeof val === 'object') return false;
          return true;
        })
        .map(([key]): TableProps.ColumnDefinition<T> => {
          return {
            id: key.toLowerCase(),
            header: key[0].toUpperCase() + key.slice(1),
            cell: (item: T) => {
              if (typeof item[key] === 'boolean') {
                return item[key] ? 'Yes' : 'No';
              }
              if (key === 'status') {
                return parseStatus(item[key] as string);
              }
              return key === 'name' ? (
                <b>{item[key] && (item[key] as string)}</b>
              ) : (
                item[key] && (item[key].toString() as string)
              );
            },
          };
        })
    : [];

  const contentDisplayPreferences = getContentDisplayPreferences(columnDefinitions);
  const collectionPreferencesProps = getCollectionPreferencesProps(contentDisplayPreferences);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(data, {
    filtering: {
      empty: <EmptyState title={`No ${contentType}`} />,
    },
    pagination: { pageSize: preferences.pageSize },
    sorting: {
      defaultState: {
        sortingColumn: columnDefinitions[0], // Default - Sort by first column
      },
    },
  });

  return (
    <Table
      {...collectionProps}
      header={<Header>{header}</Header>}
      variant="borderless"
      contentDensity="compact"
      items={items}
      columnDefinitions={columnDefinitions}
      columnDisplay={preferences.contentDisplay}
      stickyHeader={true}
      resizableColumns={true}
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder={`Filter ${contentType}`}
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
      empty={
        <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
          <SpaceBetween size="m">
            <b>No {contentType}</b>
          </SpaceBetween>
        </Box>
      }
    />
  );
}

export default SplitPanelTable;

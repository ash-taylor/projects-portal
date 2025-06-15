import type { CollectionPreferencesProps, TableProps } from '@cloudscape-design/components';

export const paginationLabels = {
  nextPageLabel: 'Next page',
  pageLabel: (pageNumber: number) => `Go to page ${pageNumber}`,
  previousPageLabel: 'Previous page',
};

export const pageSizePreference = {
  title: 'Select page size',
  options: [
    { value: 5, label: '5 alerts' },
    { value: 10, label: '10 alerts' },
    { value: 15, label: '15 alerts' },
    { value: 20, label: '20 alerts' },
  ],
};

export const getContentDisplayPreferences = <T>(
  columnDefinitions: TableProps.ColumnDefinition<T>[],
): CollectionPreferencesProps.ContentDisplayPreference => ({
  title: 'Column preferences',
  description: 'Customize the columns visibility and order.',
  options: columnDefinitions.map(({ id, header }) => ({
    id: id || '',
    label: String(header),
    alwaysVisible: id === 'id',
  })),
});

export const getCollectionPreferencesProps = (
  contentDisplayPreference: CollectionPreferencesProps.ContentDisplayPreference,
): CollectionPreferencesProps => ({
  pageSizePreference,
  contentDisplayPreference,
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
  title: 'Preferences',
});

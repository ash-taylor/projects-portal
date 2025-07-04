import { KeyValuePairs, type KeyValuePairsProps, SpaceBetween } from '@cloudscape-design/components';
import SplitPanelTable from './SplitPanelTable';

export interface SplitPanelContentProps<T> {
  keyValueItems: KeyValuePairsProps.Item[];
  contentType: 'projects' | 'customers' | 'users';
  tableItems?: T[];
  embeddedTable?: boolean;
}

function SplitPanelContent<T extends { [key: string]: string | number | boolean | object | undefined }>({
  keyValueItems,
  contentType,
  tableItems,
  embeddedTable = false,
}: SplitPanelContentProps<T>) {
  return (
    <SpaceBetween size="s">
      <KeyValuePairs columns={keyValueItems.length} items={keyValueItems} />
      {embeddedTable && (
        <SplitPanelTable
          header={`Associated ${contentType[0].toUpperCase() + contentType.slice(1)}`}
          contentType={contentType}
          data={tableItems || []}
        />
      )}
    </SpaceBetween>
  );
}

export default SplitPanelContent;

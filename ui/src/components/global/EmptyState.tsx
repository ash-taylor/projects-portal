import { Box } from '@cloudscape-design/components';
import type { ReactNode } from 'react';

const EmptyState = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <Box textAlign="center" color="inherit">
    <Box variant="strong" textAlign="center" color="inherit">
      {title}
    </Box>
    <Box variant="p" padding={{ bottom: 's' }} color="inherit">
      {subtitle && subtitle}
    </Box>
    {action && action}
  </Box>
);

export default EmptyState;

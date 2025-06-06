import { Box, Container, Spinner } from '@cloudscape-design/components';
import { FullPageCenteredBoxLayout } from './FullPageCentredBoxLayout';

export const LoadingLayout = () => (
  <FullPageCenteredBoxLayout>
    <Container>
      <Box textAlign="center">
        <Spinner size="large" />
        <Box>Loading, please wait...</Box>
      </Box>
    </Container>
  </FullPageCenteredBoxLayout>
);

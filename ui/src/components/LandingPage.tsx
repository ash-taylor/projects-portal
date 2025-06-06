import { Box, Container, ContentLayout, SpaceBetween } from '@cloudscape-design/components';
import { FullPageCenteredBoxLayout } from '../layouts/FullPageCentredBoxLayout';
import { RoutingButton } from '../routing/RoutingButton';

export default function LandingPage() {
  return (
    <FullPageCenteredBoxLayout>
      <ContentLayout
        headerBackgroundStyle={(mode) => `center center/cover url("/hero-header-${mode}.png")`}
        header={
          <Box padding={{ vertical: 'xxxl' }}>
            <Container>
              <Box padding="s">
                <Box fontSize="display-l" fontWeight="bold" variant="h1" padding="n">
                  Projects Portal
                </Box>
                <Box fontSize="display-l" fontWeight="light">
                  Industry solution to project management
                </Box>
                <Box variant="p" color="text-body-secondary" margin={{ top: 'xs', bottom: 'l' }}>
                  Manage your projects and tasks in one place.
                </Box>
                <SpaceBetween direction="horizontal" size="s">
                  <RoutingButton href="/login" variant="primary">
                    Login
                  </RoutingButton>
                  <RoutingButton href="/signup" variant="normal">
                    Sign Up
                  </RoutingButton>
                </SpaceBetween>
              </Box>
            </Container>
          </Box>
        }
      />
    </FullPageCenteredBoxLayout>
  );
}

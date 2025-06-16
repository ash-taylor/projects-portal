import {
  AppLayout,
  type ButtonDropdownProps,
  HelpPanel,
  SideNavigation,
  type SideNavigationProps,
  SpaceBetween,
  SplitPanel,
  TopNavigation,
} from '@cloudscape-design/components';
import I18nProvider from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.all';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { websiteBaseName } from '../api';
import logo from '../assets/projects-portal.svg';
import { ErrorBox } from '../components/global/ErrorBox';
import { useAuth } from '../context/auth/AuthContext';
import { useSplitPanel } from '../context/split-panel/SplitPanelContext';
import { buildAuthorizedOptions } from '../helpers/helpers';
import { LoadingLayout } from './LoadingLayout';

const LOCALE = 'en';

type SideNavigationPropsItem = (
  | SideNavigationProps.ExpandableLinkGroup
  | SideNavigationProps.LinkGroup
  | SideNavigationProps.Link
  | SideNavigationProps.Section
) & {
  admin: boolean;
};

export default function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { user, logout } = useAuth();
  const { header, content, open, openSplitPanel, closeSplitPanel } = useSplitPanel();

  const sideMenuOptions: SideNavigationProps.Item[] = [
    {
      type: 'section-group',
      title: 'Customers',
      items: buildAuthorizedOptions<SideNavigationPropsItem>(
        [
          {
            text: 'Create Customer',
            type: 'link',
            href: '/customers/create',
            admin: true,
          },
          {
            text: 'View Customers',
            type: 'link',
            href: '/customers',
            admin: false,
          },
        ],
        user,
      ),
    },
    { type: 'divider' },
    {
      type: 'section-group',
      title: 'Projects',
      items: buildAuthorizedOptions<SideNavigationPropsItem>(
        [
          {
            text: 'Create Project',
            type: 'link',
            href: '/projects/create',
            admin: true,
          },
          {
            text: 'View Projects',
            type: 'link',
            href: '/projects',
            admin: false,
          },
        ],
        user,
      ),
    },
    { type: 'divider' },
    {
      type: 'section-group',
      title: 'Team',
      items: buildAuthorizedOptions<SideNavigationPropsItem>(
        [
          {
            text: 'View Users',
            type: 'link',
            href: '/users',
            admin: false,
          },
        ],
        user,
      ),
    },
  ];

  const handleLogout = async (e: CustomEvent<ButtonDropdownProps.ItemClickDetails>) => {
    try {
      e.preventDefault();
      setLoading(true);

      await logout();
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  return (
    <I18nProvider locale={LOCALE} messages={[messages]}>
      <div id="h" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{
            href: `${websiteBaseName}`,
            title: 'Projects Portal',
            logo: {
              src: logo,
              alt: 'Projects Portal Logo',
            },
            onFollow: (event) => {
              event.preventDefault();
              if (location.pathname !== websiteBaseName) navigate(websiteBaseName);
            },
          }}
          utilities={[
            {
              type: 'menu-dropdown',
              text: `${user?.firstName} ${user?.lastName}`,
              description: user?.email,
              iconName: 'user-profile',
              items: [
                { id: 'profile', text: 'Profile' },
                { id: 'preferences', text: 'Preferences' },
                { id: 'signout', text: 'Sign out' },
              ],
              onItemClick: (e) => {
                if (e.detail.id === 'signout') {
                  handleLogout(e);
                }
              },
            },
          ]}
        />
      </div>
      <AppLayout
        headerSelector="#h"
        maxContentWidth={10000}
        navigation={
          <SideNavigation
            items={sideMenuOptions}
            onFollow={(event) => {
              if (!event.detail.external) {
                event.preventDefault();
                navigate(event.detail.href);
              }
            }}
          />
        }
        tools={<HelpPanel header={<h2>Overview</h2>}>Help content</HelpPanel>}
        splitPanelOpen={open}
        splitPanel={
          <SplitPanel hidePreferencesButton={true} header={header} closeBehavior="hide">
            {content}
          </SplitPanel>
        }
        onSplitPanelToggle={() => (open ? closeSplitPanel() : openSplitPanel())}
        content={
          <SpaceBetween direction="vertical" size="l">
            {error && renderError()}
            {loading ? <LoadingLayout /> : <Outlet />}
          </SpaceBetween>
        }
      />
    </I18nProvider>
  );
}

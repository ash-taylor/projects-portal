import {
  AppLayout,
  type ButtonDropdownProps,
  HelpPanel,
  SideNavigation,
  SpaceBetween,
  TopNavigation,
} from '@cloudscape-design/components';
import I18nProvider from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.all';
import { Outlet } from 'react-router-dom';

import { useState } from 'react';
import logo from '../assets/projects-portal.svg';
import { useAuth } from '../context/auth/authContext';
import { LoadingLayout } from './LoadingLayout';
import { ErrorBox } from '../components/global/ErrorBox';

const LOCALE = 'en';

export default function AuthenticatedLayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { user, logout } = useAuth();

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
            href: '#',
            title: 'Projects Portal',
            logo: {
              src: logo,
              alt: 'Projects Portal Logo',
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
        navigation={
          <SideNavigation
            header={{
              href: '#',
              text: 'Service name',
            }}
            items={[{ type: 'link', text: 'Page #1', href: '#' }]}
          />
        }
        tools={<HelpPanel header={<h2>Overview</h2>}>Help content</HelpPanel>}
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

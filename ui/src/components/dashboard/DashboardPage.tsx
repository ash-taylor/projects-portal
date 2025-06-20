import { SpaceBetween, Tabs } from '@cloudscape-design/components';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { buildError } from '../../helpers/buildError';
import type { ICustomerResponse } from '../customers/models/ICustomerResponse';
import { ErrorBox } from '../global/ErrorBox';
import type { IProjectResponse } from '../projects/models/IProjectResponse';
import CustomerProjectsChart from './CustomerProjectsChart';
import ProjectResourceChart from './ProjectResourceChart';
import ProjectStatusChart from './ProjectStatusChart';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const [customerData, setCustomerData] = useState<ICustomerResponse[]>([]);
  const [projectData, setProjectData] = useState<IProjectResponse[]>([]);

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest<ICustomerResponse[]>('/customers', { method: 'get' }, true);
      setCustomerData(response.data);
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest<IProjectResponse[]>('/projects', { method: 'get' }, true);
      setProjectData(response.data);
    } catch (error) {
      setError(buildError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerData();
    fetchProjectData();
  }, [fetchCustomerData, fetchProjectData]);

  const renderError = () => error && <ErrorBox error={error} onDismiss={() => setError(undefined)} />;

  return (
    <SpaceBetween size="s">
      {error && renderError()}
      <Tabs
        tabs={[
          {
            label: 'Customer Projects',
            id: 'first',
            content: (
              <CustomerProjectsChart loading={loading} totalProjects={projectData.length} customerData={customerData} />
            ),
          },
          {
            label: 'Project Status',
            id: 'second',
            content: <ProjectStatusChart loading={loading} projectData={projectData} />,
          },
          {
            label: 'Project Resources',
            id: 'third',
            content: <ProjectResourceChart loading={loading} projectData={projectData} />,
          },
        ]}
      />
    </SpaceBetween>
  );
};

export default DashboardPage;

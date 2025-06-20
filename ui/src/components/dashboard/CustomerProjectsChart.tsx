import { Box, Button, PieChart } from '@cloudscape-design/components';
import type { ICustomerResponse } from '../customers/models/ICustomerResponse';

interface CustomerProjectsChartProps {
  loading: boolean;
  totalProjects: number;
  customerData: ICustomerResponse[];
}

const CustomerProjectsChart = ({ loading, totalProjects, customerData }: CustomerProjectsChartProps) => {
  return (
    <PieChart
      loadingText="Loading data..."
      statusType={loading ? 'loading' : 'finished'}
      fitHeight
      data={customerData.map((customer) => {
        const projectCount = customer.projects?.length || 0;
        const projectPercentage = (projectCount / totalProjects) * 100;

        return {
          title: customer.name,
          percentage: projectPercentage,
          value: projectCount,
        };
      })}
      segmentDescription={(datum, sum) =>
        `${datum.value} ${datum.value !== 1 ? 'projects' : 'project'}, ${((datum.value / sum) * 100).toFixed(0)}%`
      }
      ariaDescription="Donut chart showing project percentage per customer."
      ariaLabel="Donut chart"
      innerMetricDescription="total projects"
      innerMetricValue={totalProjects.toString()}
      size="large"
      variant="donut"
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
          <Box variant="p" color="inherit">
            There is no data available.
          </Box>
        </Box>
      }
      noMatch={
        <Box textAlign="center" color="inherit">
          <b>No matching data</b>
          <Box variant="p" color="inherit">
            There is no matching data to display
          </Box>
          <Button>Clear filter</Button>
        </Box>
      }
    />
  );
};

export default CustomerProjectsChart;

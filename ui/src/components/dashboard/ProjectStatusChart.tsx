import { Box, Button, PieChart } from '@cloudscape-design/components';
import { parseStatus } from '../../helpers/helpers';
import type { IProjectResponse } from '../projects/models/IProjectResponse';
import { ProjectStatus } from '../projects/models/ProjectStatus';

interface ProjectStatusChartProps {
  loading: boolean;
  projectData: IProjectResponse[];
}

const ProjectStatusChart = ({ loading, projectData }: ProjectStatusChartProps) => {
  const statuses = Object.values(ProjectStatus);
  const statusCounts = statuses.map((status) => {
    return projectData.filter((project) => project.status === status).length;
  });

  return (
    <PieChart
      loadingText="Loading data..."
      statusType={loading ? 'loading' : 'finished'}
      fitHeight
      data={statuses.map((status, index) => {
        return {
          title: parseStatus(status),
          value: statusCounts[index],
        };
      })}
      segmentDescription={(datum, sum) =>
        `${datum.value} ${datum.value !== 1 ? 'projects' : 'project'}, ${((datum.value / sum) * 100).toFixed(0)}%`
      }
      ariaDescription="Donut chart showing project status breakdown."
      ariaLabel="Donut chart"
      innerMetricDescription="total projects"
      innerMetricValue={projectData.length.toString()}
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

export default ProjectStatusChart;

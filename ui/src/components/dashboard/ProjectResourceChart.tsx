import { BarChart, Box } from '@cloudscape-design/components';
import type { IProjectResponse } from '../projects/models/IProjectResponse';

interface ProjectResourceChartProps {
  loading: boolean;
  projectData: IProjectResponse[];
}

const ProjectResourceChart = ({ loading, projectData }: ProjectResourceChartProps) => {
  const totalAssignedUsers = projectData.reduce((acc, project) => acc + (project.users?.length || 0), 0);

  return (
    <BarChart
      loadingText="Loading data..."
      statusType={loading ? 'loading' : 'finished'}
      hideFilter
      fitHeight
      xTitle="Projects"
      xScaleType="categorical"
      yTitle="Number of team members"
      yScaleType="linear"
      xDomain={projectData.map((project) => project.name)}
      yDomain={[0, totalAssignedUsers + 1]}
      series={[
        {
          title: 'Assigned Users',
          type: 'bar',
          data: projectData.map((project) => ({ x: project.name, y: project.users?.length || 0 })),
        },
        {
          title: 'Average',
          type: 'threshold',
          y: Math.round(totalAssignedUsers / projectData.length),
        },
      ]}
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
          <Box variant="p" color="inherit">
            There is no data available
          </Box>
        </Box>
      }
    />
  );
};

export default ProjectResourceChart;

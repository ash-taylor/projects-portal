import type { ProjectStatus } from './ProjectStatus';

export interface ICreateProject {
  name: string;
  customerId: string;
  status?: ProjectStatus;
  active?: boolean;
  details?: string;
  userEmails: string[];
}

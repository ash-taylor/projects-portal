import type { ICustomerResponse } from '../../customers/models/ICustomerResponse';
import type { IUserResponse } from '../../users/models/IUserResponse';
import type { ProjectStatus } from './ProjectStatus';

export interface IProjectResponse {
  [key: string]: string | boolean | ICustomerResponse | IUserResponse[] | undefined;
  id: string;
  name: string;
  active: boolean;
  status: ProjectStatus;
  details?: string;
  customer?: ICustomerResponse;
  users?: IUserResponse[];
}

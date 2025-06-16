import type { IProjectResponse } from '../../projects/models/IProjectResponse';

export interface ICustomerResponse {
  [key: string]: string | boolean | IProjectResponse[] | undefined;
  id: string;
  name: string;
  active: boolean;
  details: string;
  projects?: IProjectResponse[];
}

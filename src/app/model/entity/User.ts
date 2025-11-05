import { Community } from './Community';

export interface User {
  cedula: string;
  name: string;
  lastName: string;
  email: string;
  address: string;
  myCommunities: Community[];
}

import { Channel } from './Channel';
import { User } from './user';

export interface Community {
  id: string;
  name: string;
  description: string;
  members: User[];
  channels: Channel[];
}

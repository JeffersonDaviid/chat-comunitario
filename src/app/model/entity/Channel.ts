import { Message } from './Message';

export interface Channel {
  id: string;
  name: string;
  description: string;
  messages: Message[];
}

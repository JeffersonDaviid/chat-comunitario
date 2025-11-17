export interface User {
  cedula: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  profileImg: string; // path
}

export interface Community {
  id: string;
  description: string;
  title: string;
  owner: User; // community owner
  members: User[]; // list of users in the community
  channels?: Channel[]; // optional if the community handles channels
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  messages?: Message[]; // list of channel messages
}

export interface Message {
  id: string;
  owner: User; // user who sends the message
  content: string;
  timestamp: string;
}

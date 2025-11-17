import { User } from '../schemas/db';
import { dbUsers } from './DBSIMULATE';

const createUser = async (userData: User) => {
  // Simulate saving user to the database
  dbUsers.push(userData);

  return userData;
};

export { createUser };

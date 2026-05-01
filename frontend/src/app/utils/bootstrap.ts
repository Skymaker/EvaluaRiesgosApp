import { initializeStorage } from './storage';
import { initializeJobCategories } from './job-storage';
import { initializeAuthSession, initializeUsers } from './auth-storage';

export const initializeAppData = async (): Promise<void> => {
  await Promise.all([
    initializeStorage(),
    initializeJobCategories(),
    initializeUsers(),
  ]);
  await initializeAuthSession();
};

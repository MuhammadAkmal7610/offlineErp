import { useBusiness } from '@/contexts/BusinessContext';
import { getDB, initDB } from '@/lib/db';
import { useEffect, useState } from 'react';

/**
 * Custom hook to get the active database for the current business.
 * This ensures all database operations use the correct business database.
 * 
 * @returns {Object} The Dexie database instance for the active business
 */
export const useDB = () => {
  const { activeBusiness, db } = useBusiness();
  return db;
};

/**
 * Custom hook to get the active database with initialization.
 * Use this when you need to ensure the database is initialized before use.
 * 
 * @returns {Object} The Dexie database instance for the active business
 */
export const useInitializedDB = () => {
  const { activeBusiness, db } = useBusiness();
  const [initializedDB, setInitializedDB] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB(activeBusiness);
        setInitializedDB(getDB(activeBusiness));
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitializedDB(db);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [activeBusiness]);

  return { db: initializedDB || db, isLoading };
};

export default useDB;
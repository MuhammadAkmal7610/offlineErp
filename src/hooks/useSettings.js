import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { initDB, getDB } from '@/lib/db';
import { useBusiness } from '@/contexts/BusinessContext';

const defaultSettings = {
  shopName: 'My Offline Shop',
  currency: 'Rs',
  address: '',
  phone: '',
};

const mapSettings = (rows) => {
  const map = {};
  rows.forEach((row) => {
    map[row.key] = row.value;
  });

  return {
    shopName: map['shopName'] ?? defaultSettings.shopName,
    currency: map['currency'] ?? defaultSettings.currency,
    address: map['address'] ?? defaultSettings.address,
    phone: map['phone'] ?? defaultSettings.phone,
  };
};

export const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const { activeBusiness } = useBusiness();

  useEffect(() => {
    let subscription = null;
    let mounted = true;

    const loadSettings = async () => {
      await initDB(activeBusiness);
      const currentDB = getDB(activeBusiness);
      
      subscription = liveQuery(() => currentDB.settings.toArray()).subscribe({
        next: (rows) => {
          if (mounted) {
            setSettings(mapSettings(rows));
          }
        },
      });
    };

    loadSettings();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [activeBusiness]);

  return settings;
};
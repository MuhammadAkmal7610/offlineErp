import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDB, initDB, initAllDBs } from '@/lib/db';

export const BusinessContext = createContext({
  activeBusiness: 'general',
  switchBusiness: () => {},
  db: getDB('general'),
  businessName: 'General Store',
  businessIcon: '🛒',
  businessColor: 'blue',
  bgColor: 'bg-blue-600',
  textColor: 'text-blue-600',
  borderColor: 'border-blue-600',
  lightBgColor: 'bg-blue-50',
  lightTextColor: 'text-blue-700',
  isInitialized: false,
});

export const businessConfig = {
  general: {
    name: 'General Store',
    icon: '🛒',
    color: 'blue',
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-600',
    lightBgColor: 'bg-blue-50',
    lightTextColor: 'text-blue-700',
    gradient: 'from-blue-500 to-blue-600',
    ringColor: 'ring-blue-500',
    hoverBg: 'hover:bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  jaggery: {
    name: 'Jaggery / Molasses',
    icon: '🟫',
    color: 'yellow',
    bgColor: 'bg-yellow-600',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-600',
    lightBgColor: 'bg-yellow-50',
    lightTextColor: 'text-yellow-700',
    gradient: 'from-yellow-500 to-yellow-600',
    ringColor: 'ring-yellow-500',
    hoverBg: 'hover:bg-yellow-50',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
  },
  cosmetics: {
    name: 'Cosmetics',
    icon: '💄',
    color: 'pink',
    bgColor: 'bg-pink-600',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-600',
    lightBgColor: 'bg-pink-50',
    lightTextColor: 'text-pink-700',
    gradient: 'from-pink-500 to-pink-600',
    ringColor: 'ring-pink-500',
    hoverBg: 'hover:bg-pink-50',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
  },
};

export const BusinessProvider = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState('general');
  const [mounted, setMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize all databases on mount
  useEffect(() => {
    const initializeDatabases = async () => {
      try {
        await initAllDBs();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize databases:', error);
      }
    };
    initializeDatabases();
  }, []);

  // Load saved business preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('activeBusiness');
    if (saved && ['general', 'jaggery', 'cosmetics'].includes(saved)) {
      setActiveBusiness(saved);
    }
  }, []);

  const switchBusiness = useCallback(async (business) => {
    setActiveBusiness(business);
    localStorage.setItem('activeBusiness', business);
    await initDB(business);
  }, []);

  const config = businessConfig[activeBusiness];

  // Prevent SSR mismatch
  if (!mounted) {
    return (
      <BusinessContext.Provider value={{
        activeBusiness: 'general',
        switchBusiness,
        db: getDB('general'),
        businessName: 'General Store',
        businessIcon: '🛒',
        businessColor: 'blue',
        bgColor: 'bg-blue-600',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-600',
        lightBgColor: 'bg-blue-50',
        lightTextColor: 'text-blue-700',
        isInitialized: false,
      }}>
        {children}
      </BusinessContext.Provider>
    );
  }

  return (
    <BusinessContext.Provider value={{
      activeBusiness,
      switchBusiness,
      db: getDB(activeBusiness),
      businessName: config.name,
      businessIcon: config.icon,
      businessColor: config.color,
      bgColor: config.bgColor,
      textColor: config.textColor,
      borderColor: config.borderColor,
      lightBgColor: config.lightBgColor,
      lightTextColor: config.lightTextColor,
      isInitialized,
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
import Dexie from 'dexie';
import { seedDatabase } from './seed.js';

// Base database class
export class ShopDatabase extends Dexie {
  constructor(dbName) {
    super(dbName);
    this.version(1).stores({
      products: '++id,name,category,barcode,price,costPrice,unit,createdAt',
      inventory: '++id,productId,quantity,lowStockThreshold,lastUpdated',
      purchases: '++id,productId,productName,quantity,costPrice,totalCost,supplier,date',
      sales: '++id,date,totalAmount,discount,paymentMethod,studentId',
      suppliers: '++id,name,phone,email,address,createdAt',
      expenses: '++id,title,amount,category,date',
      students: '++id,name,fatherName,rollNumber,phone,fatherPhone,class,address,createdAt',
      studentLedger: '++id,studentId,type,amount,description,date',
      salesReturns: '++id,originalSaleId,productId,productName,quantity,refundAmount,reason,refundMethod,studentId,date',
      settings: 'key',
      customers: '++id,name,phone,email',
      customerLedger: '++id,customerId,type,amount,description,date',
    });

    // Add a version upgrade path to include expiry date fields for cosmetics and product tracking
    this.version(2).stores({
      products: '++id,name,category,barcode,price,costPrice,unit,createdAt,expiryDate',
      inventory: '++id,productId,quantity,lowStockThreshold,lastUpdated,expiryDate',
      purchases: '++id,productId,productName,quantity,costPrice,totalCost,supplier,date,expiryDate',
      sales: '++id,date,totalAmount,discount,paymentMethod,studentId',
      suppliers: '++id,name,phone,email,address,createdAt',
      expenses: '++id,title,amount,category,date',
      students: '++id,name,fatherName,rollNumber,phone,fatherPhone,class,address,createdAt',
      studentLedger: '++id,studentId,type,amount,description,date',
      salesReturns: '++id,originalSaleId,productId,productName,quantity,refundAmount,reason,refundMethod,studentId,date',
      settings: 'key',
      customers: '++id,name,phone,email',
      customerLedger: '++id,customerId,type,amount,description,date',
    });
  }
}

// Three separate databases for each business
export const generalDB = new ShopDatabase('ShopERP_General');
export const jaggeryDB = new ShopDatabase('ShopERP_Jaggery');
export const cosmeticsDB = new ShopDatabase('ShopERP_Cosmetics');

// Default export (will be overridden by context)
export let db = generalDB;

// Get the database for a specific business
export const getDB = (business) => {
  switch (business) {
    case 'general': return generalDB;
    case 'jaggery': return jaggeryDB;
    case 'cosmetics': return cosmeticsDB;
    default: return generalDB;
  }
};

// Set the active database
export const setDB = (business) => {
  db = getDB(business);
};

// Safely open database with fallback for transient IndexedDB / Dexie errors
async function safeOpenDB(targetDB) {
  try {
    await targetDB.open();
    return targetDB;
  } catch (error) {
    console.warn(`Dexie open failed for ${targetDB.name}; attempting recovery...`, error);
    
    try {
      await targetDB.close();
    } catch (closeError) {
      console.warn(`Failed to close DB ${targetDB.name}`, closeError);
    }

    // If it's a ConstraintError, clear the database and retry
    if (error.name === 'ConstraintError' || error.message?.includes('ConstraintError')) {
      console.warn(`ConstraintError detected, clearing database ${targetDB.name}...`);
      try {
        await targetDB.delete();
      } catch (deleteError) {
        console.warn(`Failed to delete DB ${targetDB.name}`, deleteError);
      }
    }

    // Attempt to reopen after cleanup
    try {
      await targetDB.open();
      return targetDB;
    } catch (retryError) {
      console.error(`Failed to recover DB ${targetDB.name}`, retryError);
      throw retryError;
    }
  }
}

// Initialize a specific database
export async function initDB(business = 'general') {
  const targetDB = getDB(business);
  await safeOpenDB(targetDB);
  await deduplicateProducts(targetDB);
  const count = await targetDB.products.count();
  if (count === 0) {
    try {
      await seedDatabase(targetDB, business);
    } catch (error) {
      console.error(`Seeding failed for ${business} database:`, error);
      // If seeding fails due to constraint errors, try force reinit
      if (error.name === 'ConstraintError') {
        console.warn(`ConstraintError during seeding, clearing and retrying...`);
        await forceInitDB(business);
      } else {
        throw error;
      }
    }
  }
  return targetDB;
}

// Force reinitialize a database with business-specific seed data
export async function forceInitDB(business = 'general') {
  const targetDB = getDB(business);
  await safeOpenDB(targetDB);
  
  // Clear all tables
  await targetDB.products.clear();
  await targetDB.inventory.clear();
  await targetDB.purchases.clear();
  await targetDB.sales.clear();
  await targetDB.suppliers.clear();
  await targetDB.expenses.clear();
  await targetDB.students.clear();
  await targetDB.studentLedger.clear();
  await targetDB.salesReturns.clear();
  await targetDB.settings.clear();
  await targetDB.customers.clear();
  await targetDB.customerLedger.clear();
  
  // Re-seed with business-specific data
  await seedDatabase(targetDB, business);
  
  return targetDB;
}

// Alias for backwards compatibility
export { initDB as initDb };

// Initialize all databases
export async function initAllDBs() {
  await Promise.all([
    initDB('general'),
    initDB('jaggery'),
    initDB('cosmetics')
  ]);
}

export async function deduplicateProducts(targetDB = generalDB) {
  const allProducts = await targetDB.products.toArray();
  const seen = new Map();
  const toDelete = [];

  for (const product of allProducts) {
    const key = product.barcode ?? product.name;
    if (seen.has(key)) {
      if (product.id) toDelete.push(product.id);
    } else if (product.id) {
      seen.set(key, product.id);
    }
  }

  if (toDelete.length > 0) {
    await targetDB.products.bulkDelete(toDelete);
  }

  const validProductIds = (await targetDB.products.toArray()).map((product) => product.id).filter(Boolean);
  const allInventory = await targetDB.inventory.toArray();
  const orphanedInventory = allInventory.filter((item) => !validProductIds.includes(item.productId)).map((item) => item.id).filter(Boolean);
  if (orphanedInventory.length > 0) {
    await targetDB.inventory.bulkDelete(orphanedInventory);
  }

  const allInv = await targetDB.inventory.toArray();
  const seenProductIds = new Set();
  const dupInv = [];
  for (const inv of allInv) {
    if (seenProductIds.has(inv.productId)) {
      if (inv.id) dupInv.push(inv.id);
    } else {
      seenProductIds.add(inv.productId);
    }
  }
  if (dupInv.length > 0) {
    await targetDB.inventory.bulkDelete(dupInv);
  }
}

export async function exportDatabase(targetDB = generalDB) {
  const [products, inventory, purchases, sales, suppliers, expenses, studentLedger, salesReturns, settings, customers, customerLedger] = await Promise.all([
    targetDB.products.toArray(),
    targetDB.inventory.toArray(),
    targetDB.purchases.toArray(),
    targetDB.sales.toArray(),
    targetDB.suppliers.toArray(),
    targetDB.expenses.toArray(),
    targetDB.studentLedger.toArray(),
    targetDB.salesReturns.toArray(),
    targetDB.settings.toArray(),
    targetDB.customers.toArray(),
    targetDB.customerLedger.toArray(),
  ]);

  return {
    products,
    inventory,
    purchases,
    sales,
    suppliers,
    expenses,
    studentLedger,
    salesReturns,
    settings,
    customers,
    customerLedger,
  };
}

// Export all databases data
export async function exportAllDatabases() {
  return {
    general: await exportDatabase(generalDB),
    jaggery: await exportDatabase(jaggeryDB),
    cosmetics: await exportDatabase(cosmeticsDB),
  };
}

// Reset a specific database and re-seed with business-specific data
export async function resetDatabase(business = 'general') {
  const targetDB = getDB(business);
  await safeOpenDB(targetDB);
  
  // Clear all tables
  await targetDB.products.clear();
  await targetDB.inventory.clear();
  await targetDB.purchases.clear();
  await targetDB.sales.clear();
  await targetDB.suppliers.clear();
  await targetDB.expenses.clear();
  await targetDB.students.clear();
  await targetDB.studentLedger.clear();
  await targetDB.salesReturns.clear();
  await targetDB.settings.clear();
  await targetDB.customers.clear();
  await targetDB.customerLedger.clear();
  
  // Re-seed with business-specific data
  await seedDatabase(targetDB, business);
  
  return true;
}

// Reset all databases
export async function resetAllDatabases() {
  await Promise.all([
    resetDatabase('general'),
    resetDatabase('jaggery'),
    resetDatabase('cosmetics')
  ]);
}

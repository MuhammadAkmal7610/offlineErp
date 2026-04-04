import { DEFAULT_IMAGE } from './utils.js';

// ============================================
// GENERAL STORE - Grocery/Retail products
// ============================================
const generalProducts = [
  {
    name: 'Creamy Biscuit',
    category: 'Biscuits',
    barcode: '1234567000011',
    price: 1.75,
    costPrice: 1.1,
    unit: 'pcs',
    image: DEFAULT_IMAGE,
    description: 'Crunchy milk-flavored biscuit.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Chocolate Bar',
    category: 'Chocolates',
    barcode: '1234567000028',
    price: 2.5,
    costPrice: 1.5,
    unit: 'pcs',
    image: DEFAULT_IMAGE,
    description: 'Dark chocolate bar.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Sparkling Soda',
    category: 'Beverages',
    barcode: '1234567000035',
    price: 1.25,
    costPrice: 0.8,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Refreshing carbonated drink.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Potato Chips',
    category: 'Snacks',
    barcode: '1234567000042',
    price: 1.95,
    costPrice: 1.0,
    unit: 'bag',
    image: DEFAULT_IMAGE,
    description: 'Salty potato chips.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Yogurt Drink',
    category: 'Dairy',
    barcode: '1234567000059',
    price: 1.8,
    costPrice: 1.1,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Creamy yoghurt beverage.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Salted Crackers',
    category: 'Biscuits',
    barcode: '1234567000066',
    price: 1.65,
    costPrice: 0.95,
    unit: 'pack',
    image: DEFAULT_IMAGE,
    description: 'Crispy salted crackers.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Milk Chocolate',
    category: 'Chocolates',
    barcode: '1234567000073',
    price: 2.3,
    costPrice: 1.4,
    unit: 'pcs',
    image: DEFAULT_IMAGE,
    description: 'Smooth milk chocolate.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Energy Drink',
    category: 'Beverages',
    barcode: '1234567000080',
    price: 2.15,
    costPrice: 1.25,
    unit: 'can',
    image: DEFAULT_IMAGE,
    description: 'Boost of energy.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Cheese Crackers',
    category: 'Snacks',
    barcode: '1234567000097',
    price: 2.1,
    costPrice: 1.2,
    unit: 'pack',
    image: DEFAULT_IMAGE,
    description: 'Cheesy crispy snack.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Fresh Cheese',
    category: 'Dairy',
    barcode: '1234567000103',
    price: 3.25,
    costPrice: 2.1,
    unit: 'piece',
    image: DEFAULT_IMAGE,
    description: 'Soft fresh cheese.',
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// JAGGERY / MOLASSES - Sweetener products
// ============================================
const jaggeryProducts = [
  {
    name: 'Organic Jaggery Block',
    category: 'Jaggery Blocks',
    barcode: '2234567000011',
    price: 4.5,
    costPrice: 2.8,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Pure organic jaggery block, unrefined.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Jaggery Powder',
    category: 'Jaggery Powder',
    barcode: '2234567000028',
    price: 5.2,
    costPrice: 3.2,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Fine jaggery powder for cooking.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Molasses Syrup',
    category: 'Molasses',
    barcode: '2234567000035',
    price: 6.8,
    costPrice: 4.2,
    unit: 'liter',
    image: DEFAULT_IMAGE,
    description: 'Dark molasses syrup for baking.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Jaggery Cubes',
    category: 'Jaggery Cubes',
    barcode: '2234567000042',
    price: 5.5,
    costPrice: 3.4,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Convenient jaggery cubes for tea.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Palm Jaggery',
    category: 'Palm Jaggery',
    barcode: '2234567000059',
    price: 7.2,
    costPrice: 4.5,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Premium palm jaggery, rich flavor.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Jaggery Chikki',
    category: 'Jaggery Snacks',
    barcode: '2234567000066',
    price: 3.8,
    costPrice: 2.2,
    unit: 'pack',
    image: DEFAULT_IMAGE,
    description: 'Traditional jaggery peanut brittle.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Date Jaggery',
    category: 'Date Jaggery',
    barcode: '2234567000073',
    price: 8.5,
    costPrice: 5.3,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Soft date jaggery, premium quality.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Molasses Powder',
    category: 'Molasses Powder',
    barcode: '2234567000080',
    price: 7.8,
    costPrice: 4.8,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Dried molasses powder for recipes.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Jaggery Syrup',
    category: 'Syrups',
    barcode: '2234567000097',
    price: 6.2,
    costPrice: 3.8,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Liquid jaggery syrup for desserts.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Sugarcane Jaggery',
    category: 'Sugarcane Jaggery',
    barcode: '2234567000103',
    price: 4.8,
    costPrice: 3.0,
    unit: 'kg',
    image: DEFAULT_IMAGE,
    description: 'Traditional sugarcane jaggery.',
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// COSMETICS - Beauty and personal care products
// ============================================
const cosmeticsProducts = [
  {
    name: 'Moisturizing Face Cream',
    category: 'Skincare',
    barcode: '3234567000011',
    price: 12.5,
    costPrice: 7.5,
    unit: 'jar',
    image: DEFAULT_IMAGE,
    description: 'Hydrating face cream for all skin types.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Matte Lipstick - Red',
    category: 'Makeup',
    barcode: '3234567000028',
    price: 8.9,
    costPrice: 5.2,
    unit: 'pcs',
    image: DEFAULT_IMAGE,
    description: 'Long-lasting matte red lipstick.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Perfume - Floral',
    category: 'Fragrances',
    barcode: '3234567000035',
    price: 25.0,
    costPrice: 15.0,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Elegant floral fragrance, 50ml.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Shampoo - Silk Protein',
    category: 'Hair Care',
    barcode: '3234567000042',
    price: 6.8,
    costPrice: 4.0,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Nourishing shampoo with silk protein.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Eye Shadow Palette',
    category: 'Makeup',
    barcode: '3234567000059',
    price: 18.5,
    costPrice: 11.0,
    unit: 'palette',
    image: DEFAULT_IMAGE,
    description: '12-color eye shadow palette.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Body Lotion',
    category: 'Body Care',
    barcode: '3234567000066',
    price: 9.2,
    costPrice: 5.5,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Moisturizing body lotion, 200ml.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Nail Polish - Pink',
    category: 'Nail Care',
    barcode: '3234567000073',
    price: 4.5,
    costPrice: 2.5,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Glossy pink nail polish.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Face Serum - Vitamin C',
    category: 'Skincare',
    barcode: '3234567000080',
    price: 22.0,
    costPrice: 13.5,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Brightening vitamin C serum.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Conditioner - Argan Oil',
    category: 'Hair Care',
    barcode: '3234567000097',
    price: 7.5,
    costPrice: 4.5,
    unit: 'bottle',
    image: DEFAULT_IMAGE,
    description: 'Deep conditioning treatment with argan oil.',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Compact Powder',
    category: 'Makeup',
    barcode: '3234567000103',
    price: 11.0,
    costPrice: 6.5,
    unit: 'compact',
    image: DEFAULT_IMAGE,
    description: 'Lightweight compact powder for flawless finish.',
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// SUPPLIERS - Business-specific
// ============================================
const generalSuppliers = [
  {
    name: 'Apex Wholesale',
    phone: '+1234567890',
    email: 'orders@apex.com',
    address: '12 Market Road',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Fresh Foods',
    phone: '+1987654321',
    email: 'contact@freshfoods.com',
    address: '88 Commerce Ave',
    createdAt: new Date().toISOString(),
  },
];

const jaggerySuppliers = [
  {
    name: 'Sweet Farms Co.',
    phone: '+1234567001',
    email: 'info@sweetfarms.com',
    address: '45 Agriculture Lane',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Organic Sugarcane Ltd',
    phone: '+1987654002',
    email: 'sales@organicsugarcane.com',
    address: '123 Plantation Road',
    createdAt: new Date().toISOString(),
  },
];

const cosmeticsSuppliers = [
  {
    name: 'Beauty Supplies Intl',
    phone: '+1234567003',
    email: 'orders@beautysupplies.com',
    address: '789 Cosmetic Blvd',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Glamour Distributors',
    phone: '+1987654004',
    email: 'contact@glamourdistributors.com',
    address: '321 Fashion District',
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// EXPENSES - Business-specific
// ============================================
const generalExpenses = [
  { title: 'Shop Rent', amount: 220, category: 'Rent', date: new Date().toISOString(), note: 'Monthly rent' },
  { title: 'Electricity Bill', amount: 65, category: 'Utilities', date: new Date().toISOString(), note: 'Power and lights' },
  { title: 'Transport', amount: 45, category: 'Transport', date: new Date().toISOString(), note: 'Delivery fees' },
];

const jaggeryExpenses = [
  { title: 'Warehouse Rent', amount: 350, category: 'Rent', date: new Date().toISOString(), note: 'Storage facility rent' },
  { title: 'Processing Equipment', amount: 120, category: 'Equipment', date: new Date().toISOString(), note: 'Machinery maintenance' },
  { title: 'Transport', amount: 80, category: 'Transport', date: new Date().toISOString(), note: 'Bulk delivery transport' },
];

const cosmeticsExpenses = [
  { title: 'Store Rent', amount: 450, category: 'Rent', date: new Date().toISOString(), note: 'Mall space rent' },
  { title: 'Display Fixtures', amount: 85, category: 'Fixtures', date: new Date().toISOString(), note: 'Display counter maintenance' },
  { title: 'Marketing', amount: 120, category: 'Marketing', date: new Date().toISOString(), note: 'Social media ads' },
];

// ============================================
// STUDENTS - For General Store (school canteen scenario)
// ============================================
const sampleStudents = [
  {
    name: 'Ali Khan',
    fatherName: 'Ahmad Khan',
    rollNumber: 'STU-2024-001',
    phone: '0312-1234567',
    fatherPhone: '0300-7654321',
    class: 'Class 5',
    address: 'House 123, Street 45, City',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Sara Ahmed',
    fatherName: 'Muhammad Ahmed',
    rollNumber: 'STU-2024-002',
    phone: '0313-2345678',
    fatherPhone: '0301-8765432',
    class: 'Class 6',
    address: 'House 456, Street 78, City',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Bilal Hussain',
    fatherName: 'Hassan Hussain',
    rollNumber: 'STU-2024-003',
    phone: '0314-3456789',
    fatherPhone: '0302-9876543',
    class: 'Class 5',
    address: 'House 789, Street 12, City',
    createdAt: new Date().toISOString(),
  },
];

const sampleStudentLedger = [
  {
    studentId: 1,
    type: 'charge',
    amount: 500,
    description: 'Opening balance',
    date: new Date().toISOString(),
  },
  {
    studentId: 1,
    type: 'purchase',
    amount: 150,
    description: 'Biscuits and chocolates',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    studentId: 1,
    type: 'payment',
    amount: 200,
    description: 'Partial payment',
    date: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    studentId: 2,
    type: 'purchase',
    amount: 75,
    description: 'Soda and chips',
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ============================================
// CUSTOMERS - For Jaggery and Cosmetics
// ============================================
const jaggeryCustomers = [
  {
    name: 'Al-Rashid Sweets',
    phone: '0312-1111111',
    email: 'orders@alrashidsweets.com',
    address: '45 Sweet Market, Commercial Area',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Organic Foods Store',
    phone: '0313-2222222',
    email: 'info@organicfoods.com',
    address: '78 Health Street, Green Town',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Traditional Bakery',
    phone: '0314-3333333',
    email: 'contact@traditionalbakery.com',
    address: '12 Baker Lane, Old City',
    createdAt: new Date().toISOString(),
  },
];

const jaggeryCustomerLedger = [
  {
    customerId: 1,
    type: 'charge',
    amount: 2500,
    description: 'Opening balance',
    date: new Date().toISOString(),
  },
  {
    customerId: 1,
    type: 'purchase',
    amount: 1200,
    description: '5kg Jaggery blocks',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    customerId: 1,
    type: 'payment',
    amount: 1000,
    description: 'Partial payment',
    date: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    customerId: 2,
    type: 'purchase',
    amount: 800,
    description: 'Molasses syrup order',
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

const cosmeticsCustomers = [
  {
    name: 'Beauty Salon Elite',
    phone: '0312-4444444',
    email: 'info@beautyelite.com',
    address: '23 Fashion Plaza, Mall Road',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Glamour Cosmetics Shop',
    phone: '0313-5555555',
    email: 'sales@glamourshop.com',
    address: '56 Shopping Center, City Center',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Spa & Wellness Center',
    phone: '0314-6666666',
    email: 'contact@spawellness.com',
    address: '89 Relaxation Avenue, Green District',
    createdAt: new Date().toISOString(),
  },
];

const cosmeticsCustomerLedger = [
  {
    customerId: 1,
    type: 'charge',
    amount: 3500,
    description: 'Opening balance',
    date: new Date().toISOString(),
  },
  {
    customerId: 1,
    type: 'purchase',
    amount: 1800,
    description: 'Skincare products bulk order',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    customerId: 1,
    type: 'payment',
    amount: 1500,
    description: 'Partial payment',
    date: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    customerId: 2,
    type: 'purchase',
    amount: 950,
    description: 'Makeup collection',
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ============================================
// SETTINGS - Business-specific
// ============================================
const generalSettings = [
  { key: 'shopName', value: 'General Store' },
  { key: 'currency', value: 'Rs' },
  { key: 'address', value: '123 Main Market Street' },
  { key: 'phone', value: '+92 300 1234567' },
];

const jaggerySettings = [
  { key: 'shopName', value: 'Jaggery & Molasses Co.' },
  { key: 'currency', value: 'Rs' },
  { key: 'address', value: '45 Agriculture Industrial Area' },
  { key: 'phone', value: '+92 300 7654321' },
];

const cosmeticsSettings = [
  { key: 'shopName', value: 'Glamour Cosmetics' },
  { key: 'currency', value: 'Rs' },
  { key: 'address', value: '789 Fashion Mall, Shop 12' },
  { key: 'phone', value: '+92 300 9876543' },
];

// ============================================
// CATEGORY COLORS - Business-specific
// ============================================
export const categoryColors = {
  general: {
    Biscuits: '#2563eb',
    Chocolates: '#f97316',
    Beverages: '#14b8a6',
    Snacks: '#e11d48',
    Dairy: '#8b5cf6',
  },
  jaggery: {
    'Jaggery Blocks': '#92400e',
    'Jaggery Powder': '#f59e0b',
    Molasses: '#78350f',
    'Jaggery Cubes': '#d97706',
    'Palm Jaggery': '#b45309',
    'Jaggery Snacks': '#fcd34d',
    'Date Jaggery': '#78350f',
    'Molasses Powder': '#92400e',
    Syrups: '#d97706',
    'Sugarcane Jaggery': '#f59e0b',
  },
  cosmetics: {
    Skincare: '#ec4899',
    Makeup: '#8b5cf6',
    Fragrances: '#f472b6',
    'Hair Care': '#a855f7',
    'Body Care': '#d946ef',
    'Nail Care': '#f0abfc',
  },
};

// ============================================
// SEED DATABASE FUNCTION
// ============================================
export async function seedDatabase(targetDB, businessType = 'general') {
  const count = await targetDB.products.count();
  if (count > 0) return;

  // Clear existing data
  await targetDB.students.clear();
  await targetDB.studentLedger.clear();
  await targetDB.customers.clear();
  await targetDB.customerLedger.clear();
  await targetDB.products.clear();
  await targetDB.inventory.clear();
  await targetDB.suppliers.clear();
  await targetDB.expenses.clear();
  await targetDB.purchases.clear();
  await targetDB.sales.clear();

  // Select business-specific data
  let products, suppliers, expenses, settings;
  let studentData = null;
  let customerData = null;

  switch (businessType) {
    case 'general':
      products = generalProducts;
      suppliers = generalSuppliers;
      expenses = generalExpenses;
      settings = generalSettings;
      studentData = { students: sampleStudents, ledger: sampleStudentLedger };
      break;
    case 'jaggery':
      products = jaggeryProducts;
      suppliers = jaggerySuppliers;
      expenses = jaggeryExpenses;
      settings = jaggerySettings;
      customerData = { customers: jaggeryCustomers, ledger: jaggeryCustomerLedger };
      break;
    case 'cosmetics':
      products = cosmeticsProducts;
      suppliers = cosmeticsSuppliers;
      expenses = cosmeticsExpenses;
      settings = cosmeticsSettings;
      customerData = { customers: cosmeticsCustomers, ledger: cosmeticsCustomerLedger };
      break;
    default:
      products = generalProducts;
      suppliers = generalSuppliers;
      expenses = generalExpenses;
      settings = generalSettings;
      studentData = { students: sampleStudents, ledger: sampleStudentLedger };
  }

  // Add products and create inventory items
  await targetDB.products.bulkAdd(products);
  const allProducts = await targetDB.products.toArray();
  const productIds = allProducts.map((p) => p.id);
  const inventoryItems = productIds.map((productId) => ({
    productId,
    quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
    lowStockThreshold: 5,
    lastUpdated: new Date().toISOString(),
  }));

  // Add suppliers
  await targetDB.suppliers.bulkAdd(suppliers);
  const allSuppliers = await targetDB.suppliers.toArray();
  const supplierIds = allSuppliers.map((s) => s.id);

  // Add expenses
  await targetDB.expenses.bulkAdd(expenses);

  // Add settings
  await targetDB.settings.bulkPut(settings);

  // Create sample purchases
  const purchases = productIds.slice(0, 5).map((productId, index) => {
    const product = products[index];
    const quantity = Math.floor(Math.random() * 30) + 20;
    return {
      productId,
      productName: product.name,
      quantity,
      costPrice: product.costPrice,
      totalCost: quantity * product.costPrice,
      supplier: suppliers[index % suppliers.length].name,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      note: `Restock ${product.name}`,
    };
  });
  await targetDB.purchases.bulkAdd(purchases);

  // Create sample sales
  const sales = [];
  for (let i = 0; i < 5; i++) {
    const productIndex = i % products.length;
    const product = products[productIndex];
    const qty = Math.floor(Math.random() * 5) + 1;
    sales.push({
      items: [
        { productId: productIds[productIndex], productName: product.name, qty, unitPrice: product.price, subtotal: qty * product.price },
      ],
      totalAmount: qty * product.price,
      discount: 0,
      paymentMethod: Math.random() > 0.5 ? 'Cash' : 'Card',
      date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  await targetDB.sales.bulkAdd(sales);

  // Add students or customers based on business type
  if (studentData) {
    await targetDB.students.bulkAdd(studentData.students);
    const allStudents = await targetDB.students.toArray();
    const studentIds = allStudents.map((s) => s.id);
    const studentLedgerWithIds = studentData.ledger.map((entry) => ({
      ...entry,
      studentId: studentIds[entry.studentId - 1],
    }));
    await targetDB.studentLedger.bulkAdd(studentLedgerWithIds);
  }

  if (customerData) {
    await targetDB.customers.bulkAdd(customerData.customers);
    const allCustomers = await targetDB.customers.toArray();
    const customerIds = allCustomers.map((c) => c.id);
    const customerLedgerWithIds = customerData.ledger.map((entry) => ({
      ...entry,
      customerId: customerIds[entry.customerId - 1],
    }));
    await targetDB.customerLedger.bulkAdd(customerLedgerWithIds);
  }

  // Update inventory with actual quantities from purchases
  for (const purchase of purchases) {
    const invItem = inventoryItems.find((item) => item.productId === purchase.productId);
    if (invItem) {
      invItem.quantity += purchase.quantity;
    }
  }
  await targetDB.inventory.bulkPut(inventoryItems);
}
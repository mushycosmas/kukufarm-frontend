export const flocks = [
  { id: 1, code: 'FL-001', breed: 'Layers', source: 'KukuFarm Hatchery', date: '2026-01-15', birds: 2500, age: 32, mortality: 35, status: 'Active' },
  { id: 2, code: 'FL-002', breed: 'Layers', source: 'KukuFarm Hatchery', date: '2026-02-20', birds: 2740, age: 28, mortality: 24, status: 'Active' },
  { id: 3, code: 'FL-003', breed: 'Layers', source: 'Local Supplier', date: '2025-12-10', birds: 1800, age: 37, mortality: 42, status: 'Active' }
];

export const eggs = [
  { id: 1, date: '2026-09-15', flock: 'FL-001', good: 2380, broken: 35, dirty: 24, total: 2439 },
  { id: 2, date: '2026-09-15', flock: 'FL-002', good: 1900, broken: 28, dirty: 15, total: 1943 },
  { id: 3, date: '2026-09-14', flock: 'FL-001', good: 2410, broken: 31, dirty: 20, total: 2461 },
  { id: 4, date: '2026-09-14', flock: 'FL-002', good: 1920, broken: 25, dirty: 17, total: 1962 }
];

export const feed = [
  { id: 1, date: '2026-09-15', item: 'Layer Mash', quantity: 12, unit: 'bags', type: 'Consumption', flock: 'FL-001' },
  { id: 2, date: '2026-09-15', item: 'Layer Mash', quantity: 10, unit: 'bags', type: 'Consumption', flock: 'FL-002' },
  { id: 3, date: '2026-09-13', item: 'Layer Mash', quantity: 50, unit: 'bags', type: 'Purchase', flock: '-' }
];

export const health = [
  { id: 1, date: '2026-09-10', flock: 'FL-001', type: 'Vaccination', item: 'Newcastle', quantity: 2500, notes: 'Completed' },
  { id: 2, date: '2026-09-05', flock: 'FL-002', type: 'Medication', item: 'Vitamin Mix', quantity: 5, notes: '5 litres' }
];

export const mortality = [
  { id: 1, date: '2026-09-15', flock: 'FL-001', quantity: 3, reason: 'Natural', notes: '' },
  { id: 2, date: '2026-09-15', flock: 'FL-002', quantity: 2, reason: 'Disease', notes: 'Respiratory symptoms' }
];

export const sales = [
  { id: 1, invoice: 'INV-001', date: '2026-09-15', customer: 'Mlimani Hotel', product: 'Eggs - Tray', quantity: 100, amount: 450000, payment: 'Cash', status: 'Paid' },
  { id: 2, invoice: 'INV-002', date: '2026-09-14', customer: 'City Supermarket', product: 'Eggs - Tray', quantity: 80, amount: 360000, payment: 'Bank', status: 'Paid' },
  { id: 3, invoice: 'INV-003', date: '2026-09-13', customer: 'John Poultry', product: 'Live Chickens', quantity: 50, amount: 500000, payment: 'Cash', status: 'Pending' }
];

export const customers = [
  { id: 1, name: 'Mlimani Hotel', phone: '0712000001', location: 'Dodoma', balance: 0 },
  { id: 2, name: 'City Supermarket', phone: '0712000002', location: 'Dodoma', balance: 0 },
  { id: 3, name: 'John Poultry', phone: '0712000003', location: 'Dodoma', balance: 500000 }
];

export const expenses = [
  { id: 1, date: '2026-09-15', category: 'Feed', description: 'Layer Mash', amount: 720000, payment: 'Bank' },
  { id: 2, date: '2026-09-12', category: 'Medication', description: 'Vaccines and vitamins', amount: 180000, payment: 'Cash' },
  { id: 3, date: '2026-09-08', category: 'Utilities', description: 'Electricity', amount: 95000, payment: 'Cash' }
];

export const suppliers = [
  { id: 1, name: 'KukuFeed Suppliers', phone: '0755000001', item: 'Layer Mash', balance: 0 },
  { id: 2, name: 'AgroVet Tanzania', phone: '0755000002', item: 'Medication', balance: 120000 }
];

export const users = [
  { id: 1, name: 'Kelvin Cosmas', email: 'admin@kukufarm.co.tz', role: 'Administrator', status: 'Active' },
  { id: 2, name: 'Farm Manager', email: 'manager@kukufarm.co.tz', role: 'Manager', status: 'Active' },
  { id: 3, name: 'Farm Clerk', email: 'clerk@kukufarm.co.tz', role: 'Clerk', status: 'Active' }
];

export const eggChart = [
  { day: '09 Sep', eggs: 4100 }, { day: '10 Sep', eggs: 4220 }, { day: '11 Sep', eggs: 4310 },
  { day: '12 Sep', eggs: 4380 }, { day: '13 Sep', eggs: 4460 }, { day: '14 Sep', eggs: 4423 },
  { day: '15 Sep', eggs: 4380 }
];

export const financialChart = [
  { month: 'Mar', sales: 5200000, expenses: 2900000 },
  { month: 'Apr', sales: 6100000, expenses: 3100000 },
  { month: 'May', sales: 6800000, expenses: 3500000 },
  { month: 'Jun', sales: 7200000, expenses: 3900000 },
  { month: 'Jul', sales: 7900000, expenses: 4100000 },
  { month: 'Aug', sales: 8400000, expenses: 4300000 }
];
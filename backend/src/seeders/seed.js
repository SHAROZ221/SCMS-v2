const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Customer,
  Device,
  ServiceTicket,
  TicketTimeline,
  SparePart,
  TicketPart,
  Invoice,
  Notification,
} = require('../models');

async function seedDatabase() {
  try {
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables synchronized.');

    // 1. Seed Users
    console.log('👤 Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const users = await User.bulkCreate([
      {
        name: 'System Admin',
        email: 'admin@scms.com',
        password_hash: defaultPasswordHash,
        role: 'admin',
        is_active: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'technician@scms.com',
        password_hash: defaultPasswordHash,
        role: 'technician',
        is_active: true,
      },
      {
        name: 'Priya Patel',
        email: 'receptionist@scms.com',
        password_hash: defaultPasswordHash,
        role: 'receptionist',
        is_active: true,
      },
      {
        name: 'Amit Kumar',
        email: 'amit.tech@scms.com',
        password_hash: defaultPasswordHash,
        role: 'technician',
        is_active: true,
      },
    ]);

    const admin = users[0];
    const tech1 = users[1];
    const recep = users[2];
    const tech2 = users[3];

    // 2. Seed Customers (10 Indian customers)
    console.log('👥 Seeding customers...');
    const customers = await Customer.bulkCreate([
      { name: 'Aarav Mehta', phone: '+91 98201 12345', email: 'aarav.mehta@example.com', address: 'B-402, Sunset Heights, Andheri West, Mumbai' },
      { name: 'Sneha Verma', phone: '+91 98111 23456', email: 'sneha.verma@example.com', address: 'Flat 12, Gulmohar Enclave, Saket, New Delhi' },
      { name: 'Vikram Sengupta', phone: '+91 98300 34567', email: 'vikram.s@example.com', address: '45 Lake Gardens, South Kolkata' },
      { name: 'Ananya Iyer', phone: '+91 94440 45678', email: 'ananya.iyer@example.com', address: '18 Indiranagar 100ft Road, Bengaluru' },
      { name: 'Rohan Deshmukh', phone: '+91 98220 56789', email: 'rohan.d@example.com', address: '78 Shivaji Nagar, Pune' },
      { name: 'Kavita Reddy', phone: '+91 98480 67890', email: 'kavita.reddy@example.com', address: 'Plot 22, Jubilee Hills, Hyderabad' },
      { name: 'Deepak Joshi', phone: '+91 98290 78901', email: 'deepak.j@example.com', address: '12 Malviya Nagar, Jaipur' },
      { name: 'Meera Nair', phone: '+91 94470 89012', email: 'meera.nair@example.com', address: 'Panampilly Nagar, Kochi, Kerala' },
      { name: 'Siddharth Rao', phone: '+91 98800 90123', email: 'siddharth.rao@example.com', address: 'Koramangala 4th Block, Bengaluru' },
      { name: 'Pooja Bhatia', phone: '+91 98100 01234', email: 'pooja.b@example.com', address: 'Sector 14, Gurugram, Haryana' },
    ]);

    // 3. Seed Devices (15 Samsung devices)
    console.log('📱 Seeding devices...');
    const devices = await Device.bulkCreate([
      { customer_id: customers[0].id, brand: 'Samsung', model: 'Galaxy S24 Ultra', serial_number: 'SN-S24U-9901', category: 'Smartphone', purchase_date: '2026-02-15', warranty_period_months: 12, warranty_expiry: '2027-02-15' },
      { customer_id: customers[0].id, brand: 'Samsung', model: 'Galaxy Watch 6 Classic', serial_number: 'SN-GW6C-4412', category: 'Wearable', purchase_date: '2025-08-10', warranty_period_months: 12, warranty_expiry: '2026-08-10' },
      { customer_id: customers[1].id, brand: 'Samsung', model: 'Galaxy Z Fold 5', serial_number: 'SN-ZF5-8821', category: 'Smartphone', purchase_date: '2025-10-05', warranty_period_months: 12, warranty_expiry: '2026-10-05' },
      { customer_id: customers[2].id, brand: 'Samsung', model: '55" Neo QLED 4K TV (QN85C)', serial_number: 'SN-TV55-3319', category: 'Television', purchase_date: '2024-05-12', warranty_period_months: 24, warranty_expiry: '2026-05-12' },
      { customer_id: customers[3].id, brand: 'Samsung', model: 'Galaxy Tab S9 Plus', serial_number: 'SN-TS9P-7734', category: 'Tablet', purchase_date: '2026-01-20', warranty_period_months: 12, warranty_expiry: '2027-01-20' },
      { customer_id: customers[4].id, brand: 'Samsung', model: 'Galaxy A55 5G', serial_number: 'SN-A55-1198', category: 'Smartphone', purchase_date: '2025-04-18', warranty_period_months: 12, warranty_expiry: '2026-04-18' },
      { customer_id: customers[5].id, brand: 'Samsung', model: 'Front Load AI Ecobubble 8Kg Washer', serial_number: 'SN-WM8K-5561', category: 'Home Appliance', purchase_date: '2024-01-10', warranty_period_months: 36, warranty_expiry: '2027-01-10' },
      { customer_id: customers[6].id, brand: 'Samsung', model: 'Galaxy Buds 2 Pro', serial_number: 'SN-B2P-6612', category: 'Audio', purchase_date: '2025-11-25', warranty_period_months: 12, warranty_expiry: '2026-11-25' },
      { customer_id: customers[7].id, brand: 'Samsung', model: 'Galaxy S23 FE', serial_number: 'SN-S23FE-2231', category: 'Smartphone', purchase_date: '2025-03-01', warranty_period_months: 12, warranty_expiry: '2026-03-01' },
      { customer_id: customers[8].id, brand: 'Samsung', model: 'Double Door Curd Maestro Refrigerator 324L', serial_number: 'SN-RF324-9043', category: 'Home Appliance', purchase_date: '2023-11-15', warranty_period_months: 24, warranty_expiry: '2025-11-15' },
      { customer_id: customers[9].id, brand: 'Samsung', model: 'Galaxy S24', serial_number: 'SN-S24-6754', category: 'Smartphone', purchase_date: '2026-03-10', warranty_period_months: 12, warranty_expiry: '2027-03-10' },
      { customer_id: customers[1].id, brand: 'Samsung', model: 'Galaxy Book 3 Pro 360', serial_number: 'SN-GB3P-1123', category: 'Laptop', purchase_date: '2025-07-20', warranty_period_months: 12, warranty_expiry: '2026-07-20' },
      { customer_id: customers[2].id, brand: 'Samsung', model: 'Soundbar HW-Q990C', serial_number: 'SN-SBQ-8890', category: 'Audio', purchase_date: '2025-09-02', warranty_period_months: 12, warranty_expiry: '2026-09-02' },
      { customer_id: customers[3].id, brand: 'Samsung', model: 'Galaxy Z Flip 5', serial_number: 'SN-ZF5F-4456', category: 'Smartphone', purchase_date: '2025-08-30', warranty_period_months: 12, warranty_expiry: '2026-08-30' },
      { customer_id: customers[4].id, brand: 'Samsung', model: 'WindFree Inverter Split AC 1.5T', serial_number: 'SN-AC15-9988', category: 'Home Appliance', purchase_date: '2024-03-15', warranty_period_months: 60, warranty_expiry: '2029-03-15' },
    ]);

    // 4. Seed Spare Parts (30 items with stock and reorder levels)
    console.log('⚙️ Seeding spare parts inventory...');
    const spareParts = await SparePart.bulkCreate([
      { part_name: 'Dynamic AMOLED 2X Panel (S24 Ultra)', part_number: 'SEC-DISP-S24U', category: 'Display', quantity_in_stock: 6, unit_price: 18500.00, reorder_level: 3 },
      { part_name: 'Super AMOLED Display (S24)', part_number: 'SEC-DISP-S24', category: 'Display', quantity_in_stock: 8, unit_price: 12000.00, reorder_level: 4 },
      { part_name: 'Infinity Flex Foldable Display (Z Fold 5)', part_number: 'SEC-DISP-ZF5', category: 'Display', quantity_in_stock: 2, unit_price: 32000.00, reorder_level: 2 },
      { part_name: 'AMOLED Assembly (Tab S9 Plus)', part_number: 'SEC-DISP-TS9P', category: 'Display', quantity_in_stock: 3, unit_price: 15500.00, reorder_level: 2 },
      { part_name: '5000mAh Battery Pack (S24 Ultra)', part_number: 'SEC-BAT-S24U', category: 'Battery', quantity_in_stock: 15, unit_price: 3200.00, reorder_level: 5 },
      { part_name: '4000mAh Battery Module (S24)', part_number: 'SEC-BAT-S24', category: 'Battery', quantity_in_stock: 12, unit_price: 2800.00, reorder_level: 5 },
      { part_name: 'Dual Cell Battery (Z Fold 5)', part_number: 'SEC-BAT-ZF5', category: 'Battery', quantity_in_stock: 4, unit_price: 4500.00, reorder_level: 3 },
      { part_name: '10090mAh High-Cap Battery (Tab S9+)', part_number: 'SEC-BAT-TS9P', category: 'Battery', quantity_in_stock: 5, unit_price: 5200.00, reorder_level: 3 },
      { part_name: 'USB Type-C Sub-PBA Charging Board (S24U)', part_number: 'SEC-CHG-S24U', category: 'Charging', quantity_in_stock: 18, unit_price: 1800.00, reorder_level: 5 },
      { part_name: 'Type-C Port Board (Galaxy A55)', part_number: 'SEC-CHG-A55', category: 'Charging', quantity_in_stock: 1, unit_price: 1200.00, reorder_level: 5 }, // Low stock!
      { part_name: 'Type-C Sub Board (Tab S9+)', part_number: 'SEC-CHG-TS9P', category: 'Charging', quantity_in_stock: 7, unit_price: 2100.00, reorder_level: 3 },
      { part_name: '200MP Primary Camera Module (S24 Ultra)', part_number: 'SEC-CAM-S24U-200', category: 'Camera', quantity_in_stock: 4, unit_price: 9500.00, reorder_level: 2 },
      { part_name: '50MP Telephoto Periscope Camera', part_number: 'SEC-CAM-S24U-50T', category: 'Camera', quantity_in_stock: 3, unit_price: 6800.00, reorder_level: 2 },
      { part_name: 'Front Selfie Camera 12MP (S24 Series)', part_number: 'SEC-CAM-F12M', category: 'Camera', quantity_in_stock: 14, unit_price: 1900.00, reorder_level: 4 },
      { part_name: 'Main Motherboard PCB (S24U 256GB)', part_number: 'SEC-PCB-S24U256', category: 'Motherboard', quantity_in_stock: 2, unit_price: 28000.00, reorder_level: 2 },
      { part_name: 'Earpiece Speaker & Proximity Flex', part_number: 'SEC-SPK-EAR-S24', category: 'Audio', quantity_in_stock: 20, unit_price: 950.00, reorder_level: 6 },
      { part_name: 'Loudspeaker Module (S24 Series)', part_number: 'SEC-SPK-LOUD-S24', category: 'Audio', quantity_in_stock: 15, unit_price: 1100.00, reorder_level: 4 },
      { part_name: 'Vibrator / Haptic Motor Linear', part_number: 'SEC-MOT-HAPTIC', category: 'Vibration', quantity_in_stock: 10, unit_price: 750.00, reorder_level: 3 },
      { part_name: 'Back Glass Cover Titanium Black (S24U)', part_number: 'SEC-GLS-S24U-TB', category: 'Body Glass', quantity_in_stock: 8, unit_price: 3400.00, reorder_level: 3 },
      { part_name: 'Back Glass Cover Onyx Black (S24)', part_number: 'SEC-GLS-S24-OB', category: 'Body Glass', quantity_in_stock: 2, unit_price: 2900.00, reorder_level: 3 }, // Low stock!
      { part_name: '55" Neo QLED Power Supply Board (SMPS)', part_number: 'SEC-TV-SMPS-55Q', category: 'Television', quantity_in_stock: 3, unit_price: 6500.00, reorder_level: 2 },
      { part_name: '55" T-Con Logic Board 120Hz', part_number: 'SEC-TV-TCON-55Q', category: 'Television', quantity_in_stock: 2, unit_price: 4200.00, reorder_level: 2 },
      { part_name: 'QLED LED Backlight Strips Set (55")', part_number: 'SEC-TV-BLIGHT-55', category: 'Television', quantity_in_stock: 1, unit_price: 3800.00, reorder_level: 2 }, // Low stock!
      { part_name: 'Front Load Washer Drain Pump Assembly', part_number: 'SEC-WM-PUMP-FL8', category: 'Washing Machine', quantity_in_stock: 5, unit_price: 2400.00, reorder_level: 2 },
      { part_name: 'Digital Inverter Motor Belt (8Kg)', part_number: 'SEC-WM-BELT-8K', category: 'Washing Machine', quantity_in_stock: 9, unit_price: 850.00, reorder_level: 3 },
      { part_name: 'Door Lock Switch Mechanism (Washing Machine)', part_number: 'SEC-WM-DLOCK-01', category: 'Washing Machine', quantity_in_stock: 7, unit_price: 1250.00, reorder_level: 3 },
      { part_name: 'Digital Inverter Refrigerator PCB Control Board', part_number: 'SEC-RF-PCB-324L', category: 'Refrigerator', quantity_in_stock: 3, unit_price: 4600.00, reorder_level: 2 },
      { part_name: 'Defrost Heater Tube & Thermostat Kit', part_number: 'SEC-RF-HEATER-KIT', category: 'Refrigerator', quantity_in_stock: 6, unit_price: 1650.00, reorder_level: 2 },
      { part_name: 'Air Conditioner Inverter Outdoor PCB', part_number: 'SEC-AC-PCB-OUT15', category: 'Air Conditioner', quantity_in_stock: 2, unit_price: 7800.00, reorder_level: 2 },
      { part_name: 'AC Indoor Blower Motor 1.5 Ton', part_number: 'SEC-AC-BLOWER-15', category: 'Air Conditioner', quantity_in_stock: 3, unit_price: 3100.00, reorder_level: 2 },
    ]);

    // 5. Seed Service Tickets (20 tickets covering all 7 lifecycle statuses)
    console.log('🎫 Seeding service tickets...');
    const ticketData = [
      // 1. RECEIVED
      {
        ticket_number: 'SVC-20260901-001',
        customer_id: customers[0].id,
        device_id: devices[0].id,
        technician_id: tech1.id,
        status: 'RECEIVED',
        priority: 'HIGH',
        complaint_description: 'Dropped phone; screen cracked and touch input is erratic on the right side.',
        diagnosis_notes: null,
        repair_notes: null,
        estimated_cost: 19000.00,
        createdAt: '2026-09-01T09:30:00Z',
      },
      // 2. DIAGNOSING
      {
        ticket_number: 'SVC-20260901-002',
        customer_id: customers[1].id,
        device_id: devices[2].id,
        technician_id: tech1.id,
        status: 'DIAGNOSING',
        priority: 'URGENT',
        complaint_description: 'Crease line visible across main folding screen; intermittent black line appearing.',
        diagnosis_notes: 'Undergoing optical and flex cable inspection under microscope. Inner hinge mechanism checked.',
        repair_notes: null,
        estimated_cost: 33000.00,
        createdAt: '2026-09-01T10:15:00Z',
      },
      // 3. WAITING_FOR_PARTS
      {
        ticket_number: 'SVC-20260901-003',
        customer_id: customers[2].id,
        device_id: devices[3].id,
        technician_id: tech2.id,
        status: 'WAITING_FOR_PARTS',
        priority: 'MEDIUM',
        complaint_description: 'TV display turns dark on the top half after 15 minutes of playback.',
        diagnosis_notes: 'Backlight array diode failure identified in Section B.',
        repair_notes: 'Awaiting specialized QLED LED Backlight Strip Kit from regional warehouse.',
        estimated_cost: 4500.00,
        createdAt: '2026-09-01T11:00:00Z',
      },
      // 4. REPAIRING
      {
        ticket_number: 'SVC-20260902-001',
        customer_id: customers[3].id,
        device_id: devices[4].id,
        technician_id: tech1.id,
        status: 'REPAIRING',
        priority: 'MEDIUM',
        complaint_description: 'Battery drains rapidly within 2 hours of normal browsing.',
        diagnosis_notes: 'Battery health report shows 68% cell degradation. Current leakage test passed.',
        repair_notes: 'Replacing original 10090mAh battery module and applying new water-resistant thermal adhesive.',
        estimated_cost: 5700.00,
        createdAt: '2026-09-02T09:00:00Z',
      },
      // 5. READY
      {
        ticket_number: 'SVC-20260902-002',
        customer_id: customers[4].id,
        device_id: devices[5].id,
        technician_id: tech2.id,
        status: 'READY',
        priority: 'LOW',
        complaint_description: 'Device not charging unless cable is pushed hard to one side.',
        diagnosis_notes: 'Dust build-up & bent contact pins inside USB-C sub-board port.',
        repair_notes: 'Replaced USB Type-C Sub-PBA board. Full 25W Super Fast Charging verified with original tester.',
        estimated_cost: 1700.00,
        completed_at: '2026-09-02T16:30:00Z',
        createdAt: '2026-09-02T10:30:00Z',
      },
      // 6. DELIVERED
      {
        ticket_number: 'SVC-20260902-003',
        customer_id: customers[5].id,
        device_id: devices[6].id,
        technician_id: tech2.id,
        status: 'DELIVERED',
        priority: 'HIGH',
        complaint_description: 'Washing machine stops during spin cycle with 5C error code.',
        diagnosis_notes: 'Foreign obstruction burned out the drain pump motor coil.',
        repair_notes: 'Installed new OEM drain pump assembly. Run 15-min quick wash and spin calibration test.',
        estimated_cost: 3000.00,
        completed_at: '2026-09-02T15:00:00Z',
        delivered_at: '2026-09-03T11:00:00Z',
        createdAt: '2026-09-02T11:00:00Z',
      },
      // 7. CANCELLED
      {
        ticket_number: 'SVC-20260902-004',
        customer_id: customers[6].id,
        device_id: devices[7].id,
        technician_id: tech1.id,
        status: 'CANCELLED',
        priority: 'LOW',
        complaint_description: 'Left earbud volume significantly quieter than right.',
        diagnosis_notes: 'Severe earwax clogging in speaker mesh grill.',
        repair_notes: 'Customer opted out of paid service after technician cleaned mesh for free on spot.',
        estimated_cost: 0.00,
        completed_at: '2026-09-02T13:00:00Z',
        createdAt: '2026-09-02T12:15:00Z',
      },
      // Additional tickets for rich dashboard analytics
      {
        ticket_number: 'SVC-20260902-005',
        customer_id: customers[7].id,
        device_id: devices[8].id,
        technician_id: tech1.id,
        status: 'DELIVERED',
        priority: 'MEDIUM',
        complaint_description: 'Camera app force closes when switching to 3x telephoto zoom.',
        diagnosis_notes: 'OIS coil failure in telephoto module.',
        repair_notes: 'Replaced rear telephoto module and calibrated gyroscope sensors.',
        estimated_cost: 7500.00,
        completed_at: '2026-09-02T17:00:00Z',
        delivered_at: '2026-09-03T10:00:00Z',
        createdAt: '2026-09-02T13:45:00Z',
      },
      {
        ticket_number: 'SVC-20260903-001',
        customer_id: customers[8].id,
        device_id: devices[9].id,
        technician_id: tech2.id,
        status: 'READY',
        priority: 'HIGH',
        complaint_description: 'Refrigerator freezer cooling fine but lower fresh food compartment not cooling.',
        diagnosis_notes: 'Defrost heating element burnt out causing ice block over air circulation damper.',
        repair_notes: 'Replaced defrost heater kit and cleared ice blockage.',
        estimated_cost: 2400.00,
        completed_at: '2026-09-03T14:30:00Z',
        createdAt: '2026-09-03T08:30:00Z',
      },
      {
        ticket_number: 'SVC-20260903-002',
        customer_id: customers[9].id,
        device_id: devices[10].id,
        technician_id: tech1.id,
        status: 'RECEIVED',
        priority: 'MEDIUM',
        complaint_description: 'Back cover scratched and cracked after dropping on asphalt.',
        diagnosis_notes: null,
        repair_notes: null,
        estimated_cost: 3500.00,
        createdAt: '2026-09-03T09:15:00Z',
      },
      {
        ticket_number: 'SVC-20260903-003',
        customer_id: customers[1].id,
        device_id: devices[11].id,
        technician_id: tech2.id,
        status: 'DIAGNOSING',
        priority: 'URGENT',
        complaint_description: 'Galaxy Book laptop 360 hinge loose and screen flickers when tilted.',
        diagnosis_notes: 'Testing EDP display cable harness through 360-degree rotation.',
        repair_notes: null,
        estimated_cost: 5000.00,
        createdAt: '2026-09-03T09:45:00Z',
      },
      {
        ticket_number: 'SVC-20260903-004',
        customer_id: customers[2].id,
        device_id: devices[12].id,
        technician_id: tech2.id,
        status: 'REPAIRING',
        priority: 'LOW',
        complaint_description: 'Soundbar subwoofer loses wireless sync randomly.',
        diagnosis_notes: 'Faulty 5.8GHz wireless RF receiver module.',
        repair_notes: 'Replacing RF wireless sync sub-board and updating firmware.',
        estimated_cost: 2100.00,
        createdAt: '2026-09-03T10:20:00Z',
      },
      {
        ticket_number: 'SVC-20260903-005',
        customer_id: customers[3].id,
        device_id: devices[13].id,
        technician_id: tech1.id,
        status: 'READY',
        priority: 'MEDIUM',
        complaint_description: 'Cover screen on Flip 5 not responding to touch.',
        diagnosis_notes: 'Loose display flex connector inside upper chassis.',
        repair_notes: 'Re-seated flex connector with new thermal retention bracket. Passed diagnostic touch grid.',
        estimated_cost: 1500.00,
        completed_at: '2026-09-03T15:00:00Z',
        createdAt: '2026-09-03T11:05:00Z',
      },
      {
        ticket_number: 'SVC-20260903-006',
        customer_id: customers[4].id,
        device_id: devices[14].id,
        technician_id: tech2.id,
        status: 'WAITING_FOR_PARTS',
        priority: 'HIGH',
        complaint_description: 'AC outdoor unit fan making rattling loud noise and tripping breaker.',
        diagnosis_notes: 'Outdoor inverter motor PCB shorted due to high surge voltage.',
        repair_notes: 'Part requested from central store.',
        estimated_cost: 8500.00,
        createdAt: '2026-09-03T11:40:00Z',
      },
      {
        ticket_number: 'SVC-20260903-007',
        customer_id: customers[0].id,
        device_id: devices[1].id,
        technician_id: tech1.id,
        status: 'DELIVERED',
        priority: 'LOW',
        complaint_description: 'Rotating bezel on Galaxy Watch feels stiff and sticky.',
        diagnosis_notes: 'Ingress of sugary beverage residue under bezel ring.',
        repair_notes: 'Ultrasonic cleaning of bezel ring ball bearings and replaced water-resistant O-rings.',
        estimated_cost: 800.00,
        completed_at: '2026-09-03T13:00:00Z',
        delivered_at: '2026-09-03T16:00:00Z',
        createdAt: '2026-09-03T12:00:00Z',
      },
      {
        ticket_number: 'SVC-20260903-008',
        customer_id: customers[5].id,
        device_id: devices[6].id,
        technician_id: tech2.id,
        status: 'RECEIVED',
        priority: 'MEDIUM',
        complaint_description: 'Detergent drawer dispensing leak from front fascia during initial cycle fill.',
        diagnosis_notes: null,
        repair_notes: null,
        estimated_cost: 1200.00,
        createdAt: '2026-09-03T13:10:00Z',
      },
      {
        ticket_number: 'SVC-20260903-009',
        customer_id: customers[6].id,
        device_id: devices[7].id,
        technician_id: tech1.id,
        status: 'REPAIRING',
        priority: 'HIGH',
        complaint_description: 'Charging case will not hold charge or illuminate LED.',
        diagnosis_notes: 'Internal lithium pouch cell bulged.',
        repair_notes: 'Swapping charging cradle logic board and battery cell.',
        estimated_cost: 2500.00,
        createdAt: '2026-09-03T14:00:00Z',
      },
      {
        ticket_number: 'SVC-20260903-010',
        customer_id: customers[7].id,
        device_id: devices[8].id,
        technician_id: tech1.id,
        status: 'RECEIVED',
        priority: 'URGENT',
        complaint_description: 'Phone fell in swimming pool; powers on but shows moisture detected in USB port error constantly.',
        diagnosis_notes: null,
        repair_notes: null,
        estimated_cost: 2200.00,
        createdAt: '2026-09-03T14:40:00Z',
      },
      {
        ticket_number: 'SVC-20260903-011',
        customer_id: customers[8].id,
        device_id: devices[9].id,
        technician_id: tech2.id,
        status: 'RECEIVED',
        priority: 'LOW',
        complaint_description: 'Door handle gasket loose on refrigerator door.',
        diagnosis_notes: null,
        repair_notes: null,
        estimated_cost: 950.00,
        createdAt: '2026-09-03T15:20:00Z',
      },
      {
        ticket_number: 'SVC-20260903-012',
        customer_id: customers[9].id,
        device_id: devices[10].id,
        technician_id: tech1.id,
        status: 'DIAGNOSING',
        priority: 'MEDIUM',
        complaint_description: 'Microphone not picking up audio during WhatsApp calls; speakerphone works.',
        diagnosis_notes: 'Investigating secondary noise-cancellation microphone port for blockage.',
        repair_notes: null,
        estimated_cost: 1600.00,
        createdAt: '2026-09-03T15:50:00Z',
      },
    ];

    const tickets = await ServiceTicket.bulkCreate(ticketData);

    // 6. Seed Ticket Parts (Parts consumed on repair)
    console.log('🔗 Attaching parts consumed to tickets...');
    await TicketPart.bulkCreate([
      // Ticket 4: Tab S9 battery replacement
      { ticket_id: tickets[3].id, part_id: spareParts[7].id, quantity_used: 1, price_charged: 5200.00 },
      // Ticket 5: A55 USB Sub board
      { ticket_id: tickets[4].id, part_id: spareParts[9].id, quantity_used: 1, price_charged: 1200.00 },
      // Ticket 6: Washing Machine drain pump
      { ticket_id: tickets[5].id, part_id: spareParts[23].id, quantity_used: 1, price_charged: 2400.00 },
      // Ticket 8: S23 FE Telephoto module
      { ticket_id: tickets[7].id, part_id: spareParts[12].id, quantity_used: 1, price_charged: 6800.00 },
      // Ticket 9: Refrigerator defrost heater kit
      { ticket_id: tickets[8].id, part_id: spareParts[27].id, quantity_used: 1, price_charged: 1650.00 },
    ]);

    // 7. Seed Ticket Timelines
    console.log('📜 Seeding ticket timelines...');
    const timelines = [];
    for (const ticket of tickets) {
      timelines.push({
        ticket_id: ticket.id,
        status: 'RECEIVED',
        notes: 'Ticket generated upon customer walk-in intake.',
        changed_by: recep.id,
        createdAt: ticket.createdAt,
      });

      if (['DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED'].includes(ticket.status)) {
        timelines.push({
          ticket_id: ticket.id,
          status: 'DIAGNOSING',
          notes: 'Technician assigned and begun diagnostic inspection.',
          changed_by: ticket.technician_id,
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 1800000),
        });
      }

      if (['WAITING_FOR_PARTS'].includes(ticket.status)) {
        timelines.push({
          ticket_id: ticket.id,
          status: 'WAITING_FOR_PARTS',
          notes: 'Parts out of stock, waiting for warehouse supply.',
          changed_by: ticket.technician_id,
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 3600000),
        });
      }

      if (['REPAIRING', 'READY', 'DELIVERED'].includes(ticket.status)) {
        timelines.push({
          ticket_id: ticket.id,
          status: 'REPAIRING',
          notes: 'Device opened, component replacement in progress.',
          changed_by: ticket.technician_id,
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 5400000),
        });
      }

      if (['READY', 'DELIVERED'].includes(ticket.status)) {
        timelines.push({
          ticket_id: ticket.id,
          status: 'READY',
          notes: 'Repair verified through quality checklist. Customer notified for pickup.',
          changed_by: ticket.technician_id,
          createdAt: ticket.completed_at || new Date(),
        });
      }

      if (ticket.status === 'DELIVERED') {
        timelines.push({
          ticket_id: ticket.id,
          status: 'DELIVERED',
          notes: 'Handover complete and payment received.',
          changed_by: recep.id,
          createdAt: ticket.delivered_at || new Date(),
        });
      }

      if (ticket.status === 'CANCELLED') {
        timelines.push({
          ticket_id: ticket.id,
          status: 'CANCELLED',
          notes: 'Ticket cancelled per customer request.',
          changed_by: recep.id,
          createdAt: ticket.completed_at || new Date(),
        });
      }
    }
    await TicketTimeline.bulkCreate(timelines);

    // 8. Seed Invoices (5 realistic invoices)
    console.log('🧾 Seeding invoices...');
    await Invoice.bulkCreate([
      {
        invoice_number: 'INV-20260902-001',
        ticket_id: tickets[4].id, // Ready: A55 charging
        customer_id: customers[4].id,
        parts_cost: 1200.00,
        labor_cost: 500.00,
        subtotal: 1700.00,
        tax_rate: 18.00,
        tax_amount: 306.00,
        discount_amount: 0.00,
        total_amount: 2006.00,
        payment_status: 'PENDING',
        payment_method: null,
        paid_at: null,
        notes: 'Awaiting customer walk-in collection.',
      },
      {
        invoice_number: 'INV-20260902-002',
        ticket_id: tickets[5].id, // Delivered: Washer drain pump
        customer_id: customers[5].id,
        parts_cost: 2400.00,
        labor_cost: 600.00,
        subtotal: 3000.00,
        tax_rate: 18.00,
        tax_amount: 540.00,
        discount_amount: 200.00,
        total_amount: 3340.00,
        payment_status: 'PAID',
        payment_method: 'UPI',
        paid_at: '2026-09-03T11:00:00Z',
        notes: 'Paid via GooglePay / UPI ID: kavita.r@okhdfcbank',
      },
      {
        invoice_number: 'INV-20260902-003',
        ticket_id: tickets[7].id, // Delivered: S23 FE Telephoto
        customer_id: customers[7].id,
        parts_cost: 6800.00,
        labor_cost: 700.00,
        subtotal: 7500.00,
        tax_rate: 18.00,
        tax_amount: 1350.00,
        discount_amount: 500.00,
        total_amount: 8350.00,
        payment_status: 'PAID',
        payment_method: 'CARD',
        paid_at: '2026-09-03T10:00:00Z',
        notes: 'HDFC Credit Card POS swipe authorization #77291',
      },
      {
        invoice_number: 'INV-20260903-001',
        ticket_id: tickets[8].id, // Ready: Refrigerator defrost
        customer_id: customers[8].id,
        parts_cost: 1650.00,
        labor_cost: 750.00,
        subtotal: 2400.00,
        tax_rate: 18.00,
        tax_amount: 432.00,
        discount_amount: 0.00,
        total_amount: 2832.00,
        payment_status: 'PENDING',
        payment_method: null,
        paid_at: null,
        notes: 'Bill presented to customer.',
      },
      {
        invoice_number: 'INV-20260903-002',
        ticket_id: tickets[14].id, // Delivered: Watch rotating bezel
        customer_id: customers[0].id,
        parts_cost: 0.00,
        labor_cost: 800.00,
        subtotal: 800.00,
        tax_rate: 18.00,
        tax_amount: 144.00,
        discount_amount: 144.00, // Special waiver
        total_amount: 800.00,
        payment_status: 'PAID',
        payment_method: 'CASH',
        paid_at: '2026-09-03T16:00:00Z',
        notes: 'Cash payment settled at counter.',
      },
    ]);

    // 9. Seed Notifications (15 communication logs)
    console.log('✉️ Seeding notification logs...');
    await Notification.bulkCreate([
      {
        ticket_id: tickets[0].id,
        customer_id: customers[0].id,
        type: 'EMAIL',
        recipient: 'aarav.mehta@example.com',
        subject: 'Service Request Registered - SVC-20260901-001',
        message: 'Dear Aarav, your Samsung Galaxy S24 Ultra has been registered for service. Track status anytime with ticket SVC-20260901-001.',
        status: 'SENT',
        sent_at: '2026-09-01T09:35:00Z',
      },
      {
        ticket_id: tickets[1].id,
        customer_id: customers[1].id,
        type: 'EMAIL',
        recipient: 'sneha.verma@example.com',
        subject: 'Status Update: Diagnosing Device - SVC-20260901-002',
        message: 'Dear Sneha, technician Rahul Sharma has started diagnosing your Galaxy Z Fold 5.',
        status: 'SENT',
        sent_at: '2026-09-01T10:20:00Z',
      },
      {
        ticket_id: tickets[2].id,
        customer_id: customers[2].id,
        type: 'EMAIL',
        recipient: 'vikram.s@example.com',
        subject: 'Status Update: Parts on Order - SVC-20260901-003',
        message: 'Dear Vikram, your 55" Neo QLED TV requires a backlight component. We have expedited the order.',
        status: 'SENT',
        sent_at: '2026-09-01T11:30:00Z',
      },
      {
        ticket_id: tickets[3].id,
        customer_id: customers[3].id,
        type: 'EMAIL',
        recipient: 'ananya.iyer@example.com',
        subject: 'Status Update: Repair in Progress - SVC-20260902-001',
        message: 'Dear Ananya, repair is currently underway for your Galaxy Tab S9 Plus.',
        status: 'SENT',
        sent_at: '2026-09-02T09:30:00Z',
      },
      {
        ticket_id: tickets[4].id,
        customer_id: customers[4].id,
        type: 'EMAIL',
        recipient: 'rohan.d@example.com',
        subject: 'Your Device is Ready for Pickup! - SVC-20260902-002',
        message: 'Dear Rohan, repair on your Galaxy A55 5G is complete. Please collect it from our service center.',
        status: 'SENT',
        sent_at: '2026-09-02T16:35:00Z',
      },
      {
        ticket_id: tickets[5].id,
        customer_id: customers[5].id,
        type: 'EMAIL',
        recipient: 'kavita.reddy@example.com',
        subject: 'Invoice & Handover Notice - INV-20260902-002',
        message: 'Dear Kavita, thank you for visiting Samsung Service Care. Your receipt INV-20260902-002 for ₹3,340 has been settled.',
        status: 'SENT',
        sent_at: '2026-09-03T11:05:00Z',
      },
      {
        ticket_id: tickets[6].id,
        customer_id: customers[6].id,
        type: 'EMAIL',
        recipient: 'deepak.j@example.com',
        subject: 'Service Cancellation Notice - SVC-20260902-004',
        message: 'Dear Deepak, ticket SVC-20260902-004 for your Galaxy Buds 2 Pro has been closed as cancelled.',
        status: 'SENT',
        sent_at: '2026-09-02T13:05:00Z',
      },
      {
        ticket_id: tickets[7].id,
        customer_id: customers[7].id,
        type: 'EMAIL',
        recipient: 'meera.nair@example.com',
        subject: 'Invoice INV-20260902-003 Paid',
        message: 'Dear Meera, invoice INV-20260902-003 has been paid successfully via card.',
        status: 'SENT',
        sent_at: '2026-09-03T10:05:00Z',
      },
      {
        ticket_id: tickets[8].id,
        customer_id: customers[8].id,
        type: 'EMAIL',
        recipient: 'siddharth.rao@example.com',
        subject: 'Repair Complete - SVC-20260903-001',
        message: 'Dear Siddharth, your Samsung Refrigerator repair is ready. Total invoice amount is ₹2,832.',
        status: 'SENT',
        sent_at: '2026-09-03T14:35:00Z',
      },
      {
        ticket_id: tickets[9].id,
        customer_id: customers[9].id,
        type: 'EMAIL',
        recipient: 'pooja.b@example.com',
        subject: 'Service Intake Confirmation - SVC-20260903-002',
        message: 'Dear Pooja, your Galaxy S24 back panel replacement ticket is received.',
        status: 'SENT',
        sent_at: '2026-09-03T09:20:00Z',
      },
      {
        ticket_id: tickets[10].id,
        customer_id: customers[1].id,
        type: 'EMAIL',
        recipient: 'sneha.verma@example.com',
        subject: 'Technician Assigned - SVC-20260903-003',
        message: 'Dear Sneha, technician Amit Kumar is assigned to your Galaxy Book 3 Pro 360.',
        status: 'SENT',
        sent_at: '2026-09-03T09:50:00Z',
      },
      {
        ticket_id: tickets[11].id,
        customer_id: customers[2].id,
        type: 'EMAIL',
        recipient: 'vikram.s@example.com',
        subject: 'Repair Underway - SVC-20260903-004',
        message: 'Dear Vikram, parts have been fitted and calibration is underway for your Soundbar HW-Q990C.',
        status: 'SENT',
        sent_at: '2026-09-03T10:25:00Z',
      },
      {
        ticket_id: tickets[12].id,
        customer_id: customers[3].id,
        type: 'EMAIL',
        recipient: 'ananya.iyer@example.com',
        subject: 'Your Galaxy Z Flip 5 is Ready for Pickup - SVC-20260903-005',
        message: 'Dear Ananya, your Flip 5 cover screen has been repaired and is ready for collection.',
        status: 'SENT',
        sent_at: '2026-09-03T15:05:00Z',
      },
      {
        ticket_id: tickets[13].id,
        customer_id: customers[4].id,
        type: 'EMAIL',
        recipient: 'rohan.d@example.com',
        subject: 'Parts Ordered - SVC-20260903-006',
        message: 'Dear Rohan, AC Inverter PCB has been indented from national warehouse.',
        status: 'SENT',
        sent_at: '2026-09-03T11:45:00Z',
      },
      {
        ticket_id: tickets[14].id,
        customer_id: customers[0].id,
        type: 'EMAIL',
        recipient: 'aarav.mehta@example.com',
        subject: 'Handover Completed - SVC-20260903-007',
        message: 'Dear Aarav, thank you for servicing your Galaxy Watch with us.',
        status: 'SENT',
        sent_at: '2026-09-03T16:05:00Z',
      },
    ]);

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedDatabase();

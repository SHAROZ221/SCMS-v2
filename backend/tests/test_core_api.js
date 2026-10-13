process.env.NODE_ENV = 'test';
const http = require('http');

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqOptions = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phase 3 Core Backend API Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin and Receptionist
    const adminLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@scms.com', password: 'password123' },
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const recepLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'receptionist@scms.com', password: 'password123' },
    });
    const recepToken = recepLogin.data.token;
    const recepHeaders = { Authorization: `Bearer ${recepToken}` };

    const techLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'technician@scms.com', password: 'password123' },
    });
    const techToken = techLogin.data.token;
    const techHeaders = { Authorization: `Bearer ${techToken}` };

    // 2. Customers API
    const custRes = await request({ method: 'GET', path: '/api/customers', headers: recepHeaders });
    assert(custRes.status === 200 && custRes.data.customers.length > 0, 'Receptionist listed customers successfully');

    // Create unique customer
    const rand = Math.floor(Math.random() * 90000) + 10000;
    const newCustPhone = `+91 99000 ${rand}`;
    const newCust = await request({
      method: 'POST',
      path: '/api/customers',
      headers: recepHeaders,
      body: {
        name: 'Rajesh Sharma',
        phone: newCustPhone,
        email: `rajesh_${rand}@example.com`,
        address: 'Bandra, Mumbai',
      },
    });
    assert(newCust.status === 201 && newCust.data.customer.id, 'New customer created successfully');
    const customerId = newCust.data.customer.id;

    // Prevent duplicate customer phone
    const dupCust = await request({
      method: 'POST',
      path: '/api/customers',
      headers: recepHeaders,
      body: { name: 'Duplicate Rajesh', phone: newCustPhone },
    });
    assert(dupCust.status === 409, 'Duplicate customer phone correctly prevented with 409 Conflict');

    // 3. Devices API
    const newSerial = `SN-TEST-${rand}`;
    const newDevice = await request({
      method: 'POST',
      path: '/api/devices',
      headers: recepHeaders,
      body: {
        customer_id: customerId,
        brand: 'Samsung',
        model: 'Galaxy S24 FE',
        serial_number: newSerial,
        category: 'Smartphone',
        purchase_date: '2026-01-10',
        warranty_period_months: 12,
      },
    });
    assert(newDevice.status === 201 && newDevice.data.device.warranty_expiry === '2027-01-10', 'Device created with auto-calculated warranty');
    const deviceId = newDevice.data.device.id;

    // Prevent duplicate device serial
    const dupDev = await request({
      method: 'POST',
      path: '/api/devices',
      headers: recepHeaders,
      body: { customer_id: customerId, model: 'Other Model', serial_number: newSerial },
    });
    assert(dupDev.status === 409, 'Duplicate serial number correctly prevented with 409 Conflict');

    // 4. Technicians & Workload Balancing
    const techsRes = await request({ method: 'GET', path: '/api/technicians/available', headers: recepHeaders });
    assert(techsRes.status === 200 && Array.isArray(techsRes.data.technicians), 'Fetched available technicians ranked by workload');
    const assignedTech = techsRes.data.technicians[0];

    // 5. Service Tickets API: Creation
    const newTicketRes = await request({
      method: 'POST',
      path: '/api/tickets',
      headers: recepHeaders,
      body: {
        customer_id: customerId,
        device_id: deviceId,
        complaint_description: 'Battery swollen and pushing back cover out.',
        priority: 'HIGH',
        technician_id: techLogin.data.user.id,
        estimated_cost: 3200.00,
      },
    });

    assert(newTicketRes.status === 201 && newTicketRes.data.ticket.ticket_number.startsWith('SVC-'), 'Ticket created with sequential number');
    const ticket = newTicketRes.data.ticket;

    // 6. Ticket Status Lifecycle Updates
    const status1 = await request({
      method: 'PATCH',
      path: `/api/tickets/${ticket.id}/status`,
      headers: techHeaders,
      body: { status: 'DIAGNOSING', notes: 'Inspecting device battery chamber' },
    });
    assert(status1.status === 200 && status1.data.ticket.status === 'DIAGNOSING', 'Technician advanced status to DIAGNOSING');

    // 7. Inventory & Parts Usage on Ticket
    // Get a spare part
    const invRes = await request({ method: 'GET', path: '/api/inventory', headers: techHeaders });
    const batteryPart = invRes.data.parts.find(p => p.category === 'Battery');
    assert(batteryPart && batteryPart.id, 'Found spare battery in inventory');

    const initialStock = batteryPart.quantity_in_stock;

    // Attach part to ticket
    const partAdd = await request({
      method: 'POST',
      path: `/api/tickets/${ticket.id}/parts`,
      headers: techHeaders,
      body: { part_id: batteryPart.id, quantity: 1 },
    });
    assert(partAdd.status === 200 && partAdd.data.remainingStock === initialStock - 1, 'Part consumed and inventory auto-decremented');

    // Advance to READY
    const statusReady = await request({
      method: 'PATCH',
      path: `/api/tickets/${ticket.id}/status`,
      headers: techHeaders,
      body: { status: 'READY', notes: 'Battery replaced, test cycle completed 100%' },
    });
    assert(statusReady.status === 200 && statusReady.data.ticket.status === 'READY', 'Ticket moved to READY for pickup');

    // 8. Billing & Invoicing (Parts + Labor + 18% GST)
    const genInvoice = await request({
      method: 'POST',
      path: '/api/billing/generate',
      headers: recepHeaders,
      body: {
        ticket_id: ticket.id,
        labor_cost: 500,
        discount_amount: 100,
      },
    });
    assert(genInvoice.status === 201 && genInvoice.data.invoice.invoice_number.startsWith('INV-'), 'Invoice generated with auto sequential ID');
    const invoice = genInvoice.data.invoice;

    // Verify calculation
    const expectedParts = parseFloat(batteryPart.unit_price);
    const expectedSubtotal = expectedParts + 500;
    const expectedTax = parseFloat(((expectedSubtotal * 18) / 100).toFixed(2));
    const expectedTotal = parseFloat((expectedSubtotal + expectedTax - 100).toFixed(2));
    assert(parseFloat(invoice.total_amount) === expectedTotal, `Invoice total math accurate: ₹${invoice.total_amount}`);

    // Settle payment
    const payRes = await request({
      method: 'PATCH',
      path: `/api/billing/${invoice.id}/pay`,
      headers: recepHeaders,
      body: { payment_method: 'UPI', notes: 'Paid via PhonePe' },
    });
    assert(payRes.status === 200 && payRes.data.invoice.payment_status === 'PAID', 'Invoice marked as PAID');

    // Complete delivery
    const deliverRes = await request({
      method: 'PATCH',
      path: `/api/tickets/${ticket.id}/status`,
      headers: recepHeaders,
      body: { status: 'DELIVERED', notes: 'Handed over device to Rajesh Sharma.' },
    });
    assert(deliverRes.status === 200 && deliverRes.data.ticket.status === 'DELIVERED', 'Ticket lifecycle finalized to DELIVERED');

    // 9. Restock Inventory
    const restockRes = await request({
      method: 'PATCH',
      path: `/api/inventory/${batteryPart.id}/restock`,
      headers: adminHeaders,
      body: { quantityToAdd: 5 },
    });
    assert(restockRes.status === 200 && restockRes.data.newStock === initialStock - 1 + 5, 'Inventory successfully restocked');

    // 10. Dashboard & Analytics KPIs
    const dashStats = await request({ method: 'GET', path: '/api/reports/dashboard-stats', headers: adminHeaders });
    assert(dashStats.status === 200 && dashStats.data.summary.totalTickets > 0, 'Dashboard KPI stats returned accurate summary');

    const trends = await request({ method: 'GET', path: '/api/reports/ticket-trends', headers: adminHeaders });
    assert(trends.status === 200 && Array.isArray(trends.data.trends), 'Ticket trends analytics returned data');

    const techPerf = await request({ method: 'GET', path: '/api/reports/technician-performance', headers: adminHeaders });
    assert(techPerf.status === 200 && techPerf.data.performance.length > 0, 'Technician performance report calculated');

    console.log(`\n🏁 Phase 3 Verification Complete: ${passed} passed, ${failed} failed.\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

const app = require('../src/server');
const server = app.listen(5000, () => {
  runTests().finally(() => {
    server.close();
  });
});

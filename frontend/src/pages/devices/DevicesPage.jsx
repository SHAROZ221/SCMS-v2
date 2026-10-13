import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Smartphone, Plus, ShieldCheck, ShieldAlert, User, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Smartphone',
  'Tablet',
  'Television',
  'Home Appliance',
  'Audio',
  'Wearable',
  'Laptop',
  'Other',
];

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal & form states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    brand: 'Samsung',
    model: '',
    serial_number: '',
    category: 'Smartphone',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_period_months: 12,
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/devices', {
        params: {
          q: search,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
        },
      });
      setDevices(res.data.devices || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
      toast.error('Failed to load registered devices.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers', { params: { limit: 100 } });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers dropdown:', err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchCustomersList();
  }, []);

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast.error('Please select an owner customer.');
      return;
    }
    if (!formData.model || !formData.serial_number) {
      toast.error('Model and Serial Number are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/devices', formData);
      toast.success('Device registered successfully with warranty validation!');
      setIsNewModalOpen(false);
      setFormData({
        customer_id: '',
        brand: 'Samsung',
        model: '',
        serial_number: '',
        category: 'Smartphone',
        purchase_date: new Date().toISOString().split('T')[0],
        warranty_period_months: 12,
      });
      fetchDevices();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to register device.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check warranty
  const isUnderWarranty = (expiry) => {
    if (!expiry) return false;
    const today = new Date().toISOString().split('T')[0];
    return expiry >= today;
  };

  const columns = [
    {
      header: 'Device & Model',
      accessor: 'model',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-samsung-blue">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.model}</p>
            <p className="text-[11px] text-slate-500">{row.brand} &bull; {row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Serial Number',
      accessor: 'serial_number',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
          {row.serial_number}
        </span>
      ),
    },
    {
      header: 'Customer Owner',
      accessor: 'customer',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.customer?.name || 'Walk-in'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.customer?.phone}</p>
        </div>
      ),
    },
    {
      header: 'Purchase Date',
      accessor: 'purchase_date',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.purchase_date || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Warranty Status',
      accessor: 'warranty_expiry',
      render: (row) => {
        const active = isUnderWarranty(row.warranty_expiry);
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit border ${
                active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {active ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <ShieldAlert className="w-3 h-3 text-slate-400" />}
              {active ? 'Under Warranty' : 'Out of Warranty'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Exp: {row.warranty_expiry || 'Not set'}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Device Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered customer electronics with real-time warranty validation
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Device</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? 'bg-samsung-blue text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Devices DataTable */}
      <DataTable
        columns={columns}
        data={devices}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by model, serial number, brand..."
        emptyMessage="No devices registered matching search filter."
      />

      {/* Modal: Register Device */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register New Device"
      >
        <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
          <div>
            <label htmlFor="dev-customer" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Customer Owner *
            </label>
            <select
              id="dev-customer"
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dev-brand" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Brand *
              </label>
              <input
                id="dev-brand"
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="dev-cat" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                id="dev-cat"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dev-model" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Model Name *
              </label>
              <input
                id="dev-model"
                type="text"
                required
                placeholder="e.g. Galaxy S24 Ultra"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="dev-serial" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Serial Number * (Must be unique)
              </label>
              <input
                id="dev-serial"
                type="text"
                required
                placeholder="e.g. SN-S24U-9901"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dev-purchase" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Purchase Date
              </label>
              <input
                id="dev-purchase"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="dev-warranty" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Warranty Period (Months)
              </label>
              <input
                id="dev-warranty"
                type="number"
                min="0"
                value={formData.warranty_period_months}
                onChange={(e) => setFormData({ ...formData, warranty_period_months: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Save Device'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DevicesPage;

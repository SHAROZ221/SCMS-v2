import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Users, Plus, Phone, Mail, MapPin, Smartphone, Ticket, Edit, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async (pageNumber = 1, searchQuery = search) => {
    try {
      setLoading(true);
      const res = await api.get('/customers', {
        params: { page: pageNumber, limit: 10, q: searchQuery },
      });
      setCustomers(res.data.customers || []);
      setPagination(res.data.pagination || { total: 0, pages: 1, page: 1 });
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to load customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, search);
  }, [search]);

  const handleOpenDetail = async (customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(res.data.customer);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error('Failed to load customer details.');
    }
  };

  const handleOpenEdit = (customer, e) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Customer name and phone number are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/customers', formData);
      toast.success('Customer registered successfully!');
      setIsNewModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchCustomers(1, search);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create customer.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/customers/${selectedCustomer.id}`, formData);
      toast.success('Customer updated successfully!');
      setIsEditModalOpen(false);
      fetchCustomers(page, search);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update customer.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-samsung-subtle text-samsung-blue font-bold text-xs flex items-center justify-center">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-400">ID #{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-medium font-mono text-xs">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.phone}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) =>
        row.email ? (
          <div className="flex items-center gap-1.5 text-slate-600 text-xs truncate max-w-[200px]">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{row.email}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">None</span>
        ),
    },
    {
      header: 'Registered Devices',
      accessor: 'devices',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          <Smartphone className="w-3 h-3 text-slate-500" />
          {row.devices ? row.devices.length : 0} devices
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-samsung-blue hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenEdit(row, e)}
            title="Edit Customer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-samsung-blue hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, register, and manage walk-in customers and their devices
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: '' });
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Customer DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer by name, phone, or email..."
        pagination={pagination}
        onPageChange={(p) => fetchCustomers(p, search)}
        emptyMessage="No customers found matching search criteria."
        onRowClick={handleOpenDetail}
      />

      {/* Modal: New Customer */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label htmlFor="c-name" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              id="c-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Verma"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="c-phone" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number * (Must be unique)
            </label>
            <input
              id="c-phone"
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="c-email" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address (For status notifications)
            </label>
            <input
              id="c-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. rahul.verma@example.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="c-address" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Physical Address
            </label>
            <textarea
              id="c-address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full customer residential or delivery address"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
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
              {submitting ? 'Registering...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Customer */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Profile"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
          <div>
            <label htmlFor="edit-name" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="edit-phone" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              id="edit-phone"
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="edit-email" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="edit-address" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Physical Address
            </label>
            <textarea
              id="edit-address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Changes...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Customer Details & History */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Customer Profile & Service History"
        maxWidth="max-w-3xl"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            {/* Customer Summary Card */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-samsung-blue text-white font-extrabold text-base flex items-center justify-center">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                  {selectedCustomer.address && (
                    <p className="flex items-center gap-1 text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{selectedCustomer.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Registered Devices */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Registered Devices ({selectedCustomer.devices ? selectedCustomer.devices.length : 0})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCustomer.devices && selectedCustomer.devices.length > 0 ? (
                  selectedCustomer.devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3 shadow-2xs"
                    >
                      <div className="p-2 rounded-lg bg-blue-50 text-samsung-blue">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {device.brand} {device.model}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                          SN: {device.serial_number}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {device.category}
                          </span>
                          {device.warranty_expiry && (
                            <span className="text-slate-400 font-medium">
                              Warranty: {device.warranty_expiry}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic py-2 col-span-2">No registered devices yet.</p>
                )}
              </div>
            </div>

            {/* Service History Tickets */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                Service Tickets History ({selectedCustomer.tickets ? selectedCustomer.tickets.length : 0})
              </h4>
              <div className="space-y-2">
                {selectedCustomer.tickets && selectedCustomer.tickets.length > 0 ? (
                  selectedCustomer.tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-samsung-blue">{t.ticket_number}</p>
                          <p className="text-slate-600 truncate max-w-sm">{t.complaint_description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Created: {new Date(t.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic py-2">No service tickets recorded for this customer.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;

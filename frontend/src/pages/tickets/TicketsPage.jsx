import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Ticket,
  Plus,
  Filter,
  User,
  Smartphone,
  Wrench,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Trash2,
  Receipt,
  FileText,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  'ALL',
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_FOR_PARTS',
  'REPAIRING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

const TicketsPage = () => {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL');
  const [myTicketsOnly, setMyTicketsOnly] = useState(user?.role === 'technician');

  // Modals & Selected Ticket
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('action') === 'new');
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);

  // Form states
  const [customers, setCustomers] = useState([]);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [inventoryParts, setInventoryParts] = useState([]);

  // New Ticket Form
  const [ticketForm, setTicketForm] = useState({
    customer_id: '',
    device_id: '',
    complaint_description: '',
    priority: 'MEDIUM',
    technician_id: '',
    estimated_cost: '',
  });

  // Notes state for detail view
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [partUsageForm, setPartUsageForm] = useState({ part_id: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        q: search,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        my_tickets: myTicketsOnly ? 'true' : undefined,
        limit: 50,
      };
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets', { params }),
        api.get('/tickets/stats'),
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Failed to load service tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, selectedStatus, myTicketsOnly]);

  // Load ticket details if query param has ?id=
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      openTicketDetails(idParam);
    }
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
    }
  }, [searchParams]);

  // Load dropdown resources
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [custRes, techRes, invRes] = await Promise.all([
          api.get('/customers', { params: { limit: 100 } }),
          api.get('/technicians'),
          api.get('/inventory'),
        ]);
        setCustomers(custRes.data.customers || []);
        setTechnicians(techRes.data.technicians || []);
        setInventoryParts(invRes.data.parts || []);
      } catch (err) {
        console.error('Error loading dropdown lists:', err);
      }
    };
    loadPrerequisites();
  }, []);

  // When customer is selected in new ticket, fetch their devices
  const handleCustomerChange = async (customerId) => {
    setTicketForm({ ...ticketForm, customer_id: customerId, device_id: '' });
    if (!customerId) {
      setCustomerDevices([]);
      return;
    }
    try {
      const res = await api.get('/devices', { params: { customer_id: customerId } });
      setCustomerDevices(res.data.devices || []);
    } catch (err) {
      toast.error('Failed to fetch devices for this customer.');
    }
  };

  const openTicketDetails = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setSelectedTicket(res.data.ticket);
      setDiagnosisNotes(res.data.ticket.diagnosis_notes || '');
      setRepairNotes(res.data.ticket.repair_notes || '');
      setIsDetailOpen(true);
    } catch (err) {
      toast.error('Failed to load ticket details.');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.customer_id || !ticketForm.device_id || !ticketForm.complaint_description) {
      toast.error('Please select a customer, device, and describe the complaint.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/tickets', {
        ...ticketForm,
        estimated_cost: parseFloat(ticketForm.estimated_cost) || 0,
      });
      toast.success(`Ticket ${res.data.ticket.ticket_number} created successfully!`);
      setIsNewModalOpen(false);
      setTicketForm({
        customer_id: '',
        device_id: '',
        complaint_description: '',
        priority: 'MEDIUM',
        technician_id: '',
        estimated_cost: '',
      });
      fetchTickets();
      openTicketDetails(res.data.ticket.id);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create ticket.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setSubmitting(true);
      await api.patch(`/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
        notes: `Status transitioned to ${newStatus}.`,
      });
      toast.success(`Ticket status updated to ${newStatus}`);
      openTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSubmitting(true);
      await api.patch(`/tickets/${selectedTicket.id}/notes`, {
        diagnosis_notes: diagnosisNotes,
        repair_notes: repairNotes,
      });
      toast.success('Technician diagnosis and repair notes saved!');
      openTicketDetails(selectedTicket.id);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save notes.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!partUsageForm.part_id) {
      toast.error('Please choose a spare part.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/tickets/${selectedTicket.id}/parts`, partUsageForm);
      toast.success('Spare part attached and inventory stock updated!');
      setIsAddPartModalOpen(false);
      setPartUsageForm({ part_id: '', quantity: 1 });
      openTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to attach part.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePart = async (partId) => {
    if (!window.confirm('Remove this part from the ticket and return to inventory?')) return;
    try {
      await api.delete(`/tickets/${selectedTicket.id}/parts/${partId}`);
      toast.success('Part removed and stock restored.');
      openTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to remove part.');
    }
  };

  const columns = [
    {
      header: 'Ticket #',
      accessor: 'ticket_number',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-samsung-blue text-xs hover:underline">
            {row.ticket_number}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.customer?.name || 'Walk-in'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.customer?.phone}</p>
        </div>
      ),
    },
    {
      header: 'Device',
      accessor: 'device',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.device ? `${row.device.brand} ${row.device.model}` : 'Generic'}</p>
          <p className="text-[11px] text-slate-400 font-mono">SN: {row.device?.serial_number}</p>
        </div>
      ),
    },
    {
      header: 'Complaint',
      accessor: 'complaint_description',
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{row.complaint_description}</p>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Technician',
      accessor: 'technician',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.technician?.name || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Billing',
      accessor: 'invoice',
      render: (row) =>
        row.invoice ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              row.invoice.payment_status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Receipt className="w-3 h-3" />
            {row.invoice.payment_status}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Not billed</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Service Tickets</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and manage device repair lifecycles from reception to customer delivery
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {user?.role === 'technician' && (
            <button
              onClick={() => setMyTicketsOnly(!myTicketsOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                myTicketsOnly
                  ? 'bg-samsung-blue text-white border-samsung-blue'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {myTicketsOnly ? 'Viewing My Assigned Tickets' : 'Show My Tickets Only'}
            </button>
          )}

          {hasRole('admin', 'receptionist') && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {STATUS_TABS.map((status) => {
          const count =
            status === 'ALL'
              ? stats?.total ?? 0
              : stats?.byStatus?.[status] ?? 0;

          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                selectedStatus === status
                  ? 'bg-samsung-blue text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{status.replace(/_/g, ' ')}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedStatus === status
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tickets DataTable */}
      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ticket number, customer, or phone..."
        emptyMessage="No service tickets found matching criteria."
        onRowClick={(row) => openTicketDetails(row.id)}
      />

      {/* Modal: New Service Ticket Walk-in Intake */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Walk-in Customer Service Intake"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label htmlFor="t-customer" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Customer *
            </label>
            <select
              id="t-customer"
              required
              value={ticketForm.customer_id}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="t-device" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Customer Device *
            </label>
            <select
              id="t-device"
              required
              disabled={!ticketForm.customer_id}
              value={ticketForm.device_id}
              onChange={(e) => setTicketForm({ ...ticketForm, device_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue disabled:opacity-50"
            >
              <option value="">-- Choose Device --</option>
              {customerDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model} (SN: {d.serial_number}) - {d.category}
                </option>
              ))}
            </select>
            {ticketForm.customer_id && customerDevices.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                This customer has no devices registered. Please register a device first in Devices page.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="t-complaint" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Customer Complaint Description *
            </label>
            <textarea
              id="t-complaint"
              required
              rows={3}
              value={ticketForm.complaint_description}
              onChange={(e) => setTicketForm({ ...ticketForm, complaint_description: e.target.value })}
              placeholder="e.g. Screen glass cracked, display flickering, touch erratic..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="t-priority" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="t-priority"
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label htmlFor="t-tech" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assign Technician
              </label>
              <select
                id="t-tech"
                value={ticketForm.technician_id}
                onChange={(e) => setTicketForm({ ...ticketForm, technician_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                <option value="">-- Assign Later --</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.activeWorkload} active)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="t-cost" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Est. Cost (₹)
              </label>
              <input
                id="t-cost"
                type="number"
                min="0"
                step="50"
                placeholder="0.00"
                value={ticketForm.estimated_cost}
                onChange={(e) => setTicketForm({ ...ticketForm, estimated_cost: e.target.value })}
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
              {submitting ? 'Creating Ticket...' : 'Generate Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Full Ticket Lifecycle Details & Actions */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedTicket ? `Ticket Details: ${selectedTicket.ticket_number}` : 'Ticket Details'}
        maxWidth="max-w-4xl"
      >
        {selectedTicket && (
          <div className="space-y-6 text-xs">
            {/* Top Overview & Action Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-500 font-mono text-xs">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Status Transition Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedTicket.status === 'RECEIVED' && (
                  <button
                    onClick={() => handleUpdateStatus('DIAGNOSING')}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    Start Diagnosis
                  </button>
                )}
                {selectedTicket.status === 'DIAGNOSING' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('WAITING_FOR_PARTS')}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                    >
                      Wait for Parts
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('REPAIRING')}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                    >
                      Start Repair
                    </button>
                  </>
                )}
                {selectedTicket.status === 'WAITING_FOR_PARTS' && (
                  <button
                    onClick={() => handleUpdateStatus('REPAIRING')}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    Resume Repair
                  </button>
                )}
                {selectedTicket.status === 'REPAIRING' && (
                  <button
                    onClick={() => handleUpdateStatus('READY')}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    Mark Ready for Pickup
                  </button>
                )}
                {selectedTicket.status === 'READY' && (
                  <button
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    Deliver to Customer
                  </button>
                )}
                {!['DELIVERED', 'CANCELLED'].includes(selectedTicket.status) && (
                  <button
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={submitting}
                    className="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Device Meta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-2 text-samsung-blue font-bold">
                  <User className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[11px]">Customer Information</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{selectedTicket.customer?.name}</p>
                <p className="text-slate-600 font-mono mt-0.5">{selectedTicket.customer?.phone}</p>
                {selectedTicket.customer?.email && (
                  <p className="text-slate-500 mt-0.5">{selectedTicket.customer?.email}</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-2 text-samsung-blue font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[11px]">Device Details</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedTicket.device?.brand} {selectedTicket.device?.model}
                </p>
                <p className="text-slate-600 font-mono mt-0.5">SN: {selectedTicket.device?.serial_number}</p>
                <p className="text-slate-500 mt-0.5">Category: {selectedTicket.device?.category}</p>
              </div>
            </div>

            {/* Complaint */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1">
                Customer Complaint
              </span>
              <p className="text-slate-800 text-sm font-medium">{selectedTicket.complaint_description}</p>
            </div>

            {/* Technician Notes Section */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-slate-700 text-xs flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-samsung-blue" />
                  Technician Diagnosis & Repair Notes
                </span>
                {(hasRole('admin', 'technician')) && (
                  <button
                    onClick={handleSaveNotes}
                    disabled={submitting}
                    className="px-3 py-1 bg-samsung-blue hover:bg-samsung-dark text-white font-semibold rounded text-xs cursor-pointer"
                  >
                    Save Notes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="diag-notes" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Diagnosis Observations
                  </label>
                  <textarea
                    id="diag-notes"
                    rows={3}
                    value={diagnosisNotes}
                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                    placeholder="Describe issue found after disassembly..."
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
                  />
                </div>

                <div>
                  <label htmlFor="rep-notes" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Repair Action Taken
                  </label>
                  <textarea
                    id="rep-notes"
                    rows={3}
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="Describe repair procedures completed..."
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
                  />
                </div>
              </div>
            </div>

            {/* Spare Parts Consumed Table */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-samsung-blue" />
                  <span className="font-bold uppercase tracking-wider text-slate-700 text-xs">
                    Spare Parts Consumed (Inventory Deduction)
                  </span>
                </div>
                {(hasRole('admin', 'technician')) && !['DELIVERED', 'CANCELLED'].includes(selectedTicket.status) && (
                  <button
                    onClick={() => setIsAddPartModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Part</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="py-2">Part Name</th>
                      <th className="py-2">Part #</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Price</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTicket.ticketParts && selectedTicket.ticketParts.length > 0 ? (
                      selectedTicket.ticketParts.map((tp) => (
                        <tr key={tp.id}>
                          <td className="py-2 font-medium text-slate-800">{tp.part?.part_name}</td>
                          <td className="py-2 font-mono text-slate-500">{tp.part?.part_number}</td>
                          <td className="py-2">{tp.quantity_used}</td>
                          <td className="py-2 font-semibold text-slate-900">₹{parseFloat(tp.price_charged).toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right">
                            {(hasRole('admin', 'technician')) && !['DELIVERED', 'CANCELLED'].includes(selectedTicket.status) && (
                              <button
                                onClick={() => handleRemovePart(tp.part_id)}
                                title="Remove Part"
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 text-slate-400 italic text-center">
                          No spare parts logged on this repair ticket.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoicing Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-700 text-xs block mb-1">
                  Billing & Invoicing Status
                </span>
                {selectedTicket.invoice ? (
                  <p className="text-slate-700">
                    Invoice generated: <span className="font-mono font-bold text-samsung-blue">{selectedTicket.invoice.invoice_number}</span> &bull; Total: <span className="font-bold text-slate-900">₹{parseFloat(selectedTicket.invoice.total_amount).toLocaleString('en-IN')}</span> ({selectedTicket.invoice.payment_status})
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No invoice generated yet.</p>
                )}
              </div>

              {!selectedTicket.invoice && hasRole('admin', 'receptionist') && (
                <button
                  onClick={() => navigate(`/billing?action=generate&ticket_id=${selectedTicket.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Generate Invoice</span>
                </button>
              )}
            </div>

            {/* Audit Timeline */}
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-700 text-xs block mb-3">
                Lifecycle History & Audit Timeline
              </span>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedTicket.timeline && selectedTicket.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-samsung-blue flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-samsung-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{event.status}</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                        {event.changedByUser && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            by {event.changedByUser.name}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{event.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Spare Part to Ticket */}
      <Modal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        title="Consume Spare Part from Inventory"
      >
        <form onSubmit={handleAddPart} className="space-y-4 text-xs">
          <div>
            <label htmlFor="p-select" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Spare Part *
            </label>
            <select
              id="p-select"
              required
              value={partUsageForm.part_id}
              onChange={(e) => setPartUsageForm({ ...partUsageForm, part_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            >
              <option value="">-- Choose Spare Part --</option>
              {inventoryParts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                  {p.part_name} ({p.part_number}) &bull; Stock: {p.quantity_in_stock} &bull; ₹{p.unit_price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="p-qty" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Quantity Used *
            </label>
            <input
              id="p-qty"
              type="number"
              min="1"
              required
              value={partUsageForm.quantity}
              onChange={(e) => setPartUsageForm({ ...partUsageForm, quantity: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddPartModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Attaching...' : 'Add Part & Deduct Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TicketsPage;

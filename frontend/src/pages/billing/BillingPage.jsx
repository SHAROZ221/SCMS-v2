import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Receipt, Plus, CheckCircle, Clock, Printer, CreditCard, IndianRupee, ShieldCheck, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PAID'];

const BillingPage = () => {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(searchParams.get('action') === 'generate');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Tickets eligible for invoicing
  const [eligibleTickets, setEligibleTickets] = useState([]);

  // Generate Invoice Form state
  const [generateForm, setGenerateForm] = useState({
    ticket_id: searchParams.get('ticket_id') || '',
    labor_cost: 500,
    discount_amount: 0,
    notes: '',
  });
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'UPI',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/billing', {
        params: {
          q: search,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          limit: 50,
        },
      });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  // Load eligible tickets when generate modal opens
  useEffect(() => {
    const fetchEligibleTickets = async () => {
      try {
        const res = await api.get('/tickets', { params: { limit: 100 } });
        // Filter tickets that don't have an invoice yet
        const unbilled = (res.data.tickets || []).filter(
          (t) => !t.invoice && ['READY', 'DELIVERED', 'REPAIRING'].includes(t.status)
        );
        setEligibleTickets(unbilled);

        // If ticket_id in query param, select it
        const paramTicketId = searchParams.get('ticket_id');
        if (paramTicketId) {
          handleTicketSelect(paramTicketId);
        }
      } catch (err) {
        console.error('Failed to load eligible tickets:', err);
      }
    };

    if (isGenerateOpen) {
      fetchEligibleTickets();
    }
  }, [isGenerateOpen, searchParams]);

  const handleTicketSelect = async (ticketId) => {
    setGenerateForm((prev) => ({ ...prev, ticket_id: ticketId }));
    if (!ticketId) {
      setSelectedTicketDetail(null);
      return;
    }
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setSelectedTicketDetail(res.data.ticket);
    } catch (err) {
      toast.error('Failed to load ticket details.');
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!generateForm.ticket_id) {
      toast.error('Please select a service ticket to bill.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/billing/generate', {
        ticket_id: parseInt(generateForm.ticket_id, 10),
        labor_cost: parseFloat(generateForm.labor_cost) || 0,
        discount_amount: parseFloat(generateForm.discount_amount) || 0,
        notes: generateForm.notes,
      });
      toast.success(`Invoice ${res.data.invoice.invoice_number} generated successfully!`);
      setIsGenerateOpen(false);
      fetchInvoices();
      openReceipt(res.data.invoice);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to generate invoice.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.patch(`/billing/${selectedInvoice.id}/pay`, paymentForm);
      toast.success(`Payment recorded! Invoice marked as PAID.`);
      setIsPayModalOpen(false);
      fetchInvoices();
      openReceipt(selectedInvoice);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to record payment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openReceipt = async (inv) => {
    try {
      const res = await api.get(`/billing/${inv.id}`);
      setSelectedInvoice(res.data.invoice);
      setIsReceiptOpen(true);
    } catch (err) {
      toast.error('Failed to load invoice receipt.');
    }
  };

  const openPayModal = (inv, e) => {
    e.stopPropagation();
    setSelectedInvoice(inv);
    setPaymentForm({ payment_method: 'UPI', notes: '' });
    setIsPayModalOpen(true);
  };

  // Calculations for preview
  const partsTotal = selectedTicketDetail?.ticketParts
    ? selectedTicketDetail.ticketParts.reduce((sum, item) => sum + parseFloat(item.price_charged || 0), 0)
    : 0;
  const labor = parseFloat(generateForm.labor_cost) || 0;
  const discount = parseFloat(generateForm.discount_amount) || 0;
  const subtotal = partsTotal + labor;
  const tax = parseFloat(((subtotal * 18) / 100).toFixed(2));
  const total = Math.max(0, parseFloat((subtotal + tax - discount).toFixed(2)));

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      render: (row) => (
        <span className="font-mono font-bold text-samsung-blue text-xs hover:underline">
          {row.invoice_number}
        </span>
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
      header: 'Ticket #',
      accessor: 'ticket',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.ticket?.ticket_number || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Amount Payable',
      accessor: 'total_amount',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          ₹{parseFloat(row.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      accessor: 'payment_status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            row.payment_status === 'PAID'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {row.payment_status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {row.payment_status}
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: 'payment_method',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-600 uppercase">
          {row.payment_method || <span className="text-slate-400 font-normal italic">Pending</span>}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openReceipt(row)}
            title="View Receipt"
            className="p-1.5 rounded-lg text-slate-500 hover:text-samsung-blue hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.payment_status !== 'PAID' && hasRole('admin', 'receptionist') && (
            <button
              onClick={(e) => openPayModal(row, e)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Collect ₹
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated billing, 18% GST calculation, receipt printing, and payment settlement
          </p>
        </div>

        {hasRole('admin', 'receptionist') && (
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === status
                ? 'bg-samsung-blue text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {status} Invoices
          </button>
        ))}
      </div>

      {/* Invoices DataTable */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices by INV number, customer name, phone..."
        emptyMessage="No invoices found matching query."
        onRowClick={openReceipt}
      />

      {/* Modal: Generate Invoice */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Service Invoice"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
          <div>
            <label htmlFor="inv-ticket" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Completed Ticket to Bill *
            </label>
            <select
              id="inv-ticket"
              required
              value={generateForm.ticket_id}
              onChange={(e) => handleTicketSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            >
              <option value="">-- Choose Ticket --</option>
              {eligibleTickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ticket_number} &bull; {t.customer?.name} &bull; {t.device?.model} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {selectedTicketDetail && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{selectedTicketDetail.customer?.name}</span>
                <span className="font-mono text-samsung-blue">{selectedTicketDetail.ticket_number}</span>
              </div>
              <p className="text-slate-600">
                Device: {selectedTicketDetail.device?.brand} {selectedTicketDetail.device?.model} (SN: {selectedTicketDetail.device?.serial_number})
              </p>

              {/* Parts Used Breakdown */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Spare Parts Used on Ticket:</span>
                {selectedTicketDetail.ticketParts && selectedTicketDetail.ticketParts.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedTicketDetail.ticketParts.map((tp) => (
                      <li key={tp.id} className="flex items-center justify-between text-slate-600">
                        <span>{tp.part?.part_name} ({tp.quantity_used}x)</span>
                        <span className="font-mono font-medium">₹{parseFloat(tp.price_charged).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No spare parts consumed on this ticket.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-labor" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Labor Charges (₹)
              </label>
              <input
                id="inv-labor"
                type="number"
                min="0"
                step="50"
                value={generateForm.labor_cost}
                onChange={(e) => setGenerateForm({ ...generateForm, labor_cost: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="inv-discount" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Discount / Waiver (₹)
              </label>
              <input
                id="inv-discount"
                type="number"
                min="0"
                step="50"
                value={generateForm.discount_amount}
                onChange={(e) => setGenerateForm({ ...generateForm, discount_amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span>Spare Parts Cost:</span>
              <span className="font-mono font-medium">₹{partsTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Labor Charges:</span>
              <span className="font-mono font-medium">₹{labor.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>GST (18%):</span>
              <span className="font-mono font-medium">₹{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span className="font-mono font-medium">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Total Payable:</span>
              <span className="font-mono text-samsung-blue text-base">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !generateForm.ticket_id}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment Settlement */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Payment Settlement"
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-mono font-bold text-samsung-blue text-sm">{selectedInvoice.invoice_number}</p>
              <p className="text-slate-900 font-bold text-base mt-1">
                Amount Due: ₹{parseFloat(selectedInvoice.total_amount).toFixed(2)}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Customer: {selectedInvoice.customer?.name} ({selectedInvoice.customer?.phone})
              </p>
            </div>

            <div>
              <label htmlFor="pay-method" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Select Payment Mode *
              </label>
              <select
                id="pay-method"
                required
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                <option value="UPI">UPI / QR Code (PhonePe, GPay, Paytm)</option>
                <option value="CARD">Credit / Debit POS Card Swipe</option>
                <option value="CASH">Cash Over Counter</option>
                <option value="ONLINE">Net Banking / Online Transfer</option>
              </select>
            </div>

            <div>
              <label htmlFor="pay-notes" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Transaction Reference / Authorization Notes
              </label>
              <input
                id="pay-notes"
                type="text"
                placeholder="e.g. UPI Ref: 98124912 / HDFC POS #4491"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Mark as PAID'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Printable Samsung Care Invoice Receipt */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Official Service Invoice & Receipt"
        maxWidth="max-w-2xl"
      >
        {selectedInvoice && (
          <div className="space-y-6 text-xs bg-white p-2">
            {/* Printable Receipt Card */}
            <div id="printable-receipt" className="border border-slate-200 rounded-2xl p-6 space-y-6 bg-white shadow-xs">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-samsung-blue text-white font-black text-sm flex items-center justify-center">
                      SC
                    </div>
                    <div>
                      <h2 className="font-extrabold text-samsung-blue text-lg tracking-tight">SAMSUNG Care</h2>
                      <p className="text-[10px] text-slate-400 font-medium">Authorized Customer Service Center</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">GSTIN: 27AABCS1429B1Z8 &bull; SAC: 998713</p>
                </div>

                <div className="text-right">
                  <p className="font-mono font-extrabold text-base text-slate-900">{selectedInvoice.invoice_number}</p>
                  <p className="text-slate-400 text-[10px]">
                    Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        selectedInvoice.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedInvoice.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To & Device Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-slate-600">
                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-1">
                    Customer Information:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customer?.name}</p>
                  <p className="font-mono text-xs">{selectedInvoice.customer?.phone}</p>
                  <p className="text-xs truncate">{selectedInvoice.customer?.email}</p>
                  {selectedInvoice.customer?.address && (
                    <p className="text-[11px] text-slate-400 mt-1">{selectedInvoice.customer?.address}</p>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-1">
                    Service Device:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedInvoice.ticket?.device?.brand} {selectedInvoice.ticket?.device?.model}
                  </p>
                  <p className="font-mono text-xs">SN: {selectedInvoice.ticket?.device?.serial_number}</p>
                  <p className="font-mono text-xs text-samsung-blue font-semibold mt-1">
                    Ticket Ref: {selectedInvoice.ticket?.ticket_number}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.ticket?.ticketParts && selectedInvoice.ticket.ticketParts.length > 0 ? (
                      selectedInvoice.ticket.ticketParts.map((tp) => (
                        <tr key={tp.id}>
                          <td className="py-2 text-slate-800">
                            {tp.part?.part_name} <span className="font-mono text-slate-400">({tp.part?.part_number})</span>
                          </td>
                          <td className="py-2 text-center">{tp.quantity_used}</td>
                          <td className="py-2 text-right font-mono font-medium">₹{parseFloat(tp.price_charged).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 text-slate-500 italic">No replacement parts required</td>
                        <td className="py-2 text-center">-</td>
                        <td className="py-2 text-right font-mono">₹0.00</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 text-slate-800 font-medium">Technician Service & Labor Charges</td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right font-mono font-medium">
                        ₹{parseFloat(selectedInvoice.labor_cost).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              <div className="border-t border-slate-200 pt-3 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="font-mono font-medium">₹{parseFloat(selectedInvoice.tax_amount).toFixed(2)}</span>
                  </div>
                  {parseFloat(selectedInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{parseFloat(selectedInvoice.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Amount:</span>
                    <span className="font-mono text-samsung-blue text-base">
                      ₹{parseFloat(selectedInvoice.total_amount).toFixed(2)}
                    </span>
                  </div>
                  {selectedInvoice.payment_method && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Paid via: <strong className="text-slate-800 uppercase">{selectedInvoice.payment_method}</strong>
                      {selectedInvoice.paid_at && ` on ${new Date(selectedInvoice.paid_at).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                <p>Thank you for choosing Samsung Customer Care. 30-day warranty on replaced genuine parts.</p>
                <p className="mt-0.5">Computer-generated invoice. No physical signature required.</p>
              </div>
            </div>

            {/* Print & Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;

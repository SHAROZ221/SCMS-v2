import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Boxes, Plus, AlertTriangle, ArrowUpCircle, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('filter') === 'low');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [restockQty, setRestockQty] = useState(10);

  // New Part form
  const [partForm, setPartForm] = useState({
    part_name: '',
    part_number: '',
    category: 'Display',
    quantity_in_stock: 10,
    unit_price: 1500,
    reorder_level: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: {
          q: search,
          low_stock_only: lowStockOnly ? 'true' : undefined,
        },
      });
      setParts(res.data.parts || []);
    } catch (err) {
      console.error('Failed to load spare parts:', err);
      toast.error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [search, lowStockOnly]);

  const handleCreatePart = async (e) => {
    e.preventDefault();
    if (!partForm.part_name || !partForm.part_number) {
      toast.error('Part name and part number are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/inventory', partForm);
      toast.success('Spare part added to inventory catalog!');
      setIsAddModalOpen(false);
      setPartForm({
        part_name: '',
        part_number: '',
        category: 'Display',
        quantity_in_stock: 10,
        unit_price: 1500,
        reorder_level: 5,
      });
      fetchParts();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to add spare part.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.patch(`/inventory/${selectedPart.id}/restock`, {
        quantityToAdd: parseInt(restockQty, 10),
      });
      toast.success(`Restocked ${restockQty} units of ${selectedPart.part_name}!`);
      setIsRestockModalOpen(false);
      fetchParts();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to restock item.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openRestock = (part) => {
    setSelectedPart(part);
    setRestockQty(10);
    setIsRestockModalOpen(true);
  };

  const columns = [
    {
      header: 'Part Details',
      accessor: 'part_name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.part_name}</p>
          <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
            {row.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Part SKU #',
      accessor: 'part_number',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
          {row.part_number}
        </span>
      ),
    },
    {
      header: 'Unit Price',
      accessor: 'unit_price',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          ₹{parseFloat(row.unit_price).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Stock Status',
      accessor: 'quantity_in_stock',
      render: (row) => {
        const isLow = row.quantity_in_stock <= row.reorder_level;
        const isOut = row.quantity_in_stock === 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold text-sm ${
                isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {row.quantity_in_stock}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isOut
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : isLow
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Reorder Threshold',
      accessor: 'reorder_level',
      render: (row) => <span className="text-xs text-slate-500 font-medium">{row.reorder_level} units</span>,
    },
    {
      header: 'Action',
      render: (row) =>
        hasRole('admin') ? (
          <button
            onClick={() => openRestock(row)}
            className="flex items-center gap-1 px-2.5 py-1 bg-samsung-subtle hover:bg-samsung-blue hover:text-white text-samsung-blue font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Restock</span>
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Spare Parts Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Component inventory levels, auto-decrement tracking, and low-stock alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              lowStockOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}</span>
          </button>

          {hasRole('admin') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Spare Part</span>
            </button>
          )}
        </div>
      </div>

      {/* Inventory DataTable */}
      <DataTable
        columns={columns}
        data={parts}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search parts by name, SKU part number, category..."
        emptyMessage="No spare parts found matching query."
      />

      {/* Modal: Add Spare Part */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Spare Part to Inventory"
      >
        <form onSubmit={handleCreatePart} className="space-y-4 text-xs">
          <div>
            <label htmlFor="p-name" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Part Name *
            </label>
            <input
              id="p-name"
              type="text"
              required
              placeholder="e.g. Dynamic AMOLED 2X Panel (S24 Ultra)"
              value={partForm.part_name}
              onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-num" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Part SKU Number * (Must be unique)
              </label>
              <input
                id="p-num"
                type="text"
                required
                placeholder="e.g. SEC-DISP-S24U"
                value={partForm.part_number}
                onChange={(e) => setPartForm({ ...partForm, part_number: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue font-mono"
              />
            </div>

            <div>
              <label htmlFor="p-cat" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                id="p-cat"
                value={partForm.category}
                onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                <option value="Display">Display</option>
                <option value="Battery">Battery</option>
                <option value="Charging">Charging</option>
                <option value="Camera">Camera</option>
                <option value="Motherboard">Motherboard</option>
                <option value="Audio">Audio</option>
                <option value="Body Glass">Body Glass</option>
                <option value="Television">Television</option>
                <option value="Washing Machine">Washing Machine</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Air Conditioner">Air Conditioner</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="p-price" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                id="p-price"
                type="number"
                min="0"
                step="50"
                required
                value={partForm.unit_price}
                onChange={(e) => setPartForm({ ...partForm, unit_price: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="p-stock" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Initial Stock *
              </label>
              <input
                id="p-stock"
                type="number"
                min="0"
                required
                value={partForm.quantity_in_stock}
                onChange={(e) => setPartForm({ ...partForm, quantity_in_stock: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="p-reorder" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Reorder Alert Level
              </label>
              <input
                id="p-reorder"
                type="number"
                min="1"
                required
                value={partForm.reorder_level}
                onChange={(e) => setPartForm({ ...partForm, reorder_level: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Restock Part */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={selectedPart ? `Restock: ${selectedPart.part_name}` : 'Restock Part'}
      >
        {selectedPart && (
          <form onSubmit={handleRestock} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-800">{selectedPart.part_name}</p>
              <p className="font-mono text-slate-500 mt-0.5">SKU: {selectedPart.part_number}</p>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span>Current Stock: <strong className="text-slate-900">{selectedPart.quantity_in_stock}</strong></span>
                <span>Unit Cost: <strong className="text-slate-900">₹{selectedPart.unit_price}</strong></span>
              </div>
            </div>

            <div>
              <label htmlFor="restock-input" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Quantity Units to Add *
              </label>
              <input
                id="restock-input"
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Restocking...' : `Add +${restockQty} Units`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;

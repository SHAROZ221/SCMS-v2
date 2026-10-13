import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { ShieldCheck, Plus, UserPlus, Lock, Mail, User, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    role: 'receptionist',
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error('All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', registerForm);
      toast.success(`Staff account for ${registerForm.name} created!`);
      setIsRegisterOpen(false);
      setRegisterForm({ name: '', email: '', password: '', role: 'receptionist' });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create user.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/auth/users/${selectedUser.id}`, editForm);
      toast.success('User updated successfully!');
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update user.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditOpen(true);
  };

  const roleBadges = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    receptionist: 'bg-blue-100 text-blue-800 border-blue-200',
    technician: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">User ID #{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span className="font-medium text-slate-700 font-mono text-xs">{row.email}</span>,
    },
    {
      header: 'Role Privilege',
      accessor: 'role',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${
            roleBadges[row.role] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      header: 'Account Status',
      accessor: 'is_active',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {row.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {row.is_active ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => openEdit(row)}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management & Security</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized staff accounts, role-based access permissions, and account activation
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No staff users found."
      />

      {/* Modal: Register Staff Account */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Staff Account"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label htmlFor="st-name" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              id="st-name"
              type="text"
              required
              placeholder="e.g. Vikram Sharma"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="st-email" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Work Email Address *
            </label>
            <input
              id="st-email"
              type="email"
              required
              placeholder="e.g. vikram@scms.com"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue font-mono"
            />
          </div>

          <div>
            <label htmlFor="st-password" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Initial Password * (Minimum 6 characters)
            </label>
            <input
              id="st-password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            />
          </div>

          <div>
            <label htmlFor="st-role" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Role & Access Level *
            </label>
            <select
              id="st-role"
              value={registerForm.role}
              onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
            >
              <option value="receptionist">Receptionist (Intake, Tickets, Customers, Billing)</option>
              <option value="technician">Technician (Assigned Repairs, Diagnosis, Spare Parts)</option>
              <option value="admin">Administrator (Full System Control & Reports)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Staff Account */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedUser ? `Manage Account: ${selectedUser.name}` : 'Manage Account'}
      >
        {selectedUser && (
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label htmlFor="edit-u-name" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="edit-u-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              />
            </div>

            <div>
              <label htmlFor="edit-u-role" className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Role Permission
              </label>
              <select
                id="edit-u-role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-samsung-blue"
              >
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
                <option value="technician">Technician</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="edit-u-active"
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-samsung-blue focus:ring-samsung-blue border-slate-300"
              />
              <label htmlFor="edit-u-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Account is Active (Uncheck to deactivate login access)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-samsung-blue hover:bg-samsung-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Update Staff Account'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;

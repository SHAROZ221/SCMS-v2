import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Ticket,
  Clock,
  CheckCircle2,
  PackageCheck,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const STATUS_CHART_COLORS = {
  RECEIVED: '#DC2626',
  DIAGNOSING: '#EA580C',
  WAITING_FOR_PARTS: '#EAB308',
  REPAIRING: '#2563EB',
  READY: '#10B981',
  DELIVERED: '#64748B',
  CANCELLED: '#991B1B',
};

const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get('/reports/ticket-trends'),
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data.trends || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading service center dashboard..." />;
  }

  const summary = stats?.summary || {};
  const statusDistribution = (stats?.statusDistribution || []).filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Service Center Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-samsung-subtle text-samsung-blue border border-samsung-blue/20">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.role}) &bull; Real-time customer service overview
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {hasRole('admin', 'receptionist') && (
            <button
              onClick={() => navigate('/tickets?action=new')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-samsung-blue hover:bg-samsung-dark rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {summary.lowStockCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Low Inventory Alert: {summary.lowStockCount} spare {summary.lowStockCount === 1 ? 'part is' : 'parts are'} running low!
              </p>
              <p className="text-xs text-amber-700">
                Stock is at or below defined reorder levels. Restock now to prevent repair delays.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory?filter=low')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            View Inventory
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Intake"
          value={summary.todayTickets ?? 0}
          icon={Ticket}
          color="blue"
          subtitle={`${summary.totalTickets ?? 0} total tickets on file`}
          onClick={() => navigate('/tickets')}
        />
        <StatsCard
          title="In Progress"
          value={summary.pendingTickets ?? 0}
          icon={Clock}
          color="amber"
          subtitle="Diagnosing & repairing"
          onClick={() => navigate('/tickets?status=REPAIRING')}
        />
        <StatsCard
          title="Ready for Pickup"
          value={summary.readyTickets ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Repair completed & tested"
          onClick={() => navigate('/tickets?status=READY')}
        />
        <StatsCard
          title="Delivered"
          value={summary.deliveredTickets ?? 0}
          icon={PackageCheck}
          color="purple"
          subtitle="Returned to customer"
          onClick={() => navigate('/tickets?status=DELIVERED')}
        />
      </div>

      {/* Secondary Financial & Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Paid customer invoices</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Receivables</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ₹{(summary.pendingRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting customer collection</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Customers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {summary.totalCustomers ?? 0}
            </h3>
            <p className="text-xs text-samsung-blue font-medium mt-1">Unique customer profiles</p>
          </div>
          <div className="p-3 bg-blue-50 text-samsung-blue rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Intake & Resolution Volume Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Service Ticket Activity Trends</h3>
              <p className="text-xs text-slate-500">Daily ticket registrations vs completed repairs</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1428A0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1428A0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Registered"
                    stroke="#1428A0"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data available for this range
              </div>
            )}
          </div>
        </div>

        {/* Ticket Status Distribution Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current Status Distribution</h3>
            <p className="text-xs text-slate-500">Live breakdown across repair pipeline</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center my-2">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_CHART_COLORS[entry.status] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No active tickets to display</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-3 border-t border-slate-100">
            {statusDistribution.slice(0, 6).map((item) => (
              <div key={item.status} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_CHART_COLORS[item.status] || '#94A3B8' }}
                />
                <span className="text-slate-600 truncate">{item.status.replace(/_/g, ' ')}:</span>
                <span className="font-bold text-slate-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Service Tickets</h3>
            <p className="text-xs text-slate-500">Latest customer devices registered for care</p>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1 text-xs font-semibold text-samsung-blue hover:underline cursor-pointer"
          >
            <span>View all tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                stats.recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets?id=${ticket.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-samsung-blue">
                      {ticket.ticket_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {ticket.customer?.name || 'Walk-in'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ticket.device ? `${ticket.device.brand} ${ticket.device.model}` : 'Generic Device'}
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ticket.technician?.name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

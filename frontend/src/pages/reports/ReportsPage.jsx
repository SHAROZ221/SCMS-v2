import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Wrench,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

const REPORT_TABS = ['OVERVIEW', 'TECHNICIANS', 'NOTIFICATIONS'];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Analytics states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [ticketTrends, setTicketTrends] = useState([]);
  const [techPerformance, setTechPerformance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const [dashRes, trendsRes, techRes, notifRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/ticket-trends'),
          api.get('/reports/technician-performance'),
          api.get('/reports/notifications'),
        ]);
        setDashboardStats(dashRes.data);
        setTicketTrends(trendsRes.data.trends || []);
        setTechPerformance(techRes.data.performance || []);
        setNotifications(notifRes.data.notifications || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
        toast.error('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  const handleExportCSV = (data, filename = 'scms_report.csv') => {
    if (!data || data.length === 0) {
      toast.error('No data available to export.');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported as CSV successfully!');
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Compiling executive intelligence reports..." />;
  }

  const summary = dashboardStats?.summary || {};
  const paymentBreakdown = Object.entries(dashboardStats?.paymentMethodBreakdown || {})
    .filter(([_, val]) => val > 0)
    .map(([method, amount]) => ({ name: method, value: amount }));

  const PAYMENT_COLORS = ['#1428A0', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports & Insights</h1>
          <p className="text-xs text-slate-500 mt-1">
            Performance metrics, technician SLA resolution times, and communication audit logs
          </p>
        </div>

        <button
          onClick={() => handleExportCSV(techPerformance, 'technician_performance.csv')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Metrics CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs border-b border-slate-200 pb-3">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-samsung-blue text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab === 'OVERVIEW' ? 'Operations & Revenue' : tab === 'TECHNICIANS' ? 'Technician SLAs' : 'Notification Logs'}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Volume"
              value={summary.totalTickets ?? 0}
              icon={BarChart3}
              color="blue"
              subtitle="All service requests logged"
            />
            <StatsCard
              title="Total Paid Revenue"
              value={`₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={IndianRupee}
              color="emerald"
              subtitle="Settled customer invoices"
            />
            <StatsCard
              title="Pending Receivables"
              value={`₹${(summary.pendingRevenue || 0).toLocaleString('en-IN')}`}
              icon={Clock}
              color="amber"
              subtitle="Invoices pending payment"
            />
            <StatsCard
              title="Resolved Ratio"
              value={`${
                summary.totalTickets > 0
                  ? Math.round(((summary.readyTickets + summary.deliveredTickets) / summary.totalTickets) * 100)
                  : 0
              }%`}
              icon={CheckCircle2}
              color="purple"
              subtitle="Ready + Delivered tickets"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Volume Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Intake vs Resolution Volume</h3>
              <p className="text-xs text-slate-500 mb-4">Daily comparison of devices checked in vs repaired</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="count" name="New Tickets" fill="#1428A0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Breakdown Pie */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Settled Revenue by Payment Mode</h3>
                <p className="text-xs text-slate-500">Distribution across UPI, POS Cards, and Cash</p>
              </div>
              <div className="h-56 w-full flex items-center justify-center my-2">
                {paymentBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentBreakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
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
                  <p className="text-slate-400 text-xs italic">No settled payment transactions yet</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                {paymentBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                      />
                      <span className="text-slate-600 font-medium uppercase">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Technicians Performance Table */}
      {activeTab === 'TECHNICIANS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Technician Throughput & SLA Metrics</h3>
              <p className="text-xs text-slate-500">
                Resolution statistics, active load, and average turnaround time per technician
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Technician Engineer</th>
                  <th className="py-3.5 px-4 text-center">Total Assigned</th>
                  <th className="py-3.5 px-4 text-center">Active WIP</th>
                  <th className="py-3.5 px-4 text-center">Resolved</th>
                  <th className="py-3.5 px-4 text-center">Avg Resolution Time</th>
                  <th className="py-3.5 px-4 text-center">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {techPerformance.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-xs">
                          {tech.name.charAt(0)}
                        </div>
                        <div>
                          <p>{tech.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{tech.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{tech.totalAssigned}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{tech.activeCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{tech.resolvedCount}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {tech.avgResolutionHours > 0 ? `${tech.avgResolutionHours} hrs` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-extrabold text-samsung-blue bg-blue-50 px-2 py-0.5 rounded">
                        {tech.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Notification Delivery Logs */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Communication Audit Trail</h3>
              <p className="text-xs text-slate-500">Automated email status updates dispatched to customers</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing last {notifications.length} notifications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{notif.customer?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{notif.recipient}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-sm truncate">
                      {notif.subject}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-samsung-blue">
                      {notif.ticket?.ticket_number || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          notif.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            notif.status === 'SENT' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {notif.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(notif.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

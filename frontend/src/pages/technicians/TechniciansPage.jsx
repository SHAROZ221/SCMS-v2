import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Wrench, CheckCircle, Clock, Smartphone, User, ArrowRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const TechniciansPage = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTech, setSelectedTech] = useState(null);
  const [workloadTickets, setWorkloadTickets] = useState([]);
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const navigate = useNavigate();

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/technicians');
      setTechnicians(res.data.technicians || []);
    } catch (err) {
      console.error('Failed to load technicians:', err);
      toast.error('Failed to load technician workloads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const openWorkload = async (tech) => {
    setSelectedTech(tech);
    setIsWorkloadModalOpen(true);
    try {
      setModalLoading(true);
      const res = await api.get(`/technicians/${tech.id}/workload`);
      setWorkloadTickets(res.data.activeTickets || []);
    } catch (err) {
      toast.error('Failed to load technician active tickets.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading technician workload board..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Technician Workload Board</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor repair assignments, workload balancing, and technician throughput
        </p>
      </div>

      {/* Technician Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {technicians.map((tech) => (
          <div
            key={tech.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Tech Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-base flex items-center justify-center border border-emerald-200">
                    {tech.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{tech.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{tech.email}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    tech.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tech.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {tech.isAvailable ? 'Available' : 'High Load'}
                </span>
              </div>

              {/* Workload Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{tech.activeWorkload}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">{tech.resolvedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="text-lg font-black text-slate-600 mt-0.5">{tech.totalAssigned}</p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => openWorkload(tech)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-samsung-blue bg-samsung-subtle hover:bg-samsung-blue hover:text-white transition-all cursor-pointer"
              >
                <span>Inspect Active Tickets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Technician Active Tickets Workload */}
      <Modal
        isOpen={isWorkloadModalOpen}
        onClose={() => setIsWorkloadModalOpen(false)}
        title={selectedTech ? `Active Workload: ${selectedTech.name}` : 'Workload'}
        maxWidth="max-w-2xl"
      >
        {modalLoading ? (
          <LoadingSpinner message="Fetching technician workload..." />
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Currently In Progress ({workloadTickets.length})
              </span>
              <span className="text-slate-400 text-[11px]">Sorted by highest priority</span>
            </div>

            {workloadTickets.length > 0 ? (
              <div className="space-y-2.5">
                {workloadTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setIsWorkloadModalOpen(false);
                      navigate(`/tickets?id=${t.id}`);
                    }}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-samsung-blue/40 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-samsung-blue text-xs">
                          {t.ticket_number}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <p className="font-semibold text-slate-900 mt-1">
                        {t.device?.brand} {t.device?.model}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate max-w-md">
                        {t.complaint_description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={t.status} />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Owner: {t.customer?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-center py-6">
                No active tickets assigned to this technician.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TechniciansPage;

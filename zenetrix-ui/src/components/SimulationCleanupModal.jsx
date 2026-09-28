import { useState } from 'react';
import { CheckCircle2, Trash2, Database, ShieldCheck, X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';

const SimulationCleanupModal = () => {
  const {
    showCleanupModal,
    setShowCleanupModal,
    simulatedDataSummary,
    runCleanup,
    cleanupStatus,
    setCleanupStatus,
  } = useSimulation();

  const [cleanupMessage, setCleanupMessage] = useState('');

  if (!showCleanupModal) return null;

  const handleDelete = async () => {
    try {
      const res = await runCleanup(simulatedDataSummary?.domain || 'apexcloud.io');
      setCleanupMessage(res.message || 'Simulation data successfully purged from Supabase.');
    } catch (err) {
      setCleanupMessage('Error purging simulation data: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClose = () => {
    setShowCleanupModal(false);
    setCleanupStatus(null);
    setCleanupMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Simulation Complete</span>
                <span className="rounded-full bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 text-[10px] font-bold">
                  Supabase Verified
                </span>
              </div>
              <h3 className="text-lg font-bold text-ink">Autonomous Walkthrough Finished</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-muted hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview of what was simulated */}
        <div className="mt-5 space-y-3 rounded-xl border border-line bg-muted/30 p-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="font-semibold text-ink-muted">Simulated Organization</span>
            <span className="font-bold text-ink">{simulatedDataSummary?.organization || 'Apex Financial Cloud'} ({simulatedDataSummary?.domain || 'apexcloud.io'})</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-ink-muted">
            <div>
              <span className="block font-medium text-[11px] text-ink">Services Configured:</span>
              <ul className="list-disc list-inside mt-0.5 text-ink-muted">
                <li>Core Ledger DB (DATABASE)</li>
                <li>Payment Switch API (API)</li>
                <li>Customer Checkout Web (FRONTEND)</li>
              </ul>
            </div>
            <div>
              <span className="block font-medium text-[11px] text-ink">Staff Provisioned:</span>
              <ul className="list-disc list-inside mt-0.5 text-ink-muted">
                <li>Marcus Vance (MANAGER)</li>
                <li>Elena Rostova (SUPPORT_ENGINEER)</li>
                <li>David Kim (EMPLOYEE)</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-line text-[11px] text-ink-muted">
            <span className="font-semibold text-ink">Incident Cycle:</span> Primary Ledger DB timeout $\rightarrow$ Blast Radius calculated on Payment Switch $\rightarrow$ Remediated & Marked RESOLVED by Elena Rostova.
          </div>
        </div>

        {/* Database Persistence Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-ink-muted">
          <Database size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-ink font-semibold">Real Data Stored in Supabase:</strong> All organizations, services, dependencies, tasks, and users were written directly to your Supabase PostgreSQL database.
          </div>
        </div>

        {/* Result notification after cleanup */}
        {cleanupStatus === 'success' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{cleanupMessage}</span>
          </div>
        )}
        {cleanupStatus === 'error' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{cleanupMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-line">
          {cleanupStatus !== 'success' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-ink-muted hover:bg-muted hover:text-ink transition"
              >
                Keep Data in DB
              </button>
              <button
                type="button"
                disabled={cleanupStatus === 'loading'}
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
                {cleanupStatus === 'loading' ? 'Purging from Supabase...' : 'Delete Simulation Data from DB'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition"
            >
              Done <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationCleanupModal;

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  RadioTower,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Power,
} from 'lucide-react';
import api from '../api';
import { mockOrganizations, mockPlatformMetrics } from '../mockData';

const planColors = {
  FREE: 'border-line bg-muted text-ink-muted',
  PRO: 'border-primary/30 bg-primary/10 text-primary',
  ENTERPRISE: 'border-accent/30 bg-accent/10 text-accent',
};

const PlatformPortal = () => {
  const [organizations, setOrganizations] = useState(mockOrganizations);
  const [metrics, setMetrics] = useState(mockPlatformMetrics);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    domain: '',
    slug: '',
    plan: 'PRO',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  useEffect(() => {
    let mounted = true;
    const loadPlatformData = async () => {
      try {
        const [orgsRes, metricsRes] = await Promise.all([
          api.get('/platform/organizations').catch(() => ({ data: mockOrganizations })),
          api.get('/platform/metrics').catch(() => ({ data: mockPlatformMetrics })),
        ]);
        if (!mounted) return;
        setOrganizations(Array.isArray(orgsRes.data) ? orgsRes.data : mockOrganizations);
        setMetrics(metricsRes.data?.totalOrganizations ? metricsRes.data : mockPlatformMetrics);
      } catch (e) {
        console.error('Failed to load platform data:', e);
      }
    };
    loadPlatformData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/platform/organizations', form);
      setOrganizations([res.data, ...organizations]);
      setMetrics((prev) => ({
        ...prev,
        totalOrganizations: prev.totalOrganizations + 1,
        activeOrganizations: prev.activeOrganizations + 1,
        pendingSetupOrganizations: prev.pendingSetupOrganizations + 1,
      }));
      setModalOpen(false);
      setForm({
        name: '',
        domain: '',
        slug: '',
        plan: 'PRO',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      });
    } catch (err) {
      console.warn('API error, falling back to client simulation:', err);
      const synthetic = {
        id: Date.now(),
        name: form.name,
        domain: form.domain,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        plan: form.plan,
        isActive: true,
        onboardingCompleted: false,
        setupStep: 1,
        userCount: 1,
        serviceCount: 0,
        activeIncidentCount: 0,
        createdAt: new Date().toISOString(),
      };
      setOrganizations([synthetic, ...organizations]);
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (orgId) => {
    try {
      const res = await api.put(`/platform/organizations/${orgId}/status`);
      setOrganizations((current) =>
        current.map((org) => (org.id === orgId ? res.data : org))
      );
    } catch {
      setOrganizations((current) =>
        current.map((org) =>
          org.id === orgId ? { ...org, isActive: !org.isActive } : org
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Level Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Platform Overview & Tenant Fleet</h2>
          <p className="text-xs text-ink-muted">Manage multi-tenant organizations, plan subscriptions, and operational boundaries.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="primary-button"
        >
          <Plus size={16} /> Onboard Organization
        </button>
      </div>

      {/* Metrics Counter Cards */}
      <section className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: metrics.totalOrganizations, icon: Building2, tone: 'text-primary' },
          { label: 'Active Organizations', value: metrics.activeOrganizations, icon: ShieldCheck, tone: 'text-accent' },
          { label: 'Pending Setup', value: metrics.pendingSetupOrganizations || 0, icon: Clock3, tone: 'text-warning' },
          { label: 'Platform Users', value: metrics.totalUsers, icon: Users, tone: 'text-primary' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-muted">{item.label}</span>
                <Icon size={19} className={item.tone} />
              </div>
              <div className="mt-4 text-3xl font-semibold">{item.value}</div>
            </div>
          );
        })}
      </section>

      {/* Organization Fleet Table */}
      <section className="panel overflow-hidden">
        <div className="border-b border-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-title">Tenant Organizations</h3>
              <p className="section-subtitle">Dedicated operational environments with isolated tenant graph boundaries.</p>
            </div>
            <span className="metric-pill">
              <RadioTower size={14} />
              {organizations.length} organizations
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Slug / Domain</th>
                <th>Plan Tier</th>
                <th>Status</th>
                <th>Onboarding</th>
                <th>Users</th>
                <th>Services</th>
                <th>Active Incidents</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="font-semibold text-ink">{org.name}</div>
                    <div className="text-xs text-ink-muted">Tenant ID #{org.id}</div>
                  </td>
                  <td>
                    <div className="text-sm font-medium">{org.domain}</div>
                    <div className="text-xs text-ink-muted">/{org.slug || org.name.toLowerCase()}</div>
                  </td>
                  <td>
                    <span className={`badge ${planColors[org.plan] || planColors.FREE}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td>
                    {org.isActive ? (
                      <span className="badge border-accent/30 bg-accent/10 text-accent">
                        Active
                      </span>
                    ) : (
                      <span className="badge border-danger/30 bg-danger/10 text-danger">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td>
                    {org.onboardingCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                        <CheckCircle2 size={13} /> Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                        <AlertTriangle size={13} /> Step {org.setupStep || 1}/8
                      </span>
                    )}
                  </td>
                  <td>{org.userCount || 1}</td>
                  <td>{org.serviceCount || 0}</td>
                  <td>
                    {org.activeIncidentCount > 0 ? (
                      <span className="font-semibold text-danger">{org.activeIncidentCount} open</span>
                    ) : (
                      <span className="text-ink-muted">0</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(org.id)}
                      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        org.isActive
                          ? 'border border-danger/30 text-danger hover:bg-danger/10'
                          : 'border border-accent/30 text-accent hover:bg-accent/10'
                      }`}
                    >
                      <Power size={12} />
                      {org.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Onboard Organization Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <form onSubmit={handleCreateOrg} className="modal-panel max-w-lg">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={19} className="text-primary" />
                <h3 className="section-title">Onboard New Organization</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="field-label">Organization Name</label>
                <input
                  className="field-input"
                  placeholder="e.g. Stark Industries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Domain</label>
                  <input
                    className="field-input"
                    placeholder="stark.com"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Slug</label>
                  <input
                    className="field-input"
                    placeholder="stark-corp"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Plan Tier</label>
                <select
                  className="field-input"
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                >
                  <option value="FREE">FREE (Basic features)</option>
                  <option value="PRO">PRO (Advanced blast radius + SLA)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Full multi-team + automation)</option>
                </select>
              </div>

              <div className="border-t border-line pt-4">
                <div className="text-xs font-bold uppercase text-ink-muted">Initial Org Admin Account</div>

                <div className="mt-3">
                  <label className="field-label">Admin Full Name</label>
                  <input
                    className="field-input"
                    placeholder="Tony Stark"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    required
                  />
                </div>

                <div className="mt-3">
                  <label className="field-label">Admin Email</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="admin@stark.com"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="mt-3">
                  <label className="field-label">Temporary Password</label>
                  <input
                    type="password"
                    className="field-input"
                    placeholder="Defaults to 'password' if left blank"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="primary-button mt-6 w-full"
            >
              <Send size={16} />
              {submitting ? 'Provisioning...' : 'Provision Tenant Organization'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlatformPortal;

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  RadioTower,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import {
  mockDashboard,
  mockDependencies,
  mockIncidents,
  mockProjects,
  mockServices,
  mockTasks,
} from '../mockData';

const fetchOrFallback = async (path, fallback) => {
  try {
    const response = await api.get(path);
    return response.data;
  } catch {
    return fallback;
  }
};

const statusColor = {
  OPERATIONAL: 'bg-accent',
  DEGRADED: 'bg-warning',
  DOWN: 'bg-danger',
};

const severityColor = {
  CRITICAL: 'text-danger bg-danger/10 border-danger/30',
  HIGH: 'text-warning bg-warning/10 border-warning/30',
  MEDIUM: 'text-primary bg-primary/10 border-primary/30',
  LOW: 'text-ink-muted bg-muted border-line',
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(mockDashboard);
  const [services, setServices] = useState(mockServices);
  const [dependencies, setDependencies] = useState(mockDependencies);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [tasks, setTasks] = useState(mockTasks);
  const [projects, setProjects] = useState(mockProjects);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [dashboardData, serviceData, graphData, incidentData, taskData, projectData] = await Promise.all([
        fetchOrFallback('/org/dashboard', mockDashboard),
        fetchOrFallback('/services', mockServices),
        fetchOrFallback('/dependencies/graph', { dependencies: mockDependencies }),
        fetchOrFallback('/incidents?size=8', { content: mockIncidents }),
        fetchOrFallback('/tasks', mockTasks),
        fetchOrFallback('/projects', mockProjects),
      ]);

      if (!mounted) return;
      setDashboard(dashboardData);
      setServices(Array.isArray(serviceData) ? serviceData : mockServices);
      setDependencies(Array.isArray(graphData.dependencies) ? graphData.dependencies : mockDependencies);
      setIncidents(Array.isArray(incidentData?.content) ? incidentData.content : Array.isArray(incidentData) ? incidentData : mockIncidents);
      setTasks(Array.isArray(taskData) ? taskData : mockTasks);
      setProjects(Array.isArray(projectData) ? projectData : mockProjects);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setupSteps = useMemo(() => ([
    { label: 'Services', done: services.length > 0 },
    { label: 'Dependencies', done: dependencies.length > 0 },
    { label: 'Teams', done: dashboard.teamCount > 0 },
    { label: 'Projects', done: projects.length > 0 },
    { label: 'Tasks', done: tasks.length > 0 },
    { label: 'Incidents', done: incidents.length > 0 },
  ]), [dashboard.teamCount, dependencies.length, incidents.length, projects.length, services.length, tasks.length]);

  const slaSeries = [
    { day: 'Mon', value: 91 },
    { day: 'Tue', value: 94 },
    { day: 'Wed', value: 89 },
    { day: 'Thu', value: 96 },
    { day: 'Fri', value: dashboard.slaComplianceRate || 94 },
  ];

  const dependencyLines = dependencies.slice(0, 4);
  const openRisks = incidents.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-4 gap-4">
        {[
          { label: 'Services', value: dashboard.serviceCount, icon: RadioTower, tone: 'text-primary' },
          { label: 'Open incidents', value: dashboard.openIncidentCount, icon: ShieldAlert, tone: 'text-danger' },
          { label: 'Active tasks', value: dashboard.activeTaskCount, icon: Clock3, tone: 'text-warning' },
          { label: 'SLA compliance', value: `${dashboard.slaComplianceRate}%`, icon: CheckCircle2, tone: 'text-accent' },
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

      <section className="grid grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="section-title">Service Dependency Graph</h3>
              <p className="section-subtitle">Current org graph used by blast radius traversal.</p>
            </div>
            <span className="metric-pill">
              <GitBranch size={14} />
              {dashboard.dependencyCount} edges
            </span>
          </div>

          <div className="dependency-board">
            {services.slice(0, 4).map((service, index) => (
              <div key={service.id} className="dependency-node" style={{ gridColumn: index + 1 }}>
                <div className={`mb-3 h-2 w-2 rounded-full ${statusColor[service.status] || 'bg-muted-strong'}`} />
                <div className="text-sm font-semibold">{service.name}</div>
                <div className="mt-1 text-xs text-ink-muted">{service.ownerTeam?.name || 'Unassigned'}</div>
              </div>
            ))}
            <div className="dependency-lines">
              {dependencyLines.map((dependency, index) => (
                <span key={dependency.id || index}>
                  {dependency.fromService?.name || 'Service'} depends on {dependency.toService?.name || 'Dependency'}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="section-title">Build Sequence</h3>
          <p className="section-subtitle">The enforced order from the specification.</p>
          <div className="mt-5 space-y-2">
            {setupSteps.map((step, index) => {
              const targetRoute = step.label === 'Incidents' ? '/incidents' : '/operations';
              return (
                <a
                  key={step.label}
                  href={targetRoute}
                  className="flex items-center gap-3 rounded-md p-2 -mx-2 hover:bg-muted transition-colors group"
                  title={`Navigate to ${step.label}`}
                >
                  <div className={step.done ? 'step-dot step-dot-done' : 'step-dot'}>{index + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">{step.label}</div>
                    <div className="text-xs text-ink-muted">{step.done ? 'Configured' : 'Pending setup'}</div>
                  </div>
                  {step.done ? (
                    <CheckCircle2 size={17} className="text-accent" />
                  ) : (
                    <ArrowUpRight size={15} className="text-ink-faint group-hover:text-primary transition-colors" />
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="panel p-6">
          <h3 className="section-title">SLA Trend</h3>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaSeries}>
                <CartesianGrid stroke="#d9e0ea" strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="section-title">Team Workload</h3>
              <p className="section-subtitle">Open task pressure by owner.</p>
            </div>
            <Users size={19} className="text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.workloadByOwner || []}>
                <CartesianGrid stroke="#d9e0ea" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="owner" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                  {(dashboard.workloadByOwner || []).map((entry, index) => (
                    <Cell key={entry.owner} fill={index % 2 === 0 ? '#2563eb' : '#0f9f86'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_1fr] gap-6">
        <div className="panel overflow-hidden">
          <div className="border-b border-line p-5">
            <h3 className="section-title">Incident Heat Map</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Incidents</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.heatmapByService || []).map((row) => (
                <tr key={row.service}>
                  <td>{row.service}</td>
                  <td>{row.owner}</td>
                  <td>
                    <span className={`status-dot ${statusColor[row.status] || 'bg-muted-strong'}`} />
                    {String(row.status).toLowerCase()}
                  </td>
                  <td>{row.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="section-title">Escalation Alerts</h3>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="space-y-3">
            {openRisks.slice(0, 4).map((incident) => (
              <div key={incident.id} className="flex items-center justify-between rounded-md border border-line p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{incident.title}</div>
                  <div className="mt-1 text-xs text-ink-muted">{incident.service?.name || 'Unmapped service'}</div>
                </div>
                <span className={`badge ${severityColor[incident.priority] || severityColor.LOW}`}>
                  {incident.priority}
                </span>
              </div>
            ))}
          </div>
          <a href="/incidents" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Open incident command <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

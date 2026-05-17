import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock3,
  GitBranch,
  Lightbulb,
  Plus,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react';
import api from '../api';
import {
  mockBlastRadius,
  mockIncidents,
  mockServices,
  mockSuggestions,
  mockTasks,
} from '../mockData';

const priorityTone = {
  CRITICAL: 'border-danger/30 bg-danger/10 text-danger',
  HIGH: 'border-warning/30 bg-warning/10 text-warning',
  MEDIUM: 'border-primary/30 bg-primary/10 text-primary',
  LOW: 'border-line bg-muted text-ink-muted',
};

const statusTone = {
  OPEN: 'border-danger/30 bg-danger/10 text-danger',
  IN_PROGRESS: 'border-primary/30 bg-primary/10 text-primary',
  RESOLVED: 'border-accent/30 bg-accent/10 text-accent',
  CLOSED: 'border-line bg-muted text-ink-muted',
};

const safe = async (request, fallback) => {
  try {
    const response = await request();
    return response.data;
  } catch {
    return fallback;
  }
};

const minutesToLabel = (dateValue) => {
  if (!dateValue) return 'No SLA';
  const minutes = Math.round((new Date(dateValue).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return 'Breached';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
};

const Incidents = () => {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [services, setServices] = useState(mockServices);
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedId, setSelectedId] = useState(mockIncidents[0]?.id);
  const [blastRadius, setBlastRadius] = useState(mockBlastRadius);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', priority: 'HIGH', taskId: '', serviceId: '' });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [incidentData, serviceData, taskData] = await Promise.all([
        safe(() => api.get('/incidents?size=30'), { content: mockIncidents }),
        safe(() => api.get('/services'), mockServices),
        safe(() => api.get('/tasks'), mockTasks),
      ]);
      if (!mounted) return;
      const incidentList = Array.isArray(incidentData?.content) ? incidentData.content : mockIncidents;
      setIncidents(incidentList);
      setServices(Array.isArray(serviceData) ? serviceData : mockServices);
      setTasks(Array.isArray(taskData) ? taskData : mockTasks);
      setSelectedId((current) => current || incidentList[0]?.id);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) || incidents[0],
    [incidents, selectedId],
  );

  useEffect(() => {
    if (!selectedIncident?.id) return;
    let mounted = true;
    const loadDetail = async () => {
      const [blastData, suggestionData] = await Promise.all([
        safe(() => api.get(`/incidents/${selectedIncident.id}/blast-radius`), mockBlastRadius),
        safe(() => api.get(`/incidents/${selectedIncident.id}/suggestions`), mockSuggestions),
      ]);
      if (!mounted) return;
      setBlastRadius(blastData);
      setSuggestions(Array.isArray(suggestionData) ? suggestionData : mockSuggestions);
    };
    loadDetail();
    return () => {
      mounted = false;
    };
  }, [selectedIncident?.id]);

  const filteredIncidents = incidents.filter((incident) => {
    const haystack = `${incident.title} ${incident.description} ${incident.service?.name}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const createIncident = async (event) => {
    event.preventDefault();
    const payload = {
      title: incidentForm.title,
      description: incidentForm.description,
      priority: incidentForm.priority,
      taskId: incidentForm.taskId ? Number(incidentForm.taskId) : null,
      serviceId: incidentForm.serviceId ? Number(incidentForm.serviceId) : null,
    };
    try {
      const response = await api.post('/incidents', payload);
      setIncidents((current) => [response.data, ...current]);
      setSelectedId(response.data.id);
    } catch {
      const task = tasks.find((item) => item.id === payload.taskId);
      const service = task?.service || services.find((item) => item.id === payload.serviceId);
      const synthetic = {
        id: Date.now(),
        ...payload,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        service,
        project: task?.project,
        task,
        reportedBy: { name: 'Current user' },
        assignedTo: null,
      };
      setIncidents((current) => [synthetic, ...current]);
      setSelectedId(synthetic.id);
    }
    setIncidentForm({ title: '', description: '', priority: 'HIGH', taskId: '', serviceId: '' });
    setFormOpen(false);
  };

  const applySuggestion = async (suggestion) => {
    if (!selectedIncident) return;
    const payload = { resolutionNotes: suggestion.resolutionNotes, resolvedVia: 'suggestion' };
    try {
      const response = await api.put(`/incidents/${selectedIncident.id}/resolve`, payload);
      setIncidents((current) => current.map((incident) => (incident.id === selectedIncident.id ? response.data : incident)));
    } catch {
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === selectedIncident.id
            ? { ...incident, status: 'RESOLVED', resolutionNotes: suggestion.resolutionNotes, resolvedVia: 'suggestion', resolvedAt: new Date().toISOString() }
            : incident,
        ),
      );
    }
  };

  return (
    <div className="grid grid-cols-[360px_1fr] gap-6">
      <aside className="panel h-[calc(100vh-136px)] overflow-hidden">
        <div className="border-b border-line p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title">Incident Board</h3>
            <button type="button" className="icon-button" onClick={() => setFormOpen(true)} aria-label="Create incident">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={17} />
            <input
              className="field-input pl-9"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="h-[calc(100%-105px)] overflow-auto p-3">
          {filteredIncidents.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => setSelectedId(incident.id)}
              className={selectedIncident?.id === incident.id ? 'incident-row incident-row-active' : 'incident-row'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{incident.title}</div>
                  <div className="mt-1 truncate text-xs text-ink-muted">{incident.service?.name || 'Unmapped service'}</div>
                </div>
                <span className={`badge ${priorityTone[incident.priority] || priorityTone.LOW}`}>{incident.priority}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                <span>#{incident.id}</span>
                <span>{minutesToLabel(incident.slaDeadline)}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {selectedIncident && (
        <section className="space-y-6">
          <div className="grid grid-cols-[1fr_0.9fr] gap-6">
            <div className="panel p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`badge ${statusTone[selectedIncident.status] || statusTone.CLOSED}`}>{selectedIncident.status}</span>
                    <span className={`badge ${priorityTone[selectedIncident.priority] || priorityTone.LOW}`}>{selectedIncident.priority}</span>
                  </div>
                  <h3 className="text-2xl font-semibold">{selectedIncident.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{selectedIncident.description}</p>
                </div>
                <div className="rounded-md border border-line px-4 py-3 text-right">
                  <div className="text-xs font-semibold uppercase text-ink-muted">SLA</div>
                  <div className="mt-1 text-xl font-semibold">{minutesToLabel(selectedIncident.slaDeadline)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={GitBranch} label="Service" value={selectedIncident.service?.name || 'Unmapped'} />
                <InfoTile icon={UserRound} label="Assigned To" value={selectedIncident.assignedTo?.name || 'Unassigned'} />
                <InfoTile icon={Clock3} label="Created" value={new Date(selectedIncident.createdAt).toLocaleString()} />
                <InfoTile icon={ShieldAlert} label="Project" value={selectedIncident.project?.name || 'Independent incident'} />
              </div>
            </div>

            <div className="panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="section-title">Blast Radius</h3>
                  <p className="section-subtitle">Impact score {blastRadius.estimatedImpactScore}</p>
                </div>
                <span className={`badge ${blastRadius.severity === 'critical' ? priorityTone.CRITICAL : priorityTone.HIGH}`}>
                  {blastRadius.severity}
                </span>
              </div>

              <div className="radius-chain">
                {(blastRadius.affectedServices || []).map((service, index) => (
                  <div key={`${service.id}-${index}`} className="radius-node">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white">{index + 1}</div>
                    <div>
                      <div className="text-sm font-semibold">{service.name}</div>
                      <div className="text-xs text-ink-muted">{service.ownerTeam} · {service.dependencyType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[0.95fr_1.05fr] gap-6">
            <div className="panel p-6">
              <h3 className="section-title">Blocked Teams</h3>
              <div className="mt-4 space-y-3">
                {(blastRadius.blockedTeams || []).map((team) => (
                  <div key={team.id} className="rounded-md border border-line p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{team.teamName}</div>
                      <span className="badge border-warning/30 bg-warning/10 text-warning">{team.activeTaskCount} tasks</span>
                    </div>
                    <div className="mt-2 text-sm text-ink-muted">Lead: {team.leadName}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-6">
              <h3 className="section-title">Tasks At Risk</h3>
              <div className="mt-4 space-y-3">
                {(blastRadius.tasksAtRisk || []).slice(0, 4).map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between rounded-md border border-line p-3">
                    <div>
                      <div className="text-sm font-semibold">{task.title}</div>
                      <div className="mt-1 text-xs text-ink-muted">{task.serviceName} · {task.assignedTo}</div>
                    </div>
                    <AlertTriangle size={17} className="text-warning" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <Lightbulb size={19} className="text-warning" />
              <h3 className="section-title">Resolution Suggestions</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {suggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.incidentId} className="rounded-md border border-line p-4">
                  <div className="text-sm font-semibold">{suggestion.title}</div>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-ink-muted">{suggestion.resolutionNotes}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
                    <span>{suggestion.resolvedBy}</span>
                    <span>{suggestion.resolvedInHours}h</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="secondary-button flex-1" onClick={() => applySuggestion(suggestion)}>
                      <Check size={15} />
                      Solved it
                    </button>
                    <button type="button" className="icon-button" aria-label="Dismiss suggestion">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="section-title">Activity Log</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                ['Created', selectedIncident.reportedBy?.name || 'Employee'],
                ['Assigned', selectedIncident.assignedTo?.name || 'Pending'],
                ['Blast radius', `${blastRadius.affectedServices?.length || 0} services`],
                ['SLA state', minutesToLabel(selectedIncident.slaDeadline)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-line bg-muted p-3">
                  <div className="text-xs font-semibold uppercase text-ink-muted">{label}</div>
                  <div className="mt-2 text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {formOpen && (
        <div className="modal-backdrop">
          <form onSubmit={createIncident} className="modal-panel">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="section-title">Create Incident</h3>
              <button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <label className="field-label">Title</label>
            <input className="field-input" value={incidentForm.title} onChange={(event) => setIncidentForm({ ...incidentForm, title: event.target.value })} required />
            <label className="field-label mt-4">Description</label>
            <textarea className="field-input min-h-24" value={incidentForm.description} onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Priority</label>
                <select className="field-input" value={incidentForm.priority} onChange={(event) => setIncidentForm({ ...incidentForm, priority: event.target.value })}>
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="field-label">Task</label>
                <select className="field-input" value={incidentForm.taskId} onChange={(event) => setIncidentForm({ ...incidentForm, taskId: event.target.value })}>
                  <option value="">Independent</option>
                  {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                </select>
              </div>
            </div>
            <label className="field-label mt-4">Service</label>
            <select className="field-input" value={incidentForm.serviceId} onChange={(event) => setIncidentForm({ ...incidentForm, serviceId: event.target.value })}>
              <option value="">Inherited from task</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <button type="submit" className="primary-button mt-6 w-full">
              <Send size={16} />
              Raise incident
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="rounded-md border border-line bg-muted p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-muted">
      <Icon size={14} />
      {label}
    </div>
    <div className="mt-2 text-sm font-semibold">{value}</div>
  </div>
);

export default Incidents;

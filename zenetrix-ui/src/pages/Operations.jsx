import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  GitBranch,
  Plus,
  Rows3,
  UsersRound,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Save,
  UserPlus,
  ShieldCheck,
  FolderKanban,
  Wand2,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import OnboardingWizard from '../components/OnboardingWizard';
import {
  mockDependencies,
  mockProjects,
  mockServices,
  mockTasks,
  mockTeams,
  mockUsers,
} from '../mockData';

const serviceTypes = ['API', 'DATABASE', 'INFRASTRUCTURE', 'FRONTEND', 'INTEGRATION', 'SECURITY', 'OTHER'];
const serviceStatuses = ['OPERATIONAL', 'DEGRADED', 'DOWN'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const stages = ['To Do', 'In Progress', 'Blocked', 'Done'];

const employeeRoles = [
  {
    role: 'MANAGER',
    title: 'Team Lead',
    description: 'Incident Commander & Service Owner. Assigns tickets, approves resolutions, and configures escalation.',
    badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  {
    role: 'SUPPORT_ENGINEER',
    title: 'Developer / Tester',
    description: 'Remediation & Diagnostic Resolver. Claims tickets, performs triage, marks tasks In Progress & Done.',
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  {
    role: 'EMPLOYEE',
    title: 'End Employee',
    description: 'Internal Consumer & Reporter. Reports incidents/bugs, views service health & blast radius.',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
];

const safeGet = async (path, fallback) => {
  try {
    const response = await api.get(path);
    return response.data;
  } catch {
    return fallback;
  }
};

const Operations = () => {
  const { user } = useAuth();

  const isOrgAdmin = user?.role === 'ORG_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isSupportEngineer = user?.role === 'SUPPORT_ENGINEER';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const canManageStaff = isOrgAdmin || isSuperAdmin;
  const canManageServices = isOrgAdmin || isSuperAdmin || isManager;
  const canManageDependencies = isOrgAdmin || isSuperAdmin || isManager;
  const canManageTeams = isOrgAdmin || isSuperAdmin || isManager;
  const canManageProjects = isOrgAdmin || isSuperAdmin || isManager;
  const canManageTasks = isOrgAdmin || isSuperAdmin || isManager || isSupportEngineer;

  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [wizardOpen, setWizardOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('services');
  const [serviceForm, setServiceForm] = useState({ name: '', type: 'API', customType: '', description: '', ownerTeamId: '' });
  const [dependencyForm, setDependencyForm] = useState({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', serviceIds: [] });
  const [taskForm, setTaskForm] = useState({ projectId: '', title: '', serviceId: '', assignedToId: '', priority: 'MEDIUM', stage: 'To Do' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'MANAGER', teamId: '' });

  // Customization & Edit modal states
  const [editingService, setEditingService] = useState(null);
  const [serviceActionError, setServiceActionError] = useState('');
  const [depActionError, setDepActionError] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userSuccessMessage, setUserSuccessMessage] = useState('');

  const loadData = async () => {
    const [serviceData, graphData, teamData, userData, projectData, taskData] = await Promise.all([
      safeGet('/services', []),
      safeGet('/dependencies/graph', { dependencies: [] }),
      safeGet('/teams', []),
      safeGet('/org/users', []),
      safeGet('/projects', []),
      safeGet('/tasks', []),
    ]);

    setServices(Array.isArray(serviceData) ? serviceData : []);
    setDependencies(Array.isArray(graphData?.dependencies) ? graphData.dependencies : []);
    setTeams(Array.isArray(teamData) ? teamData : []);
    setUsers(Array.isArray(userData) ? userData : []);
    setProjects(Array.isArray(projectData) ? projectData : []);
    setTasks(Array.isArray(taskData) ? taskData : []);
  };

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const sequence = useMemo(() => ([
    { label: 'Services', done: services.length > 0 },
    { label: 'Dependencies', done: dependencies.length > 0 },
    { label: 'Teams', done: teams.length > 0 },
    { label: 'Projects', done: projects.length > 0 },
    { label: 'Tasks', done: tasks.length > 0 },
    { label: 'Staff Provisioned', done: users.filter((u) => u.role !== 'ORG_ADMIN').length > 0 },
  ]), [dependencies.length, projects.length, services.length, tasks.length, teams.length, users]);

  const createService = async (event) => {
    event.preventDefault();
    setServiceActionError('');

    if (serviceForm.type === 'OTHER' && !serviceForm.customType.trim()) {
      setServiceActionError('Please enter the specific custom service name/category for type OTHER.');
      return;
    }

    const payload = {
      name: serviceForm.name.trim(),
      type: serviceForm.type,
      customType: serviceForm.type === 'OTHER' ? serviceForm.customType.trim() : null,
      description: serviceForm.description,
      ownerTeamId: serviceForm.ownerTeamId ? Number(serviceForm.ownerTeamId) : null,
      status: 'OPERATIONAL',
    };
    try {
      const response = await api.post('/services', payload);
      setServices((current) => [...current, response.data]);
      setServiceForm({ name: '', type: 'API', customType: '', description: '', ownerTeamId: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create service';
      setServiceActionError(msg);
    }
  };

  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!editingService) return;
    setServiceActionError('');

    if (editingService.type === 'OTHER' && (!editingService.customType || !editingService.customType.trim())) {
      setServiceActionError('Please enter the specific custom service name/category for type OTHER.');
      return;
    }

    const payload = {
      name: editingService.name,
      type: editingService.type,
      customType: editingService.type === 'OTHER' ? editingService.customType.trim() : null,
      description: editingService.description,
      ownerTeamId: editingService.ownerTeamId ? Number(editingService.ownerTeamId) : null,
      status: editingService.status || 'OPERATIONAL',
    };
    try {
      const response = await api.put(`/services/${editingService.id}`, payload);
      setServices((current) => current.map((s) => (s.id === editingService.id ? response.data : s)));
      setEditingService(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update service';
      setServiceActionError(msg);
    }
  };

  const handleDeleteService = async (serviceId) => {
    setServiceActionError('');
    try {
      await api.delete(`/services/${serviceId}`);
      setServices((current) => current.filter((s) => s.id !== serviceId));
      setDependencies((current) => current.filter((d) => d.fromService?.id !== serviceId && d.toService?.id !== serviceId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete service. Ensure no active tasks or incidents are linked.';
      setServiceActionError(msg);
    }
  };

  const createDependency = async (event) => {
    event.preventDefault();
    setDepActionError('');
    const fromId = Number(dependencyForm.fromServiceId);
    const toId = Number(dependencyForm.toServiceId);

    if (fromId === toId) {
      setDepActionError('A service cannot depend on itself (Self-dependency invariant).');
      return;
    }

    const isDuplicate = dependencies.some(
      (d) => (d.fromService?.id === fromId || d.fromServiceId === fromId) &&
             (d.toService?.id === toId || d.toServiceId === toId)
    );
    if (isDuplicate) {
      setDepActionError('Already defined: This dependency relationship already exists.');
      return;
    }

    const payload = {
      fromServiceId: fromId,
      toServiceId: toId,
      dependencyType: dependencyForm.dependencyType,
    };
    try {
      const response = await api.post('/dependencies', payload);
      setDependencies((current) => [...current, response.data]);
      setDependencyForm({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Circular or invalid service dependency detected.';
      setDepActionError(msg);
    }
  };

  const handleDeleteDependency = async (depId) => {
    setDepActionError('');
    try {
      await api.delete(`/dependencies/${depId}`);
      setDependencies((current) => current.filter((d) => d.id !== depId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete dependency';
      setDepActionError(msg);
    }
  };

  const handleCycleDependencyType = async (dependency) => {
    const cycle = { HARD: 'SOFT', SOFT: 'DATA', DATA: 'HARD' };
    const nextType = cycle[dependency.dependencyType] || 'HARD';
    try {
      const res = await api.put(`/dependencies/${dependency.id}`, {
        fromServiceId: dependency.fromService?.id || dependency.fromServiceId,
        toServiceId: dependency.toService?.id || dependency.toServiceId,
        dependencyType: nextType,
      });
      setDependencies((current) => current.map((d) => (d.id === dependency.id ? res.data : d)));
    } catch {
      setDependencies((current) => current.map((d) => (d.id === dependency.id ? { ...d, dependencyType: nextType } : d)));
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    const payload = {
      name: projectForm.name,
      description: projectForm.description,
      status: 'ACTIVE',
      serviceIds: projectForm.serviceIds.map(Number),
    };
    try {
      const response = await api.post('/projects', payload);
      setProjects((current) => [response.data, ...current]);
      setProjectForm({ name: '', description: '', serviceIds: [] });
    } catch {
      setProjects((current) => [{ id: Date.now(), ...payload }, ...current]);
      setProjectForm({ name: '', description: '', serviceIds: [] });
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskForm.projectId) return;
    const payload = {
      title: taskForm.title,
      serviceId: taskForm.serviceId ? Number(taskForm.serviceId) : null,
      assignedToId: taskForm.assignedToId ? Number(taskForm.assignedToId) : null,
      priority: taskForm.priority,
      stage: taskForm.stage,
    };
    try {
      const response = await api.post(`/projects/${taskForm.projectId}/tasks`, payload);
      setTasks((current) => [response.data, ...current]);
      setTaskForm({ projectId: taskForm.projectId, title: '', serviceId: '', assignedToId: '', priority: 'MEDIUM', stage: 'To Do' });
    } catch {
      setTasks((current) => [{ id: Date.now(), ...payload }, ...current]);
      setTaskForm({ projectId: taskForm.projectId, title: '', serviceId: '', assignedToId: '', priority: 'MEDIUM', stage: 'To Do' });
    }
  };

  // Staff creation (3 user forms & hierarchy)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setUserActionError('');
    setUserSuccessMessage('');

    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserActionError('Full name and work email are required.');
      return;
    }

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password ? userForm.password.trim() : 'password',
      role: userForm.role,
      teamId: userForm.teamId ? Number(userForm.teamId) : null,
    };

    try {
      const res = await api.post('/org/users', payload);
      setUsers([...users, res.data]);
      setUserSuccessMessage(`Successfully provisioned account for ${res.data.name} as ${res.data.role}`);
      setUserForm({ name: '', email: '', password: '', role: 'MANAGER', teamId: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to provision staff account.';
      setUserActionError(msg);
    }
  };

  const handleDeleteStaff = async (userId) => {
    setUserActionError('');
    try {
      await api.delete(`/org/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setUserActionError(err.response?.data?.message || 'Failed to remove user account.');
    }
  };

  const toggleProjectService = (serviceId) => {
    setProjectForm((current) => {
      const exists = current.serviceIds.includes(serviceId);
      return {
        ...current,
        serviceIds: exists
          ? current.serviceIds.filter((id) => id !== serviceId)
          : [...current.serviceIds, serviceId],
      };
    });
  };

  const filteredServices = useMemo(() => {
    if (selectedProjectId === 'ALL') return services;
    const project = projects.find((p) => String(p.id) === String(selectedProjectId));
    if (!project || !project.services) return services;
    const serviceIds = project.services.map((s) => s.id);
    return services.filter((s) => serviceIds.includes(s.id));
  }, [selectedProjectId, services, projects]);

  const staffUsers = users.filter((u) => u.role !== 'ORG_ADMIN');

  return (
    <div className="space-y-6">
      {/* Active Session & Hierarchy Scope Banner */}
      <div className="rounded-xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink">Active Session: {user?.name || user?.email || 'User'}</span>
              <span className={`badge ${
                isOrgAdmin ? 'border-primary/40 bg-primary/10 text-primary' :
                isManager ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' :
                isSupportEngineer ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              }`}>
                {isOrgAdmin ? 'Organization Administrator (ORG_ADMIN)' :
                 isManager ? 'Team Lead (MANAGER)' :
                 isSupportEngineer ? 'Developer / Tester (SUPPORT_ENGINEER)' :
                 'End Employee (EMPLOYEE)'}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {isOrgAdmin && 'Full authority over services, dependency architecture, team setup, and employee provisioning.'}
              {isManager && 'Incident Commander & Service Owner. Assigns tickets, manages projects, approves resolutions, configures escalation. (Staff provisioning reserved for Org Admin).'}
              {isSupportEngineer && 'Remediation & Diagnostic Resolver. Claims tickets, triages diagnostics, transitions tasks to In Progress & Done. (Staff provisioning reserved for Org Admin).'}
              {isEmployee && 'Internal Consumer & Reporter. Reports incidents/bugs, views service health & blast radius. (Read-only operations).'}
            </p>
          </div>
        </div>

        {isOrgAdmin && (
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Wand2 size={15} />
            Run 8-Step Setup Wizard
          </button>
        )}
      </div>

      {/* Multi-Project Scope Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-ink-muted">Project Management Scope</span>
              <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px]">
                {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-ink">Active Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-md border border-line bg-background px-3 py-1 text-sm font-semibold text-ink shadow-inner focus:border-primary focus:outline-none"
              >
                <option value="ALL">All Projects (Global Organization Scope)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="section-title">Setup Sequence & Readiness</h3>
              <p className="section-subtitle">Multi-project architecture verification and dependency invariants</p>
            </div>
            <span className="metric-pill">
              {sequence.filter((item) => item.done).length} / {sequence.length} Ready
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sequence.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`step-badge ${item.done ? 'step-badge-done' : ''}`}>
                  <span>{index + 1}</span>
                  <span>{item.label}</span>
                </div>
                {index < sequence.length - 1 && <ArrowRight size={15} className="text-ink-faint" />}
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-5 flex items-center gap-2">
            <GitBranch size={19} className="text-primary" />
            <h3 className="section-title">Graph Preview</h3>
          </div>
          <div className="graph-preview">
            {filteredServices.slice(0, 5).map((service, index) => (
              <div key={service.id} className="graph-node" style={{ left: `${8 + index * 20}%`, top: `${index % 2 === 0 ? 22 : 58}%` }}>
                <span>{service.name}</span>
              </div>
            ))}
            {dependencies.slice(0, 4).map((dependency, index) => (
              <div key={dependency.id || index} className="graph-edge" style={{ top: `${35 + index * 11}%`, width: `${22 + index * 7}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex border-b border-line">
          {[
            { id: 'services', label: 'Services', icon: Boxes },
            { id: 'dependencies', label: 'Dependencies', icon: GitBranch },
            { id: 'projects', label: 'Projects', icon: Rows3 },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
            { id: 'teams', label: 'Teams', icon: UsersRound },
            { id: 'staff', label: 'Staff & Roles', icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'tab-button tab-button-active' : 'tab-button'}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: SERVICES */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            {canManageServices ? (
              <form onSubmit={createService} className="border-r border-line p-6">
                <h3 className="section-title">Add Service / Component</h3>
                {serviceActionError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{serviceActionError}</span>
                  </div>
                )}
                <label className="field-label mt-5">Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Auth API, Payment Gateway, Kafka Cluster"
                  value={serviceForm.name}
                  onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                  required
                />

                <label className="field-label mt-4">Component Type *</label>
                <select
                  className="field-input"
                  value={serviceForm.type}
                  onChange={(event) => setServiceForm({ ...serviceForm, type: event.target.value })}
                >
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'OTHER' ? 'OTHER (Specify Custom Type)' : type}
                    </option>
                  ))}
                </select>

                {/* Specific Custom Service Name input when OTHER is selected */}
                {serviceForm.type === 'OTHER' && (
                  <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
                    <label className="field-label text-primary font-semibold flex items-center gap-1.5">
                      Specific Custom Service Name / Category *
                    </label>
                    <input
                      className="field-input border-primary/50 focus:border-primary mt-1"
                      placeholder="e.g. Apache Kafka Broker, Redis Cache, AWS S3 Bucket, Vector DB, LLM Worker"
                      value={serviceForm.customType}
                      onChange={(e) => setServiceForm({ ...serviceForm, customType: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      When OTHER is chosen, enter the exact component specification for graph and blast radius precision.
                    </p>
                  </div>
                )}

                <label className="field-label mt-4">Owner Team</label>
                <select
                  className="field-input"
                  value={serviceForm.ownerTeamId}
                  onChange={(event) => setServiceForm({ ...serviceForm, ownerTeamId: event.target.value })}
                >
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                <label className="field-label mt-4">Description</label>
                <textarea
                  className="field-input min-h-24"
                  placeholder="Operational purpose, SLA requirements, and failure impact"
                  value={serviceForm.description}
                  onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
                />

                <button className="primary-button mt-5 w-full" type="submit">
                  <Plus size={16} /> Create Service
                </button>
              </form>
            ) : (
              <div className="border-r border-line p-8 flex flex-col justify-center items-center text-center bg-surface/50">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
                  <Boxes size={28} />
                </div>
                <h4 className="text-base font-bold text-ink">Service Registry (Read-Only)</h4>
                <p className="mt-2 text-xs text-ink-muted max-w-sm leading-relaxed">
                  Service component creation and modification are restricted to <strong className="text-ink">Organization Administrators</strong> and <strong className="text-ink">Service Owners (Team Leads)</strong>.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-background p-4 text-left text-xs space-y-2 w-full max-w-sm shadow-sm">
                  <div className="font-semibold text-ink flex items-center gap-2 border-b border-line pb-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Your Hierarchy Scope</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {isSupportEngineer
                      ? 'As Developer / Tester (SUPPORT_ENGINEER), you claim tickets, perform triage diagnostics, and execute tasks across registered services.'
                      : 'As End Employee (EMPLOYEE), you have consumer-level visibility to monitor component health status, blast radius, and report incidents.'}
                  </p>
                </div>
              </div>
            )}

            <ServiceTable
              services={filteredServices}
              onEdit={(service) => setEditingService(service)}
              onDelete={handleDeleteService}
              canManage={canManageServices}
            />
          </div>
        )}

        {/* TAB: DEPENDENCIES */}
        {activeTab === 'dependencies' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            {canManageDependencies ? (
              <form onSubmit={createDependency} className="border-r border-line p-6">
                <h3 className="section-title">Add Dependency</h3>
                <p className="mt-1 text-xs text-ink-muted">Directional caller-to-callee impact relationship.</p>
                {depActionError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{depActionError}</span>
                  </div>
                )}
                <label className="field-label mt-5">Dependent Service (Caller)</label>
                <select className="field-input" value={dependencyForm.fromServiceId} onChange={(event) => setDependencyForm({ ...dependencyForm, fromServiceId: event.target.value })} required>
                  <option value="">Select caller service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
                <label className="field-label mt-4">Dependency (Callee)</label>
                <select className="field-input" value={dependencyForm.toServiceId} onChange={(event) => setDependencyForm({ ...dependencyForm, toServiceId: event.target.value })} required>
                  <option value="">Select callee dependency</option>
                  {services
                    .filter((service) => String(service.id) !== String(dependencyForm.fromServiceId))
                    .map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
                <label className="field-label mt-4">Type</label>
                <select className="field-input" value={dependencyForm.dependencyType} onChange={(event) => setDependencyForm({ ...dependencyForm, dependencyType: event.target.value })}>
                  <option value="HARD">HARD (Critical path - immediate failure)</option>
                  <option value="SOFT">SOFT (Non-blocking - degraded features)</option>
                  <option value="DATA">DATA (Database or state replication)</option>
                </select>
                <button className="primary-button mt-5 w-full" type="submit"><Plus size={16} /> Link dependency</button>
              </form>
            ) : (
              <div className="border-r border-line p-8 flex flex-col justify-center items-center text-center bg-surface/50">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
                  <GitBranch size={28} />
                </div>
                <h4 className="text-base font-bold text-ink">Dependency Topology (Read-Only)</h4>
                <p className="mt-2 text-xs text-ink-muted max-w-sm leading-relaxed">
                  Dependency architecture and topology linkages are configured by <strong className="text-ink">Organization Administrators</strong> and <strong className="text-ink">Service Owners (Team Leads)</strong>.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-background p-4 text-left text-xs space-y-2 w-full max-w-sm shadow-sm">
                  <div className="font-semibold text-ink flex items-center gap-2 border-b border-line pb-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Topology Inspection</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    You have read-only visibility into caller-to-callee dependencies, blast radius calculations, and downstream failure propagation pathways.
                  </p>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="section-title">Dependency Edges</h3>
                  <p className="section-subtitle">
                    {canManageDependencies ? 'Click badge to cycle type (HARD ↔ SOFT ↔ DATA) or delete to unlink.' : 'Active upstream and downstream architectural topology.'}
                  </p>
                </div>
                <span className="metric-pill">{dependencies.length} edges</span>
              </div>
              <div className="mt-4 space-y-3">
                {dependencies.length === 0 ? (
                  <div className="rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                    No dependencies defined yet.
                  </div>
                ) : (
                  dependencies.map((dependency) => (
                    <div key={dependency.id} className="dependency-row group">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{dependency.fromService?.name || 'Service A'}</span>
                        <ArrowRight size={14} className="text-ink-faint" />
                        <span className="font-semibold text-ink">{dependency.toService?.name || 'Service B'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageDependencies ? (
                          <button
                            type="button"
                            onClick={() => handleCycleDependencyType(dependency)}
                            title="Click to cycle dependency type"
                            className="badge cursor-pointer border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            {dependency.dependencyType}
                          </button>
                        ) : (
                          <span className="badge border-primary/30 bg-primary/10 text-primary">
                            {dependency.dependencyType}
                          </span>
                        )}
                        {canManageDependencies && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDependency(dependency.id)}
                            className="icon-button text-ink-muted hover:text-danger hover:bg-danger/10"
                            title="Unlink dependency"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            {canManageProjects ? (
              <form onSubmit={createProject} className="border-r border-line p-6">
                <h3 className="section-title">Create Project</h3>
                <p className="mt-1 text-xs text-ink-muted">Group services and operational tasks into distinct project streams.</p>
                <label className="field-label mt-5">Project Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Checkout Resilience, Mobile Banking"
                  value={projectForm.name}
                  onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                  required
                />
                <label className="field-label mt-4">Description</label>
                <textarea
                  className="field-input min-h-24"
                  placeholder="Scope and deliverables"
                  value={projectForm.description}
                  onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
                />
                <label className="field-label mt-4">Associated Services</label>
                <div className="check-grid max-h-48 overflow-y-auto">
                  {services.map((service) => (
                    <label key={service.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={projectForm.serviceIds.includes(service.id)}
                        onChange={() => toggleProjectService(service.id)}
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
                <button className="primary-button mt-5 w-full" type="submit">
                  <Plus size={16} /> Create Project
                </button>
              </form>
            ) : (
              <div className="border-r border-line p-8 flex flex-col justify-center items-center text-center bg-surface/50">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
                  <Rows3 size={28} />
                </div>
                <h4 className="text-base font-bold text-ink">Project Streams (Read-Only)</h4>
                <p className="mt-2 text-xs text-ink-muted max-w-sm leading-relaxed">
                  Project stream grouping is managed by <strong className="text-ink">Organization Administrators</strong> and <strong className="text-ink">Team Leads</strong>.
                </p>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Active Projects</h3>
                <span className="metric-pill">{projects.length} projects</span>
              </div>
              <div className="mt-4 space-y-3">
                <ProjectList projects={projects} />
              </div>
            </div>
          </div>
        )}

        {/* TAB: TASKS */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-[0.38fr_0.62fr] gap-0">
            {canManageTasks ? (
              <form onSubmit={createTask} className="border-r border-line p-6">
                <h3 className="section-title">Create Task</h3>
                <label className="field-label mt-5">Project *</label>
                <select
                  className="field-input"
                  value={taskForm.projectId}
                  onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <label className="field-label mt-4">Title *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Optimize Redis eviction policy"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                  required
                />
                <label className="field-label mt-4">Service Component</label>
                <select
                  className="field-input"
                  value={taskForm.serviceId}
                  onChange={(event) => setTaskForm({ ...taskForm, serviceId: event.target.value })}
                >
                  <option value="">No service link</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="field-label">Priority</label>
                    <select
                      className="field-input"
                      value={taskForm.priority}
                      onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}
                    >
                      {priorities.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Stage</label>
                    <select
                      className="field-input"
                      value={taskForm.stage}
                      onChange={(event) => setTaskForm({ ...taskForm, stage: event.target.value })}
                    >
                      {stages.map((stage) => (
                        <option key={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="field-label mt-4">Assign To (Resolver)</label>
                <select
                  className="field-input"
                  value={taskForm.assignedToId}
                  onChange={(event) => setTaskForm({ ...taskForm, assignedToId: event.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <button className="primary-button mt-5 w-full" type="submit">
                  <Plus size={16} /> Create Task
                </button>
              </form>
            ) : (
              <div className="border-r border-line p-8 flex flex-col justify-center items-center text-center bg-surface/50">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-base font-bold text-ink">Operational Task Queue</h4>
                <p className="mt-2 text-xs text-ink-muted max-w-sm leading-relaxed">
                  Operational tasks are created and assigned by <strong className="text-ink">Team Leads</strong> and claimed by <strong className="text-ink">Developers / Testers</strong>.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-background p-4 text-left text-xs space-y-2 w-full max-w-sm shadow-sm">
                  <div className="font-semibold text-ink flex items-center gap-2 border-b border-line pb-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Your Hierarchy Scope</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    As an End Employee (EMPLOYEE), your primary role is reporting incidents/bugs and monitoring blast radius health.
                  </p>
                </div>
              </div>
            )}
            <TaskBoard tasks={tasks} />
          </div>
        )}

        {/* TAB: TEAMS */}
        {activeTab === 'teams' && (
          <div className="p-6">
            <h3 className="section-title">Team Ownership</h3>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {teams.length === 0 ? (
                <div className="col-span-3 rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                  No teams configured yet.
                </div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="rounded-md border border-line p-4 shadow-sm bg-background">
                    <div className="text-sm font-semibold">{team.name}</div>
                    <div className="mt-1 text-xs text-ink-muted">Lead: {team.lead?.name || 'Unassigned'}</div>
                    <div className="mt-4 text-xs font-semibold uppercase text-ink-muted">Owned services</div>
                    <div className="mt-2 space-y-2">
                      {services.filter((service) => service.ownerTeam?.id === team.id).map((service) => (
                        <div key={service.id} className="rounded bg-muted px-2 py-1 text-sm flex items-center justify-between">
                          <span>{service.name}</span>
                          <span className="text-[10px] text-ink-muted">
                            {service.type === 'OTHER' && service.customType ? service.customType : service.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: STAFF & ROLES (ORGANIZATION ROLE & HIERARCHY) */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-[0.45fr_0.55fr] gap-0">
            {canManageStaff ? (
              <form onSubmit={handleCreateStaff} className="border-r border-line p-6">
                <h3 className="section-title">Provision Employee Account</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Create employee accounts following the 3 organizational hierarchy levels.
                </p>

                {userActionError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{userActionError}</span>
                  </div>
                )}

                {userSuccessMessage && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
                    <CheckCircle2 size={15} />
                    <span>{userSuccessMessage}</span>
                  </div>
                )}

                <label className="field-label mt-5">Full Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Alex Chen"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />

                <label className="field-label mt-3">Work Email *</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="alex@company.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />

                <label className="field-label mt-3">Employee ID / Password</label>
                <input
                  className="field-input"
                  placeholder="Default: password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />

                <label className="field-label mt-3">Organizational Role & Hierarchy *</label>
                <div className="mt-2 space-y-2">
                  {employeeRoles.map((r) => (
                    <label
                      key={r.role}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        userForm.role === r.role
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-line bg-surface hover:bg-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffRole"
                        value={r.role}
                        checked={userForm.role === r.role}
                        onChange={() => setUserForm({ ...userForm, role: r.role })}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{r.title}</span>
                          <span className={`badge ${r.badgeClass}`}>{r.role}</span>
                        </div>
                        <p className="mt-0.5 text-ink-muted">{r.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label className="field-label mt-3">Operational Team</label>
                <select
                  className="field-input"
                  value={userForm.teamId}
                  onChange={(e) => setUserForm({ ...userForm, teamId: e.target.value })}
                >
                  <option value="">No team assignment (unassigned)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <button className="primary-button mt-5 w-full" type="submit">
                  <UserPlus size={16} /> Provision Employee ID
                </button>
              </form>
            ) : (
              <div className="border-r border-line p-8 flex flex-col justify-center items-center text-center bg-surface/50">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
                  <ShieldAlert size={28} />
                </div>
                <h4 className="text-base font-bold text-ink">Staff Provisioning Restricted</h4>
                <p className="mt-2 text-xs text-ink-muted max-w-sm leading-relaxed">
                  Under organizational governance, only <strong className="text-ink">Organization Administrators (ORG_ADMIN)</strong> have authority to provision employee accounts and assign hierarchy roles.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-background p-4 text-left text-xs space-y-3 w-full max-w-sm shadow-sm">
                  <div className="font-semibold text-ink flex items-center gap-2 border-b border-line pb-2">
                    <UserCheck size={16} className="text-primary" />
                    <span>Role Hierarchy Governance</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-ink-muted">
                    <div>
                      <div className="font-semibold text-purple-400">Team Lead (MANAGER)</div>
                      <div>Incident Commander & Service Owner. Assigns tickets, approves resolutions, configures escalation.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-400">Developer / Tester (SUPPORT_ENGINEER)</div>
                      <div>Remediation & Diagnostic Resolver. Claims tickets, performs triage, marks tasks In Progress & Done.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400">End Employee (EMPLOYEE)</div>
                      <div>Internal Consumer & Reporter. Reports incidents/bugs, views service health & blast radius.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="section-title">Active Organization Roster</h3>
                  <p className="section-subtitle">
                    {canManageStaff
                      ? 'Org Admin manages employee IDs across Team Leads, Devs/Testers, and End Employees.'
                      : 'Active organization directory and assigned operational teams.'}
                  </p>
                </div>
                <span className="metric-pill">{users.length} accounts</span>
              </div>

              <div className="mt-4 space-y-3 max-h-[560px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                    No employee accounts provisioned yet.
                  </div>
                ) : (
                  users.map((u) => {
                    const roleConfig = employeeRoles.find((r) => r.role === u.role) || {
                      title: u.role === 'ORG_ADMIN' ? 'Organization Admin' : u.role,
                      badgeClass: u.role === 'ORG_ADMIN' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-line bg-muted text-ink-muted',
                    };
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-lg border border-line bg-background p-4 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{u.name}</span>
                            <span className={`badge ${roleConfig.badgeClass}`}>{roleConfig.title}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                            <span>{u.email}</span>
                            {u.team && <span>• Team: {u.team}</span>}
                          </div>
                        </div>

                        {canManageStaff && u.role !== 'ORG_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(u.id)}
                            className="icon-button text-ink-muted hover:text-danger hover:bg-danger/10"
                            title="Revoke employee ID"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Edit Service Customization Modal */}
      {editingService && (
        <div className="modal-backdrop">
          <form onSubmit={handleUpdateService} className="modal-panel max-w-lg">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes size={20} className="text-primary" />
                <h3 className="section-title">Customize Service</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditingService(null)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="field-label">Service Name *</label>
                <input
                  className="field-input"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Type *</label>
                  <select
                    className="field-input"
                    value={editingService.type}
                    onChange={(e) => setEditingService({ ...editingService, type: e.target.value })}
                  >
                    {serviceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t === 'OTHER' ? 'OTHER (Specify Custom Type)' : t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Status</label>
                  <select
                    className="field-input"
                    value={editingService.status}
                    onChange={(e) => setEditingService({ ...editingService, status: e.target.value })}
                  >
                    {serviceStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Custom Type input when OTHER is selected */}
              {editingService.type === 'OTHER' && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <label className="field-label text-primary font-semibold flex items-center gap-1.5">
                    Specific Custom Service Name / Category *
                  </label>
                  <input
                    className="field-input border-primary/50 focus:border-primary mt-1"
                    placeholder="e.g. Apache Kafka, Redis Distributed Cache, AWS S3, Vector DB"
                    value={editingService.customType || ''}
                    onChange={(e) => setEditingService({ ...editingService, customType: e.target.value })}
                    required
                  />
                  <p className="mt-1 text-[11px] text-ink-muted">
                    When OTHER is chosen, enter the exact component specification for graph and blast radius precision.
                  </p>
                </div>
              )}

              <div>
                <label className="field-label">Owner Team</label>
                <select
                  className="field-input"
                  value={editingService.ownerTeamId || editingService.ownerTeam?.id || ''}
                  onChange={(e) => setEditingService({ ...editingService, ownerTeamId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  className="field-input min-h-24"
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="secondary-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
              >
                <Save size={15} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Setup Wizard Modal */}
      <OnboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => {
          setWizardOpen(false);
          loadData();
        }}
      />
    </div>
  );
};

const ServiceTable = ({ services, onEdit, onDelete, canManage = true }) => (
  <div className="overflow-x-auto">
    <table className="data-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Type</th>
          <th>Owner</th>
          <th>Status</th>
          {canManage && <th className="text-right">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {services.length === 0 ? (
          <tr>
            <td colSpan={canManage ? 5 : 4} className="py-6 text-center text-xs text-ink-muted">
              No services registered yet. Add a service to customize your company catalog.
            </td>
          </tr>
        ) : (
          services.map((service) => (
            <tr key={service.id}>
              <td>
                <div className="font-semibold text-ink">{service.name}</div>
                <div className="text-xs text-ink-muted">{service.description || 'No description provided'}</div>
              </td>
              <td>
                <span className="badge border-primary/30 bg-primary/10 text-primary text-[11px]">
                  {service.type === 'OTHER' && service.customType ? `OTHER: ${service.customType}` : service.type}
                </span>
              </td>
              <td>
                <span className={service.ownerTeam ? 'font-medium text-ink' : 'text-xs text-ink-faint'}>
                  {service.ownerTeam?.name || 'Unassigned'}
                </span>
              </td>
              <td>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  service.status === 'OPERATIONAL'
                    ? 'text-accent'
                    : service.status === 'DEGRADED'
                    ? 'text-warning'
                    : 'text-danger'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    service.status === 'OPERATIONAL'
                      ? 'bg-accent'
                      : service.status === 'DEGRADED'
                      ? 'bg-warning'
                      : 'bg-danger'
                  }`} />
                  {String(service.status).toLowerCase()}
                </span>
              </td>
              {canManage && (
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(service)}
                      className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-1 text-xs font-medium text-ink hover:bg-muted transition-colors"
                      title="Customize service"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(service.id)}
                      className="inline-flex items-center gap-1 rounded border border-danger/20 bg-danger/5 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                      title="Delete service"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const ProjectList = ({ projects }) => (
  <div className="space-y-3">
    {projects.length === 0 ? (
      <div className="rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
        No projects configured yet.
      </div>
    ) : (
      projects.map((project) => (
        <div key={project.id} className="rounded-md border border-line p-4 shadow-sm bg-background">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-ink">{project.name}</div>
            <span className="badge border-accent/30 bg-accent/10 text-accent">{project.status}</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">{project.description}</p>
        </div>
      ))
    )}
  </div>
);

const TaskBoard = ({ tasks }) => (
  <div className="grid grid-cols-4 gap-0">
    {stages.map((stage) => (
      <div key={stage} className="min-h-[520px] border-r border-line p-4 last:border-r-0">
        <div className="mb-4 text-sm font-semibold">{stage}</div>
        <div className="space-y-3">
          {tasks.filter((task) => task.stage === stage).map((task) => (
            <div key={task.id} className="rounded-md border border-line bg-background p-3 shadow-sm">
              <div className="text-sm font-semibold text-ink">{task.title}</div>
              <div className="mt-2 text-xs text-ink-muted">{task.service?.name}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ink-muted">{task.assignedTo?.name || 'Unassigned'}</span>
                <span className="badge border-line bg-muted text-ink-muted">{task.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default Operations;

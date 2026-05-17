import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Boxes, CheckCircle2, GitBranch, Plus, Rows3, UsersRound } from 'lucide-react';
import api from '../api';
import {
  mockDependencies,
  mockProjects,
  mockServices,
  mockTasks,
  mockTeams,
  mockUsers,
} from '../mockData';

const serviceTypes = ['API', 'DATABASE', 'INFRASTRUCTURE', 'FRONTEND', 'INTEGRATION', 'SECURITY', 'OTHER'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const stages = ['To Do', 'In Progress', 'Blocked', 'Done'];

const safeGet = async (path, fallback) => {
  try {
    const response = await api.get(path);
    return response.data;
  } catch {
    return fallback;
  }
};

const Operations = () => {
  const [services, setServices] = useState(mockServices);
  const [dependencies, setDependencies] = useState(mockDependencies);
  const [teams, setTeams] = useState(mockTeams);
  const [users, setUsers] = useState(mockUsers);
  const [projects, setProjects] = useState(mockProjects);
  const [tasks, setTasks] = useState(mockTasks);
  const [activeTab, setActiveTab] = useState('services');
  const [serviceForm, setServiceForm] = useState({ name: '', type: 'API', description: '', ownerTeamId: '' });
  const [dependencyForm, setDependencyForm] = useState({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', serviceIds: [] });
  const [taskForm, setTaskForm] = useState({ projectId: '', title: '', serviceId: '', assignedToId: '', priority: 'MEDIUM', stage: 'To Do' });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [serviceData, graphData, teamData, userData, projectData, taskData] = await Promise.all([
        safeGet('/services', mockServices),
        safeGet('/dependencies/graph', { dependencies: mockDependencies }),
        safeGet('/teams', mockTeams),
        safeGet('/org/users', mockUsers),
        safeGet('/projects', mockProjects),
        safeGet('/tasks', mockTasks),
      ]);

      if (!mounted) return;
      setServices(Array.isArray(serviceData) ? serviceData : mockServices);
      setDependencies(Array.isArray(graphData.dependencies) ? graphData.dependencies : mockDependencies);
      setTeams(Array.isArray(teamData) ? teamData : mockTeams);
      setUsers(Array.isArray(userData) ? userData : mockUsers);
      setProjects(Array.isArray(projectData) ? projectData : mockProjects);
      setTasks(Array.isArray(taskData) ? taskData : mockTasks);
    };
    load();
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
  ]), [dependencies.length, projects.length, services.length, tasks.length, teams.length]);

  const createService = async (event) => {
    event.preventDefault();
    const payload = {
      name: serviceForm.name,
      type: serviceForm.type,
      description: serviceForm.description,
      ownerTeamId: serviceForm.ownerTeamId ? Number(serviceForm.ownerTeamId) : null,
      status: 'OPERATIONAL',
    };
    try {
      const response = await api.post('/services', payload);
      setServices((current) => [...current, response.data]);
    } catch {
      setServices((current) => [...current, { id: Date.now(), ...payload, ownerTeam: teams.find((team) => team.id === payload.ownerTeamId) }]);
    }
    setServiceForm({ name: '', type: 'API', description: '', ownerTeamId: '' });
  };

  const createDependency = async (event) => {
    event.preventDefault();
    const payload = {
      fromServiceId: Number(dependencyForm.fromServiceId),
      toServiceId: Number(dependencyForm.toServiceId),
      dependencyType: dependencyForm.dependencyType,
    };
    try {
      const response = await api.post('/dependencies', payload);
      setDependencies((current) => [...current, response.data]);
    } catch {
      setDependencies((current) => [
        ...current,
        {
          id: Date.now(),
          dependencyType: payload.dependencyType,
          fromService: services.find((service) => service.id === payload.fromServiceId),
          toService: services.find((service) => service.id === payload.toServiceId),
        },
      ]);
    }
    setDependencyForm({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
  };

  const createProject = async (event) => {
    event.preventDefault();
    const payload = {
      name: projectForm.name,
      description: projectForm.description,
      status: 'ACTIVE',
      startDate: new Date().toISOString().slice(0, 10),
      serviceIds: projectForm.serviceIds,
    };
    try {
      const response = await api.post('/projects', payload);
      setProjects((current) => [response.data, ...current]);
    } catch {
      setProjects((current) => [{ id: Date.now(), ...payload, createdBy: { name: 'Current user' } }, ...current]);
    }
    setProjectForm({ name: '', description: '', serviceIds: [] });
  };

  const createTask = async (event) => {
    event.preventDefault();
    const projectId = Number(taskForm.projectId);
    const payload = {
      title: taskForm.title,
      serviceId: Number(taskForm.serviceId),
      assignedToId: taskForm.assignedToId ? Number(taskForm.assignedToId) : null,
      priority: taskForm.priority,
      stage: taskForm.stage,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, payload);
      setTasks((current) => [response.data, ...current]);
    } catch {
      setTasks((current) => [
        {
          id: Date.now(),
          ...payload,
          service: services.find((service) => service.id === payload.serviceId),
          assignedTo: users.find((user) => user.id === payload.assignedToId),
          project: projects.find((project) => project.id === projectId),
        },
        ...current,
      ]);
    }
    setTaskForm({ projectId: '', title: '', serviceId: '', assignedToId: '', priority: 'MEDIUM', stage: 'To Do' });
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-[0.85fr_1.15fr] gap-6">
        <div className="panel p-6">
          <h3 className="section-title">Org Setup Progress</h3>
          <p className="section-subtitle">Services come first, then dependencies, ownership, projects, and tasks.</p>
          <div className="mt-6 space-y-4">
            {sequence.map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={step.done ? 'step-dot step-dot-done' : 'step-dot'}>{index + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{step.label}</div>
                  <div className="text-xs text-ink-muted">{step.done ? 'Configured' : 'Waiting'}</div>
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
            {services.slice(0, 5).map((service, index) => (
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

        {activeTab === 'services' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            <form onSubmit={createService} className="border-r border-line p-6">
              <h3 className="section-title">Add Service</h3>
              <label className="field-label mt-5">Name</label>
              <input className="field-input" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required />
              <label className="field-label mt-4">Type</label>
              <select className="field-input" value={serviceForm.type} onChange={(event) => setServiceForm({ ...serviceForm, type: event.target.value })}>
                {serviceTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <label className="field-label mt-4">Owner Team</label>
              <select className="field-input" value={serviceForm.ownerTeamId} onChange={(event) => setServiceForm({ ...serviceForm, ownerTeamId: event.target.value })}>
                <option value="">Unassigned</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <label className="field-label mt-4">Description</label>
              <textarea className="field-input min-h-24" value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} />
              <button className="primary-button mt-5" type="submit"><Plus size={16} /> Create service</button>
            </form>
            <ServiceTable services={services} />
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            <form onSubmit={createDependency} className="border-r border-line p-6">
              <h3 className="section-title">Add Dependency</h3>
              <label className="field-label mt-5">Dependent Service</label>
              <select className="field-input" value={dependencyForm.fromServiceId} onChange={(event) => setDependencyForm({ ...dependencyForm, fromServiceId: event.target.value })} required>
                <option value="">Select service</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <label className="field-label mt-4">Dependency</label>
              <select className="field-input" value={dependencyForm.toServiceId} onChange={(event) => setDependencyForm({ ...dependencyForm, toServiceId: event.target.value })} required>
                <option value="">Select service</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <label className="field-label mt-4">Type</label>
              <select className="field-input" value={dependencyForm.dependencyType} onChange={(event) => setDependencyForm({ ...dependencyForm, dependencyType: event.target.value })}>
                <option>HARD</option>
                <option>SOFT</option>
                <option>DATA</option>
              </select>
              <button className="primary-button mt-5" type="submit"><Plus size={16} /> Link dependency</button>
            </form>
            <div className="p-6">
              <h3 className="section-title">Dependency Edges</h3>
              <div className="mt-4 space-y-3">
                {dependencies.map((dependency) => (
                  <div key={dependency.id} className="dependency-row">
                    <span>{dependency.fromService?.name}</span>
                    <ArrowRight size={15} className="text-ink-faint" />
                    <span>{dependency.toService?.name}</span>
                    <span className="badge border-primary/30 bg-primary/10 text-primary">{dependency.dependencyType}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            <form onSubmit={createProject} className="border-r border-line p-6">
              <h3 className="section-title">Create Project</h3>
              <label className="field-label mt-5">Name</label>
              <input className="field-input" value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} required />
              <label className="field-label mt-4">Description</label>
              <textarea className="field-input min-h-24" value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} />
              <label className="field-label mt-4">Services</label>
              <div className="check-grid">
                {services.map((service) => (
                  <label key={service.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={projectForm.serviceIds.includes(service.id)}
                      onChange={(event) => {
                        const serviceIds = event.target.checked
                          ? [...projectForm.serviceIds, service.id]
                          : projectForm.serviceIds.filter((id) => id !== service.id);
                        setProjectForm({ ...projectForm, serviceIds });
                      }}
                    />
                    {service.name}
                  </label>
                ))}
              </div>
              <button className="primary-button mt-5" type="submit"><Plus size={16} /> Create project</button>
            </form>
            <div className="p-6">
              <ProjectList projects={projects} />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-[0.42fr_0.58fr] gap-0">
            <form onSubmit={createTask} className="border-r border-line p-6">
              <h3 className="section-title">Create Task</h3>
              <label className="field-label mt-5">Project</label>
              <select className="field-input" value={taskForm.projectId} onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })} required>
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <label className="field-label mt-4">Title</label>
              <input className="field-input" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
              <label className="field-label mt-4">Service</label>
              <select className="field-input" value={taskForm.serviceId} onChange={(event) => setTaskForm({ ...taskForm, serviceId: event.target.value })} required>
                <option value="">Select service</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Priority</label>
                  <select className="field-input" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                    {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Stage</label>
                  <select className="field-input" value={taskForm.stage} onChange={(event) => setTaskForm({ ...taskForm, stage: event.target.value })}>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </div>
              </div>
              <label className="field-label mt-4">Assign To</label>
              <select className="field-input" value={taskForm.assignedToId} onChange={(event) => setTaskForm({ ...taskForm, assignedToId: event.target.value })}>
                <option value="">Unassigned</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
              <button className="primary-button mt-5" type="submit"><Plus size={16} /> Create task</button>
            </form>
            <TaskBoard tasks={tasks} />
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="p-6">
            <h3 className="section-title">Team Ownership</h3>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="rounded-md border border-line p-4">
                  <div className="text-sm font-semibold">{team.name}</div>
                  <div className="mt-1 text-xs text-ink-muted">Lead: {team.lead?.name || 'Unassigned'}</div>
                  <div className="mt-4 text-xs font-semibold uppercase text-ink-muted">Owned services</div>
                  <div className="mt-2 space-y-2">
                    {services.filter((service) => service.ownerTeam?.id === team.id).map((service) => (
                      <div key={service.id} className="rounded bg-muted px-2 py-1 text-sm">{service.name}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const ServiceTable = ({ services }) => (
  <div className="overflow-hidden">
    <table className="data-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Type</th>
          <th>Owner</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service) => (
          <tr key={service.id}>
            <td>
              <div className="font-semibold">{service.name}</div>
              <div className="text-xs text-ink-muted">{service.description}</div>
            </td>
            <td>{service.type}</td>
            <td>{service.ownerTeam?.name || 'Unassigned'}</td>
            <td>{String(service.status).toLowerCase()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProjectList = ({ projects }) => (
  <div className="space-y-3">
    {projects.map((project) => (
      <div key={project.id} className="rounded-md border border-line p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{project.name}</div>
          <span className="badge border-accent/30 bg-accent/10 text-accent">{project.status}</span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">{project.description}</p>
      </div>
    ))}
  </div>
);

const TaskBoard = ({ tasks }) => (
  <div className="grid grid-cols-4 gap-0">
    {stages.map((stage) => (
      <div key={stage} className="min-h-[520px] border-r border-line p-4 last:border-r-0">
        <div className="mb-4 text-sm font-semibold">{stage}</div>
        <div className="space-y-3">
          {tasks.filter((task) => task.stage === stage).map((task) => (
            <div key={task.id} className="rounded-md border border-line bg-background p-3">
              <div className="text-sm font-semibold">{task.title}</div>
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

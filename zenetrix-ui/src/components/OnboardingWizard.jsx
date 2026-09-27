import { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  GitBranch,
  UsersRound,
  ShieldCheck,
  Clock3,
  BellRing,
  UserPlus,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Lock,
  FolderKanban,
  UserCheck,
  Info,
} from 'lucide-react';
import api from '../api';

const stepConfig = [
  { id: 1, label: 'Services', title: 'Add Services & Components', icon: Boxes, desc: 'Atomic building blocks of your architecture' },
  { id: 2, label: 'Dependencies', title: 'Define Service Dependencies', icon: GitBranch, desc: 'Directional relationships that power blast radius traversal' },
  { id: 3, label: 'Teams', title: 'Create Teams', icon: UsersRound, desc: 'Operational teams responsible for services' },
  { id: 4, label: 'Ownership', title: 'Map Service Ownership', icon: ShieldCheck, desc: 'Link services directly to their owning team' },
  { id: 5, label: 'SLAs', title: 'Configure SLA Rules', icon: Clock3, desc: 'Resolution deadlines for Critical, High, Medium, Low' },
  { id: 6, label: 'Escalation', title: 'Escalation Policies', icon: BellRing, desc: 'Automated notification thresholds at 50%, 75%, and 100%' },
  { id: 7, label: 'Staff IDs', title: 'Provision Employee IDs & Roles', icon: UserPlus, desc: 'Create Team Leads, Dev/Testers, and End Employees' },
  { id: 8, label: 'Launch', title: 'Review Graph & Go Live', icon: Rocket, desc: 'Confirm structural reality and unlock incident command' },
];

const serviceTypes = ['API', 'DATABASE', 'INFRASTRUCTURE', 'FRONTEND', 'INTEGRATION', 'SECURITY', 'OTHER'];

const employeeRoles = [
  {
    role: 'MANAGER',
    title: 'Team Lead',
    description: 'Incident Commander & Service Owner. Assigns tickets, approves resolutions, manages escalation.',
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

const OnboardingWizard = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Form states
  const [serviceForm, setServiceForm] = useState({ name: '', type: 'API', customType: '', description: '' });
  const [depForm, setDepForm] = useState({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
  const [teamForm, setTeamForm] = useState({ name: '' });
  const [ownershipForm, setOwnershipForm] = useState({ serviceId: '', ownerTeamId: '' });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER',
    teamId: '',
  });
  const [slaForm, setSlaForm] = useState({
    criticalHours: 1,
    highHours: 4,
    mediumHours: 24,
    lowHours: 72,
  });

  const [depError, setDepError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [launchError, setLaunchError] = useState('');

  const fetchExistingData = async () => {
    try {
      const [servicesRes, depsRes, teamsRes, usersRes, projectsRes, statusRes] = await Promise.all([
        api.get('/services').catch(() => ({ data: [] })),
        api.get('/dependencies').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] })),
        api.get('/org/users').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/org/onboarding/status').catch(() => ({ data: null })),
      ]);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setDependencies(Array.isArray(depsRes.data) ? depsRes.data : []);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setOrgUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      const projList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(String(projList[0].id));
      }

      if (statusRes?.data?.currentStep) {
        setCurrentStep(Math.max(1, Math.min(8, statusRes.data.currentStep)));
      }
    } catch (e) {
      console.error('Error fetching onboarding baseline:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExistingData();
    }
  }, [isOpen]);

  // Dynamic step completion validation
  const step1Done = useMemo(() => services.length >= 1, [services.length]);
  const step2Done = useMemo(() => (services.length > 1 ? dependencies.length >= 1 : services.length === 1), [services.length, dependencies.length]);
  const step3Done = useMemo(() => teams.length >= 1, [teams.length]);
  const step4Done = useMemo(() => services.length > 0 && services.some((s) => s.ownerTeam || s.ownerTeamId), [services]);
  const step5Done = useMemo(() => slaForm.criticalHours > 0, [slaForm.criticalHours]);
  const step6Done = true; // baseline escalation triggers pre-configured
  const step7Done = useMemo(() => orgUsers.filter((u) => u.role !== 'ORG_ADMIN').length >= 1, [orgUsers]);
  const step8Done = useMemo(() => step1Done && step2Done && step3Done && step4Done && step5Done && step6Done && step7Done, [
    step1Done,
    step2Done,
    step3Done,
    step4Done,
    step5Done,
    step6Done,
    step7Done,
  ]);

  // Strict sequential gating: Check if target step can be accessed
  const isStepUnlocked = (stepId) => {
    if (stepId === 1) return true;
    if (stepId === 2) return step1Done;
    if (stepId === 3) return step1Done && step2Done;
    if (stepId === 4) return step1Done && step2Done && step3Done;
    if (stepId === 5) return step1Done && step2Done && step3Done && step4Done;
    if (stepId === 6) return step1Done && step2Done && step3Done && step4Done && step5Done;
    if (stepId === 7) return step1Done && step2Done && step3Done && step4Done && step5Done && step6Done;
    if (stepId === 8) return step8Done;
    return false;
  };

  const canAdvanceCurrentStep = () => {
    if (currentStep === 1) return step1Done;
    if (currentStep === 2) return step2Done;
    if (currentStep === 3) return step3Done;
    if (currentStep === 4) return step4Done;
    if (currentStep === 5) return step5Done;
    if (currentStep === 6) return step6Done;
    if (currentStep === 7) return step7Done;
    return true;
  };

  const getStepBlockerReason = () => {
    if (currentStep === 1 && !step1Done) return 'Add at least 1 service to unlock Step 2.';
    if (currentStep === 2 && !step2Done) return 'Link dependencies between services to unlock Step 3.';
    if (currentStep === 3 && !step3Done) return 'Create at least 1 operational response team to unlock Step 4.';
    if (currentStep === 4 && !step4Done) return 'Assign an owner team to your services to unlock Step 5.';
    if (currentStep === 7 && !step7Done) return 'Provision at least 1 staff ID (Team Lead, Dev/Tester, or Employee) to unlock Step 8.';
    return '';
  };

  if (!isOpen) return null;

  // Step 1: Add Service with custom type support
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;
    setServiceError('');

    if (serviceForm.type === 'OTHER' && !serviceForm.customType.trim()) {
      setServiceError('Please specify the custom service name/category for type OTHER.');
      return;
    }

    if (services.some((s) => s.name.toLowerCase() === serviceForm.name.trim().toLowerCase())) {
      setServiceError(`A service named "${serviceForm.name.trim()}" already exists in your catalog.`);
      return;
    }

    const payload = {
      name: serviceForm.name.trim(),
      type: serviceForm.type,
      customType: serviceForm.type === 'OTHER' ? serviceForm.customType.trim() : null,
      description: serviceForm.description.trim(),
      status: 'OPERATIONAL',
    };

    try {
      const res = await api.post('/services', payload);
      setServices([...services, res.data]);

      // If a project is selected, also link this service to the project
      if (selectedProjectId) {
        try {
          const currentProj = projects.find((p) => String(p.id) === String(selectedProjectId));
          if (currentProj) {
            const currentServiceIds = (currentProj.services || []).map((s) => s.id);
            await api.put(`/projects/${selectedProjectId}`, {
              name: currentProj.name,
              description: currentProj.description,
              status: currentProj.status || 'ACTIVE',
              serviceIds: [...currentServiceIds, res.data.id],
            });
          }
        } catch {
          // ignore project link errors
        }
      }
    } catch {
      setServices([...services, { id: Date.now(), ...payload }]);
    }
    setServiceForm({ name: '', type: 'API', customType: '', description: '' });
  };

  const handleRemoveService = async (serviceId) => {
    try {
      await api.delete(`/services/${serviceId}`);
    } catch {
      // fallback
    }
    setServices(services.filter((s) => s.id !== serviceId));
    setDependencies(dependencies.filter((d) => d.fromService?.id !== serviceId && d.toService?.id !== serviceId));
  };

  // Step 2: Add Dependency
  const handleAddDependency = async (e) => {
    e.preventDefault();
    setDepError('');
    const fromId = Number(depForm.fromServiceId);
    const toId = Number(depForm.toServiceId);
    if (!fromId || !toId) return;

    if (fromId === toId) {
      setDepError('A service cannot depend on itself.');
      return;
    }

    const isDuplicate = dependencies.some(
      (d) => (d.fromService?.id === fromId || d.fromServiceId === fromId) &&
             (d.toService?.id === toId || d.toServiceId === toId)
    );
    if (isDuplicate) {
      setDepError('Already defined: This dependency is already connected.');
      return;
    }

    try {
      const payload = {
        fromServiceId: fromId,
        toServiceId: toId,
        dependencyType: depForm.dependencyType,
      };
      const res = await api.post('/dependencies', payload);
      setDependencies([...dependencies, res.data]);
      setDepForm({ fromServiceId: '', toServiceId: '', dependencyType: 'HARD' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Circular or invalid service dependency detected.';
      setDepError(msg);
    }
  };

  const handleRemoveDependency = async (depId) => {
    try {
      await api.delete(`/dependencies/${depId}`);
    } catch {
      // fallback
    }
    setDependencies(dependencies.filter((d) => d.id !== depId));
  };

  // Step 3: Create Team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    try {
      const res = await api.post('/teams', { name: teamForm.name.trim() });
      setTeams([...teams, res.data]);
    } catch {
      setTeams([...teams, { id: Date.now(), name: teamForm.name.trim() }]);
    }
    setTeamForm({ name: '' });
  };

  // Step 4: Assign Service Ownership
  const handleAssignOwnership = async (e) => {
    e.preventDefault();
    if (!ownershipForm.serviceId || !ownershipForm.ownerTeamId) return;
    const serviceId = Number(ownershipForm.serviceId);
    const teamId = Number(ownershipForm.ownerTeamId);
    const service = services.find((s) => s.id === serviceId);
    const team = teams.find((t) => t.id === teamId);
    if (!service) return;

    try {
      const updated = await api.put(`/services/${serviceId}`, {
        name: service.name,
        type: service.type,
        customType: service.customType,
        description: service.description,
        status: service.status || 'OPERATIONAL',
        ownerTeamId: teamId,
      });
      setServices(services.map((s) => (s.id === serviceId ? updated.data : s)));
    } catch {
      setServices(services.map((s) => (s.id === serviceId ? { ...s, ownerTeam: team } : s)));
    }
    setOwnershipForm({ serviceId: '', ownerTeamId: '' });
  };

  // Step 7: Provision Employee Accounts with 3 Roles & Hierarchy
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserError('Name and email are required.');
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
      setOrgUsers([...orgUsers, res.data]);
      setUserSuccess(`Successfully provisioned account for ${res.data.name} (${res.data.role})`);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'MANAGER',
        teamId: '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to provision employee ID.';
      setUserError(msg);
    }
  };

  const handleDeleteEmployee = async (userId) => {
    try {
      await api.delete(`/org/users/${userId}`);
      setOrgUsers(orgUsers.filter((u) => u.id !== userId));
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to remove user account.');
    }
  };

  // Create Project inline
  const handleCreateProjectInline = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const res = await api.post('/projects', {
        name: newProjectName.trim(),
        description: 'Provisioned during organization setup wizard',
        status: 'ACTIVE',
        serviceIds: [],
      });
      setProjects([...projects, res.data]);
      setSelectedProjectId(String(res.data.id));
      setNewProjectName('');
      setShowProjectModal(false);
    } catch (err) {
      console.error('Project creation failed:', err);
    }
  };

  const handleNext = async () => {
    if (!canAdvanceCurrentStep()) return;
    const nextStep = Math.min(8, currentStep + 1);
    try {
      await api.put(`/org/onboarding/step/${nextStep}`);
    } catch {
      // ignore
    }
    setCurrentStep(nextStep);
  };

  const handleLaunchOrganization = async () => {
    if (!step8Done) {
      setLaunchError('Cannot launch: Please satisfy all prerequisite steps before going live.');
      return;
    }
    setSubmitting(true);
    setLaunchError('');
    try {
      await api.post('/org/onboarding/complete');
      if (onComplete) onComplete();
      if (onClose) onClose();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to launch organization. Check step requirements.';
      setLaunchError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentConfig = stepConfig.find((s) => s.id === currentStep);
  const staffUsers = orgUsers.filter((u) => u.role !== 'ORG_ADMIN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        {/* Wizard Header with Multi-Project Scope */}
        <header className="border-b border-line bg-background px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-sm">
                <currentConfig.icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-muted">
                  <span>Step {currentStep} of 8</span>
                  <span>•</span>
                  <span>Sequential Setup Wizard</span>
                </div>
                <h2 className="text-xl font-bold text-ink">{currentConfig.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Multi-Project Scope Selector */}
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-sm">
                <FolderKanban size={15} className="text-primary" />
                <span className="text-xs font-medium text-ink-muted">Project Scope:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-ink focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-surface text-ink">
                      {p.name}
                    </option>
                  ))}
                  {projects.length === 0 && <option value="">Default Project Scope</option>}
                </select>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
                  title="Create a new Project"
                >
                  + New
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="icon-button"
                aria-label="Close wizard"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Inline New Project Modal */}
        {showProjectModal && (
          <div className="border-b border-primary/30 bg-primary/5 px-8 py-3">
            <form onSubmit={handleCreateProjectInline} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-primary">New Project Name:</span>
              <input
                className="field-input h-8 max-w-xs text-xs"
                placeholder="e.g. Payment Gateway V2, Mobile App"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" className="primary-button h-8 px-3 text-xs">
                Create & Switch
              </button>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="secondary-button h-8 px-3 text-xs"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Step Progress Tracker with Strict Sequential Padlock */}
        <div className="border-b border-line bg-muted/40 px-8 py-3">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {stepConfig.map((s) => {
              const isActive = s.id === currentStep;
              const unlocked = isStepUnlocked(s.id);
              const isPast = s.id < currentStep && unlocked;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    if (unlocked) setCurrentStep(s.id);
                  }}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/40'
                      : isPast
                      ? 'text-accent hover:bg-muted'
                      : unlocked
                      ? 'text-ink-muted hover:bg-muted'
                      : 'cursor-not-allowed text-ink-muted/40 opacity-50'
                  }`}
                  title={!unlocked ? `Complete Step ${s.id - 1} first to unlock` : s.label}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                      isActive
                        ? 'bg-white text-primary font-bold'
                        : isPast
                        ? 'bg-accent/20 text-accent font-bold'
                        : unlocked
                        ? 'bg-line text-ink'
                        : 'bg-line/40 text-ink-muted'
                    }`}
                  >
                    {!unlocked ? <Lock size={10} /> : isPast ? '✓' : s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-ink-muted">{currentConfig.desc}</p>
            {getStepBlockerReason() && (
              <span className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                <AlertCircle size={13} /> {getStepBlockerReason()}
              </span>
            )}
          </div>

          {/* STEP 1: SERVICES & COMPONENTS */}
          {currentStep === 1 && (
            <div className="grid grid-cols-[1fr_1.2fr] gap-8">
              <form onSubmit={handleAddService} className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Add Component</h3>
                {serviceError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{serviceError}</span>
                  </div>
                )}

                <label className="field-label mt-4">Service Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Auth API, Payment Gateway, Redis Cache"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />

                <label className="field-label mt-4">Component Type *</label>
                <select
                  className="field-input"
                  value={serviceForm.type}
                  onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                >
                  {serviceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === 'OTHER' ? 'OTHER (Specify Custom Service)' : t}
                    </option>
                  ))}
                </select>

                {/* Specific Custom Service Name input when OTHER is selected */}
                {serviceForm.type === 'OTHER' && (
                  <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
                    <label className="field-label text-primary font-semibold flex items-center gap-1.5">
                      Specific Service / Component Name *
                    </label>
                    <input
                      className="field-input border-primary/50 focus:border-primary mt-1"
                      placeholder="e.g. Apache Kafka, Redis Cluster, AWS S3, Vector DB, LLM Worker"
                      value={serviceForm.customType}
                      onChange={(e) => setServiceForm({ ...serviceForm, customType: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      When "OTHER" is chosen, specify the exact system role to accurately power blast radius and topology mapping.
                    </p>
                  </div>
                )}

                <label className="field-label mt-4">Description</label>
                <textarea
                  className="field-input min-h-20"
                  placeholder="What is this component responsible for?"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />

                <button type="submit" className="primary-button mt-5 w-full">
                  <Plus size={16} /> Add to Architecture Graph
                </button>
              </form>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Configured Services ({services.length})</h3>
                  {step1Done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <CheckCircle2 size={14} /> Step 1 Met
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-warning">Minimum 1 required</span>
                  )}
                </div>

                <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto">
                  {services.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-muted">
                      No services added yet. Add at least 1 service to unlock Step 2.
                    </div>
                  ) : (
                    services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-md border border-line bg-background p-3 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{s.name}</span>
                            <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px]">
                              {s.type === 'OTHER' && s.customType ? `OTHER: ${s.customType}` : s.type}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-ink-muted">{s.description || 'No description provided'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(s.id)}
                          className="icon-button text-ink-muted hover:text-danger hover:bg-danger/10"
                          title="Remove service"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEPENDENCIES */}
          {currentStep === 2 && (
            <div className="grid grid-cols-[1fr_1.2fr] gap-8">
              <form onSubmit={handleAddDependency} className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Connect Dependencies</h3>
                <p className="mt-1 text-xs text-ink-muted">Directional caller-to-callee relationships that power blast radius.</p>

                {depError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{depError}</span>
                  </div>
                )}

                <label className="field-label mt-4">Caller Service (Dependent) *</label>
                <select
                  className="field-input"
                  value={depForm.fromServiceId}
                  onChange={(e) => setDepForm({ ...depForm, fromServiceId: e.target.value })}
                  required
                >
                  <option value="">Select caller service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type === 'OTHER' && s.customType ? s.customType : s.type})
                    </option>
                  ))}
                </select>

                <label className="field-label mt-4">Callee Service (Dependency) *</label>
                <select
                  className="field-input"
                  value={depForm.toServiceId}
                  onChange={(e) => setDepForm({ ...depForm, toServiceId: e.target.value })}
                  required
                >
                  <option value="">Select callee dependency...</option>
                  {services
                    .filter((s) => String(s.id) !== String(depForm.fromServiceId))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type === 'OTHER' && s.customType ? s.customType : s.type})
                      </option>
                    ))}
                </select>

                <label className="field-label mt-4">Dependency Coupling Type *</label>
                <select
                  className="field-input"
                  value={depForm.dependencyType}
                  onChange={(e) => setDepForm({ ...depForm, dependencyType: e.target.value })}
                >
                  <option value="HARD">HARD (Critical: Cannot function if down)</option>
                  <option value="SOFT">SOFT (Non-blocking: Gracefully degrades)</option>
                  <option value="DATA">DATA (Reads or writes persistent state)</option>
                </select>

                <button type="submit" className="primary-button mt-5 w-full">
                  <Plus size={16} /> Link Directional Edge
                </button>
              </form>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Graph Edges ({dependencies.length})</h3>
                  {step2Done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <CheckCircle2 size={14} /> Step 2 Met
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-warning">Link at least 1 dependency</span>
                  )}
                </div>

                <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto">
                  {dependencies.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-muted">
                      No dependencies linked yet. Link which service depends on which to calculate blast radius.
                    </div>
                  ) : (
                    dependencies.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-md border border-line bg-background p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{d.fromService?.name || 'Service A'}</span>
                          <ArrowRight size={14} className="text-ink-muted" />
                          <span>{d.toService?.name || 'Service B'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge border-primary/30 bg-primary/10 text-primary">{d.dependencyType}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(d.id)}
                            className="icon-button text-ink-muted hover:text-danger hover:bg-danger/10"
                            title="Unlink dependency"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TEAMS */}
          {currentStep === 3 && (
            <div className="grid grid-cols-[1fr_1.2fr] gap-8">
              <form onSubmit={handleCreateTeam} className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Create Operational Team</h3>
                <label className="field-label mt-4">Team Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Platform SRE, Core Payments, Data Ops, Frontend Web"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  required
                />
                <button type="submit" className="primary-button mt-5 w-full">
                  <Plus size={16} /> Create Team
                </button>
              </form>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Configured Teams ({teams.length})</h3>
                  {step3Done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <CheckCircle2 size={14} /> Step 3 Met
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-warning">Create at least 1 team</span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {teams.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-muted">
                      No teams created yet. Create teams to map service ownership in Step 4.
                    </div>
                  ) : (
                    teams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-md border border-line bg-background p-3 shadow-sm">
                        <span className="font-semibold text-ink">{t.name}</span>
                        <span className="text-xs text-ink-muted">{t.lead?.name || 'Lead to be assigned in Step 7'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SERVICE OWNERSHIP */}
          {currentStep === 4 && (
            <div className="grid grid-cols-[1fr_1.2fr] gap-8">
              <form onSubmit={handleAssignOwnership} className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Assign Ownership</h3>
                <p className="mt-1 text-xs text-ink-muted">Every service must have an operational owner team.</p>

                <label className="field-label mt-4">Select Service *</label>
                <select
                  className="field-input"
                  value={ownershipForm.serviceId}
                  onChange={(e) => setOwnershipForm({ ...ownershipForm, serviceId: e.target.value })}
                  required
                >
                  <option value="">Select service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <label className="field-label mt-4">Responsible Team *</label>
                <select
                  className="field-input"
                  value={ownershipForm.ownerTeamId}
                  onChange={(e) => setOwnershipForm({ ...ownershipForm, ownerTeamId: e.target.value })}
                  required
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <button type="submit" className="primary-button mt-5 w-full">
                  Set Service Owner
                </button>
              </form>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Ownership Overview</h3>
                  {step4Done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <CheckCircle2 size={14} /> Ownership Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-warning">Assign at least 1 service</span>
                  )}
                </div>

                <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border border-line bg-background p-3 shadow-sm">
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className={`badge ${s.ownerTeam ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-muted text-ink-muted'}`}>
                        {s.ownerTeam?.name || 'Unassigned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SLA RULES */}
          {currentStep === 5 && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Resolution Time Limits</h3>
                <p className="mt-1 text-xs text-ink-muted">Set resolution time targets used by the live blast radius countdown timers.</p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
                    <span className="text-xs font-bold uppercase text-danger">Critical Priority</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="field-input w-24 text-center font-bold"
                        value={slaForm.criticalHours}
                        onChange={(e) => setSlaForm({ ...slaForm, criticalHours: Number(e.target.value) })}
                      />
                      <span className="text-sm font-medium">Hours (Default 1 hr)</span>
                    </div>
                  </div>

                  <div className="rounded-md border border-warning/30 bg-warning/5 p-4">
                    <span className="text-xs font-bold uppercase text-warning">High Priority</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="field-input w-24 text-center font-bold"
                        value={slaForm.highHours}
                        onChange={(e) => setSlaForm({ ...slaForm, highHours: Number(e.target.value) })}
                      />
                      <span className="text-sm font-medium">Hours (Default 4 hrs)</span>
                    </div>
                  </div>

                  <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                    <span className="text-xs font-bold uppercase text-primary">Medium Priority</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="field-input w-24 text-center font-bold"
                        value={slaForm.mediumHours}
                        onChange={(e) => setSlaForm({ ...slaForm, mediumHours: Number(e.target.value) })}
                      />
                      <span className="text-sm font-medium">Hours (Default 24 hrs)</span>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-muted p-4">
                    <span className="text-xs font-bold uppercase text-ink-muted">Low Priority</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="field-input w-24 text-center font-bold"
                        value={slaForm.lowHours}
                        onChange={(e) => setSlaForm({ ...slaForm, lowHours: Number(e.target.value) })}
                      />
                      <span className="text-sm font-medium">Hours (Default 72 hrs)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ESCALATION POLICIES */}
          {currentStep === 6 && (
            <div className="max-w-2xl space-y-4">
              <div className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Tiered Notification Chain</h3>
                <p className="mt-1 text-xs text-ink-muted">Automated triggers when an incident ages toward an SLA breach.</p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-line p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded bg-muted text-xs font-bold">50%</span>
                      <div>
                        <div className="text-sm font-semibold">Early Warning Trigger</div>
                        <div className="text-xs text-ink-muted">Notify Assigned Dev/Tester & Team Lead</div>
                      </div>
                    </div>
                    <span className="badge border-line bg-muted text-ink-muted">In-App + Email</span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded bg-warning text-xs font-bold text-white">75%</span>
                      <div>
                        <div className="text-sm font-semibold text-warning">Urgent Escalation Trigger</div>
                        <div className="text-xs text-ink-muted">Notify Department Lead & Auto Priority Bump</div>
                      </div>
                    </div>
                    <span className="badge border-warning/30 bg-warning/10 text-warning">High Priority</span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-danger/30 bg-danger/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded bg-danger text-xs font-bold text-white">100%</span>
                      <div>
                        <div className="text-sm font-semibold text-danger">Breach Notification Trigger</div>
                        <div className="text-xs text-ink-muted">Log SLA Breach & Alert Org Admin Immediately</div>
                      </div>
                    </div>
                    <span className="badge border-danger/30 bg-danger/10 text-danger">Breach Alert</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PROVISION EMPLOYEE IDS (3 User Types & Hierarchy) */}
          {currentStep === 7 && (
            <div className="grid grid-cols-[1.1fr_1.2fr] gap-8">
              <form onSubmit={handleCreateEmployee} className="rounded-lg border border-line bg-background p-6">
                <h3 className="text-base font-semibold">Provision Employee Account</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Create staff accounts following the 3 organizational hierarchy levels.
                </p>

                {userError && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle size={15} />
                    <span>{userError}</span>
                  </div>
                )}

                {userSuccess && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
                    <CheckCircle2 size={15} />
                    <span>{userSuccess}</span>
                  </div>
                )}

                <label className="field-label mt-4">Full Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Maya Lin"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />

                <label className="field-label mt-3">Work Email *</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="maya@company.com"
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

                <label className="field-label mt-3">User Role & Hierarchy Level *</label>
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
                        name="employeeRole"
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

                <label className="field-label mt-3">Assign to Operational Team</label>
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

                <button type="submit" className="primary-button mt-5 w-full">
                  <UserPlus size={16} /> Provision Employee ID
                </button>
              </form>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Active Staff ({staffUsers.length})</h3>
                  {step7Done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <CheckCircle2 size={14} /> Step 7 Met
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-warning">Provision at least 1 staff member</span>
                  )}
                </div>

                <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
                  {staffUsers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-muted">
                      No staff accounts created yet. Provision Team Leads, Devs/Testers, or Employees.
                    </div>
                  ) : (
                    staffUsers.map((u) => {
                      const roleConfig = employeeRoles.find((r) => r.role === u.role) || {
                        title: u.role,
                        badgeClass: 'border-line bg-muted text-ink-muted',
                      };
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-md border border-line bg-background p-3 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{u.name}</span>
                              <span className={`badge ${roleConfig.badgeClass}`}>{roleConfig.title}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                              <span>{u.email}</span>
                              {u.team && <span>• Team: {u.team}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(u.id)}
                            className="icon-button text-ink-muted hover:text-danger hover:bg-danger/10"
                            title="Revoke employee ID"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & LAUNCH */}
          {currentStep === 8 && (
            <div className="space-y-6">
              {launchError && (
                <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  <AlertCircle size={15} />
                  <span>{launchError}</span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-line bg-background p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-ink">{services.length}</div>
                  <div className="text-xs text-ink-muted">Services Configured</div>
                  <div className="mt-1 text-[11px] text-accent">✓ Verified</div>
                </div>
                <div className="rounded-lg border border-line bg-background p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-ink">{dependencies.length}</div>
                  <div className="text-xs text-ink-muted">Graph Edges</div>
                  <div className="mt-1 text-[11px] text-accent">✓ Verified</div>
                </div>
                <div className="rounded-lg border border-line bg-background p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-ink">{teams.length}</div>
                  <div className="text-xs text-ink-muted">Teams Registered</div>
                  <div className="mt-1 text-[11px] text-accent">✓ Verified</div>
                </div>
                <div className="rounded-lg border border-line bg-background p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-ink">{staffUsers.length}</div>
                  <div className="text-xs text-ink-muted">Staff Provisioned</div>
                  <div className="mt-1 text-[11px] text-accent">✓ Verified</div>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-background p-6">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <CheckCircle2 size={18} className="text-accent" />
                  Full Operational Hierarchy Readiness
                </div>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  Your organization structure is now fully verified. Services are mapped, team ownership is established,
                  SLAs are configured, and staff accounts (Team Leads, Dev/Testers, and End Employees) have been provisioned.
                  Zenetrix will now automatically compute real-time blast radius calculations when an incident occurs.
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    disabled={submitting || !step8Done}
                    onClick={handleLaunchOrganization}
                    className={`flex items-center gap-2 rounded-lg px-8 py-3 text-base font-semibold shadow-lg transition-all ${
                      step8Done
                        ? 'bg-primary text-white hover:bg-primary-hover ring-2 ring-primary/30'
                        : 'bg-muted text-ink-muted cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Rocket size={18} />
                    {submitting ? 'Launching Platform...' : 'Launch Organization & Go Live'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer with Strict Gating */}
        <footer className="flex items-center justify-between border-t border-line bg-background px-8 py-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="secondary-button"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-4">
            {getStepBlockerReason() && (
              <span className="text-xs text-warning">{getStepBlockerReason()}</span>
            )}

            {currentStep < 8 ? (
              <button
                type="button"
                disabled={!canAdvanceCurrentStep()}
                onClick={handleNext}
                className={`primary-button flex items-center gap-2 ${
                  !canAdvanceCurrentStep() ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                Next: {stepConfig[currentStep]?.label} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !step8Done}
                onClick={handleLaunchOrganization}
                className={`primary-button flex items-center gap-2 ${
                  !step8Done ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <CheckCircle2 size={16} /> Complete Setup
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default OnboardingWizard;

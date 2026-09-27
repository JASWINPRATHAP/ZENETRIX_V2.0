const futureDate = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const pastDate = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const mockTeams = [
  { id: 1, name: 'Platform Reliability', lead: { id: 2, name: 'Maya Manager' } },
  { id: 2, name: 'Data Operations', lead: { id: 3, name: 'Bob DB Support' } },
  { id: 3, name: 'Experience Systems', lead: { id: 2, name: 'Maya Manager' } },
];

export const mockServices = [
  {
    id: 1,
    name: 'Customer DB Cluster',
    type: 'DATABASE',
    status: 'OPERATIONAL',
    description: 'Primary customer and order datastore.',
    ownerTeam: mockTeams[1],
  },
  {
    id: 2,
    name: 'Auth API',
    type: 'API',
    status: 'DEGRADED',
    description: 'Identity, login, session, and token refresh boundary.',
    ownerTeam: mockTeams[0],
  },
  {
    id: 3,
    name: 'Payment Gateway',
    type: 'INTEGRATION',
    status: 'OPERATIONAL',
    description: 'Checkout and external processor orchestration.',
    ownerTeam: mockTeams[0],
  },
  {
    id: 4,
    name: 'Merchant Portal',
    type: 'FRONTEND',
    status: 'OPERATIONAL',
    description: 'Operational dashboard used by merchant support.',
    ownerTeam: mockTeams[2],
  },
];

export const mockDependencies = [
  { id: 1, fromService: mockServices[1], toService: mockServices[0], dependencyType: 'DATA' },
  { id: 2, fromService: mockServices[2], toService: mockServices[1], dependencyType: 'HARD' },
  { id: 3, fromService: mockServices[3], toService: mockServices[2], dependencyType: 'SOFT' },
];

export const mockProjects = [
  {
    id: 1,
    name: 'Checkout Resilience',
    description: 'Reliability hardening across checkout auth and payment flows.',
    status: 'ACTIVE',
    startDate: pastDate(24 * 12),
    endDate: futureDate(24 * 21),
    createdBy: { name: 'Maya Manager' },
  },
  {
    id: 2,
    name: 'Merchant Console Refresh',
    description: 'Reduce support handoffs by surfacing payment state directly.',
    status: 'ACTIVE',
    startDate: pastDate(24 * 4),
    endDate: futureDate(24 * 11),
    createdBy: { name: 'Maya Manager' },
  },
];

export const mockTasks = [
  {
    id: 1,
    title: 'Harden payment session handoff',
    description: 'Payment session creation fails when Auth API latency spikes.',
    stage: 'Blocked',
    priority: 'HIGH',
    dueDate: futureDate(40),
    assignedTo: { id: 4, name: 'Eve Employee' },
    service: mockServices[2],
    project: mockProjects[0],
  },
  {
    id: 2,
    title: 'Add fallback token refresh path',
    description: 'Keep the portal usable during Auth API brownouts.',
    stage: 'In Progress',
    priority: 'CRITICAL',
    dueDate: futureDate(12),
    assignedTo: { id: 4, name: 'Eve Employee' },
    service: mockServices[1],
    project: mockProjects[0],
  },
  {
    id: 3,
    title: 'Expose payment status timeline',
    description: 'Give support a single glance status view.',
    stage: 'To Do',
    priority: 'MEDIUM',
    dueDate: futureDate(120),
    assignedTo: { id: 4, name: 'Eve Employee' },
    service: mockServices[3],
    project: mockProjects[1],
  },
];

export const mockIncidents = [
  {
    id: 101,
    title: 'Auth refresh latency blocking checkout handoff',
    description: 'Token refresh is taking 12 seconds and checkout cannot create payment sessions.',
    priority: 'CRITICAL',
    status: 'OPEN',
    createdAt: pastDate(2),
    slaDeadline: futureDate(0.7),
    service: mockServices[1],
    project: mockProjects[0],
    task: mockTasks[1],
    reportedBy: { name: 'Eve Employee' },
    assignedTo: { name: 'Maya Manager' },
  },
  {
    id: 102,
    title: 'Payment retry webhook timeout',
    description: 'Processor retry events are delayed under peak traffic.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: pastDate(7),
    slaDeadline: futureDate(1.8),
    service: mockServices[2],
    project: mockProjects[0],
    task: mockTasks[0],
    reportedBy: { name: 'Eve Employee' },
    assignedTo: { name: 'Bob DB Support' },
  },
  {
    id: 88,
    title: 'Auth pool saturation during flash sale',
    description: 'Connection pool pressure caused token refresh failures.',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdAt: pastDate(92),
    resolvedAt: pastDate(89),
    resolutionNotes: 'Raised Auth API pool cap, cleared stale sessions, and enabled token retry jitter.',
    service: mockServices[1],
    project: mockProjects[0],
    reportedBy: { name: 'Eve Employee' },
    assignedTo: { name: 'Maya Manager' },
  },
];

export const mockBlastRadius = {
  affectedServices: [
    { id: 2, name: 'Auth API', dependencyType: 'source', ownerTeam: 'Platform Reliability', depth: 0 },
    { id: 3, name: 'Payment Gateway', dependencyType: 'hard', ownerTeam: 'Platform Reliability', depth: 1 },
    { id: 4, name: 'Merchant Portal', dependencyType: 'soft', ownerTeam: 'Experience Systems', depth: 2 },
  ],
  blockedTeams: [
    { id: 1, teamName: 'Platform Reliability', leadName: 'Maya Manager', activeTaskCount: 2, members: ['Maya Manager', 'Eve Employee'] },
    { id: 3, teamName: 'Experience Systems', leadName: 'Maya Manager', activeTaskCount: 1, members: ['Eve Employee'] },
  ],
  slaAtRisk: [
    { incidentId: 101, title: 'Auth refresh latency blocking checkout handoff', minutesRemaining: 42, severity: 'critical' },
    { incidentId: 102, title: 'Payment retry webhook timeout', minutesRemaining: 108, severity: 'high' },
  ],
  tasksAtRisk: [
    { taskId: 1, title: 'Harden payment session handoff', assignedTo: 'Eve Employee', dueDate: futureDate(40), serviceName: 'Payment Gateway' },
    { taskId: 2, title: 'Add fallback token refresh path', assignedTo: 'Eve Employee', dueDate: futureDate(12), serviceName: 'Auth API' },
    { taskId: 3, title: 'Expose payment status timeline', assignedTo: 'Eve Employee', dueDate: futureDate(120), serviceName: 'Merchant Portal' },
  ],
  estimatedImpactScore: 82,
  severity: 'critical',
};

export const mockSuggestions = [
  {
    incidentId: 88,
    title: 'Auth pool saturation during flash sale',
    resolutionNotes: 'Raised Auth API pool cap, cleared stale sessions, and enabled token retry jitter.',
    resolvedBy: 'Maya Manager',
    resolvedInHours: 3,
    score: 7,
  },
  {
    incidentId: 72,
    title: 'Session refresh timeout after deploy',
    resolutionNotes: 'Rolled back token middleware, purged invalid sessions, and redeployed with patched retry policy.',
    resolvedBy: 'Bob DB Support',
    resolvedInHours: 2,
    score: 5,
  },
];

export const mockDashboard = {
  serviceCount: mockServices.length,
  dependencyCount: mockDependencies.length,
  teamCount: mockTeams.length,
  activeProjectCount: mockProjects.length,
  activeTaskCount: mockTasks.filter((task) => task.stage !== 'Done').length,
  openIncidentCount: mockIncidents.filter((incident) => incident.status === 'OPEN').length,
  criticalIncidentCount: mockIncidents.filter((incident) => incident.priority === 'CRITICAL').length,
  slaComplianceRate: 94.2,
  heatmapByService: mockServices.map((service) => ({
    service: service.name,
    status: service.status,
    owner: service.ownerTeam?.name ?? 'Unassigned',
    incidents: mockIncidents.filter((incident) => incident.service?.id === service.id).length,
  })),
  workloadByOwner: [
    { owner: 'Eve Employee', tasks: 3, blocked: 1 },
    { owner: 'Maya Manager', tasks: 2, blocked: 0 },
    { owner: 'Bob DB Support', tasks: 1, blocked: 0 },
  ],
};

export const mockUsers = [
  { id: 1, name: 'Alice Admin', email: 'admin@acme.com', role: 'ORG_ADMIN' },
  { id: 2, name: 'Maya Manager', email: 'manager@acme.com', role: 'MANAGER' },
  { id: 3, name: 'Bob DB Support', email: 'bob.db@acme.com', role: 'SUPPORT_ENGINEER' },
  { id: 4, name: 'Eve Employee', email: 'eve@acme.com', role: 'EMPLOYEE' },
  { id: 5, name: 'Super Admin', email: 'superadmin@zenetrix.local', role: 'SUPER_ADMIN' },
];

export const mockOrganizations = [
  {
    id: 1,
    name: 'Acme Corp',
    domain: 'acme.com',
    slug: 'acme',
    plan: 'ENTERPRISE',
    isActive: true,
    onboardingCompleted: true,
    setupStep: 8,
    userCount: 4,
    serviceCount: 4,
    activeIncidentCount: 2,
    createdAt: pastDate(24 * 30),
  },
  {
    id: 2,
    name: 'Stark Logistics',
    domain: 'starklogistics.io',
    slug: 'stark-logistics',
    plan: 'PRO',
    isActive: true,
    onboardingCompleted: false,
    setupStep: 2,
    userCount: 1,
    serviceCount: 2,
    activeIncidentCount: 0,
    createdAt: pastDate(24 * 3),
  },
  {
    id: 3,
    name: 'Cyberdyne Systems',
    domain: 'cyberdyne.ai',
    slug: 'cyberdyne',
    plan: 'FREE',
    isActive: false,
    onboardingCompleted: false,
    setupStep: 1,
    userCount: 1,
    serviceCount: 0,
    activeIncidentCount: 0,
    createdAt: pastDate(24 * 1),
  },
];

export const mockPlatformMetrics = {
  totalOrganizations: 3,
  activeOrganizations: 2,
  pendingSetupOrganizations: 2,
  totalUsers: 6,
  activeIncidents: 2,
  platformComplianceRate: 94.2,
};

export const mockOnboardingStatus = {
  isCompleted: false,
  currentStep: 1,
  serviceCount: 0,
  dependencyCount: 0,
  teamCount: 0,
  servicesWithOwnerCount: 0,
  slaPolicyCount: 0,
  managerCount: 0,
  steps: [
    { stepNumber: 1, name: 'Services & Components', description: 'Register services and atomic components', isDone: false, statusText: '0 added' },
    { stepNumber: 2, name: 'Service Dependencies', description: 'Define directional dependencies (HARD, SOFT, DATA)', isDone: false, statusText: '0 dependencies' },
    { stepNumber: 3, name: 'Teams', description: 'Create operational teams and assign leads', isDone: false, statusText: '0 teams' },
    { stepNumber: 4, name: 'Service Ownership', description: 'Link responsible teams to services', isDone: false, statusText: '0 assigned' },
    { stepNumber: 5, name: 'SLA Rules', description: 'Configure resolution time limits per priority', isDone: false, statusText: '0 policies' },
    { stepNumber: 6, name: 'Escalation Policies', description: 'Configure warning triggers and notification paths', isDone: false, statusText: 'Pending' },
    { stepNumber: 7, name: 'Invite Managers', description: 'Activate the management layer with team leads', isDone: false, statusText: '0 managers' },
    { stepNumber: 8, name: 'Graph Preview & Launch', description: 'Verify blast radius graph and unlock operations', isDone: false, statusText: 'Pending setup' },
  ],
};


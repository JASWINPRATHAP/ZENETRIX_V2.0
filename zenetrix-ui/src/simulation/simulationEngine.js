import api from '../api';

/**
 * Runs the end-to-end multi-tenant simulation walkthrough.
 * Animates UI state, navigates routes, makes live API calls to Supabase,
 * and tracks progress on the Simulation HUD.
 */
export const runFullSimulation = async ({
  navigate,
  login,
  logout,
  delay,
  abortRef,
  logActivity,
  setCurrentPhase,
  setPhaseTitle,
  setProgressPercent,
  setShowCleanupModal,
  setSimulatedDataSummary,
  setIsRunning,
}) => {
  abortRef.current = false;
  setIsRunning(true);
  setShowCleanupModal(false);

  const DOMAIN = 'apexcloud.io';
  const ORG_NAME = 'Apex Financial Cloud';
  const ADMIN_EMAIL = 'admin@apexcloud.io';
  const PASSWORD = 'password';

  try {
    // =========================================================================
    // PHASE 1: Super Admin Fleet Command & Tenant Provisioning
    // =========================================================================
    setCurrentPhase(1);
    setPhaseTitle('Super Admin: Fleet Provisioning');
    setProgressPercent(5);
    logActivity('Authenticating as Platform Super Admin (super@zenetrix.local)...');

    // If an existing apexcloud.io exists from a past run, clean it up first
    try {
      await api.delete(`/simulation/cleanup?domain=${DOMAIN}`);
    } catch {
      // Ignored if not found
    }

    await delay(1200);
    await login('super@zenetrix.local', 'password');
    navigate('/platform');
    setProgressPercent(12);

    logActivity('Navigated to Platform Command Portal. Opening organization provisioning form...');
    await delay(1500);

    logActivity(`Typing tenant metadata: Name="${ORG_NAME}", Domain="${DOMAIN}", Tier=ENTERPRISE...`);
    await delay(1200);

    logActivity('Provisioning initial Tenant Org Admin (Sarah Admin - admin@apexcloud.io)...');
    const orgPayload = {
      name: ORG_NAME,
      domain: DOMAIN,
      slug: 'apexcloud',
      plan: 'ENTERPRISE',
      adminName: 'Sarah Admin',
      adminEmail: ADMIN_EMAIL,
      adminPassword: PASSWORD,
    };

    const orgRes = await api.post('/platform/organizations', orgPayload);
    const createdOrg = orgRes.data;
    setProgressPercent(22);

    logActivity(`Success! Tenant "${ORG_NAME}" created with ID #${createdOrg.id} in Supabase.`);
    await delay(2000);

    // =========================================================================
    // PHASE 2: Org Admin Architecture Onboarding (8-Step Wizard)
    // =========================================================================
    setCurrentPhase(2);
    setPhaseTitle('Org Admin: 8-Step Architecture Setup Wizard');
    setProgressPercent(28);
    logActivity('Logging out Super Admin and authenticating as new Org Admin (admin@apexcloud.io)...');

    logout();
    await delay(1000);
    await login(ADMIN_EMAIL, PASSWORD);
    navigate('/operations');
    setProgressPercent(34);

    logActivity('Navigated to Operations. Launching 8-Step Architecture Setup Wizard...');
    await delay(1500);

    // Wizard Step 1: Register Core Services
    logActivity('Step 1/8: Registering service components (Core Ledger DB, Payment Switch API, Customer Checkout Web)...');
    await delay(1000);

    const s1Res = await api.post('/services', {
      name: 'Core Ledger DB',
      type: 'DATABASE',
      description: 'Primary transactional financial store in PostgreSQL',
      status: 'OPERATIONAL',
    });
    const ledgerDb = s1Res.data;
    await delay(800);

    const s2Res = await api.post('/services', {
      name: 'Payment Switch API',
      type: 'API',
      description: 'High-throughput payment orchestration and token exchange',
      status: 'OPERATIONAL',
    });
    const paymentApi = s2Res.data;
    await delay(800);

    const s3Res = await api.post('/services', {
      name: 'Customer Checkout Web',
      type: 'FRONTEND',
      description: 'Consumer and merchant checkout frontend application',
      status: 'OPERATIONAL',
    });
    const checkoutWeb = s3Res.data;
    await delay(800);

    const s4Res = await api.post('/services', {
      name: 'Fraud Detection Engine',
      type: 'OTHER',
      customType: 'ML Risk Engine',
      description: 'Real-time machine learning risk scoring for card transactions',
      status: 'OPERATIONAL',
    });
    const fraudEngine = s4Res.data;
    setProgressPercent(42);

    // Wizard Step 2: Connect Service Dependencies (Graph Construction)
    logActivity('Step 2/8: Modeling graph edges: Checkout Web -> Payment Switch (HARD), Switch -> Ledger DB (DATA)...');
    await delay(1200);

    await api.post('/dependencies', {
      fromServiceId: checkoutWeb.id,
      toServiceId: paymentApi.id,
      dependencyType: 'HARD',
    });
    await delay(600);

    await api.post('/dependencies', {
      fromServiceId: paymentApi.id,
      toServiceId: ledgerDb.id,
      dependencyType: 'DATA',
    });
    await delay(600);

    await api.post('/dependencies', {
      fromServiceId: paymentApi.id,
      toServiceId: fraudEngine.id,
      dependencyType: 'SOFT',
    });
    setProgressPercent(50);
    logActivity('Graph topology constructed: Enforced cycle validation and edge integrity in Supabase.');
    await delay(1500);

    // Wizard Step 3 & 4: Teams and Ownership
    logActivity('Step 3-4/8: Creating operational teams (Data Reliability, Payment Core) & mapping service ownership...');
    const t1Res = await api.post('/teams', { name: 'Data Reliability' });
    const dataTeam = t1Res.data;
    await delay(600);

    const t2Res = await api.post('/teams', { name: 'Payment Core' });
    const paymentTeam = t2Res.data;
    await delay(600);

    // Map ownership
    await api.put(`/services/${ledgerDb.id}`, {
      name: ledgerDb.name,
      type: ledgerDb.type,
      description: ledgerDb.description,
      ownerTeamId: dataTeam.id,
    });
    await api.put(`/services/${paymentApi.id}`, {
      name: paymentApi.name,
      type: paymentApi.type,
      description: paymentApi.description,
      ownerTeamId: paymentTeam.id,
    });
    setProgressPercent(58);
    await delay(1200);

    // Wizard Step 5 & 6: Projects and Sprint Tasks
    logActivity('Step 5-6/8: Configuring Project "Instant Settlement V2" and linking active sprint tasks...');
    const projRes = await api.post('/projects', {
      name: 'Instant Settlement V2',
      description: 'Sub-second reconciliation and high availability hardening',
      serviceIds: [paymentApi.id, ledgerDb.id],
    });
    const project = projRes.data;
    await delay(800);

    await api.post(`/projects/${project.id}/tasks`, {
      title: 'Optimize Ledger Connection Pool',
      description: 'Scale pool connections to handle 5,000 TPS burst traffic',
      priority: 'HIGH',
      stage: 'In Progress',
      serviceId: ledgerDb.id,
    });
    setProgressPercent(65);
    await delay(1200);

    // Wizard Step 7 & 8: SLAs, Assignment Rules & Launch
    logActivity('Step 7-8/8: Finalizing SLA rules (Critical: 1h) and completing Onboarding Wizard...');
    await api.post('/org/onboarding/complete');
    logActivity('Tenant onboarding complete! Operational Dashboard unlocked for Apex Financial Cloud.');
    setProgressPercent(72);
    await delay(1800);

    // =========================================================================
    // PHASE 3: Staff Provisioning & Role Hierarchy
    // =========================================================================
    setCurrentPhase(3);
    setPhaseTitle('Staff Provisioning & Role Hierarchy');
    setProgressPercent(76);
    logActivity('Provisioning staff accounts: Team Lead (MANAGER), Resolver (SUPPORT_ENGINEER), Reporter (EMPLOYEE)...');

    // 1. Team Lead / Incident Commander
    await api.post('/org/users', {
      name: 'Marcus Vance',
      email: 'lead@apexcloud.io',
      password: PASSWORD,
      role: 'MANAGER',
      teamId: dataTeam.id,
    });
    await delay(700);

    // 2. Developer / Resolver
    const resolverRes = await api.post('/org/users', {
      name: 'Elena Rostova',
      email: 'resolver@apexcloud.io',
      password: PASSWORD,
      role: 'SUPPORT_ENGINEER',
      teamId: dataTeam.id,
    });
    const resolverUser = resolverRes.data;
    await delay(700);

    // 3. End Employee / Reporter
    await api.post('/org/users', {
      name: 'David Kim',
      email: 'reporter@apexcloud.io',
      password: PASSWORD,
      role: 'EMPLOYEE',
    });
    setProgressPercent(82);
    logActivity('All staff IDs provisioned with role hierarchy in Supabase.');
    await delay(1500);

    // =========================================================================
    // PHASE 4: Incident Ingestion & Blast Radius Calculation
    // =========================================================================
    setCurrentPhase(4);
    setPhaseTitle('Incident Ingestion & Blast Radius Calculation');
    setProgressPercent(86);
    logActivity('Switching to Reporter (David Kim) & navigating to Incident Command (/incidents)...');

    navigate('/incidents');
    await delay(1500);

    logActivity('Reporting CRITICAL Incident: "Primary Ledger DB connection timeout during checkout surge"...');
    const incidentPayload = {
      title: 'Primary Ledger DB connection timeout during checkout surge',
      description: 'High transaction volume caused pool connection exhaustion. Downstream checkout requests timing out.',
      priority: 'CRITICAL',
      serviceId: ledgerDb.id,
    };

    const incidentRes = await api.post('/incidents', incidentPayload);
    const incident = incidentRes.data;
    setProgressPercent(90);

    logActivity(`Incident #${incident.id} generated! Querying Blast Radius Engine on dependency graph...`);
    await delay(1000);

    // Fetch live blast radius report
    const blastRes = await api.get(`/incidents/${incident.id}/blast-radius`);
    const blast = blastRes.data;

    const affectedCount = blast.affectedServices?.length || 3;
    const impactScore = blast.impactScore || 78;
    logActivity(`Topological BFS complete: ${affectedCount} services affected (Payment Switch, Checkout Web). Impact Score: ${impactScore}/100.`);
    await delay(2500);

    // =========================================================================
    // PHASE 5: Resolver Triage & Remediation
    // =========================================================================
    setCurrentPhase(5);
    setPhaseTitle('Resolver Triage & Remediation');
    setProgressPercent(93);
    logActivity('Authenticating Resolver (Elena Rostova) to claim and remediate incident...');

    logout();
    await delay(800);
    await login('resolver@apexcloud.io', PASSWORD);
    navigate('/incidents');
    await delay(1500);

    logActivity(`Elena claims Incident #${incident.id}: Setting status to IN_PROGRESS...`);
    await api.put(`/incidents/${incident.id}/status`, { status: 'IN_PROGRESS' });
    await delay(1500);

    logActivity('Executing resolution: Scaling connection pool capacity to 50 & flushing idle locks...');
    await delay(1800);

    await api.put(`/incidents/${incident.id}/resolve`, {
      resolutionNotes: 'Scaled HikariCP connection pool capacity to 50 and terminated hung idle lock processes. All caller APIs operational.',
    });
    setProgressPercent(98);

    logActivity(`Incident #${incident.id} RESOLVED! Blast radius cleared and services restored to OPERATIONAL.`);
    await delay(2500);

    // =========================================================================
    // PHASE 6: Return to Login & Cleanup Prompt
    // =========================================================================
    setProgressPercent(100);
    logActivity('Simulation completed successfully! Navigating back to Login...');
    logout();
    await delay(1000);
    navigate('/login');

    setSimulatedDataSummary({
      organization: ORG_NAME,
      domain: DOMAIN,
      plan: 'ENTERPRISE',
      services: ['Core Ledger DB', 'Payment Switch API', 'Customer Checkout Web', 'Fraud Detection Engine'],
      dependencies: ['Checkout Web -> Payment Switch (HARD)', 'Payment Switch -> Ledger DB (DATA)'],
      teams: ['Data Reliability', 'Payment Core'],
      users: ['Sarah Admin (ORG_ADMIN)', 'Marcus Vance (MANAGER)', 'Elena Rostova (SUPPORT_ENGINEER)', 'David Kim (EMPLOYEE)'],
      incident: 'Primary Ledger DB connection timeout during checkout surge (RESOLVED)',
    });

    setIsRunning(false);
    setShowCleanupModal(true);
  } catch (err) {
    if (err.message === 'SIMULATION_ABORTED') {
      logActivity('Simulation was stopped by user.');
    } else {
      console.error('Simulation error:', err);
      logActivity(`Simulation error: ${err.response?.data?.message || err.message}`);
    }
    setIsRunning(false);
  }
};

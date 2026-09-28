-- Baseline Zenetrix demo tenant. These inserts are idempotent for PostgreSQL.

INSERT INTO organizations (name, domain, slug, plan, is_active, onboarding_completed, setup_step, created_at)
SELECT 'Acme Corp', 'acme.com', 'acme', 'ENTERPRISE', true, true, 8, NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE domain = 'acme.com');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Super Admin', 'superadmin@zenetrix.local', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'SUPER_ADMIN', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@zenetrix.local');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Super Admin', 'super@zenetrix.local', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'SUPER_ADMIN', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'super@zenetrix.local');


INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Alice Admin', 'admin@acme.com', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'ORG_ADMIN', NULL, o.id
FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@acme.com');

INSERT INTO organizations (name, domain, slug, plan, is_active, onboarding_completed, setup_step, created_at)
SELECT 'AWD', 'awd.in', 'awd', 'ENTERPRISE', true, false, 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE domain = 'awd.in');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'AWD Admin', 'admin@awd.in', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'ORG_ADMIN', NULL, o.id
FROM organizations o
WHERE o.domain = 'awd.in'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@awd.in');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Maya Manager', 'manager@acme.com', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'MANAGER', 'PLATFORM', o.id
FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@acme.com');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Bob DB Support', 'bob.db@acme.com', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'SUPPORT_ENGINEER', 'DB_SUPPORT', o.id
FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'bob.db@acme.com');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Eve Employee', 'eve@acme.com', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'EMPLOYEE', NULL, o.id
FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'eve@acme.com');

INSERT INTO users (name, email, password, role, team, organization_id)
SELECT 'Charlie Infra', 'charlie.infra@acme.com', '$2a$10$RyTUw9eRswh/w6UIyGedkuCVqYaRmQKkXE6NoTxfWi6texdHdbbI2', 'SUPPORT_ENGINEER', 'INFRA_SUPPORT', o.id
FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'charlie.infra@acme.com');

INSERT INTO teams (name, lead_id, organization_id, created_at)
SELECT 'Platform Reliability', u.id, o.id, NOW()
FROM organizations o
JOIN users u ON u.email = 'manager@acme.com'
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.name = 'Platform Reliability' AND t.organization_id = o.id);

INSERT INTO teams (name, lead_id, organization_id, created_at)
SELECT 'Data Operations', u.id, o.id, NOW()
FROM organizations o
JOIN users u ON u.email = 'bob.db@acme.com'
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.name = 'Data Operations' AND t.organization_id = o.id);

INSERT INTO services (name, type, description, status, owner_team_id, organization_id, created_at)
SELECT 'Auth API', 'API', 'Identity, login, token refresh, and account access boundary.', 'DEGRADED', t.id, o.id, NOW()
FROM organizations o
JOIN teams t ON t.name = 'Platform Reliability' AND t.organization_id = o.id
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.name = 'Auth API' AND s.organization_id = o.id);

INSERT INTO services (name, type, description, status, owner_team_id, organization_id, created_at)
SELECT 'Payment Gateway', 'INTEGRATION', 'Checkout and external processor orchestration.', 'OPERATIONAL', t.id, o.id, NOW()
FROM organizations o
JOIN teams t ON t.name = 'Platform Reliability' AND t.organization_id = o.id
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.name = 'Payment Gateway' AND s.organization_id = o.id);

INSERT INTO services (name, type, description, status, owner_team_id, organization_id, created_at)
SELECT 'Customer DB Cluster', 'DATABASE', 'Primary customer and order data store.', 'OPERATIONAL', t.id, o.id, NOW()
FROM organizations o
JOIN teams t ON t.name = 'Data Operations' AND t.organization_id = o.id
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.name = 'Customer DB Cluster' AND s.organization_id = o.id);

INSERT INTO service_dependencies (from_service_id, to_service_id, dependency_type, organization_id, created_at)
SELECT payment.id, auth.id, 'HARD', o.id, NOW()
FROM organizations o
JOIN services payment ON payment.name = 'Payment Gateway' AND payment.organization_id = o.id
JOIN services auth ON auth.name = 'Auth API' AND auth.organization_id = o.id
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (
    SELECT 1 FROM service_dependencies d
    WHERE d.from_service_id = payment.id AND d.to_service_id = auth.id AND d.organization_id = o.id
  );

INSERT INTO service_dependencies (from_service_id, to_service_id, dependency_type, organization_id, created_at)
SELECT auth.id, db.id, 'DATA', o.id, NOW()
FROM organizations o
JOIN services auth ON auth.name = 'Auth API' AND auth.organization_id = o.id
JOIN services db ON db.name = 'Customer DB Cluster' AND db.organization_id = o.id
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (
    SELECT 1 FROM service_dependencies d
    WHERE d.from_service_id = auth.id AND d.to_service_id = db.id AND d.organization_id = o.id
  );

INSERT INTO projects (name, description, status, start_date, end_date, created_by_id, organization_id, created_at)
SELECT 'Checkout Resilience', 'Reliability hardening across checkout auth and payment flows.', 'ACTIVE', CURRENT_DATE - 14, CURRENT_DATE + 21, u.id, o.id, NOW()
FROM organizations o
JOIN users u ON u.email = 'manager@acme.com'
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.name = 'Checkout Resilience' AND p.organization_id = o.id);

INSERT INTO project_services (project_id, service_id)
SELECT p.id, s.id
FROM projects p
JOIN organizations o ON o.id = p.organization_id
JOIN services s ON s.organization_id = o.id AND s.name IN ('Auth API', 'Payment Gateway')
WHERE p.name = 'Checkout Resilience'
  AND NOT EXISTS (SELECT 1 FROM project_services ps WHERE ps.project_id = p.id AND ps.service_id = s.id);

INSERT INTO tasks (title, description, stage, priority, due_date, assigned_to_id, created_by_id, service_id, project_id, organization_id, created_at, updated_at)
SELECT 'Harden payment session handoff', 'Payment session creation fails when Auth API latency spikes.', 'Blocked', 'HIGH', CURRENT_TIMESTAMP, employee.id, manager.id, service.id, project.id, org.id, NOW(), NOW()
FROM organizations org
JOIN users manager ON manager.email = 'manager@acme.com'
JOIN users employee ON employee.email = 'eve@acme.com'
JOIN services service ON service.name = 'Payment Gateway' AND service.organization_id = org.id
JOIN projects project ON project.name = 'Checkout Resilience' AND project.organization_id = org.id
WHERE org.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM tasks task WHERE task.title = 'Harden payment session handoff' AND task.organization_id = org.id);

INSERT INTO sla_policies (priority, resolution_time_limit_hours, organization_id)
SELECT 'CRITICAL', 1, o.id FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM sla_policies s WHERE s.priority = 'CRITICAL' AND s.organization_id = o.id);

INSERT INTO sla_policies (priority, resolution_time_limit_hours, organization_id)
SELECT 'HIGH', 4, o.id FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM sla_policies s WHERE s.priority = 'HIGH' AND s.organization_id = o.id);

INSERT INTO assignment_rules (keyword, target_team, priority_override, organization_id)
SELECT 'database', 'DB_SUPPORT', NULL, o.id FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM assignment_rules r WHERE r.keyword = 'database' AND r.organization_id = o.id);

INSERT INTO assignment_rules (keyword, target_team, priority_override, organization_id)
SELECT 'timeout', 'DB_SUPPORT', 'HIGH', o.id FROM organizations o
WHERE o.domain = 'acme.com'
  AND NOT EXISTS (SELECT 1 FROM assignment_rules r WHERE r.keyword = 'timeout' AND r.organization_id = o.id);

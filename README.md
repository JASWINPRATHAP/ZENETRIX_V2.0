# ZENETRIX

Zenetrix is a multi-tenant operational awareness platform for incident impact analysis.

It contains:

- `incident-management` - Spring Boot backend with PostgreSQL/JPA, JWT auth, RBAC, services, dependencies, projects, tasks, incidents, blast radius, and resolution suggestions.
- `zenetrix-ui` - React/Vite frontend for the operational dashboard, org graph setup, project/task management, and incident command view.

## Local Run

Backend:

```bash
cd incident-management
mvn spring-boot:run
```

Frontend:

```bash
cd zenetrix-ui
npm install
npm run dev
```

Default frontend URL:

```text
http://127.0.0.1:5173
```

Demo UI login:

```text
admin@acme.com
password
```

import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Activity,
  Bell,
  Building2,
  GitBranch,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  TicketCheck,
  Wand2,
} from 'lucide-react';
import OnboardingWizard from './OnboardingWizard';
import api from '../api';
import { useSimulation } from '../simulation/SimulationContext';

const defaultNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations Graph', icon: GitBranch },
  { to: '/incidents', label: 'Incidents', icon: TicketCheck },
];

const superAdminNavItems = [
  { to: '/platform', label: 'Platform Portal', icon: Building2 },
];

const pageTitles = {
  '/': 'Operational Awareness',
  '/operations': 'Organization Setup',
  '/incidents': 'Incident Command',
  '/platform': 'Platform Administration',
};


const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { isRunning } = useSimulation();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORG_ADMIN';
  const navItems = isSuperAdmin ? superAdminNavItems : defaultNavItems;

  useEffect(() => {
    if (isOrgAdmin && !isRunning) {
      api.get('/org/onboarding/status')
        .then((res) => {
          if (res.data && !res.data.isCompleted) {
            setWizardOpen(true);
          }
        })
        .catch(() => {});
    } else if (isRunning) {
      setWizardOpen(false);
    }
  }, [isOrgAdmin, isRunning]);

  return (
    <div className="min-h-screen bg-background text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col border-r border-line bg-surface">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-normal">Zenetrix</h1>
            <p className="text-xs text-ink-muted">Operations platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-ink-muted hover:bg-muted hover:text-ink',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}

          {isOrgAdmin && (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="mt-4 flex h-11 w-full items-center gap-3 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Wand2 size={18} />
              Setup Wizard (8 Steps)
            </button>
          )}
        </nav>

        <div className="border-t border-line p-4">
          <div className="mb-3 rounded-md border border-line bg-muted p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-muted">
              <Building2 size={14} />
              {isSuperAdmin ? 'Platform Fleet' : 'Tenant Scope'}
            </div>
            <div className="mt-2 text-sm font-semibold">
              {isSuperAdmin ? 'Global Administration' : user?.organizationName || 'Acme Corp'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{user?.name || user?.email}</span>
              <span className="block truncate text-xs text-ink-muted">{user?.role || 'SIGNED_IN'}</span>
            </span>
            <LogOut size={17} className="text-ink-muted" />
          </button>
        </div>
      </aside>

      <main className="min-h-screen pl-[272px]">

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-line bg-background/95 px-8 backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-muted">
              <ShieldCheck size={14} />
              Multi-tenant command layer
            </div>
            <h2 className="mt-1 text-2xl font-semibold">{pageTitles[location.pathname] || 'Zenetrix'}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="h-9 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>
        <div className="px-8 py-7">{children}</div>
      </main>

      <OnboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => setWizardOpen(false)}
      />
    </div>
  );
};


export default Layout;

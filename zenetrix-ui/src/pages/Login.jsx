import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Database,
  LockKeyhole,
  Network,
  ShieldCheck,
  Crown,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const PERSONAS = [
  {
    id: 'superadmin',
    roleName: 'Super Admin',
    email: 'superadmin@zenetrix.local',
    password: 'password',
    icon: Crown,
    badge: 'Platform Level',
    badgeColor: 'border-accent/40 bg-accent/10 text-accent',
    destination: '/platform',
    desc: 'Oversees multi-tenant fleet, onboarding status, and plan tiers.',
  },
  {
    id: 'orgadmin',
    roleName: 'Org Admin',
    email: 'admin@acme.com',
    password: 'password',
    icon: Building2,
    badge: 'Tenant Level',
    badgeColor: 'border-primary/40 bg-primary/10 text-primary',
    destination: '/ (with 8-Step Wizard)',
    desc: 'Configures Acme Corp teams, services, dependencies, and SLA rules.',
  },
  {
    id: 'manager',
    roleName: 'Platform Lead',
    email: 'manager@acme.com',
    password: 'password',
    icon: Users,
    badge: 'Team Level',
    badgeColor: 'border-line bg-muted text-ink-muted',
    destination: '/incidents',
    desc: 'Incident commander handling active outages & blast radius.',
  },
];

const Login = () => {
  const [selectedPersona, setSelectedPersona] = useState('superadmin');
  const [email, setEmail] = useState('superadmin@zenetrix.local');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectPersona = (p) => {
    setSelectedPersona(p.id);
    setEmail(p.email);
    setPassword(p.password);
    setError('');
  };

  const handleAuth = async (targetEmail, targetPassword) => {
    setSubmitting(true);
    setError('');
    try {
      await login(targetEmail, targetPassword);
      if (targetEmail === 'superadmin@zenetrix.local' || targetEmail === 'super@zenetrix.local') {
        navigate('/platform');
      } else {
        navigate('/');
      }
    } catch {
      setError('Could not sign in with those credentials. Please check the backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuth(email, password);
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="grid min-h-screen grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between border-r border-line bg-surface px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-white shadow-sm">
              <Activity size={23} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Zenetrix</h1>
              <p className="text-sm text-ink-muted">Operational awareness platform</p>
            </div>
          </div>

          <div className="max-w-2xl py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={13} />
              Enterprise Multi-Tenant Platform Architecture
            </div>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal">
              See what will break next — before it breaks.
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              Connect operational incidents to graph blast radius, service dependencies, SLA countdowns, and cross-team accountability.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Crown, label: 'Super Admin Layer', value: 'Fleet Control' },
                { icon: Network, label: '8-Step Setup Wizard', value: 'Tenant Ready' },
                { icon: ShieldCheck, label: 'Role Scoped Access', value: 'JWT Enforced' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-md border border-line bg-background p-4 shadow-sm">
                    <Icon size={20} className="text-primary" />
                    <div className="mt-3 text-sm font-semibold">{item.value}</div>
                    <div className="mt-1 text-xs text-ink-muted">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4 text-xs text-ink-muted">
            <span>Spring Boot Core API : 8081</span>
            <span>Vite Frontend Dev : 5173</span>
          </div>
        </section>

        <section className="grid place-items-center overflow-y-auto px-10 py-8">
          <div className="w-full max-w-md">
            {/* Quick Persona Picker */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Select Sign-in Persona</span>
                <span className="text-xs text-primary font-medium">1-Click Auto-Fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPersona(p)}
                      className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                          : 'border-line bg-surface hover:border-line-hover hover:bg-muted'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <Icon size={16} className={isSelected ? 'text-primary' : 'text-ink-muted'} />
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-ink">{p.roleName}</div>
                      <div className="truncate text-[11px] text-ink-muted">{p.email.split('@')[0]}</div>
                    </button>
                  );
                })}
              </div>

              {/* Persona Context Card */}
              {selectedPersona && (
                <div className="mt-2.5 rounded-md border border-line bg-muted/60 p-2.5 text-xs text-ink-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">
                      {PERSONAS.find((p) => p.id === selectedPersona)?.roleName} Scope:
                    </span>
                    <span className="text-[11px] text-primary">
                      Route: {PERSONAS.find((p) => p.id === selectedPersona)?.destination}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px]">
                    {PERSONAS.find((p) => p.id === selectedPersona)?.desc}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="panel p-6 shadow-md">
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-primary">
                    <LockKeyhole size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Sign in</h2>
                    <p className="text-xs text-ink-muted">Enter credentials or use persona presets above</p>
                  </div>
                </div>
              </div>

              <label className="field-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="field-input mb-3 text-sm"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedPersona('');
                }}
                required
              />

              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field-input text-sm"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedPersona('');
                }}
                required
              />

              {error && (
                <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="primary-button mt-5 w-full justify-center"
              >
                {submitting ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In as {selectedPersona ? PERSONAS.find((p) => p.id === selectedPersona)?.roleName : 'User'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="mt-4 border-t border-line pt-3 text-center">
                <p className="text-[11px] text-ink-muted">
                  Default seed password: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-ink">password</code>
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

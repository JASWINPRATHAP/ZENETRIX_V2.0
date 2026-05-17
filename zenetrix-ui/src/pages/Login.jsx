import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Database, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Could not sign in with those credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="grid min-h-screen grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between border-r border-line bg-surface px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-white">
              <Activity size={23} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Zenetrix</h1>
              <p className="text-sm text-ink-muted">Operational awareness platform</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase text-primary">Incident impact intelligence</p>
            <h2 className="text-5xl font-semibold leading-tight tracking-normal">
              See the blast radius before the incident becomes a business outage.
            </h2>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Network, label: 'Dependency graph', value: 'Live' },
                { icon: ShieldCheck, label: 'RBAC tenant scope', value: 'Enforced' },
                { icon: Database, label: 'PostgreSQL model', value: 'Ready' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-md border border-line bg-background p-4">
                    <Icon size={20} className="text-primary" />
                    <div className="mt-4 text-sm font-semibold">{item.value}</div>
                    <div className="mt-1 text-xs text-ink-muted">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-ink-muted">JWT secured Spring Boot API on port 8081</p>
        </section>

        <section className="grid place-items-center px-10">
          <form onSubmit={handleSubmit} className="panel w-full max-w-md p-8">
            <div className="mb-7">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-md bg-muted text-primary">
                <LockKeyhole size={20} />
              </div>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-2 text-sm text-ink-muted">Use your Zenetrix organization account.</p>
            </div>

            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="field-input mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

            <button type="submit" disabled={submitting} className="primary-button mt-6 w-full">
              {submitting ? 'Signing in...' : 'Enter Operations Center'}
              <ArrowRight size={17} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;

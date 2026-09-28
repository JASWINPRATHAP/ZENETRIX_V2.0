import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { SimulationProvider } from './simulation/SimulationContext';
import SimulationHUD from './components/SimulationHUD';
import SimulationCleanupModal from './components/SimulationCleanupModal';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Incidents from './pages/Incidents';
import Operations from './pages/Operations';
import PlatformPortal from './pages/PlatformPortal';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-ink-muted">Loading Zenetrix...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const RootRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/platform" replace />;
  }
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <SimulationProvider>
        <Router>
          <SimulationHUD />
          <SimulationCleanupModal />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><RootRoute /></ProtectedRoute>} />
            <Route path="/platform" element={<ProtectedRoute><PlatformPortal /></ProtectedRoute>} />
            <Route path="/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SimulationProvider>
    </AuthProvider>
  );
}

export default App;


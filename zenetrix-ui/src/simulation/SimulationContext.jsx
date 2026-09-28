import { createContext, useContext, useState, useRef } from 'react';
import api from '../api';

const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [totalPhases] = useState(5);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [activityLog, setActivityLog] = useState('');
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 = normal, 2 = fast, 3 = instant
  const [progressPercent, setProgressPercent] = useState(0);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [simulatedDataSummary, setSimulatedDataSummary] = useState(null);

  const abortRef = useRef(false);
  const isPausedRef = useRef(false);
  const speedRef = useRef(1);

  // Sync ref with state
  const setSpeed = (s) => {
    setSpeedMultiplier(s);
    speedRef.current = s;
  };

  const setPaused = (p) => {
    setIsPaused(p);
    isPausedRef.current = p;
  };

  const delay = async (baseMs) => {
    const adjustedMs = Math.max(80, Math.floor(baseMs / speedRef.current));
    let elapsed = 0;
    const interval = 50;
    while (elapsed < adjustedMs) {
      if (abortRef.current) throw new Error('SIMULATION_ABORTED');
      while (isPausedRef.current) {
        if (abortRef.current) throw new Error('SIMULATION_ABORTED');
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, interval));
      elapsed += interval;
    }
  };

  const logActivity = (msg) => {
    setActivityLog(msg);
  };

  const stopSimulation = () => {
    abortRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    logActivity('Simulation aborted by user.');
  };

  const runCleanup = async (domain = 'apexcloud.io') => {
    setCleanupStatus('loading');
    try {
      const res = await api.delete(`/simulation/cleanup?domain=${encodeURIComponent(domain)}`);
      setCleanupStatus('success');
      return res.data;
    } catch (err) {
      console.error('Cleanup error:', err);
      setCleanupStatus('error');
      throw err;
    }
  };

  const checkSimulationStatus = async (domain = 'apexcloud.io') => {
    try {
      const res = await api.get(`/simulation/status?domain=${encodeURIComponent(domain)}`);
      return res.data;
    } catch {
      return { exists: false };
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        isRunning,
        setIsRunning,
        isPaused,
        setPaused,
        currentPhase,
        setCurrentPhase,
        totalPhases,
        phaseTitle,
        setPhaseTitle,
        activityLog,
        logActivity,
        speedMultiplier,
        setSpeed,
        progressPercent,
        setProgressPercent,
        showCleanupModal,
        setShowCleanupModal,
        cleanupStatus,
        setCleanupStatus,
        simulatedDataSummary,
        setSimulatedDataSummary,
        delay,
        abortRef,
        stopSimulation,
        runCleanup,
        checkSimulationStatus,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);

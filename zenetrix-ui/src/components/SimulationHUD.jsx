import { Sparkles, Pause, Play, Square, FastForward } from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';

const SimulationHUD = () => {
  const {
    isRunning,
    isPaused,
    setPaused,
    currentPhase,
    totalPhases,
    phaseTitle,
    activityLog,
    speedMultiplier,
    setSpeed,
    progressPercent,
    stopSimulation,
  } = useSimulation();

  if (!isRunning) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="rounded-2xl border border-primary/40 bg-surface/95 backdrop-blur-md p-4 shadow-2xl shadow-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Badge & Title */}
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/30">
              <Sparkles size={20} className="animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Autopilot Engaged</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                  Phase {currentPhase} of {totalPhases}
                </span>
              </div>
              <h4 className="text-sm font-bold text-ink">{phaseTitle || 'Executing Simulation...'}</h4>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center rounded-lg border border-line bg-muted/60 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSpeed(1)}
                className={`rounded px-2 py-1 transition ${speedMultiplier === 1 ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => setSpeed(2)}
                className={`rounded px-2 py-1 transition ${speedMultiplier === 2 ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => setSpeed(3)}
                className={`rounded px-2 py-1 transition flex items-center gap-1 ${speedMultiplier === 3 ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}
              >
                <FastForward size={12} /> 3x
              </button>
            </div>

            {/* Pause / Resume */}
            <button
              type="button"
              onClick={() => setPaused(!isPaused)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-muted transition"
            >
              {isPaused ? (
                <>
                  <Play size={13} className="text-emerald-500 fill-emerald-500" /> Resume
                </>
              ) : (
                <>
                  <Pause size={13} className="text-amber-500 fill-amber-500" /> Pause
                </>
              )}
            </button>

            {/* Abort */}
            <button
              type="button"
              onClick={stopSimulation}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
            >
              <Square size={13} className="fill-rose-400" /> Stop
            </button>
          </div>
        </div>

        {/* Live Terminal Typewriter Log */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/40 border border-white/5 px-3 py-2 font-mono text-xs text-emerald-400 shadow-inner">
          <span className="text-primary font-bold">{'>'}</span>
          <span className="truncate">{activityLog}</span>
          <span className="inline-block h-3 w-1.5 bg-emerald-400 animate-pulse"></span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimulationHUD;

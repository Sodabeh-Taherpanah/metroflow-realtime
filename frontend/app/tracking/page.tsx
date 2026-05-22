'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ProbeShape = {
  id: string;
  pointCount: number;
};

type ProbeResult = {
  jobId: string;
  status: string;
  sourceType: 'gtfs' | 'gpx';
  stats: {
    shapeCount: number;
    pointCount: number;
    canonicalPointCount: number;
  };
  shapes: ProbeShape[];
  routeArtifacts: RouteArtifact[];
  validationWarnings: string[];
};

type RouteArtifact = {
  id: string;
  routeId?: string;
  routeName?: string;
  rawPath?: string;
  canonicalPath?: string;
  rawPointCount?: number;
  canonicalPointCount?: number;
};

type ProbeJob = {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
  result?: ProbeResult;
};

type RoutesCatalog = {
  routes: RouteArtifact[];
};

type UserRole = 'viewer' | 'operator' | 'admin';

type TrackingAgent = {
  id?: string;
  agentId?: string;
  routeId?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
};

type AgentFrame = {
  id: string;
  routeId?: string;
  prev: { lat: number; lng: number };
  target: { lat: number; lng: number };
  current: { lat: number; lng: number };
  updatedAtMs: number;
};

export default function TrackingPage() {
  const [gtfsZipPath, setGtfsZipPath] = useState('');
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [routeView, setRouteView] = useState<'raw' | 'canonical'>('canonical');
  const [listedRoutes, setListedRoutes] = useState<RouteArtifact[]>([]);
  const [isEmittingTestUpdate, setIsEmittingTestUpdate] = useState(false);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [agentFrames, setAgentFrames] = useState<Record<string, AgentFrame>>({});

  const apiBaseUrl = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!configured || configured.includes('api.example.com')) {
      return '';
    }
    return configured.replace(/\/$/, '');
  }, []);
  const canRunControls = userRole === 'operator' || userRole === 'admin';

  const appendLog = (message: string) => {
    setLogs(prev => [message, ...prev].slice(0, 30));
  };

  const fetchRoutes = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/ingest/routes`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as RoutesCatalog;
      setListedRoutes(payload.routes || []);
    } catch {
      // Non-blocking: routes list is optional for page load
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const pollAgents = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/tracking/agents`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as TrackingAgent[];
      const now = Date.now();

      setAgentFrames(prev => {
        const next: Record<string, AgentFrame> = {};
        const seen = new Set<string>();

        (Array.isArray(payload) ? payload : []).forEach(agent => {
          const id = String(agent.agentId || agent.id || '').trim();
          const lat = Number(agent.location?.lat);
          const lng = Number(agent.location?.lng);

          if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }

          const existing = prev[id];
          const target = { lat, lng };
          seen.add(id);

          if (!existing) {
            next[id] = {
              id,
              routeId: agent.routeId,
              prev: target,
              target,
              current: target,
              updatedAtMs: now,
            };
            return;
          }

          next[id] = {
            ...existing,
            routeId: agent.routeId,
            prev: existing.current,
            target,
            updatedAtMs: now,
          };
        });

        Object.keys(prev).forEach(id => {
          if (!seen.has(id)) {
            // keep stale agents for a short while to avoid marker flicker
            if (now - prev[id].updatedAtMs < 15_000) {
              next[id] = prev[id];
            }
          }
        });

        return next;
      });
    } catch {
      // non-blocking
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    pollAgents();
    const interval = setInterval(pollAgents, 1_000);
    return () => clearInterval(interval);
  }, [pollAgents]);

  useEffect(() => {
    let rafId = 0;

    const animate = (timestamp: number) => {
      setAgentFrames(prev => {
        let changed = false;
        const next: Record<string, AgentFrame> = {};

        for (const [id, frame] of Object.entries(prev)) {
          const progress = Math.min(1, (timestamp - frame.updatedAtMs) / 1000);
          const lat = frame.prev.lat + (frame.target.lat - frame.prev.lat) * progress;
          const lng = frame.prev.lng + (frame.target.lng - frame.prev.lng) * progress;

          if (
            Math.abs(lat - frame.current.lat) > 1e-7 ||
            Math.abs(lng - frame.current.lng) > 1e-7
          ) {
            changed = true;
          }

          next[id] = {
            ...frame,
            current: { lat, lng },
          };
        }

        return changed ? next : prev;
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!currentJobId) {
      setServerLogs([]);
      return;
    }

    let cancelled = false;
    const pollLogs = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/ingest/logs/${currentJobId}?limit=200`);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { lines?: string[] };
        if (!cancelled) {
          setServerLogs(Array.isArray(payload.lines) ? [...payload.lines].reverse() : []);
        }
      } catch {
        // non-blocking
      }
    };

    pollLogs();
    const interval = setInterval(pollLogs, 1_500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiBaseUrl, currentJobId]);

  const runProbe = async () => {
    if (!canRunControls) {
      setError('Your role does not allow running ingest or simulator controls.');
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Start probe now? This can take a while for large GTFS files.'
      );
      if (!confirmed) {
        appendLog('Probe cancelled by user.');
        return;
      }
    }

    setError(null);
    setProbeResult(null);
    setIsLoading(true);
    setJobStatus(null);
    appendLog('Queueing probe request...');

    try {
      let response: Response;

      if (gpxFile) {
        const formData = new FormData();
        if (gtfsZipPath.trim()) {
          formData.append('gtfsZipPath', gtfsZipPath.trim());
        }
        formData.append('gpxFile', gpxFile);

        response = await fetch(`${apiBaseUrl}/api/ingest/probe`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${apiBaseUrl}/api/ingest/probe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gtfsZipPath: gtfsZipPath.trim() || undefined,
          }),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Probe failed with status ${response.status}`);
      }

      const queued = (await response.json()) as { jobId: string; status: 'queued' };
      setCurrentJobId(queued.jobId);
      setJobStatus(queued.status);
      appendLog(`Probe queued. jobId=${queued.jobId}`);

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const jobResponse = await fetch(`${apiBaseUrl}/api/ingest/jobs/${queued.jobId}`);
        if (!jobResponse.ok) {
          const text = await jobResponse.text();
          throw new Error(text || `Job fetch failed with status ${jobResponse.status}`);
        }

        const job = (await jobResponse.json()) as ProbeJob;
        setJobStatus(job.status);
        appendLog(`Job ${job.jobId} status: ${job.status}`);

        if (job.status === 'completed' && job.result) {
          setProbeResult(job.result);
          appendLog(
            `Probe complete. source=${job.result.sourceType} shapes=${job.result.stats.shapeCount} rawPoints=${job.result.stats.pointCount} canonicalPoints=${job.result.stats.canonicalPointCount}`
          );
          if (job.result.validationWarnings?.length) {
            job.result.validationWarnings.forEach(warning => appendLog(`Validation: ${warning}`));
          }
          await fetchRoutes();
          return;
        }

        if (job.status === 'failed') {
          throw new Error(job.error || 'Probe job failed.');
        }
      }

      throw new Error('Probe job timed out while waiting for completion.');
    } catch (probeError) {
      const message = probeError instanceof Error ? probeError.message : 'Unknown probe error';
      setError(message);
      appendLog(`Probe failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const emitTestUpdate = async () => {
    if (!canRunControls) {
      setError('Your role does not allow running ingest or simulator controls.');
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Emit a simulator test update to realtime gateway?');
      if (!confirmed) {
        appendLog('Test emit cancelled by user.');
        return;
      }
    }

    setError(null);
    setIsEmittingTestUpdate(true);
    appendLog('Emitting test agent.location.update...');

    try {
      const response = await fetch(`${apiBaseUrl}/api/simulator/test-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: (listedRoutes[0]?.id ||
            probeResult?.routeArtifacts?.[0]?.id ||
            'test-route') as string,
          seq: 0,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Emit failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        event?: string;
        emitted?: Record<string, unknown>;
      };
      appendLog(
        `Test emit ${payload.ok ? 'succeeded' : 'completed'}: ${payload.event || 'agent.location.update'}`
      );
    } catch (emitError) {
      const message = emitError instanceof Error ? emitError.message : 'Unknown emit error';
      setError(message);
      appendLog(`Test emit failed: ${message}`);
    } finally {
      setIsEmittingTestUpdate(false);
    }
  };

  const animatedAgents = useMemo(
    () => Object.values(agentFrames).map(frame => ({ ...frame, ...frame.current })),
    [agentFrames]
  );

  const mapBounds = useMemo(() => {
    if (animatedAgents.length === 0) {
      return {
        minLat: 52.48,
        maxLat: 52.56,
        minLng: 13.35,
        maxLng: 13.46,
      };
    }

    const lats = animatedAgents.map(agent => agent.current.lat);
    const lngs = animatedAgents.map(agent => agent.current.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latPad = Math.max(0.002, (maxLat - minLat) * 0.2);
    const lngPad = Math.max(0.002, (maxLng - minLng) * 0.2);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [animatedAgents]);

  const logsToRender = serverLogs.length > 0 ? serverLogs : logs;

  const toPreviewPosition = (lat: number, lng: number) => {
    const xRatio =
      (lng - mapBounds.minLng) / Math.max(0.000001, mapBounds.maxLng - mapBounds.minLng);
    const yRatio =
      (lat - mapBounds.minLat) / Math.max(0.000001, mapBounds.maxLat - mapBounds.minLat);

    return {
      left: `${Math.min(100, Math.max(0, xRatio * 100))}%`,
      top: `${Math.min(100, Math.max(0, (1 - yRatio) * 100))}%`,
    };
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Tracking / Ingest</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          GTFS/GPX ingest probe to canonical route samples for simulator and tracking workflows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500 dark:text-slate-400">
            Probe an input source and inspect route shape IDs with point counts before replay.
            {currentJobId ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Job: {currentJobId} {jobStatus ? `(${jobStatus})` : ''}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Role
              </label>
              <select
                value={userRole}
                onChange={event => setUserRole(event.target.value as UserRole)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="viewer">viewer</option>
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>
              {!canRunControls ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Viewer mode: controls are read-only.
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                GTFS zip path
              </label>
              <input
                value={gtfsZipPath}
                onChange={event => setGtfsZipPath(event.target.value)}
                placeholder="./data/gtfs/sample.zip"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                GPX upload
              </label>
              <input
                type="file"
                accept=".gpx,application/gpx+xml,text/xml,application/xml"
                onChange={event => setGpxFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-300 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-100 dark:hover:file:bg-slate-600"
              />
            </div>

            <Button
              onClick={runProbe}
              disabled={!canRunControls || isLoading || (!gtfsZipPath.trim() && !gpxFile)}
            >
              {isLoading ? 'Running probe...' : 'Probe GTFS/GPX'}
            </Button>

            <Button
              onClick={emitTestUpdate}
              variant="outline"
              disabled={!canRunControls || isEmittingTestUpdate}
            >
              {isEmittingTestUpdate ? 'Emitting update...' : 'Emit test update'}
            </Button>

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={routeView === 'raw' ? 'default' : 'outline'}
                onClick={() => setRouteView('raw')}
              >
                Raw
              </Button>
              <Button
                size="sm"
                variant={routeView === 'canonical' ? 'default' : 'outline'}
                onClick={() => setRouteView('canonical')}
              >
                Canonical
              </Button>
            </div>

            {(listedRoutes.length > 0 ? listedRoutes : probeResult?.routeArtifacts || []).length >
            0 ? (
              (listedRoutes.length > 0 ? listedRoutes : probeResult?.routeArtifacts || [])
                .slice(0, 25)
                .map(shape => (
                  <div
                    key={shape.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="truncate pr-3">
                      <p className="truncate text-slate-700 dark:text-slate-200">{shape.id}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {routeView === 'canonical' ? shape.canonicalPath : shape.rawPath}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {routeView === 'canonical'
                        ? (shape.canonicalPointCount ?? 0)
                        : (shape.rawPointCount ?? 0)}{' '}
                      pts
                    </span>
                  </div>
                ))
            ) : (
              <p>No probe results yet.</p>
            )}

            {(listedRoutes.length > 0 ? listedRoutes : probeResult?.routeArtifacts || []).length >
            0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Downloads
                </p>
                {(listedRoutes.length > 0 ? listedRoutes : probeResult?.routeArtifacts || [])
                  .slice(0, 8)
                  .map(shape => (
                    <div
                      key={`${shape.id}-downloads`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="max-w-45 truncate text-xs text-slate-500 dark:text-slate-400">
                        {shape.id}
                      </span>
                      <a
                        href={`${apiBaseUrl}/api/ingest/download/${encodeURIComponent(shape.id)}?view=raw`}
                        className="text-xs text-blue-600 underline dark:text-blue-300"
                        target="_blank"
                        rel="noreferrer"
                      >
                        raw
                      </a>
                      <a
                        href={`${apiBaseUrl}/api/ingest/download/${encodeURIComponent(shape.id)}?view=canonical`}
                        className="text-xs text-blue-600 underline dark:text-blue-300"
                        target="_blank"
                        rel="noreferrer"
                      >
                        canonical
                      </a>
                      <a
                        href={`${apiBaseUrl}/api/ingest/download/${encodeURIComponent(shape.id)}?view=samples`}
                        className="text-xs text-blue-600 underline dark:text-blue-300"
                        target="_blank"
                        rel="noreferrer"
                      >
                        samples
                      </a>
                    </div>
                  ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <p>
              {probeResult
                ? `Source ${probeResult.sourceType} with ${probeResult.stats.pointCount} raw points and ${probeResult.stats.canonicalPointCount} canonical points.`
                : 'Live position preview from tracking agents.'}
            </p>
            <div className="relative h-64 overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.16),transparent_55%)]" />
              {animatedAgents.map(agent => {
                const pos = toPreviewPosition(agent.current.lat, agent.current.lng);
                return (
                  <div
                    key={agent.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pos.left, top: pos.top }}
                    title={`${agent.id}${agent.routeId ? ` (${agent.routeId})` : ''}`}
                  >
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
                  </div>
                );
              })}
              {animatedAgents.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                  No live agents yet. Start simulator to see animated markers.
                </div>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {animatedAgents.length} agent{animatedAgents.length === 1 ? '' : 's'} animated with
              requestAnimationFrame interpolation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            {logsToRender.length > 0 ? (
              logsToRender.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  {line}
                </div>
              ))
            ) : (
              <p>No logs yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

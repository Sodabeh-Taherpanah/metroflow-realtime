'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', []);

  const appendLog = (message: string) => {
    setLogs(prev => [message, ...prev].slice(0, 30));
  };

  const fetchRoutes = async () => {
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
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const runProbe = async () => {
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

      const payload = (await response.json()) as { ok?: boolean; event?: string; emitted?: any };
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

            <Button onClick={runProbe} disabled={isLoading || (!gtfsZipPath.trim() && !gpxFile)}>
              {isLoading ? 'Running probe...' : 'Probe GTFS/GPX'}
            </Button>

            <Button onClick={emitTestUpdate} variant="outline" disabled={isEmittingTestUpdate}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500 dark:text-slate-400">
            {probeResult
              ? `Source ${probeResult.sourceType} with ${probeResult.stats.pointCount} raw points and ${probeResult.stats.canonicalPointCount} canonical points.`
              : 'Map preview placeholder.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            {logs.length > 0 ? (
              logs.map((line, index) => (
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

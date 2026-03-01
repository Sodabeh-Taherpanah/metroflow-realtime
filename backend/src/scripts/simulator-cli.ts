import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require("socket.io-client");

type RouteSample = {
  seq: number;
  lat: number;
  lng: number;
  dist: number;
  bearing: number;
};

type CliOptions = {
  route: string;
  interval: number;
  loop: boolean;
  agents: number;
  url: string;
};

function parseArgs(argv: string[]): CliOptions {
  const defaults: CliOptions = {
    route: "shape_A",
    interval: 1000,
    loop: true,
    agents: 1,
    url: process.env.WS_URL || "http://localhost:3001",
  };

  const args = new Map<string, string>();
  for (const entry of argv) {
    if (!entry.startsWith("--")) {
      continue;
    }
    const [key, value] = entry.slice(2).split("=");
    if (key) {
      args.set(key, value ?? "");
    }
  }

  const interval = Number(args.get("interval") ?? defaults.interval);
  const agents = Number(args.get("agents") ?? defaults.agents);
  const loopRaw = args.get("loop");

  return {
    route: args.get("route") || defaults.route,
    interval:
      Number.isFinite(interval) && interval > 0 ? interval : defaults.interval,
    loop: loopRaw === undefined ? defaults.loop : loopRaw !== "false",
    agents:
      Number.isFinite(agents) && agents > 0
        ? Math.floor(agents)
        : defaults.agents,
    url: args.get("url") || defaults.url,
  };
}

function loadSamples(routeId: string): RouteSample[] {
  const dataDir = process.env.DATA_DIR || "./data";
  const samplePath = resolve(
    process.cwd(),
    dataDir,
    "samples",
    `route-${routeId}-samples.json`,
  );

  if (!existsSync(samplePath)) {
    console.log(
      `[sim-cli] sample file not found at ${samplePath}, using one fallback point.`,
    );
    return [
      {
        seq: 0,
        lat: 52.52,
        lng: 13.405,
        dist: 0,
        bearing: 0,
      },
    ];
  }

  const file = JSON.parse(readFileSync(samplePath, "utf-8"));
  const points = Array.isArray(file?.samples) ? file.samples : [];
  if (points.length === 0) {
    throw new Error(`No samples found in ${samplePath}`);
  }

  return points.map((point: any) => ({
    seq: Number(point.seq) || 0,
    lat: Number(point.lat),
    lng: Number(point.lng),
    dist: Number(point.dist) || 0,
    bearing: Number(point.bearing) || 0,
  }));
}

function startSimulator(options: CliOptions) {
  const samples = loadSamples(options.route);
  const socket = io(options.url, {
    transports: ["websocket"],
  });

  let tick = 0;

  socket.on("connect", () => {
    console.log(`[sim-cli] connected id=${socket.id} url=${options.url}`);
    console.log(
      `[sim-cli] route=${options.route} interval=${options.interval}ms loop=${options.loop} agents=${options.agents} samples=${samples.length}`,
    );

    const timer = setInterval(() => {
      for (let agentIndex = 0; agentIndex < options.agents; agentIndex += 1) {
        const sampleIndex = options.loop
          ? tick % samples.length
          : Math.min(tick, samples.length - 1);
        const sample = samples[sampleIndex];

        const payload = {
          agentId: `sim-agent-${agentIndex + 1}`,
          routeId: options.route,
          location: {
            lat: sample.lat,
            lng: sample.lng,
          },
          seq: sample.seq,
          dist: sample.dist,
          bearing: sample.bearing,
          emittedAt: new Date().toISOString(),
          source: "simulator-cli",
        };

        socket.emit("agent.location.update", payload);
        console.log(
          `[sim-cli] emit agent=${payload.agentId} seq=${payload.seq} lat=${payload.location.lat} lng=${payload.location.lng}`,
        );
      }

      tick += 1;

      if (!options.loop && tick >= samples.length) {
        console.log("[sim-cli] completed non-loop run, disconnecting.");
        clearInterval(timer);
        socket.disconnect();
      }
    }, options.interval);

    socket.on("disconnect", () => {
      clearInterval(timer);
      console.log("[sim-cli] disconnected");
    });
  });

  socket.on("connect_error", (error) => {
    console.error("[sim-cli] connect error:", error.message);
  });
}

const options = parseArgs(process.argv.slice(2));
startSimulator(options);

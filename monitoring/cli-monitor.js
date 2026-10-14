/**
 * RedStone CLI Real-Time Metrics Monitor
 * 
 * Scrapes and displays live Prometheus metrics in your terminal.
 * No Docker or external tools required!
 * 
 * Usage:
 *   node monitoring/cli-monitor.js
 *   node monitoring/cli-monitor.js https://redstone-ugwp.onrender.com/metrics
 */

const targetUrl = process.argv[2] || process.env.METRICS_URL || 'https://redstone-ugwp.onrender.com/metrics';
const token = process.env.METRICS_TOKEN || null;

console.clear();
console.log('='.repeat(65));
console.log(`  RedStone Live Prometheus Monitor`);
console.log(`  Target: ${targetUrl}`);
console.log('='.repeat(65));
console.log('Fetching live metrics...\n');

function parseMetrics(text) {
  const result = {
    requests: [],
    inFlight: 0,
    dbStatus: 0,
    memoryRssMb: 0,
    heapUsedMb: 0,
    uptimeSeconds: 0,
    cpuSeconds: 0,
    errors: [],
  };

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;

    // HTTP Requests Total
    if (line.startsWith('redstone_http_requests_total{')) {
      const match = line.match(/\{method="([^"]+)",route="([^"]+)",status_code="([^"]+)"\}\s+([0-9.]+)/);
      if (match) {
        result.requests.push({ method: match[1], route: match[2], status: match[3], count: Number(match[4]) });
      }
    }

    // In Flight
    if (line.startsWith('redstone_http_requests_in_flight{')) {
      const match = line.match(/\}\s+([0-9.]+)/);
      if (match) result.inFlight = Number(match[1]);
    }

    // Database Status
    if (line.startsWith('redstone_database_status ')) {
      result.dbStatus = Number(line.split(' ')[1]);
    }

    // Process Memory
    if (line.startsWith('redstone_process_resident_memory_bytes ')) {
      result.memoryRssMb = (Number(line.split(' ')[1]) / (1024 * 1024)).toFixed(1);
    }
    if (line.startsWith('redstone_nodejs_heap_size_used_bytes ')) {
      result.heapUsedMb = (Number(line.split(' ')[1]) / (1024 * 1024)).toFixed(1);
    }

    // Process Start Time for Uptime
    if (line.startsWith('redstone_process_start_time_seconds ')) {
      const startTime = Number(line.split(' ')[1]);
      result.uptimeSeconds = Math.floor(Date.now() / 1000 - startTime);
    }

    // Errors
    if (line.startsWith('redstone_http_errors_total{')) {
      const match = line.match(/\{method="([^"]+)",route="([^"]+)",status_code="([^"]+)",error_type="([^"]+)"\}\s+([0-9.]+)/);
      if (match) {
        result.errors.push({ method: match[1], route: match[2], status: match[3], type: match[4], count: Number(match[5]) });
      }
    }
  }

  return result;
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

async function scrape() {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(targetUrl, { headers });
    if (!res.ok) {
      console.log(`[${new Date().toLocaleTimeString()}] HTTP Error: ${res.status} ${res.statusText}`);
      return;
    }

    const text = await res.text();
    const data = parseMetrics(text);

    console.clear();
    console.log('='.repeat(65));
    console.log(`  RedStone Live Prometheus Metrics Monitor`);
    console.log(`  Target:  ${targetUrl}`);
    console.log(`  Updated: ${new Date().toLocaleTimeString()} (refreshing every 3s)`);
    console.log('='.repeat(65));

    console.log('\n[ SYSTEM HEALTH ]');
    const dbDisplay = data.dbStatus === 1 ? '\x1b[32mCONNECTED (OK)\x1b[0m' : '\x1b[31mDISCONNECTED\x1b[0m';
    console.log(`  Database Status:     ${dbDisplay}`);
    console.log(`  Process Uptime:      ${formatUptime(data.uptimeSeconds)}`);
    console.log(`  Resident Memory:     ${data.memoryRssMb} MB (Heap: ${data.heapUsedMb} MB)`);
    console.log(`  Requests In-Flight:  ${data.inFlight}`);

    console.log('\n[ HTTP REQUEST COUNTS BY ROUTE ]');
    if (data.requests.length === 0) {
      console.log('  No HTTP requests recorded yet.');
    } else {
      console.log('  METHOD  STATUS  COUNT   ROUTE');
      console.log('  ' + '-'.repeat(55));
      for (const r of data.requests) {
        const statusColor = r.status.startsWith('2') ? '\x1b[32m' : r.status.startsWith('4') ? '\x1b[33m' : '\x1b[31m';
        console.log(`  ${r.method.padEnd(7)} ${statusColor}${r.status.padEnd(7)}\x1b[0m ${String(r.count).padEnd(7)} ${r.route}`);
      }
    }

    if (data.errors.length > 0) {
      console.log('\n[ ERRORS DETECTED ]');
      for (const e of data.errors) {
        console.log(`  ${e.type.toUpperCase()}: ${e.method} ${e.route} (${e.status}) -> ${e.count} occurrences`);
      }
    }

    console.log('\n' + '-'.repeat(65));
    console.log('  Press Ctrl+C to exit.');
  } catch (err) {
    console.log(`[${new Date().toLocaleTimeString()}] Fetch failed: ${err.message}`);
  }
}

// Initial scrape and interval
scrape();
setInterval(scrape, 3000);

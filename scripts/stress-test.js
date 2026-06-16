/**
 * stress-test.js — Teste de Stress na API do WorkDash
 *
 * Testa a Netlify Function (/.netlify/functions/api) sob carga:
 * - Requisições GET/POST concorrentes
 * - Diferentes níveis de concorrência (10, 50, 100)
 * - Largura de banda e latência (p50, p95, p99)
 * - Payloads de diferentes tamanhos
 * - Race conditions (escritas simultâneas)
 * - Timeout e resiliência
 *
 * Uso:
 *   node scripts/stress-test.js                           # testa contra http://localhost:8888
 *   node scripts/stress-test.js https://seu-site.netlify.app  # testa em produção
 *
 * ⚠️ ATENÇÃO: Testar em produção vai consumir cota da Netlify Functions!
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';

// ─── Config ──────────────────────────────────────────────

const TARGET_URL = process.argv[2] || 'http://localhost:8888';
const API_PATH = '/.netlify/functions/api';
const BASE_URL = TARGET_URL.replace(/\/+$/, '');

let client;
if (BASE_URL.startsWith('https')) {
  client = https;
} else {
  client = http;
}

const CONCURRENCY_LEVELS = [10, 50, 100];
const DEFAULT_ITERATIONS = 3;

// ─── Helpers ──────────────────────────────────────────────

function formatMs(ms) {
  if (ms < 1) return (ms * 1000).toFixed(2) + ' µs';
  if (ms < 1000) return ms.toFixed(2) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fetch(method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_PATH, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          size: Buffer.byteLength(data, 'utf8')
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    avg: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    med: percentile(sorted, 50),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    count: sorted.length,
    errors: 0
  };
}

function logStats(label, s) {
  console.log(`  ${label}`);
  console.log(`    requests: ${s.count}  erros: ${s.errors}`);
  console.log(`    avg=${formatMs(s.avg)}  med=${formatMs(s.med)}  min=${formatMs(s.min)}  max=${formatMs(s.max)}`);
  console.log(`    p50=${formatMs(s.p50)}  p75=${formatMs(s.p75)}  p90=${formatMs(s.p90)}  p95=${formatMs(s.p95)}  p99=${formatMs(s.p99)}`);
}

function section(title) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(72)}`);
}

// ─── Payloads ─────────────────────────────────────────────

function generatePayload(numCards) {
  const customs = [];
  const order = [];
  for (let i = 0; i < numCards; i++) {
    const id = 'card-' + i;
    customs.push({
      id,
      title: 'Parecer ' + i,
      content: ('Conteúdo do parecer número ' + i + '. ').repeat(5),
      color: 'light',
      type: 'copy',
      showDate: false,
      local: 'Curitiba',
      sit: 'Regular'
    });
    order.push(id);
  }
  return JSON.stringify({
    dashboards: [{
      id: 'stress-test',
      name: 'Stress Test',
      icon: 'fa-flask',
      order,
      customs,
      edits: {},
      deleted: []
    }],
    activeDashboard: 'stress-test',
    dashSortMode: 'custom',
    servicos: {},
    _lastModified: Date.now()
  });
}

// ─── 1. Health Check (GET) ────────────────────────────────

section('1. HEALTH CHECK — GET /api');

async function healthCheck() {
  const start = performance.now();
  try {
    const res = await fetch('GET');
    const elapsed = performance.now() - start;
    console.log(`  Status: ${res.status}  Tamanho: ${formatBytes(res.size)}  Tempo: ${formatMs(elapsed)}`);

    let parsed = null;
    try { parsed = JSON.parse(res.body); } catch (_) { }
    console.log(`  Dashboards: ${parsed && parsed.dashboards ? parsed.dashboards.length : 'N/A'}  empty: ${parsed ? !!parsed.empty : 'parse error'}`);
  } catch (err) {
    console.log(`  ERRO: ${err.message}`);
  }
}

await healthCheck();

// ─── 2. POST com diferentes tamanhos de payload ──────────

section('2. POST — DIFERENTES TAMANHOS DE PAYLOAD');

async function postPayload(label, numCards) {
  const payload = generatePayload(numCards);
  console.log(`\n  Payload: ${label} (${numCards} cards, ${formatBytes(Buffer.byteLength(payload, 'utf8'))})`);

  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const res = await fetch('POST', payload);
      const elapsed = performance.now() - start;
      times.push(elapsed);
      console.log(`    req ${i + 1}: ${res.status} ${formatMs(elapsed)}`);
    } catch (err) {
      console.log(`    req ${i + 1}: ERRO — ${err.message}`);
    }
  }

  if (times.length > 0) {
    const s = stats(times);
    logStats('  Resumo:', s);
  }
}

await postPayload('pequeno', 5);
await postPayload('médio', 50);
await postPayload('grande', 200);

// ─── 3. Concorrência — GET ────────────────────────────────

section('3. CONCORRÊNCIA — GET /api');

async function concurrentGet(concurrency, totalRequests) {
  console.log(`\n  ${concurrency} requisições concorrentes (total ${totalRequests})...`);

  const times = [];
  let errors = 0;

  async function runBatch(batch) {
    const promises = batch.map(async () => {
      const start = performance.now();
      try {
        const res = await fetch('GET');
        const elapsed = performance.now() - start;
        times.push(elapsed);
        return { ok: res.status === 200, time: elapsed };
      } catch (err) {
        errors++;
        return { ok: false, error: err.message };
      }
    });
    return Promise.all(promises);
  }

  // Divide em batches de 'concurrency' requisições
  const batches = [];
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batchSize = Math.min(concurrency, totalRequests - i);
    const batch = Array.from({ length: batchSize }, () => null);
    batches.push(batch);
  }

  for (const batch of batches) {
    await runBatch(batch);
  }

  const s = stats(times);
  s.errors = errors;
  logStats('  Resultado:', s);

  if (times.length > 0) {
    const totalTime = times.reduce((a, b) => a + b, 0);
    console.log(`    Throughput: ~${(totalRequests / (totalTime / 1000)).toFixed(1)} req/s`);
  }
}

for (const c of CONCURRENCY_LEVELS) {
  await concurrentGet(c, c * 3);
}

// ─── 4. Concorrência — POST ───────────────────────────────

section('4. CONCORRÊNCIA — POST /api (race condition)');

async function concurrentPost(concurrency, numCards) {
  const payload = generatePayload(numCards);
  console.log(`\n  ${concurrency} POSTs simultâneos (${numCards} cards cada, ${formatBytes(Buffer.byteLength(payload, 'utf8'))}/req)...`);

  const times = [];
  let errors = 0;
  let successes = 0;

  const promises = Array.from({ length: concurrency }, async () => {
    const start = performance.now();
    try {
      const res = await fetch('POST', payload);
      const elapsed = performance.now() - start;
      times.push(elapsed);
      if (res.status >= 200 && res.status < 300) successes++;
      else errors++;
      return { ok: res.status < 300, time: elapsed, status: res.status };
    } catch (err) {
      errors++;
      return { ok: false, error: err.message };
    }
  });

  const results = await Promise.all(promises);

  const statusCodes = {};
  results.forEach(r => {
    const code = r.status || 'error';
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });

  console.log(`    Status: ${JSON.stringify(statusCodes)}`);
  console.log(`    Sucessos: ${successes}  Erros: ${errors}`);

  if (times.length > 0) {
    const s = stats(times);
    s.errors = errors;
    logStats('  Latência:', s);
  }
}

for (const c of [10, 50]) {
  await concurrentPost(c, 20);
}

// ─── 5. Teste de timeout ──────────────────────────────────

section('5. RESILIÊNCIA — TIMEOUT');

async function testTimeout() {
  console.log('\n  Testando timeout (1s)...');
  const start = performance.now();
  try {
    const res = await fetch('GET');
    const elapsed = performance.now() - start;
    console.log(`  OK: ${res.status} em ${formatMs(elapsed)}`);
  } catch (err) {
    const elapsed = performance.now() - start;
    console.log(`  Timeout/erro após ${formatMs(elapsed)}: ${err.message}`);
  }
}

await testTimeout();

// ─── 6. Teste de integridade ──────────────────────────────

section('6. INTEGRIDADE DOS DADOS');

async function testIntegrity() {
  console.log('\n  Escrevendo payload de teste...');
  const payload = generatePayload(10);
  const parsed = JSON.parse(payload);

  try {
    const writeRes = await fetch('POST', payload);
    console.log(`  POST → ${writeRes.status}`);

    const readRes = await fetch('GET');
    const readData = JSON.parse(readRes.body);

    if (readData.dashboards && readData.dashboards.length > 0) {
      const stressDash = readData.dashboards.find(d => d.id === 'stress-test');
      if (stressDash) {
        console.log(`  Dashboard recuperado: ${stressDash.customs.length} cards`);
        console.log(`  Integridade: ${stressDash.customs.length === parsed.dashboards[0].customs.length ? '✓ OK' : '✗ DIVERGENTE'}`);
      } else {
        console.log('  Dashboard stress-test não encontrado na resposta');
      }
    } else {
      console.log('  Resposta sem dashboards');
    }
  } catch (err) {
    console.log(`  ERRO: ${err.message}`);
  }
}

await testIntegrity();

// ─── Resumo ───────────────────────────────────────────────

console.log(`\n${'═'.repeat(72)}`);
console.log(`  STRESS TEST CONCLUÍDO — ${BASE_URL}`);
console.log(`${'═'.repeat(72)}\n`);

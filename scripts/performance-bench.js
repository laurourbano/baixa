/**
 * performance-bench.js — Benchmark de Performance do WorkDash
 *
 * Cenários:
 *   1. Renderização de cards em massa (DOM)
 *   2. Serialização/deserialização JSON (localStorage simulado)
 *   3. Busca/filtro em arrays grandes
 *   4. Criação massiva de elementos DOM
 *   5. Consumo de memória
 *
 * Uso:
 *   node scripts/performance-bench.js
 *   node scripts/performance-bench.js --section=dom,json,filter,memory
 *   node scripts/performance-bench.js --cards=100,500,1000 --iterations=30
 *   node --expose-gc scripts/performance-bench.js          # medição de heap precisa
 *
 * Flags:
 *   --section  seções a executar (dom|json|filter|elements|memory, separado por vírgula)
 *   --cards    contagens de cards a testar (ex: 10,100,500)
 *   --iters    iterações por benchmark (default: 20)
 */

'use strict';

const { performance } = require('perf_hooks');
const { JSDOM } = require('jsdom');

// ─── CLI ──────────────────────────────────────────────────

const argv = process.argv.slice(2);
function flag(name, fallback) {
  const prefix = '--' + name + '=';
  const arg = argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

const SECTIONS = (flag('section', 'dom,json,filter,elements,memory,softdelete')).split(',').map(s => s.trim());
const CARD_SIZES = (flag('cards', '10,50,100,200')).split(',').map(Number);
const DEFAULT_ITERS = parseInt(flag('iters', '20'), 10);

const GLOBAL_DOM = new JSDOM('<!DOCTYPE html><div id="dynamic-cards"></div><div id="container"></div>');
const GLOBAL_DOC = GLOBAL_DOM.window.document;

// ─── Helpers ──────────────────────────────────────────────

function formatMs(ms) {
  if (ms < 0.001) return (ms * 1000000).toFixed(0) + ' ns';
  if (ms < 1) return (ms * 1000).toFixed(2) + ' µs';
  if (ms < 1000) return ms.toFixed(2) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

function formatBytes(bytes) {
  if (bytes < 0) return '-' + formatBytes(-bytes);
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function memoryUsage() {
  const m = process.memoryUsage();
  return { heapUsed: m.heapUsed, heapTotal: m.heapTotal, rss: m.rss };
}

function forceGC() {
  if (typeof global.gc === 'function') {
    global.gc();
    global.gc();
  }
}

function runBench(name, fn, iterations) {
  iterations = iterations || DEFAULT_ITERS;
  const times = [];
  let result;

  forceGC();
  // Warmup + estabilização JIT
  for (let i = 0; i < 3; i++) fn();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    name,
    avg: sum / times.length,
    med: times[Math.floor(times.length / 2)],
    min: times[0],
    max: times[times.length - 1],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
    iterations,
    result
  };
}

const _allResults = [];

function logResult(bench) {
  _allResults.push(bench);
  console.log(`\n  ${bench.name}`);
  console.log(`    avg=${formatMs(bench.avg)}  med=${formatMs(bench.med)}  min=${formatMs(bench.min)}  max=${formatMs(bench.max)}  p95=${formatMs(bench.p95)}  (${bench.iterations}x)`);
}

function section(title) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(80)}`);
}

// ─── Geradores de dados ──────────────────────────────────

function generateCard(id) {
  return {
    id: 'card-' + id,
    title: 'Card de teste número ' + id + ' — Parecer sobre empresa XYZ Ltda',
    content: 'Conteúdo detalhado do parecer referente ao processo ' + id +
      '. Considerando os autos, verifica-se a regularidade das anotações de responsabilidade técnica ' +
      'do profissional farmacêutico, conforme disposto na Lei 3.820/60 e Decreto 85.878/81. ' +
      'A documentação apresentada atende aos requisitos legais. '.repeat(3),
    color: ['light', 'dark', 'info', 'success', 'warning', 'danger', 'primary'][id % 7],
    type: 'copy',
    showDate: id % 3 === 0,
    local: 'Curitiba - PR',
    sit: id % 2 === 0 ? 'Regular' : 'Pendente',
    julgamento: id % 2 === 0 ? 'Deferido' : 'Em análise'
  };
}

/** Pré-aloca para evitar custo de resize durante benchmark */
function generateLargeState(numCards, numDashboards) {
  numDashboards = numDashboards || 1;
  const dashboards = new Array(numDashboards);
  for (let d = 0; d < numDashboards; d++) {
    const customs = new Array(numCards);
    const order = new Array(numCards);
    for (let i = 0; i < numCards; i++) {
      const card = generateCard(i);
      customs[i] = card;
      order[i] = card.id;
    }
    dashboards[d] = {
      id: 'dash-' + d,
      name: 'Dashboard ' + d,
      icon: 'fa-file-alt',
      order,
      customs,
      edits: {},
      deleted: []
    };
  }
  return {
    dashboards,
    activeDashboard: 'dash-0',
    dashSortMode: 'custom',
    servicos: {},
    _lastModified: Date.now()
  };
}

/** Template de card compatível com o cards.js real (usa data-id) */
function renderCardHTML(card) {
  return `<div class="card h-100 border-${card.color}" data-id="${card.id}" data-color="${card.color}">
    <div class="card-header d-flex justify-content-between align-items-center py-1 px-2">
      <span class="fw-bold x-small">${card.title}</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-sm text-muted btn-edit"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm text-muted btn-delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="card-body py-1 px-2">
      <div class="content-display x-small">${card.content}</div>
    </div>
    <div class="card-footer py-1 px-2 d-flex justify-content-between x-small">
      <span>${card.local || ''}</span>
      <span class="badge bg-${card.color}">${card.sit || ''}</span>
    </div>
  </div>`;
}

// ─── 1. Renderização DOM ─────────────────────────────────

if (SECTIONS.includes('dom')) {
  section('1. RENDERIZAÇÃO DOM (simulando app.render)');

  function benchmarkDOMRender(numCards, iterations) {
    const container = GLOBAL_DOC.getElementById('dynamic-cards');
    const state = generateLargeState(numCards, 1);
    const cards = state.dashboards[0].customs;

    return runBench(`Renderizar ${numCards} cards`, () => {
      container.innerHTML = '';
      const fragment = GLOBAL_DOC.createDocumentFragment();

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const col = GLOBAL_DOC.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-3 mb-2';
        col.setAttribute('data-card-id', card.id);
        col.setAttribute('data-color', card.color);
        col.innerHTML = renderCardHTML(card);
        fragment.appendChild(col);
      }

      container.appendChild(fragment);
    }, iterations);
  }

  CARD_SIZES.forEach(n => {
    logResult(benchmarkDOMRender(n, DEFAULT_ITERS));
  });
}

// ─── 2. Serialização/Deserialização JSON ─────────────────

if (SECTIONS.includes('json')) {
  section('2. SERIALIZAÇÃO / DESERIALIZAÇÃO JSON (localStorage simulado)');

  function benchmarkJSONSerialize(numCards, iterations) {
    const state = generateLargeState(numCards, 1);
    return runBench(`JSON.stringify ${numCards} cards`, () => {
      return JSON.stringify(state);
    }, iterations);
  }

  function benchmarkJSONDeserialize(json, numCards, iterations) {
    return runBench(`JSON.parse ${numCards} cards`, () => {
      return JSON.parse(json);
    }, iterations);
  }

  function benchmarkLocalStorageRoundtrip(json, numCards, iterations) {
    return runBench(`localStorage roundtrip ${numCards} cards`, () => {
      // Simula setItem → getItem → parse
      const raw = json;
      return JSON.parse(raw);
    }, iterations);
  }

  const jsonSizes = [10, 100, 500].filter(n => CARD_SIZES.includes(n));
  if (jsonSizes.length === 0) jsonSizes.push(100, 500);

  jsonSizes.forEach(n => {
    const state = generateLargeState(n, 1);
    const json = JSON.stringify(state);

    logResult(benchmarkJSONSerialize(n, DEFAULT_ITERS));
    logResult(benchmarkJSONDeserialize(json, n, DEFAULT_ITERS));
    logResult(benchmarkLocalStorageRoundtrip(json, n, DEFAULT_ITERS));

    console.log(`    Tamanho do JSON: ${formatBytes(json.length)}`);
  });

  const bigState = generateLargeState(500, 1);
  const bigJson = JSON.stringify(bigState);
  console.log(`\n  Referência: 500 cards → ${formatBytes(bigJson.length)}`);
}

// ─── 3. Busca / Filtro em arrays ─────────────────────────

if (SECTIONS.includes('filter')) {
  section('3. BUSCA / FILTRO EM ARRAYS GRANDES');

  function benchmarkFilter(numCards, iterations) {
    const state = generateLargeState(numCards, 1);
    const cards = state.dashboards[0].customs;

    const r1 = runBench(`Array.filter por propriedade (${numCards} cards)`, () => {
      return cards.filter(c => c.sit === 'Pendente');
    }, iterations);
    logResult(r1);
    if (r1.result) console.log(`    Encontrados: ${r1.result.length}`);

    const r2 = runBench(`Busca regex em conteúdo (${numCards} cards)`, () => {
      const regex = /regularidade/i;
      return cards.filter(c => regex.test(c.content));
    }, iterations);
    logResult(r2);

    const targetId = 'card-' + Math.floor(numCards / 2);
    const r3 = runBench(`Array.find por ID (${numCards} cards)`, () => {
      return cards.find(c => c.id === targetId);
    }, iterations);
    logResult(r3);
  }

  CARD_SIZES.filter(n => n >= 100).forEach(n => {
    benchmarkFilter(n, DEFAULT_ITERS);
  });
}

// ─── 4. Criação massiva de elementos DOM ─────────────────

if (SECTIONS.includes('elements')) {
  section('4. CRIAÇÃO MASSIVA DE ELEMENTOS DOM');

  function benchmarkDOMCreation(count, iterations) {
    const container = GLOBAL_DOC.getElementById('container');

    const r1 = runBench(`Criar ${count} elementos (appendChild)`, () => {
      container.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const div = GLOBAL_DOC.createElement('div');
        div.textContent = 'Item ' + i;
        container.appendChild(div);
      }
    }, iterations);
    logResult(r1);

    const r2 = runBench(`Criar ${count} elementos (fragment)`, () => {
      container.innerHTML = '';
      const frag = GLOBAL_DOC.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const div = GLOBAL_DOC.createElement('div');
        div.textContent = 'Item ' + i;
        frag.appendChild(div);
      }
      container.appendChild(frag);
    }, iterations);
    logResult(r2);

    const r3 = runBench(`Criar ${count} elementos (innerHTML batch)`, () => {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += '<div>Item ' + i + '</div>';
      }
      container.innerHTML = html;
    }, iterations);
    logResult(r3);

    return { r1, r2, r3 };
  }

  CARD_SIZES.forEach(n => {
    benchmarkDOMCreation(n, Math.min(DEFAULT_ITERS, 10));
  });
}

// ─── 5. Memória ──────────────────────────────────────────

if (SECTIONS.includes('memory')) {
  section('5. CONSUMO DE MEMÓRIA');

  const hasGC = typeof global.gc === 'function';
  if (!hasGC) {
    console.log('\n  ⚠️  Execute com --expose-gc para medição precisa de heap:');
    console.log('     node --expose-gc scripts/performance-bench.js --section=memory\n');
  }

  const memSizes = [0, 100, 500, 1000];

  memSizes.forEach(n => {
    forceGC();
    const before = memoryUsage();
    const state = generateLargeState(n, 1);
    const json = JSON.stringify(state);
    forceGC();
    const after = memoryUsage();

    const delta = after.heapUsed - before.heapUsed;

    console.log(`\n  ${n} cards:`);
    console.log(`    Heap usado : ${formatBytes(before.heapUsed)} → ${formatBytes(after.heapUsed)} (Δ ${formatBytes(delta)})`);
    console.log(`    JSON       : ${formatBytes(json.length)}`);
    if (delta > 0 && json.length > 0) {
      const overhead = ((delta - json.length) / json.length * 100).toFixed(0);
      console.log(`    Overhead   : ~${overhead}% (objetos JS vs JSON serializado)`);
    }
  });
}

// ─── 6. Renderização com Soft Delete ─────────────────────

if (SECTIONS.includes('softdelete')) {
  section('6. RENDERIZAÇÃO COM SOFT DELETE (filtro ativo/inativo/todos)');

  function renderCardHTMLInactive(card, date, isInactive) {
    var color = card.color || 'light';
    var inactiveClass = isInactive ? ' card-inactive' : '';
    var canCopy = !isInactive;
    var clickHandler = canCopy ? '' : '';

    var body = (card.showDate !== false ? date + ' - ' : '') + card.content;
    if (isInactive) {
      body += '<div class="info-card-badge bg-secondary bg-opacity-25 text-muted"><i class="fas fa-box-archive me-1"></i> Inativo</div>';
    } else {
      body += '<div class="card-copy-hint">Clique para copiar</div>';
    }

    return '<div class="col-12 col-md-6 col-lg-3 mb-3">' +
      '<div class="card h-100 border-' + color + inactiveClass + '" data-id="' + card.id + '" data-color="' + color + '">' +
      '<div class="card-head"><span class="card-title-header">' + card.title + '</span>' +
      '<div class="actions">' +
      '<i class="fa fa-pen"></i><i class="fa fa-trash"></i>' +
      (isInactive
        ? '<i class="fa fa-rotate-left text-info ms-1"></i>'
        : '<i class="fa fa-box-archive text-warning ms-1"></i>') +
      '</div></div>' + body + '</div></div>';
  }

  function benchmarkSoftDeleteRender(totalCards, inactiveRatio, iterations) {
    var container = GLOBAL_DOC.getElementById('dynamic-cards');
    var state = generateLargeState(totalCards, 1);
    var cards = state.dashboards[0].customs;
    var dash = state.dashboards[0];

    // Marca X% como inativos
    var inactiveCount = Math.floor(totalCards * inactiveRatio);
    dash.inactive = [];
    for (var i = 0; i < inactiveCount; i++) {
      dash.inactive.push(cards[i].id);
    }
    var inactiveSet = {};
    for (var ii = 0; ii < dash.inactive.length; ii++) {
      inactiveSet[dash.inactive[ii]] = true;
    }

    // Modo 'all' (renderiza ativos + inativos)
    return runBench(
      `Renderizar ${totalCards} cards (${Math.round((1 - inactiveRatio) * 100)}% ativos) como "Todos"`,
      function () {
        var html = '';
        var date = '16/06/2026';
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          html += renderCardHTMLInactive(c, date, !!inactiveSet[c.id]);
        }
        container.innerHTML = html;
      }, iterations);
  }

  [50, 100, 200].forEach(function (n) {
    // 30% inativos — filtrar como "Ativos" (70 cards de 100)
    logResult(benchmarkSoftDeleteRender(n, 0.3, DEFAULT_ITERS));
    // 70% inativos — filtrar como "Inativos"
    logResult(benchmarkSoftDeleteRender(n, 0.7, DEFAULT_ITERS));
  });

  // Benchmark de filtro: construir array de ativos filtrando inativos
  function benchmarkFilterActive(totalCards, inactiveRatio, iterations) {
    var state = generateLargeState(totalCards, 1);
    var cards = state.dashboards[0].customs;
    var dash = state.dashboards[0];
    var inactiveCount = Math.floor(totalCards * inactiveRatio);
    dash.inactive = [];
    for (var i = 0; i < inactiveCount; i++) {
      dash.inactive.push(cards[i].id);
    }
    var inactiveSet = {};
    for (var ii = 0; ii < dash.inactive.length; ii++) {
      inactiveSet[dash.inactive[ii]] = true;
    }

    return runBench(
      `Filtrar ativos com Set (${totalCards} cards, ${Math.round(inactiveRatio * 100)}% inativos)`,
      function () {
        var result = [];
        for (var i = 0; i < cards.length; i++) {
          if (!inactiveSet[cards[i].id]) result.push(cards[i]);
        }
        return result.length;
      }, iterations);
  }

  [100, 500, 1000].forEach(function (n) {
    logResult(benchmarkFilterActive(n, 0.5, DEFAULT_ITERS));
  });
}

// ─── Resumo Agregado ──────────────────────────────────────

section('RESUMO AGREGADO');

if (_allResults.length > 0) {
  const nameWidth = Math.max(..._allResults.map(r => r.name.length), 40);

  console.log();
  console.log('  ' + 'Benchmark'.padEnd(nameWidth) + '  ' +
    'avg'.padStart(10) + '  ' +
    'p95'.padStart(10) + '  ' +
    'min'.padStart(10) + '  ' +
    'max'.padStart(10));
  console.log('  ' + '─'.repeat(nameWidth + 44));

  _allResults.forEach(r => {
    console.log('  ' + r.name.padEnd(nameWidth) + '  ' +
      formatMs(r.avg).padStart(10) + '  ' +
      formatMs(r.p95).padStart(10) + '  ' +
      formatMs(r.min).padStart(10) + '  ' +
      formatMs(r.max).padStart(10));
  });

  // Destaques
  console.log(`\n  ${_allResults.length} benchmarks executados`);
}

console.log();

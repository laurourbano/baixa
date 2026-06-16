import { test, expect } from '@playwright/test';

/**
 * Testes de Performance — WorkDash
 *
 * Mede:
 * - Tempo de carregamento inicial (First Paint, DOM Ready)
 * - Tempo de login até dashboard
 * - Tempo de renderização dos cards
 * - Web Vitals (FCP, LCP, TBT, CLS) via PerformanceObserver
 * - Tamanho de recursos carregados
 * - Número de requisições
 */

const BASE_URL = 'http://localhost:8000';

function formatMs(ms) {
  return ms.toFixed(0) + 'ms';
}

function log(label, value, threshold) {
  const icon = threshold && value > threshold ? '⚠️ ' : '  ';
  console.log(`${icon}${label}: ${formatMs(value)}${threshold ? ` (limite: ${formatMs(threshold)})` : ''}`);
}

/** Faz login e espera o dashboard ficar pronto */
async function loginAndWaitDashboard(page) {
  await page.goto(BASE_URL);
  await page.fill('#login-email', 'perf@test.com');
  await page.fill('#login-password', '1234');
  await page.click('button:has-text("Entrar")');
  // Aguarda o dashboard aparecer (não está hidden)
  await page.waitForSelector('#view-dashboard:not(.d-none)', { timeout: 10000 });
  // Aguarda cards ou toolbar aparecerem
  await page.waitForSelector('#dash-toolbar', { timeout: 10000 });
}

test.describe('Performance — WorkDash', () => {

  test('métricas de carregamento da página', async ({ page }) => {
    const start = Date.now();

    await page.goto(BASE_URL, { waitUntil: 'load' });
    const loadTime = Date.now() - start;
    log('Tempo de carregamento (load)', loadTime, 3000);

    // Aguarda renderização completa do login
    await page.waitForSelector('#login-overlay', { state: 'visible' });
    const visibleTime = Date.now() - start;
    log('Tempo até login visível', visibleTime, 3000);
  });

  test('métricas de login até dashboard', async ({ page }) => {
    await page.goto(BASE_URL);
    const loginStart = Date.now();

    await page.fill('#login-email', 'perf@test.com');
    await page.fill('#login-password', '1234');
    await page.click('button:has-text("Entrar")');

    // Aguarda o dashboard
    await page.waitForSelector('#view-dashboard:not(.d-none)', { timeout: 10000 });
    await page.waitForSelector('#dash-toolbar', { timeout: 10000 });

    const loginToDash = Date.now() - loginStart;
    log('Login → Dashboard pronto', loginToDash, 5000);

    const cardCount = await page.locator('#dynamic-cards [data-id]').count();
    console.log(`  Cards renderizados: ${cardCount}`);
  });

  test('Web Vitals — Core Web Vitals', async ({ page }) => {
    test.setTimeout(60000);

    // Faz login primeiro para ter uma página interativa
    await loginAndWaitDashboard(page);

    // Injeta observador de Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {};

        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              results.FCP = entry.startTime;
            }
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });

        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          results.LCP = last ? last.startTime : null;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        let tbt = 0;
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            tbt += entry.duration - 50;
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });

        let cls = 0;
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });

        // Aguarda 2 segundos para coletar métricas
        setTimeout(() => {
          paintObserver.disconnect();
          lcpObserver.disconnect();
          longTaskObserver.disconnect();
          layoutShiftObserver.disconnect();

          const nav = performance.getEntriesByType('navigation')[0];
          if (nav) {
            results.domContentLoaded = nav.domContentLoadedEventEnd;
            results.domComplete = nav.domComplete;
            results.domInteractive = nav.domInteractive;
            results.loadEventEnd = nav.loadEventEnd;
            results.ttfb = nav.responseStart - nav.requestStart;
          }

          results.TBT = tbt;
          results.CLS = cls;
          resolve(results);
        }, 2000);
      });
    });

    console.log('\n  Core Web Vitals:');
    if (vitals.FCP) log('  FCP (First Contentful Paint)', vitals.FCP, 1800);
    else console.log('  FCP: não disponível');

    if (vitals.LCP) log('  LCP (Largest Contentful Paint)', vitals.LCP, 2500);
    else console.log('  LCP: não disponível');

    if (vitals.TBT !== undefined) log('  TBT (Total Blocking Time)', vitals.TBT, 200);
    if (vitals.CLS !== undefined) console.log(`  CLS (Cumulative Layout Shift): ${vitals.CLS.toFixed(4)}${vitals.CLS > 0.1 ? ' ⚠️ (limite: 0.1)' : ''}`);

    console.log('\n  Navigation Timing:');
    if (vitals.ttfb !== undefined) log('  TTFB (Time to First Byte)', vitals.ttfb, 800);
    if (vitals.domInteractive) log('  DOM Interactive', vitals.domInteractive, 2000);
    if (vitals.domContentLoaded) log('  DOM Content Loaded', vitals.domContentLoaded, 2000);
    if (vitals.loadEventEnd) log('  Load Event End', vitals.loadEventEnd, 3000);

    expect(vitals.FCP || 0).toBeLessThan(5000);
    expect(vitals.LCP || 0).toBeLessThan(8000);
  });

  test('tamanho de recursos e requisições', async ({ page }) => {
    const resources = [];

    page.on('response', async (response) => {
      try {
        const url = response.url();
        const status = response.status();
        const body = await response.body().catch(() => null);
        const size = body ? body.length : 0;
        resources.push({ url, status, size, type: response.request().resourceType() });
      } catch (_) { /* ignora */ }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const byType = {};
    resources.forEach(r => {
      const t = r.type || 'other';
      byType[t] = (byType[t] || 0) + r.size;
    });

    console.log(`\n  Total de requisições: ${resources.length}`);
    console.log(`  Tamanho total: ${(totalSize / 1024).toFixed(1)} KB`);

    console.log('\n  Por tipo:');
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, size]) => {
      console.log(`    ${type}: ${(size / 1024).toFixed(1)} KB`);
    });

    // Bootstrap + Font Awesome + app: ~1.8MB típico
    expect(resources.length).toBeLessThan(35);
    expect(totalSize).toBeLessThan(2.5 * 1024 * 1024); // < 2.5MB
  });

  test('performance de renderização com muitos cards', async ({ page }) => {
    await loginAndWaitDashboard(page);

    // Injeta muitos cards no estado via evaluate
    const renderStart = Date.now();

    await page.evaluate(() => {
      const app = window.MainApp;
      const dash = app.getActiveDash();

      for (let i = 0; i < 100; i++) {
        const id = 'perf-card-' + i;
        dash.customs.push({
          id,
          title: 'Card de Performance ' + i,
          content: 'Conteúdo do card de performance número ' + i + '. '.repeat(10),
          color: ['light', 'dark', 'info', 'success', 'warning'][i % 5],
          type: 'copy',
          showDate: i % 3 === 0,
          local: 'Curitiba - PR',
          sit: i % 2 === 0 ? 'Regular' : 'Pendente'
        });
        dash.order.push(id);
      }

      app.render();
    });

    // Aguarda cards aparecerem
    await page.waitForSelector('#dynamic-cards [data-id]', { timeout: 10000 });

    const renderTime = Date.now() - renderStart;
    log('Renderizar 100 cards', renderTime, 1000);

    const cardCount = await page.locator('#dynamic-cards [data-id]').count();
    console.log(`  Cards no DOM: ${cardCount}`);
    expect(cardCount).toBeGreaterThanOrEqual(100);
  });

  test('performance de localStorage com dados grandes', async ({ page }) => {
    await loginAndWaitDashboard(page);

    const lsStart = Date.now();

    const result = await page.evaluate(() => {
      const app = window.MainApp;
      const dash = app.getActiveDash();

      for (let i = 0; i < 500; i++) {
        const id = 'ls-card-' + i;
        dash.customs.push({
          id,
          title: 'Card ' + i,
          content: 'Conteúdo '.repeat(20),
          color: 'light',
          type: 'copy',
          showDate: false
        });
        dash.order.push(id);
      }

      const saveStart = performance.now();
      app._save();
      const saveTime = performance.now() - saveStart;

      const loadStart = performance.now();
      const loaded = app._load();
      const loadTime = performance.now() - loadStart;

      const raw = localStorage.getItem('baixa_rt_data');
      const size = raw ? raw.length : 0;

      return { saveTime, loadTime, loaded, size, cardCount: dash.customs.length };
    });

    const lsTime = Date.now() - lsStart;

    log('localStorage save (500 cards)', result.saveTime, 100);
    log('localStorage load (500 cards)', result.loadTime, 100);
    console.log(`  Tamanho JSON: ${(result.size / 1024).toFixed(1)} KB`);
    console.log(`  Cards no estado: ${result.cardCount}`);
    console.log(`  Load ok: ${result.loaded}`);

    expect(result.saveTime).toBeLessThan(200);
    expect(result.loadTime).toBeLessThan(200);
  });
});

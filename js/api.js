/**
 * api.js — Comunicação com o backend
 *
 * @module api
 * @description
 * Gerencia toda a comunicação HTTP com o backend (Render).
 *
 * Funcionalidades:
 * - callApi: requisição fetch com timeout via AbortController
 * - callApiWithRetry: chamada com retry e backoff exponencial (para cold-start do Render)
 * - notifyChange: autosave — detecta mudanças e envia POST /api/save + POST /api/backup
 * - Atualização do indicador de status (🟢 API / 🟡 localStorage / 🔴 erro)
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  async function callApi(path, options, timeoutMs) {
    const base = window.BAIXA_API_URL ? window.BAIXA_API_URL.replace(/\/$/, '') : '';
    const url = base ? (base + path) : path;
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 5000);
    try {
      const res = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * callApiWithRetry — chamada com retry e backoff exponencial.
   * Útil para backends com cold start (ex: Render free tier).
   * @param {string} path - caminho da API (ex: '/api/data')
   * @param {object} [options] - opções do fetch
   * @param {object} [retryOpts]
   * @param {number} [retryOpts.maxRetries=3] - número máximo de tentativas
   * @param {number} [retryOpts.baseTimeout=30000] - timeout por tentativa (ms)
   * @param {number} [retryOpts.delayMs=2000] - delay inicial entre tentativas (ms)
   * @param {function} [retryOpts.onRetry] - callback(attempt, maxRetries, delay)
   */
  async function callApiWithRetry(path, options, retryOpts) {
    var opts = retryOpts || {};
    var maxRetries = opts.maxRetries || 3;
    var baseTimeout = opts.baseTimeout || 30000;
    var delayMs = opts.delayMs || 2000;
    var onRetry = opts.onRetry || null;

    var lastError = null;

    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        var res = await callApi(path, options, baseTimeout);
        return res;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          var delay = delayMs * Math.pow(2, attempt); // backoff exponencial
          if (onRetry) onRetry(attempt + 1, maxRetries, delay);
          await new Promise(function (r) { setTimeout(r, delay); });
        }
      }
    }

    throw lastError;
  }

  function notifyChange() {
    // Garante que localStorage esteja atualizado antes de enviar ao backend
    app._save();

    var status = document.getElementById('gh-status');
    if (status) {
      status.classList.remove('d-none');
      status.className = 'badge bg-transparent border border-warning x-small text-warning';
      status.innerHTML = '<span class="text-warning"><i class="fas fa-sync-alt fa-spin me-1"></i>Salvando...</span>';
      status.title = 'Enviando alterações para o backend...';
    }

    var payload = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app.__state)
    };

    // Usa retry (até 2 tentativas) para garantir que o save chegue ao backend
    callApiWithRetry('/api/save', payload, {
      maxRetries: 2,
      baseTimeout: 15000,
      delayMs: 1000
    }).then(function (r) {
      return r.json().catch(function () { return null; });
    }).then(function (j) {
      if (j && status) {
        status.className = 'badge bg-transparent border border-success x-small text-success';
        status.innerHTML = '<i class="fas fa-check-circle me-1"></i>Salvo (API)';
        status.title = 'Salvo no backend: ' + (j.backup || j.saved || 'ok') + ' → banco SQLite';
      }
      return callApi('/api/backup', payload);
    }).then(function (b) {
      return b.json().catch(function () { return null; });
    }).then(function (bj) {
      if (bj && status) {
        status.className = 'badge bg-transparent border border-info x-small text-info';
        status.innerHTML = '<i class="fas fa-archive me-1"></i>Backup (API)';
        status.title = 'Backup criado no backend: ' + (bj.backup || bj.dataFile || 'ok');
      } else if (status) {
        status.className = 'badge bg-transparent border border-warning x-small text-warning';
        status.innerHTML = '<i class="fas fa-check-circle me-1"></i>Salvo (sem backup)';
        status.title = 'Salvo no backend, mas backup falhou';
      }
    }).catch(function () {
      if (status) {
        status.className = 'badge bg-transparent border border-danger x-small text-danger';
        status.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Erro ao salvar';
        status.title = 'Falha ao salvar no backend. Os dados estão seguros no navegador.';
      }
      app._updateStatusIndicator('save-error');
    });
  }

  app.callApi = callApi;
  app.callApiWithRetry = callApiWithRetry;
  app.notifyChange = notifyChange;
}(window.MainApp));

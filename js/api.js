/**
 * api.js — Comunicação com o backend (Netlify Function)
 *
 * GET  /api → carrega dados do servidor
 * POST /api → salva dados no servidor
 *
 * Fallback: se offline, localStorage mantém tudo seguro.
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  function callApi(path, options, timeoutMs) {
    var url = (window.BAIXA_API_URL || '/api') + (path || '');
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs || 10000);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res;
      })
      .catch(function (err) {
        clearTimeout(timer);
        throw err;
      });
  }

  /** Busca dados do backend. Retorna null se indisponível. */
  function fetchData() {
    return callApi('', {}, 10000)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        return (data && data.dashboards && data.dashboards.length) ? data : null;
      })
      .catch(function () { return null; });
  }

  /** Envia estado para o backend. Retorna true se ok. */
  function pushData() {
    var state = app.__state;
    if (!state || !state.dashboards) return Promise.resolve(false);
    return callApi('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }, 8000)
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  /** Chamado a cada alteração — salva local e tenta enviar. */
  function notifyChange() {
    app._save();

    var status = document.getElementById('gh-status');
    if (!status) return;

    status.classList.remove('d-none');
    status.className = 'badge bg-transparent border border-warning x-small text-warning';
    status.innerHTML = '<i class="fas fa-sync-alt fa-spin me-1"></i>Salvando...';
    status.title = 'Enviando para o servidor...';

    pushData().then(function (ok) {
      if (ok) {
        status.className = 'badge bg-transparent border border-success x-small text-success';
        status.innerHTML = '<i class="fas fa-cloud-check me-1"></i>Salvo';
        status.title = 'Dados salvos no servidor e no navegador';
      } else {
        status.className = 'badge bg-transparent border border-warning x-small text-warning';
        status.innerHTML = '<i class="fas fa-hdd me-1"></i>Salvo (offline)';
        status.title = 'Servidor indisponível. Dados salvos apenas no navegador.';
      }
    });
  }

  app.fetchData = fetchData;
  app.pushData = pushData;
  app.notifyChange = notifyChange;

}(window.MainApp));

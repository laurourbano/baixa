/**
 * api.js — Comunicação com o backend
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

  function notifyChange() {
    var status = document.getElementById('gh-status');
    if (status) {
      status.classList.remove('d-none');
      status.className = 'badge bg-transparent border border-warning x-small text-warning';
      status.innerHTML = '<span class="text-warning"><i class="fas fa-sync-alt fa-spin me-1"></i>Salvando...</span>';
      status.title = 'Enviando alterações para o backend...';
    }
    app.showToast('Alteração detectada! Salvando no backend...', 'warning', 4000);

    var payload = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app.__state)
    };

    callApi('/api/save', payload).then(function (r) {
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
        app.showToast('Backup salvo no backend com sucesso!', 'success', 2500);
      } else if (status) {
        status.className = 'badge bg-transparent border border-warning x-small text-warning';
        status.innerHTML = '<i class="fas fa-check-circle me-1"></i>Salvo (sem backup)';
        status.title = 'Salvo no backend, mas backup falhou';
      }
    }).catch(function () {
      if (status) {
        app._updateStatusIndicator('save-error');
      }
    });
  }

  app.callApi = callApi;
  app.notifyChange = notifyChange;
}(window.MainApp));

/**
 * ui-helpers.js — Toast, Confirm Dialog, Loading Overlay, Status Indicator
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  /* ── Toast ──────────────────────────────── */
  function showToast(message, type, duration) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    type = type || 'success';
    duration = duration || 3000;

    var existing = Array.from(container.querySelectorAll('.toast-message'));
    if (existing.some(function (m) { return m.textContent === message; })) return;

    var toast = document.createElement('div');
    toast.className = 'custom-toast toast-' + type;

    var icons = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };

    toast.innerHTML =
      '<i class="fas ' + icons[type] + ' toast-icon"></i>' +
      '<span class="toast-message small">' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px) scale(0.9)';
      toast.style.transition = '0.3s ease-out';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }

  /* ── Loading Overlay ───────────────────── */
  var _loadingShownAt = 0;

  function showLoading(message) {
    var overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    var txt = overlay.querySelector('.loading-text');
    if (txt) txt.textContent = message || 'Carregando...';
    overlay.classList.remove('d-none');
    _loadingShownAt = Date.now();
  }

  function hideLoading(loaded) {
    var overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    var elapsed = Date.now() - (_loadingShownAt || 0);
    var wait = Math.max(0, 600 - elapsed);
    setTimeout(function () {
      overlay.classList.add('d-none');
      if (loaded) showToast('Dados carregados com sucesso.', 'success', 1800);
    }, wait);
  }

  /* ── Confirm Dialog ────────────────────── */
  function showConfirm(title, message, type) {
    return new Promise(function (resolve) {
      var modalEl = document.getElementById('confirmModal');
      var modal = new bootstrap.Modal(modalEl);

      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;

      var iconEl = document.getElementById('confirm-icon');
      var icons = {
        warning: '<i class="fas fa-question-circle fa-3x text-warning"></i>',
        danger: '<i class="fas fa-exclamation-triangle fa-3x text-danger"></i>',
        info: '<i class="fas fa-info-circle fa-3x text-info"></i>'
      };
      iconEl.innerHTML = icons[type] || icons.warning;

      var yesBtn = document.getElementById('confirm-btn-yes');
      var newYesBtn = yesBtn.cloneNode(true);
      yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

      newYesBtn.onclick = function () {
        modal.hide();
        resolve(true);
      };

      modalEl.addEventListener('hidden.bs.modal', function () {
        resolve(false);
      }, { once: true });

      modal.show();
    });
  }

  /* ── Status Indicator ──────────────────── */
  function updateStatusIndicator(source) {
    var status = document.getElementById('gh-status');
    if (!status) return;
    status.classList.remove('d-none');

    var apiUrl = window.BAIXA_API_URL || window.location.origin;

    if (source === 'api') {
      status.className = 'badge bg-transparent border border-success x-small text-success';
      status.innerHTML = '<i class="fas fa-cloud me-1"></i>Dados via API';
      status.title = 'Carregado do backend (' + apiUrl + ') → banco SQLite';
    } else if (source === 'saved') {
      status.className = 'badge bg-transparent border border-success x-small text-success';
      status.innerHTML = '<i class="fas fa-check-circle me-1"></i>Salvo (API)';
      status.title = 'Dados salvos no backend (' + apiUrl + ') → banco SQLite';
    } else if (source === 'backup') {
      status.className = 'badge bg-transparent border border-info x-small text-info';
      status.innerHTML = '<i class="fas fa-archive me-1"></i>Backup (API)';
      status.title = 'Backup criado no backend (' + apiUrl + ')';
    } else if (source === 'save-error') {
      status.className = 'badge bg-transparent border border-danger x-small text-danger';
      status.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Dados via localStorage';
      status.title = 'Falha ao salvar no backend (' + apiUrl + '). Dados salvos apenas no navegador (localStorage).';
    } else {
      status.className = 'badge bg-transparent border border-warning x-small text-warning';
      status.innerHTML = '<i class="fas fa-hdd me-1"></i>Dados via localStorage';
      status.title = 'Carregado do armazenamento local do navegador (localStorage) — backend indisponível';
    }
  }

  app.showToast = showToast;
  app.showLoading = showLoading;
  app.hideLoading = hideLoading;
  app.showConfirm = showConfirm;
  app._updateStatusIndicator = updateStatusIndicator;
}(window.MainApp));

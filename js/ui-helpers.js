/**
 * ui-helpers.js — Componentes reutilizáveis de UI
 *
 * Componentes:
 * - showToast(message, type, duration): notificação temporária
 * - showLoading(message) / hideLoading(loaded): overlay de carregamento
 * - showConfirm(title, message, type): diálogo de confirmação (Promise)
 * - _updateStatusIndicator(source): badge no header
 *
 * @namespace MainApp
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
      if (loaded) showToast('Dados carregados.', 'success', 1800);
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

    if (source === 'api') {
      status.className = 'badge bg-transparent border border-success x-small text-success';
      status.innerHTML = '<i class="fas fa-cloud me-1"></i>Servidor';
      status.title = 'Dados carregados do servidor (Netlify Functions)';
    } else if (source === 'localStorage') {
      status.className = 'badge bg-transparent border border-warning x-small text-warning';
      status.innerHTML = '<i class="fas fa-hdd me-1"></i>Dados locais';
      status.title = 'Servidor indisponível — dados do navegador';
    } else {
      status.className = 'badge bg-transparent border border-secondary x-small text-secondary';
      status.innerHTML = '<i class="fas fa-hdd me-1"></i>Padrão';
      status.title = 'Nenhum dado encontrado — estado inicial';
    }
  }

  app.showToast = showToast;
  app.showLoading = showLoading;
  app.hideLoading = hideLoading;
  app.showConfirm = showConfirm;
  app._updateStatusIndicator = updateStatusIndicator;

}(window.MainApp));

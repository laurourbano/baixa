/**
 * app.js — Coordenador da aplicação. Inicializa todos os módulos.
 */
(function () {
  'use strict';

  var app = window.MainApp;

  /* ── Init ──────────────────────────────── */
  async function init() {
    // Inicializa modais Bootstrap
    window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
    window.locModal = new bootstrap.Modal(document.getElementById('locationModal'));

    // Verifica autenticação
    var isAuth = localStorage.getItem('baixa_rt_auth') === 'true';
    if (isAuth) {
      var email = localStorage.getItem('baixa_rt_user_email') || 'usuario@portal.com';
      document.getElementById('user-display-email').textContent = email;
      document.getElementById('modal-email').textContent = email;

      var initials = email.split('@')[0].substring(0, 2).toUpperCase();
      document.getElementById('user-avatar').textContent = initials;
      document.getElementById('modal-avatar').textContent = initials;

      document.getElementById('login-overlay').classList.add('hidden');
    } else {
      var emailInput = document.getElementById('login-email');
      var passInput = document.getElementById('login-password');

      [emailInput, passInput].forEach(function (el) {
        el.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') app.checkLogin();
        });
      });

      emailInput.focus();
    }

    // Carrega dados do backend
    app.showLoading('Carregando dados...');
    var loadedOk = false;
    var dataSource = 'localStorage';

    try {
      var res = await app.callApi('/api/data');
      var backend = await res.json().catch(function () { return null; });
      if (backend) {
        var hasData = (backend.order && backend.order.length > 0) || (backend.customs && backend.customs.length > 0);
        if (hasData) {
          app.__state.order = backend.order || [];
          app.__state.customs = backend.customs || [];
          app.__state.edits = backend.edits || {};
          app.__state.deleted = backend.deleted || [];
          app._save();
          loadedOk = true;
          dataSource = 'api';
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados do backend:', e);
      app.showToast('Falha ao carregar dados do backend. Usando dados locais.', 'warning', 4000);
    }

    app.hideLoading(loadedOk);
    app._updateStatusIndicator(dataSource);

    app.render();
    app.setupDragAndDrop();
    app.initFiscalSearch();
    app.initCalculator();
    initPlanoInspection();
    app.initWeather();

    // Enter no modal de localização
    var weatherFilter = document.getElementById('weather-city-filter');
    if (weatherFilter) {
      weatherFilter.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          var select = document.getElementById('weather-city-select');
          if (select.value) app.saveLocationManual(select.value);
        }
      });
    }

    // Focus automático nos modais
    document.getElementById('cardModal').addEventListener('shown.bs.modal', function () {
      document.getElementById('m-title').focus();
    });

    document.getElementById('settingsModal').addEventListener('shown.bs.modal', function () {
      document.getElementById('old-password').focus();
    });

    document.getElementById('locationModal').addEventListener('shown.bs.modal', function () {
      var filter = document.getElementById('weather-city-filter');
      if (filter) filter.focus();
    });

    // Expor saveCard globalmente (usado em onclick no HTML)
    window.saveCard = app.saveCard;

    // Restaurar tokens salvos
    var savedToken = localStorage.getItem('gh_token');
    var ghTokenEl = document.getElementById('gh-token');
    if (savedToken && ghTokenEl) ghTokenEl.value = savedToken;

    var savedRepo = localStorage.getItem('gh_repo');
    var ghRepoEl = document.getElementById('gh-repo');
    if (savedRepo && ghRepoEl) ghRepoEl.value = savedRepo;

    app._save();
  }

  /* ── Plano Inspeção ───────────────────── */
  async function initPlanoInspection() {
    var btnPlano = document.getElementById('btnPlanoInspection');
    if (!btnPlano) return;
    try {
      var proxyUrl = 'https://api.allorigins.win/get?url=';
      var target = encodeURIComponent('https://crf-pr.org.br/documento/index?DocumentoSearch%5Bid_documento_categoria%5D=19');
      var response = await fetch(proxyUrl + target);
      var data = await response.json();
      var match = data.contents.match(/href="(\/documento\/view\/\d+\/[pP]lano-[^"]*)"/);
      if (match && match[1]) btnPlano.href = 'https://crf-pr.org.br' + match[1];
    } catch (e) { /* ignora silenciosamente */ }
  }

  /* ── Bootstrap ────────────────────────── */
  app.init = init;
  document.addEventListener('DOMContentLoaded', init);
}());

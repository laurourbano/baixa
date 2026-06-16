/**
 * app.js — Coordenador da aplicação. Inicializa todos os módulos.
 */
(function () {
  'use strict';

  var app = window.MainApp;

  /* ── Init ──────────────────────────────── */
  async function init() {
    window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
    window.locModal = new bootstrap.Modal(document.getElementById('locationModal'));

    var isAuth = localStorage.getItem('baixa_rt_auth') === 'true';
    if (isAuth) {
      var email = localStorage.getItem('baixa_rt_user_email') || 'usuario@portal.com';
      document.getElementById('user-display-email').textContent = email;
      document.getElementById('modal-email').textContent = email;

      var initials = email.split('@')[0].substring(0, 2).toUpperCase();
      document.getElementById('user-avatar').textContent = initials;
      document.getElementById('modal-avatar').textContent = initials;

      document.getElementById('login-overlay').classList.add('hidden');
      await loadAndInit();
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
  }

  /* ── Carregar dados e inicializar app ─── */
  async function loadAndInit() {
    app.showLoading('Carregando dados...');

    var loaded = false;
    var dataSource = 'localStorage';

    // 1. Tenta carregar do backend (Netlify Function, sempre online)
    try {
      var backend = await app.fetchData();
      if (backend && backend.dashboards) {
        app.__state.dashboards = backend.dashboards;
        app.__state.activeDashboard = backend.activeDashboard || 'default';
        app.__state.dashSortMode = backend.dashSortMode || 'custom';
        app.__state.servicos = backend.servicos || {};
        app.__state._lastModified = backend._lastModified || Date.now();
        app.ensureDefaultDashboards();
        app._save();
        loaded = true;
        dataSource = 'api';
      }
    } catch (_) { /* offline — fallback abaixo */ }

    // 2. Fallback: localStorage
    if (!loaded) {
      loaded = app._load();
      dataSource = loaded ? 'localStorage' : 'default';
    }

    // 3. Se carregou do localStorage, tenta enviar para o backend
    if (dataSource === 'localStorage') {
      app.pushData().then(function (ok) {
        if (ok) dataSource = 'api';
        app._updateStatusIndicator(dataSource);
      });
    }

    app.hideLoading(loaded);
    app._updateStatusIndicator(dataSource);

    app.initDashboards();
    app.render();
    app.setupDragAndDrop();
    app.updatePageTitle();

    importarRespostasIngressoPJ();

    app.initFiscalSearch();
    app.initCalculator();
    app.initConsultas();
    initPlanoInspection();
    app.initWeather();

    var weatherFilter = document.getElementById('weather-city-filter');
    if (weatherFilter) {
      weatherFilter.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          var select = document.getElementById('weather-city-select');
          if (select.value) app.saveLocationManual(select.value);
        }
      });
    }

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

    window.saveCard = app.saveCard;

    var savedToken = localStorage.getItem('gh_token');
    var ghTokenEl = document.getElementById('gh-token');
    if (savedToken && ghTokenEl) ghTokenEl.value = savedToken;

    var savedRepo = localStorage.getItem('gh_repo');
    var ghRepoEl = document.getElementById('gh-repo');
    if (savedRepo && ghRepoEl) ghRepoEl.value = savedRepo;

    var importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          app.importFromFile(this.files[0]);
          this.value = '';
        }
      });
    }

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

  /* ── Importar respostas no Ingresso PJ ── */
  function formatarTitulo(str) {
    return str.split(' ').map(function (word) {
      var upper = word.toUpperCase();
      if (word === upper && word.length <= 3) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function importarRespostasIngressoPJ() {
    var dash = (app.__state && app.__state.dashboards || []).find(function (d) { return d.id === 'dash-ingresso-pj'; });
    if (!dash) return;
    if (dash.customs && dash.customs.some(function (c) { return c.id && c.id.indexOf('rp-') === 0; })) return;

    fetch('assets/consultas/respostas-padrao.json')
      .then(function (r) { return r.json(); })
      .then(function (respostas) {
        if (!respostas || !Object.keys(respostas).length) return;
        if (!dash.customs) dash.customs = [];
        if (!dash.order) dash.order = [];
        var imported = 0;
        Object.keys(respostas).sort().forEach(function (k) {
          var id = 'rp-' + k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (dash.customs.some(function (c) { return c.id === id; })) return;
          dash.customs.push({
            id: id, title: formatarTitulo(k), content: respostas[k],
            color: 'info', type: 'copy', showDate: true
          });
          dash.order.push(id);
          imported++;
        });
        if (imported > 0) {
          app._save();
          app.notifyChange();
          app.render();
          app.showToast(imported + ' respostas importadas para Ingresso PJ!', 'success', 3000);
        }
      }).catch(function () {});
  }

  /* ── Bootstrap ────────────────────────── */
  app.init = init;
  app.loadAndInit = loadAndInit;
  document.addEventListener('DOMContentLoaded', init);
}());

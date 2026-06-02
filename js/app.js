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

    // Carrega dados do backend (com retry para cold start do Render)
    app.showLoading('Conectando ao servidor...');
    var loadedOk = false;
    var dataSource = 'localStorage';

    try {
      // Ping de aquecimento — acorda o backend (Render cold start)
      try {
        await app.callApi('/api/health', {}, 10000);
      } catch (_) {
        // Ignora falha no ping, tenta /api/data mesmo assim
      }

      app.showLoading('Carregando dados...');
      var res = await app.callApiWithRetry('/api/data', {}, {
        maxRetries: 3,
        baseTimeout: 30000,
        delayMs: 2000,
        onRetry: function (attempt, maxRetries) {
          app.showLoading('Aguardando servidor... (tentativa ' + attempt + '/' + maxRetries + ')');
        }
      });
      var backend = await res.json().catch(function () { return null; });
      if (backend) {
        var hasData = false;
        // Detecta formato: multi-dashboard vs flat antigo
        if (backend.dashboards && backend.dashboards.length > 0) {
          // Preserva nomes/ícones locais se já existirem
          var localState = JSON.parse(localStorage.getItem('baixa_rt_data')) || {};
          var localDashboards = localState.dashboards || [];

          // Merge: backend é a base, mas dados locais (mais recentes) prevalecem
          backend.dashboards.forEach(function (bd) {
            var local = localDashboards.find(function (ld) { return ld.id === bd.id; });
            if (local) {
              bd.name = local.name;
              bd.icon = local.icon || bd.icon;
              // Preserva cards e ordenação locais (mais recentes)
              bd.customs = local.customs || [];
              bd.order = local.order || [];
              bd.edits = local.edits || {};
              bd.deleted = local.deleted || [];
            }
          });

          // Preserva dashboards locais que não existem no backend (ex: save falhou)
          localDashboards.forEach(function (ld) {
            var existsInBackend = backend.dashboards.some(function (bd) { return bd.id === ld.id; });
            if (!existsInBackend) {
              backend.dashboards.push(ld);
            }
          });

          app.__state.dashboards = backend.dashboards;
          app.__state.activeDashboard = backend.activeDashboard || backend.dashboards[0].id;
          app.__state.dashSortMode = backend.dashSortMode || 'custom';
          app.__state.servicos = backend.servicos || {};
          app.ensureDefaultDashboards();
          hasData = true;
        } else if (backend.order && backend.order.length > 0 || backend.customs && backend.customs.length > 0) {
          // Formato antigo (flat) — migrar
          app.__state.dashboards = [{
            id: 'default',
            name: 'Dashboard de Pareceres',
            order: backend.order || [],
            customs: backend.customs || [],
            edits: backend.edits || {},
            deleted: backend.deleted || []
          }];
          app.__state.activeDashboard = 'default';
          app.__state.servicos = backend.servicos || {};
          app.ensureDefaultDashboards();
          hasData = true;
        }
        if (hasData) {
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

    // Inicializa dashboards e renderiza sidebar
    app.initDashboards();
    app.render();
    app.setupDragAndDrop();
    app.updatePageTitle();

    // Importa respostas padrão como cards no Ingresso PJ (se vazio)
    importarRespostasIngressoPJ();

    app.initFiscalSearch();
    app.initCalculator();
    app.initConsultas();
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

  /* ── Importar respostas no Ingresso PJ ── */
  function formatarTitulo(str) {
    // Converte MAIÚSCULAS para Primeira letra maiúscula, preservando siglas (palavras com até 3 letras totalmente maiúsculas)
    return str.split(' ').map(function (word) {
      var upper = word.toUpperCase();
      // Preserva siglas: palavras curtas (até 3 chars) que já estão em maiúsculas
      if (word === upper && word.length <= 3) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function importarRespostasIngressoPJ() {
    var dash = (app.__state && app.__state.dashboards || []).find(function (d) { return d.id === 'dash-ingresso-pj'; });
    if (!dash) return;
    // Verifica se já tem cards de resposta (prefixo rp-)
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
  document.addEventListener('DOMContentLoaded', init);
}());

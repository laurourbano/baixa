/**
 * store.js — Gerenciamento de estado centralizado (multi-dashboard)
 *
 * @module store
 * @description
 * Gerencia o estado global da aplicação com suporte a múltiplos dashboards.
 *
 * Estrutura de estado:
 *   {
 *     dashboards: Array<Dashboard>,  // Lista de dashboards
 *     activeDashboard: string,       // ID do dashboard ativo
 *     dashSortMode: 'custom'|'alpha', // Modo de ordenação da sidebar
 *     servicos: Object               // Modelos de parecer por tipo
 *   }
 *
 * Cada Dashboard contém: id, name, icon, order[], customs[], edits{}, deleted[]
 *
 * Funcionalidades:
 * - 6 dashboards padrão pré-criados (Pareceres, Ingresso PJ, Inscrição PF,
 *   Contratos, Conferência PF, Conferência PJ)
 * - Migração automática do formato antigo (dashboard único) para multi-dashboard
 * - CRUD de dashboards com persistência em localStorage (chave: baixa_rt_data)
 * - Recriação de dashboards padrão se removidos acidentalmente
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var STORAGE_KEY = 'baixa_rt_data';

  /* ── Dashboards padrão pré-criados ────── */
  var DEFAULT_DASHBOARDS = [
    { id: 'default',          name: 'Dashboard de Pareceres', icon: 'fa-file-alt' },
    { id: 'dash-ingresso-pj', name: 'Ingresso PJ',            icon: 'fa-door-open' },
    { id: 'dash-inscricao-pf',name: 'Inscrição PF',           icon: 'fa-id-card' },
    { id: 'dash-contratos',   name: 'Controle de Contratos',  icon: 'fa-file-contract' },
    { id: 'dash-conf-pf',     name: 'Conferência PF',         icon: 'fa-clipboard-check' },
    { id: 'dash-conf-pj',     name: 'Conferência PJ',         icon: 'fa-file-circle-check' }
  ];

  function createDashFromTemplate(tmpl) {
    return {
      id: tmpl.id,
      name: tmpl.name,
      icon: tmpl.icon || 'fa-file-alt',
      order: [],
      customs: [],
      edits: {},
      deleted: []
    };
  }

  function ensureDefaultDashboards(dashboards) {
    DEFAULT_DASHBOARDS.forEach(function (tmpl) {
      var exists = dashboards.some(function (d) { return d.id === tmpl.id; });
      if (!exists) {
        var newDash = createDashFromTemplate(tmpl);
        dashboards.push(newDash);
        // Se for Ingresso PJ e estiver vazio, importa respostas padrão
        if (tmpl.id === 'dash-ingresso-pj') {
          importarRespostasParaDashboard(newDash);
        }
      } else {
        // Garante ícone nos dashboards existentes que não têm
        var existing = dashboards.find(function (d) { return d.id === tmpl.id; });
        if (existing && !existing.icon) {
          existing.icon = tmpl.icon;
        }
        // Importa respostas se Ingresso PJ estiver vazio
        if (tmpl.id === 'dash-ingresso-pj' && existing && (!existing.customs || existing.customs.length === 0)) {
          importarRespostasParaDashboard(existing);
        }
      }
    });
  }

  function importarRespostasParaDashboard(dash) {
    try {
      var respostas = JSON.parse(localStorage.getItem('baixa_rt_data') || '{}').respostasPadrao || {};
      if (typeof window._store !== 'undefined' && window._store.respostasPadrao) {
        respostas = window._store.respostasPadrao;
      }
      var keys = Object.keys(respostas);
      if (!keys.length) return;
      // Já tem cards? Não importa de novo
      if (dash.customs && dash.customs.length > 0) return;
      if (!dash.customs) dash.customs = [];
      if (!dash.order) dash.order = [];
      keys.sort().forEach(function (k) {
        var id = 'rp-' + k.toLowerCase().replace(/[^a-z0-9]/g, '-');
        var card = {
          id: id,
          title: k,
          content: respostas[k],
          color: 'info',
          type: 'copy',
          showDate: true
        };
        dash.customs.push(card);
        dash.order.push(id);
      });
    } catch(e) {}
  }

  /* ── Carregar / Migrar ────────────────── */
  var raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  var state;

  if (raw && raw.dashboards) {
    ensureDefaultDashboards(raw.dashboards);
    if (!raw.dashSortMode) raw.dashSortMode = 'custom';
    state = raw;
  } else if (raw && (raw.order || raw.customs)) {
    var migratedDash = {
      id: 'default',
      name: 'Dashboard de Pareceres',
      icon: 'fa-file-alt',
      order: raw.order || [],
      customs: raw.customs || [],
      edits: raw.edits || {},
      deleted: raw.deleted || []
    };
    state = {
      dashboards: [migratedDash],
      activeDashboard: 'default',
      dashSortMode: 'custom',
      servicos: raw.servicos || {}
    };
    ensureDefaultDashboards(state.dashboards);
  } else {
    state = {
      dashboards: DEFAULT_DASHBOARDS.map(createDashFromTemplate),
      activeDashboard: 'default',
      dashSortMode: 'custom',
      servicos: {}
    };
  }

  /* ── Helpers ──────────────────────────── */
  function getActiveDash() {
    var activeId = state.activeDashboard || 'default';
    var dash = state.dashboards.find(function (d) { return d.id === activeId; });
    if (!dash) {
      dash = state.dashboards[0];
      state.activeDashboard = dash.id;
    }
    return dash;
  }

  function setActiveDashboard(id) {
    state.activeDashboard = id;
    save();
  }

  function addDashboard(name, icon) {
    var id = 'dash-' + Date.now();
    state.dashboards.push({
      id: id,
      name: name,
      icon: icon || 'fa-file-alt',
      order: [],
      customs: [],
      edits: {},
      deleted: []
    });
    save();
    return id;
  }

  function renameDashboard(id, newName, newIcon) {
    var dash = state.dashboards.find(function (d) { return d.id === id; });
    if (dash) {
      dash.name = newName;
      if (newIcon) dash.icon = newIcon;
      save();
    }
  }

  function removeDashboard(id) {
    if (state.dashboards.length <= 1) return false;
    var idx = state.dashboards.findIndex(function (d) { return d.id === id; });
    if (idx === -1) return false;
    state.dashboards.splice(idx, 1);
    if (state.activeDashboard === id) {
      state.activeDashboard = state.dashboards[0].id;
    }
    save();
    return true;
  }

  function reorderDashboards(fromIdx, toIdx) {
    if (state.dashSortMode !== 'custom') return;
    var item = state.dashboards.splice(fromIdx, 1)[0];
    state.dashboards.splice(toIdx, 0, item);
    save();
  }

  function setDashSortMode(mode) {
    state.dashSortMode = mode;
    if (mode === 'alpha') {
      state.dashboards.sort(function (a, b) {
        return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      });
    }
    save();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    state.dashboards = DEFAULT_DASHBOARDS.map(createDashFromTemplate);
    state.activeDashboard = 'default';
    state.servicos = {};
    save();
  }

  /* ── Expor API ────────────────────────── */
  Object.defineProperty(app, '__state', { get: function () { return state; } });

  app._save = save;
  app.__resetState = resetState;
  app.getActiveDash = getActiveDash;
  app.setActiveDashboard = setActiveDashboard;
  app.addDashboard = addDashboard;
  app.renameDashboard = renameDashboard;
  app.removeDashboard = removeDashboard;
  app.reorderDashboards = reorderDashboards;
  app.setDashSortMode = setDashSortMode;
  app.ensureDefaultDashboards = function () { ensureDefaultDashboards(state.dashboards); };

}(window.MainApp));

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
        dashboards.push(createDashFromTemplate(tmpl));
      } else {
        // Garante ícone nos dashboards existentes que não têm
        var existing = dashboards.find(function (d) { return d.id === tmpl.id; });
        if (existing && !existing.icon) {
          existing.icon = tmpl.icon;
        }
      }
    });
  }

  /* ── Estado inicial (backend é a fonte primária) ── */
  var state = {
    dashboards: DEFAULT_DASHBOARDS.map(createDashFromTemplate),
    activeDashboard: 'default',
    dashSortMode: 'custom',
    servicos: {},
    _lastModified: Date.now()
  };

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
    state._lastModified = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function replaceState(newState) {
    // Backend é a fonte da verdade — mas preserva edições locais se o backend estiver desatualizado
    if (!newState || !newState.dashboards) return false;

    var backendTime = newState._lastModified || 0;
    var localTime = state._lastModified || 0;

    // Mescla dashboards por ID
    var mergedDashboards = newState.dashboards.map(function (backendDash) {
      var localDash = state.dashboards.find(function (d) { return d.id === backendDash.id; });
      if (!localDash) return backendDash;

      // Se o estado local é mais recente, preserva edits e customs locais
      if (localTime > backendTime) {
        // Mantém customs e order locais, mas garante que cards do backend que não existem localmente sejam adicionados
        var localIds = {};
        localDash.customs.forEach(function (c) { localIds[c.id] = true; });
        backendDash.customs.forEach(function (c) {
          if (!localIds[c.id]) {
            localDash.customs.push(c);
            if (localDash.order.indexOf(c.id) === -1) localDash.order.push(c.id);
          }
        });

        // Preserva edits locais (não sobrescreve com versões antigas do backend)
        var mergedEdits = {};
        Object.keys(backendDash.edits).forEach(function (id) { mergedEdits[id] = backendDash.edits[id]; });
        Object.keys(localDash.edits).forEach(function (id) { mergedEdits[id] = localDash.edits[id]; });

        return {
          id: backendDash.id,
          name: backendDash.name || localDash.name,
          icon: backendDash.icon || localDash.icon,
          order: localDash.order,
          customs: localDash.customs,
          edits: mergedEdits,
          deleted: localDash.deleted
        };
      }

      return backendDash;
    });

    state.dashboards = mergedDashboards;
    state.activeDashboard = newState.activeDashboard || 'default';
    state.dashSortMode = newState.dashSortMode || 'custom';
    state.servicos = newState.servicos || {};
    state._lastModified = Math.max(localTime, backendTime);
    ensureDefaultDashboards(state.dashboards);
    save();
    return true;
  }

  function loadFromLocalStorage() {
    var raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    if (!raw) return false;
    if (raw.dashboards) {
      state.dashboards = raw.dashboards;
      state.activeDashboard = raw.activeDashboard || 'default';
      state.dashSortMode = raw.dashSortMode || 'custom';
      state.servicos = raw.servicos || {};
      state._lastModified = raw._lastModified || Date.now();
      ensureDefaultDashboards(state.dashboards);
      save();
      return true;
    }
    if (raw.order || raw.customs) {
      // Formato antigo — migrar
      state.dashboards = [{
        id: 'default', name: 'Dashboard de Pareceres', icon: 'fa-file-alt',
        order: raw.order || [], customs: raw.customs || [],
        edits: raw.edits || {}, deleted: raw.deleted || []
      }];
      state.activeDashboard = 'default';
      state.servicos = raw.servicos || {};
      state._lastModified = Date.now();
      ensureDefaultDashboards(state.dashboards);
      save();
      return true;
    }
    return false;
  }

  function resetState() {
    state.dashboards = DEFAULT_DASHBOARDS.map(createDashFromTemplate);
    state.activeDashboard = 'default';
    state.servicos = {};
    state._lastModified = Date.now();
    save();
  }

  /* ── Expor API ────────────────────────── */
  Object.defineProperty(app, '__state', { get: function () { return state; } });

  app._save = save;
  app._replaceState = replaceState;
  app._loadFromLocalStorage = loadFromLocalStorage;
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

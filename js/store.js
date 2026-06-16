/**
 * store.js — Gerenciamento de estado centralizado (multi-dashboard)
 *
 * Persistência: localStorage (chave: baixa_rt_data)
 * Export/Import: JSON file download/upload
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var STORAGE_KEY = 'baixa_rt_data';

  /* ── Dashboards padrão ─────────────────── */
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
      deleted: [],
      inactive: [],
      filterMode: 'active'
    };
  }

  function ensureDefaultDashboards(dashboards) {
    DEFAULT_DASHBOARDS.forEach(function (tmpl) {
      var exists = dashboards.some(function (d) { return d.id === tmpl.id; });
      if (!exists) {
        dashboards.push(createDashFromTemplate(tmpl));
      } else {
        var existing = dashboards.find(function (d) { return d.id === tmpl.id; });
        if (existing && !existing.icon) existing.icon = tmpl.icon;
      }
    });
    // Garante campos novos em dashboards migrados de versões antigas
    dashboards.forEach(function (d) {
      if (!d.inactive) d.inactive = [];
      if (!d.filterMode) d.filterMode = 'active';
    });
  }

  /* ── Estado ────────────────────────────── */
  var state = {
    dashboards: DEFAULT_DASHBOARDS.map(createDashFromTemplate),
    activeDashboard: 'default',
    dashSortMode: 'custom',
    servicos: {},
    _lastModified: 0
  };

  /* ── Persistência ──────────────────────── */
  function save() {
    state._lastModified = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function load() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.dashboards) return false;
      state.dashboards = parsed.dashboards;
      state.activeDashboard = parsed.activeDashboard || 'default';
      state.dashSortMode = parsed.dashSortMode || 'custom';
      state.servicos = parsed.servicos || {};
      state._lastModified = parsed._lastModified || Date.now();
      ensureDefaultDashboards(state.dashboards);
      save();
      return true;
    } catch (_) {
      return false;
    }
  }

  function resetState() {
    state.dashboards = DEFAULT_DASHBOARDS.map(createDashFromTemplate);
    state.activeDashboard = 'default';
    state.servicos = {};
    state._lastModified = Date.now();
    save();
  }

  /* ── Export / Import ───────────────────── */
  function exportToFile() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'workdash-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    app.showToast('Backup exportado com sucesso!', 'success');
  }

  function importFromFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var imported = JSON.parse(e.target.result);
        if (!imported.dashboards) {
          app.showToast('Arquivo inválido: formato não reconhecido.', 'danger');
          return;
        }
        state.dashboards = imported.dashboards;
        state.activeDashboard = imported.activeDashboard || 'default';
        state.dashSortMode = imported.dashSortMode || 'custom';
        state.servicos = imported.servicos || {};
        state._lastModified = Date.now();
        ensureDefaultDashboards(state.dashboards);
        save();
        app.render();
        app.initDashboards();
        app.showToast('Dados restaurados com sucesso!', 'success');
      } catch (_) {
        app.showToast('Erro ao ler o arquivo.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  /* ── Acesso ao dashboard ativo ─────────── */
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

  /* ── CRUD de dashboards ────────────────── */
  function addDashboard(name, icon) {
    var id = 'dash-' + Date.now();
    state.dashboards.push({
      id: id, name: name, icon: icon || 'fa-file-alt',
      order: [], customs: [], edits: {}, deleted: [],
      inactive: [], filterMode: 'active'
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
    if (state.activeDashboard === id) state.activeDashboard = state.dashboards[0].id;
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

  /* ── Filtro de cards (ativo/inativo/todos) ── */
  function setFilterMode(mode) {
    var dash = getActiveDash();
    if (!dash) return;
    dash.filterMode = mode;
    save();
  }

  function getFilterMode() {
    var dash = getActiveDash();
    return dash ? (dash.filterMode || 'active') : 'active';
  }

  /* ── Expor API ─────────────────────────── */
  Object.defineProperty(app, '__state', { get: function () { return state; } });

  app._save = save;
  app._load = load;
  app.__resetState = resetState;
  app.exportToFile = exportToFile;
  app.importFromFile = importFromFile;
  app.getActiveDash = getActiveDash;
  app.setActiveDashboard = setActiveDashboard;
  app.addDashboard = addDashboard;
  app.renameDashboard = renameDashboard;
  app.removeDashboard = removeDashboard;
  app.reorderDashboards = reorderDashboards;
  app.setDashSortMode = setDashSortMode;
  app.setFilterMode = setFilterMode;
  app.getFilterMode = getFilterMode;
  app.ensureDefaultDashboards = function () { ensureDefaultDashboards(state.dashboards); };

}(window.MainApp));

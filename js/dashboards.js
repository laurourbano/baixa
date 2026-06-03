/**
 * dashboards.js — Gerenciamento de múltiplos dashboards
 *
 * @module dashboards
 * @description
 * Gerencia criação, renomeação, exclusão e ordenação de dashboards na sidebar.
 *
 * Funcionalidades:
 * - CRUD completo de dashboards com modal dedicado
 * - 24 ícones Font Awesome disponíveis com seletor visual
 * - Sugestão automática de ícone baseada em palavras-chave no nome
 *   (ex.: "ingresso" → fa-door-open, "baixa" → fa-door-closed,
 *    "conferência" → fa-clipboard-check, "pj" → fa-building)
 * - Drag-and-drop para reordenação manual na sidebar
 * - Alternância entre ordem manual e alfabética (A-Z, locale pt-BR)
 * - Renderização dinâmica da sidebar com controles hover (editar/excluir)
 * - Proteção: impede exclusão do último dashboard
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  /* ── Ícones disponíveis ───────────────── */
  var ICON_OPTIONS = [
    'fa-file-alt', 'fa-file-lines', 'fa-file-contract', 'fa-file-circle-check',
    'fa-clipboard-list', 'fa-clipboard-check', 'fa-list-check',
    'fa-building', 'fa-id-card', 'fa-user-tie',
    'fa-magnifying-glass', 'fa-scale-balanced', 'fa-gavel',
    'fa-folder-open', 'fa-receipt', 'fa-stamp',
    'fa-tag', 'fa-bookmark', 'fa-layer-group', 'fa-chart-simple',
    'fa-door-open', 'fa-door-closed', 'fa-circle-xmark', 'fa-circle-plus'
  ];

  /* ── Sugestão de ícone por palavra-chave ── */
  var ICON_SUGGESTIONS = {
    // Baixa / encerramento
    'baixa': 'fa-door-closed',
    'encerramento': 'fa-circle-xmark',
    'demiss': 'fa-door-closed',
    'saída': 'fa-door-closed',
    'saida': 'fa-door-closed',
    'exonera': 'fa-circle-xmark',
    'fim': 'fa-circle-xmark',
    'rescis': 'fa-file-contract',
    'cancel': 'fa-circle-xmark',
    // Ingresso / entrada
    'ingresso': 'fa-door-open',
    'entrada': 'fa-door-open',
    'contrata': 'fa-id-card',
    'início': 'fa-circle-plus',
    'inicio': 'fa-circle-plus',
    'começo': 'fa-circle-plus',
    'comeco': 'fa-circle-plus',
    'admiss': 'fa-id-card',
    // Genéricos
    'inscri': 'fa-id-card',
    'contrato': 'fa-file-contract',
    'confer': 'fa-clipboard-check',
    'conferencia': 'fa-clipboard-check',
    'processo': 'fa-magnifying-glass',
    'fiscal': 'fa-magnifying-glass',
    'dashboard': 'fa-file-alt',
    'parecer': 'fa-file-lines',
    'relatorio': 'fa-chart-simple',
    'relatório': 'fa-chart-simple',
    'juridico': 'fa-scale-balanced',
    'jurídico': 'fa-scale-balanced',
    'cadastro': 'fa-id-card',
    'registro': 'fa-tag',
    'documento': 'fa-file-alt',
    'certid': 'fa-stamp',
    'receita': 'fa-receipt',
    'balanço': 'fa-chart-simple',
    'balanco': 'fa-chart-simple',
    'fiscaliza': 'fa-magnifying-glass',
    'auto': 'fa-gavel',
    'infra': 'fa-gavel',
    'pessoa juridica': 'fa-building',
    'pessoa física': 'fa-id-card',
    'pessoa fisica': 'fa-id-card',
    'pj': 'fa-building',
    'pf': 'fa-id-card'
  };

  function suggestIcon(name) {
    if (!name) return null;
    var lower = name.toLowerCase();
    // Procura por correspondência exata de palavra composta primeiro
    for (var key in ICON_SUGGESTIONS) {
      if (lower.indexOf(key) !== -1) {
        return ICON_SUGGESTIONS[key];
      }
    }
    return null;
  }

  /* ── Descrições contextuais dos ícones ── */
  var ICON_LABELS = {
    'fa-file-alt': 'Documento',
    'fa-file-lines': 'Parecer / Texto',
    'fa-file-contract': 'Contrato',
    'fa-file-circle-check': 'Processo concluído',
    'fa-clipboard-list': 'Lista / Resumo',
    'fa-clipboard-check': 'Conferência',
    'fa-list-check': 'Checklist',
    'fa-building': 'Empresa / PJ',
    'fa-id-card': 'Cadastro / PF',
    'fa-user-tie': 'Profissional',
    'fa-magnifying-glass': 'Busca / Fiscalização',
    'fa-scale-balanced': 'Jurídico',
    'fa-gavel': 'Autuação / Infração',
    'fa-folder-open': 'Pasta / Arquivo',
    'fa-receipt': 'Receita / Financeiro',
    'fa-stamp': 'Certidão / Selo',
    'fa-tag': 'Registro / Etiqueta',
    'fa-bookmark': 'Favorito / Marcação',
    'fa-layer-group': 'Categoria / Grupo',
    'fa-chart-simple': 'Relatório / Estatística',
    'fa-door-open': 'Entrada / Ingresso',
    'fa-door-closed': 'Saída / Baixa',
    'fa-circle-xmark': 'Encerramento / Fim',
    'fa-circle-plus': 'Início / Abertura'
  };

  var draggedDashId = null;

  /* ── Modal de Dashboard ───────────────── */
  var dashModal = null;

  function initDashModal() {
    var el = document.getElementById('dashboardModal');
    if (!el) return;
    dashModal = new bootstrap.Modal(el);

    var nameInput = document.getElementById('dash-name');
    if (nameInput) {
      nameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') saveDashboardFromModal();
      });
      // Sugestão automática de ícone ao digitar
      nameInput.addEventListener('input', function () {
        var suggested = suggestIcon(nameInput.value);
        var hintEl = document.getElementById('dash-icon-hint');
        if (suggested) {
          document.getElementById('dash-icon-value').value = suggested;
          renderIconPicker(suggested);
          if (hintEl) hintEl.innerHTML = '<i class="fas fa-lightbulb me-1"></i> Ícone sugerido: <b>' + suggested.replace('fa-', '') + '</b>';
        } else {
          if (hintEl) hintEl.innerHTML = '';
        }
      });
    }

    var saveBtn = document.getElementById('dash-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveDashboardFromModal);
    }

    el.addEventListener('shown.bs.modal', function () {
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    });
  }

  /* ── Render do seletor de ícones ──────── */
  function renderIconPicker(selectedIcon) {
    var container = document.getElementById('dash-icon-picker');
    if (!container) return;
    var html = '';
    ICON_OPTIONS.forEach(function (icon) {
      var isSel = icon === selectedIcon;
      var label = ICON_LABELS[icon] || icon.replace('fa-', '');
      html += '<button type="button" class="icon-option' + (isSel ? ' selected' : '') +
        '" data-icon="' + icon + '" onclick="MainApp.selectDashIcon(this, \'' + icon + '\')" title="' + label + '">' +
        '<i class="fas ' + icon + '"></i></button>';
    });
    container.innerHTML = html;
  }

  function selectDashIcon(btn, icon) {
    document.getElementById('dash-icon-value').value = icon;
    var all = document.querySelectorAll('#dash-icon-picker .icon-option');
    all.forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }

  function openDashboardModal(mode, id, currentName, currentIcon) {
    var titleEl = document.getElementById('dashboard-modal-title');
    var idEl = document.getElementById('dash-edit-id');
    var nameEl = document.getElementById('dash-name');

    if (mode === 'create') {
      if (titleEl) titleEl.textContent = 'Nova Página';
      if (idEl) idEl.value = '';
      if (nameEl) nameEl.value = '';
      renderIconPicker('fa-file-alt');
      document.getElementById('dash-icon-value').value = 'fa-file-alt';
    } else if (mode === 'rename') {
      if (titleEl) titleEl.textContent = 'Editar Página';
      if (idEl) idEl.value = id;
      if (nameEl) nameEl.value = currentName || '';
      var icon = currentIcon || 'fa-file-alt';
      renderIconPicker(icon);
      document.getElementById('dash-icon-value').value = icon;
    }

    if (dashModal) dashModal.show();
  }

  function saveDashboardFromModal() {
    var id = document.getElementById('dash-edit-id').value;
    var name = document.getElementById('dash-name').value.trim();
    var icon = document.getElementById('dash-icon-value').value;

    if (!name) {
      app.showToast('O nome da página não pode ficar vazio.', 'warning', 2500);
      return;
    }

    if (id) {
      app.renameDashboard(id, name, icon);
      renderSidebarDashboards();
      updatePageTitle();
      app.notifyChange();
      app.showToast('Página atualizada!', 'success', 2500);
    } else {
      var newId = app.addDashboard(name, icon);
      renderSidebarDashboards();
      app.setActiveDashboard(newId);
      switchView('dashboard');
      app.render();
      app.setupDragAndDrop();
      app.notifyChange();
      app.showToast('Página "' + name + '" criada!', 'success', 3000);
    }

    if (dashModal) dashModal.hide();
  }

  /* ── Ordenação ─────────────────────────── */
  function getSortedDashboards() {
    var list = app.__state.dashboards.slice();
    var mode = app.__state.dashSortMode || 'custom';
    if (mode === 'alpha') {
      list.sort(function (a, b) {
        return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      });
    }
    return list;
  }

  function toggleSortMode() {
    var current = app.__state.dashSortMode || 'custom';
    var next = current === 'custom' ? 'alpha' : 'custom';
    app.setDashSortMode(next);
    renderSidebarDashboards();
    updateSortButton(next);
    app.notifyChange();
    app.showToast(
      next === 'alpha' ? 'Ordenação: A-Z' : 'Ordenação: manual (arraste)',
      'info', 2000
    );
  }

  function updateSortButton(mode) {
    var btn = document.getElementById('btn-sort-dashboards');
    if (!btn) return;
    var icon = btn.querySelector('i');
    var span = btn.querySelector('span');
    if (mode === 'alpha') {
      if (icon) { icon.className = 'fas fa-arrow-down-wide-short'; }
      if (span) span.textContent = 'Ordem Manual';
    } else {
      if (icon) { icon.className = 'fas fa-sort-alpha-down'; }
      if (span) span.textContent = 'Ordenar A-Z';
    }
  }

  /* ── Drag & Drop dos dashboards ────────── */
  function setupDashDragAndDrop() {
    var container = document.getElementById('sidebar-dashboards');
    if (!container) return;

    container.addEventListener('dragstart', function (e) {
      var handle = e.target.closest('.dash-drag-handle');
      if (!handle) return;
      var row = handle.closest('.dash-nav-row');
      if (!row) return;
      // Não permite arrastar se estiver em modo alfabético
      if ((app.__state.dashSortMode || 'custom') === 'alpha') {
        e.preventDefault();
        return;
      }
      draggedDashId = row.getAttribute('data-dash-id');
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedDashId);
    });

    container.addEventListener('dragend', function (e) {
      var row = e.target.closest('.dash-nav-row');
      if (row) row.classList.remove('dragging');
      draggedDashId = null;
      // Limpa todos os drag-over
      container.querySelectorAll('.dash-nav-row').forEach(function (r) {
        r.classList.remove('drag-over');
      });
    });

    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      var row = e.target.closest('.dash-nav-row');
      if (!row || row.getAttribute('data-dash-id') === draggedDashId) return;
      container.querySelectorAll('.dash-nav-row').forEach(function (r) {
        r.classList.remove('drag-over');
      });
      row.classList.add('drag-over');
    });

    container.addEventListener('drop', function (e) {
      e.preventDefault();
      var targetRow = e.target.closest('.dash-nav-row');
      if (!targetRow || !draggedDashId) return;

      var targetId = targetRow.getAttribute('data-dash-id');
      if (targetId === draggedDashId) return;

      var list = app.__state.dashboards;
      var fromIdx = list.findIndex(function (d) { return d.id === draggedDashId; });
      var toIdx = list.findIndex(function (d) { return d.id === targetId; });

      if (fromIdx !== -1 && toIdx !== -1) {
        app.reorderDashboards(fromIdx, toIdx);
        renderSidebarDashboards();
        app.notifyChange();
      }

      container.querySelectorAll('.dash-nav-row').forEach(function (r) {
        r.classList.remove('drag-over');
      });
    });
  }

  /* ── Renderizar lista de dashboards na sidebar ── */
  function renderSidebarDashboards() {
    var container = document.getElementById('sidebar-dashboards');
    if (!container) return;

    var state = app.__state;
    var activeId = state.activeDashboard;
    var sortMode = state.dashSortMode || 'custom';
    var list = getSortedDashboards();
    var html = '';

    list.forEach(function (dash) {
      var isActive = dash.id === activeId;
      var displayName = dash.name || 'Dashboard';
      var dashIcon = dash.icon || 'fa-file-alt';
      var escapedId = dash.id.replace(/'/g, "\\'");
      var escapedName = displayName.replace(/'/g, "\\'");
      var escapedIcon = dashIcon.replace(/'/g, "\\'");

      var draggableAttr = sortMode === 'custom' ? ' draggable="true"' : '';

      html += '<div class="dash-nav-row' + (isActive ? ' active' : '') + '" data-dash-id="' + dash.id + '">' +
        '<span class="dash-drag-handle" title="Arrastar para reordenar"' + draggableAttr + '>⠿</span>' +
        '<a href="#" class="nav-item dash-nav-item' + (isActive ? ' active' : '') + '" ' +
        'data-dash-id="' + dash.id + '" ' +
        'draggable="false" ondragstart="return false" ' +
        'onclick="MainApp.setActiveDashboard(\'' + escapedId + '\');switchView(\'dashboard\');MainApp.renderSidebarDashboards();MainApp.render();"' +
        ' title="' + escapedName + '">' +
        '<i class="fas ' + dashIcon + '"></i> <span>' + displayName + '</span>' +
        '</a>' +
        '</div>';
    });

    container.innerHTML = html;
    // Re-aplica drag-and-drop após re-render
    setupDashDragAndDrop();
  }

  function addDashboardPrompt() {
    openDashboardModal('create');
  }

  function deleteDashboardPrompt(id) {
    var dash = app.__state.dashboards.find(function (d) { return d.id === id; });
    if (!dash) return;
    app.showConfirm(
      'Excluir Página',
      'Deseja excluir permanentemente a página "' + dash.name + '" e todos os seus cards?',
      'danger'
    ).then(function (confirmed) {
      if (!confirmed) return;
      var removed = app.removeDashboard(id);
      if (!removed) {
        app.showToast('Não é possível excluir a última página!', 'warning', 3000);
        return;
      }
      renderSidebarDashboards();
      switchView('dashboard');
      app.render();
      app.setupDragAndDrop();
      updatePageTitle();
      app.notifyChange();
      app.showToast('Página excluída.', 'info', 2500);
    });
  }

  function updatePageTitle() {
    // O título da página é estático ("Parecer"), não deve ser alterado dinamicamente
    renderDashboardToolbar();
  }

  /* ── Toolbar dentro da página do dashboard ── */
  function renderDashboardToolbar() {
    var toolbar = document.getElementById('dash-toolbar');
    if (!toolbar) return;

    var dash = app.getActiveDash();
    if (!dash) {
      toolbar.innerHTML = '';
      return;
    }

    var escapedId = dash.id.replace(/'/g, "\\'");
    var escapedName = (dash.name || 'Dashboard').replace(/'/g, "\\'");
    var escapedIcon = (dash.icon || 'fa-file-alt').replace(/'/g, "\\'");
    var totalDashboards = app.__state.dashboards.length;

    var html = '<div class="dash-toolbar-inner">' +
      '<span class="dash-toolbar-label"><i class="fas ' + dash.icon + ' me-2"></i>' + dash.name + '</span>' +
      '<div class="dash-toolbar-actions">' +
      '<button class="btn btn-sm btn-outline-primary dash-page-edit-btn" onclick="MainApp.openDashboardModal(\'rename\',\'' + escapedId + '\',\'' + escapedName + '\',\'' + escapedIcon + '\')" title="Editar nome e ícone da página">' +
      '<i class="fas fa-pen-to-square me-1"></i> Editar página</button>';

    if (totalDashboards > 1) {
      html += '<button class="btn btn-sm btn-outline-danger dash-page-del-btn ms-2" onclick="MainApp.deleteDashboardPrompt(\'' + escapedId + '\')" title="Excluir esta página e todos os seus cards">' +
        '<i class="fas fa-trash-can me-1"></i> Excluir página</button>';
    }

    html += '</div></div>';
    toolbar.innerHTML = html;
  }

  function initDashboards() {
    initDashModal();
    renderSidebarDashboards();
    updateSortButton(app.__state.dashSortMode || 'custom');
  }

  /* ── Expor API pública ────────────────── */
  app.renderSidebarDashboards = renderSidebarDashboards;
  app.addDashboardPrompt = addDashboardPrompt;
  app.openDashboardModal = openDashboardModal;
  app.selectDashIcon = selectDashIcon;
  app.deleteDashboardPrompt = deleteDashboardPrompt;
  app.updatePageTitle = updatePageTitle;
  app.renderDashboardToolbar = renderDashboardToolbar;
  app.initDashboards = initDashboards;
  app.toggleSortMode = toggleSortMode;

}(window.MainApp));

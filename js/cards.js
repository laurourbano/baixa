/**
 * cards.js — Renderização, CRUD, cópia e drag-and-drop de cards
 *
 * @module cards
 * @description
 * Gerencia cards dentro de cada dashboard.
 *
 * Tipos de card suportados:
 * - copy: texto copiável com data automática
 * - link: link externo com botão "Abrir Link"
 * - pdf: link para PDF com botão "Abrir PDF"
 * - info: informativo somente leitura
 *
 * Funcionalidades:
 * - render: grid responsivo (col-12 col-md-6 col-lg-3) com ordenação por drag-and-drop
 * - Cópia inteligente: substitui placeholder [00/00/0000] pela data atual (pt-BR)
 * - Modal Bootstrap para criar/editar cards com campos: título, tipo, cor, conteúdo,
 *   link, local, situação, julgamento, flag mostrar data
 * - Drag-and-drop via HTML5 Drag and Drop API nos handles ⠿
 * - Exportação Excel (.xlsx) via SheetJS
 * - Feedback visual de cópia (destaque verde temporário)
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var lastCopiedId = null;
  var _copying = false;

  function formattedDate() {
    return new Date().toLocaleDateString('pt-BR');
  }

  /* ── Helper: dashboard ativo ──────────── */
  function dash() {
    return app.getActiveDash();
  }

  /* ── Render ────────────────────────────── */
  function render() {
    var grid = document.getElementById('dynamic-cards');
    if (!grid) return;

    var d = dash();
    if (!d) return;

    var date = formattedDate();
    var filterMode = d.filterMode || 'active';
    var hasEdits = false;
    for (var _k in d.edits) { if (d.edits.hasOwnProperty(_k)) { hasEdits = true; break; } }

    // Map para lookup O(1) de posição no order
    var orderMap = {};
    for (var oi = 0; oi < d.order.length; oi++) {
      orderMap[d.order[oi]] = oi;
    }

    // Set para lookup O(1) de deletados
    var deletedSet = {};
    for (var di = 0; di < d.deleted.length; di++) {
      deletedSet[d.deleted[di]] = true;
    }

    // Set para lookup O(1) de inativos
    var inactiveSet = {};
    for (var ii = 0; ii < d.inactive.length; ii++) {
      inactiveSet[d.inactive[ii]] = true;
    }

    // Filtra cards conforme filterMode
    var active = [];
    for (var ai = 0; ai < d.customs.length; ai++) {
      var c = d.customs[ai];
      if (deletedSet[c.id]) continue;

      var isInactive = !!inactiveSet[c.id];

      if (filterMode === 'active' && isInactive) continue;
      if (filterMode === 'inactive' && !isInactive) continue;

      var card = hasEdits && d.edits[c.id] ? Object.assign({}, c, d.edits[c.id]) : c;
      card._inactive = isInactive;
      active.push(card);
    }

    // Ordena por order map (O(n log n) sem indexOf interno)
    active.sort(function (a, b) {
      return (orderMap[a.id] !== undefined ? orderMap[a.id] : 999) -
             (orderMap[b.id] !== undefined ? orderMap[b.id] : 999);
    });

    // Renderiza HTML
    var html = '';
    for (var ri = 0; ri < active.length; ri++) {
      html += renderCardHTML(active[ri], date);
    }

    // Placeholder quando não há cards no filtro atual
    if (active.length === 0) {
      var placeholderMsg = filterMode === 'inactive'
        ? 'Nenhum card inativo neste dashboard.'
        : 'Nenhum card neste dashboard. Clique em + para adicionar.';
      html = '<div class="col-12 text-center py-5 text-muted x-small">' +
        '<i class="fas fa-inbox fs-4 mb-2 d-block"></i>' + placeholderMsg + '</div>';
    }

    grid.innerHTML = html;

    if (lastCopiedId) {
      var cardEl = document.querySelector('[data-id="' + lastCopiedId + '"]');
      if (cardEl) {
        cardEl.classList.add('shadow-lg', 'copied-active');
        var contentEl = cardEl.querySelector('.content-display');
        if (contentEl) contentEl.classList.add('fw-bold');
        var btn = cardEl.querySelector('.btn-copy-mini');
        if (btn) {
          btn.classList.add('btn-active');
          btn.innerHTML = '<i class="fas fa-check"></i>';
        }
      }
    }

    app._save();
  }

  /** Constrói HTML de um card — extraído para clareza e performance */
  function renderCardHTML(card, date) {
    var isInactive = card._inactive === true;
    var isLink = card.type === 'link' || card.type === 'pdf';
    var isInfo = card.type === 'info';
    var icon = card.type === 'pdf' ? 'fa-file-pdf' : 'fa-external-link-alt';
    var btnLabel = card.type === 'pdf' ? 'Abrir PDF' : 'Abrir Link';
    var color = card.color || 'light';
    var bootstrapColor = color === 'light' ? 'secondary' : color;
    var canCopy = !isLink && !isInfo && !isInactive;

    var metaLine = '';
    if (card.local || card.sit || card.julgamento) {
      metaLine = '<div class="info-line">' +
        '<span>Local: <b>' + (card.local || '') + '</b></span>' +
        '<span>Situação: <b>' + (card.sit || '') + '</b></span>' +
        '<span>Julgamento: <b>' + (card.julgamento || '') + '</b></span>' +
        '</div>';
    }

    var body = '';
    if (isLink) {
      body = '<div class="link-card-body text-center mt-2">' +
        '<p class="x-small mb-2">' + (card.content || 'Acesso rápido') + '</p>' +
        '<a href="' + card.link + '" target="_blank" class="btn btn-outline-' + bootstrapColor + ' btn-sm-compact" onclick="event.stopPropagation()">' +
        '<i class="fas ' + icon + ' me-1"></i>' + btnLabel + '</a></div>';
    } else if (isInfo) {
      body = '<div class="content-display">' + card.content + '</div>' +
        '<div class="info-card-badge"><i class="fas fa-info-circle me-1"></i> Informativo</div>';
    } else {
      var contentHtml = (card.showDate !== false ? date + ' - ' : '') +
        card.content.replace(/\[\s*00\/00\/0000\s*\]/g, '<span class="date-highlight">' + date + '</span>');
      body = '<div class="content-display">' + contentHtml + '</div>';

      if (isInactive) {
        body += '<div class="info-card-badge bg-secondary bg-opacity-25 text-muted"><i class="fas fa-box-archive me-1"></i> Inativo</div>';
        body += '<button class="btn-copy-mini btn-outline-info" onclick="event.stopPropagation(); MainApp.toggleInactive(\'' + card.id + '\')" title="Reativar card">' +
          '<i class="fas fa-rotate-left"></i></button>';
      } else {
        body += '<div class="card-copy-hint"><i class="fas fa-mouse-pointer me-1"></i> Clique no card para copiar</div>' +
          '<div class="card-copy-success"><i class="fas fa-check-circle me-1"></i> Conteúdo Copiado!</div>' +
          '<button class="btn-copy-mini btn-outline-success" onclick="event.stopPropagation(); MainApp.copy(this, \'' + card.id + '\')" title="Copiar conteúdo">' +
          '<i class="fas fa-copy"></i></button>';
      }
    }

    var clickHandler = canCopy ? ' onclick="MainApp.copy(this.querySelector(\'.content-display\'), \'' + card.id + '\')"' : '';

    var inactiveClass = isInactive ? ' card-inactive' : '';

    return '<div class="col-12 col-md-6 col-lg-3 mb-3">' +
      '<div class="card h-100 border-' + color + (isInfo ? ' card-info-type' : '') + inactiveClass + '" data-id="' + card.id + '" data-color="' + color + '"' + clickHandler + '>' +
      '<div class="card-head" onclick="event.stopPropagation()">' +
      '<span class="handle" title="Arrastar para reordenar">⠿</span>' +
      '<span class="card-title-header">' + card.title + '</span>' +
      '<div class="actions">' +
      '<i class="fa fa-pen" onclick="MainApp.edit(\'' + card.id + '\')"></i>' +
      '<i class="fa fa-trash" onclick="MainApp.del(\'' + card.id + '\')"></i>' +
      (isInactive
        ? '<i class="fa fa-rotate-left text-info ms-1" onclick="MainApp.toggleInactive(\'' + card.id + '\')" title="Reativar"></i>'
        : '<i class="fa fa-box-archive text-warning ms-1" onclick="MainApp.toggleInactive(\'' + card.id + '\')" title="Inativar"></i>') +
      '</div></div>' + metaLine + body + '</div></div>';
  }

  /* ── Reset highlight ───────────────────── */
  function resetCardHighlight(id) {
    if (!id) return;
    var card = document.querySelector('[data-id="' + id + '"]');
    if (!card) return;
    var contentEl = card.querySelector('.content-display');
    var originalColor = card.getAttribute('data-color') || 'light';
    if (contentEl) contentEl.classList.remove('fw-bold');
    card.classList.remove('shadow-lg', 'copied-active');
    var btn = card.querySelector('.btn-copy-mini');
    if (btn) {
      btn.classList.remove('btn-active');
      btn.innerHTML = '<i class="fas fa-copy"></i>';
    }
    if (originalColor !== 'success') {
      card.classList.remove('border-success');
      card.classList.add('border-' + originalColor);
    }
  }

  /* ── CRUD ──────────────────────────────── */
  function closeModal() {
    window.bsModal.hide();
  }

  function toggleLinkField() {
    var type = document.getElementById('m-type').value;
    var group = document.getElementById('link-field-group');
    var showDateGroup = document.getElementById('m-showDate').closest('.form-check');
    var contentLabel = document.getElementById('m-content');

    if (type === 'link' || type === 'pdf') {
      group.classList.remove('d-none');
      showDateGroup.classList.add('d-none');
      contentLabel.placeholder = 'Descrição curta (opcional)';
      contentLabel.rows = 2;
    } else if (type === 'info') {
      group.classList.add('d-none');
      showDateGroup.classList.add('d-none');
    } else {
      group.classList.add('d-none');
      showDateGroup.classList.remove('d-none');
      contentLabel.placeholder = 'Conteúdo';
      contentLabel.rows = 4;
    }
  }

  function openCreate() {
    document.getElementById('m-id').value = '';
    document.getElementById('m-title').value = '';
    document.getElementById('m-content').value = '';
    document.getElementById('m-color').value = 'light';
    document.getElementById('m-local').value = '';
    document.getElementById('m-sit').value = '';
    document.getElementById('m-julgamento').value = '';
    document.getElementById('m-type').value = 'copy';
    document.getElementById('m-link').value = '';
    document.getElementById('m-showDate').checked = true;
    toggleLinkField();
    populateRespostasPadrao();
    window.bsModal.show();
  }

  function populateRespostasPadrao() {
    var rpSelect = document.getElementById('m-resposta-padrao');
    if (!rpSelect) return;
    var respostas = {};
    // Tenta múltiplas fontes
    try { var s = JSON.parse(localStorage.getItem('baixa_rt_data') || '{}'); if (s.respostasPadrao) respostas = s.respostasPadrao; } catch(e) {}
    if (app.__state && app.__state.servicos && app.__state.servicos.respostasPadrao) respostas = app.__state.servicos.respostasPadrao;
    if (window._store && window._store.respostasPadrao) respostas = window._store.respostasPadrao;
    var keys = Object.keys(respostas).sort();
    rpSelect.innerHTML = '<option value="">Nenhuma</option>' +
      keys.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('');
    rpSelect.value = '';
    rpSelect.onchange = function () {
      var val = this.value;
      if (val && respostas[val]) {
        document.getElementById('m-content').value = respostas[val];
        if (!document.getElementById('m-title').value) {
          document.getElementById('m-title').value = val;
        }
      }
    };
  }

  function saveCard() {
    var id = document.getElementById('m-id').value;
    var d = dash();
    var data = {
      title: document.getElementById('m-title').value,
      content: document.getElementById('m-content').value,
      color: document.getElementById('m-color').value,
      local: document.getElementById('m-local').value,
      sit: document.getElementById('m-sit').value,
      julgamento: document.getElementById('m-julgamento').value,
      type: document.getElementById('m-type').value,
      link: document.getElementById('m-link').value,
      showDate: document.getElementById('m-showDate').checked
    };

    if (id) {
      app.showConfirm('Salvar Edição', 'Deseja salvar as alterações deste card?', 'info').then(function (confirmed) {
        if (!confirmed) {
          app.showToast('Edição cancelada.', 'info');
          return;
        }
        d.edits[id] = data;
        closeModal();
        render();
        app.notifyChange();
        app.showToast('Card salvo com sucesso.', 'success');
      });
    } else {
      d.customs.push({ id: 'custom-' + Date.now() });
      Object.assign(d.customs[d.customs.length - 1], data);
      closeModal();
      render();
      app.notifyChange();
      app.showToast('Card salvo com sucesso.', 'success');
    }
  }

  function edit(id) {
    var d = dash();
    var card = Object.assign({}, d.customs.find(function (c) { return c.id === id; }), d.edits[id]);

    document.getElementById('m-id').value = id;
    document.getElementById('m-title').value = card.title;
    document.getElementById('m-content').value = card.content;
    document.getElementById('m-color').value = card.color || 'light';
    document.getElementById('m-local').value = card.local || '';
    document.getElementById('m-sit').value = card.sit || '';
    document.getElementById('m-julgamento').value = card.julgamento || '';
    document.getElementById('m-type').value = card.type || 'copy';
    document.getElementById('m-link').value = card.link || '';
    document.getElementById('m-showDate').checked = card.showDate !== false;

    toggleLinkField();
    populateRespostasPadrao();
    window.bsModal.show();
  }

  function del(id) {
    return app.showConfirm('Excluir Card', 'Deseja excluir este card permanentemente?', 'danger').then(function (confirmed) {
      if (confirmed) {
        var d = dash();
        d.deleted.push(id);
        // Remove também do inactive se estiver lá
        var inactiveIdx = d.inactive.indexOf(id);
        if (inactiveIdx !== -1) d.inactive.splice(inactiveIdx, 1);
        render();
        app.notifyChange();
        app.showToast('Card removido com sucesso.', 'info');
      }
    });
  }

  /* ── Soft delete / Inativação ──────────── */
  function toggleInactive(id) {
    var d = dash();
    if (!d) return;
    var idx = d.inactive.indexOf(id);

    if (idx === -1) {
      // Inativar
      d.inactive.push(id);
      render();
      app.notifyChange();
      app.showToast('Card inativado. Use o filtro "Inativos" para visualizar.', 'info', 3000);
    } else {
      // Reativar
      d.inactive.splice(idx, 1);
      render();
      app.notifyChange();
      app.showToast('Card reativado com sucesso.', 'success');
    }
  }

  function copy(el, id) {
    if (_copying) return;

    var card = document.querySelector('[data-id="' + id + '"]');
    if (card && card.querySelector('.info-card-badge')) return;

    _copying = true;
    var contentEl = card && (card.querySelector('.content-display') || card.querySelector('textarea'));
    if (!contentEl) { _copying = false; return; }

    var text = contentEl.textContent || contentEl.value;
    return navigator.clipboard.writeText(text).then(function () {
      var btn = card.querySelector('.btn-copy-mini') || card.querySelector('.btn-sm-compact');
      var successEl = card.querySelector('.card-copy-success');
      var hintEl = card.querySelector('.card-copy-hint');

      if (btn) {
        btn.classList.add('btn-active');
        btn.innerHTML = '<i class="fas fa-check"></i>';

        if (lastCopiedId && lastCopiedId !== id) {
          resetCardHighlight(lastCopiedId);
        }
        lastCopiedId = id;

        if (successEl) successEl.classList.add('visible');
        if (hintEl) hintEl.classList.add('hidden');

        contentEl.classList.add('fw-bold');
        card.classList.add('shadow-lg', 'copied-active');

        setTimeout(function () {
          if (successEl) successEl.classList.remove('visible');
          if (hintEl) hintEl.classList.remove('hidden');
          _copying = false;
        }, 1200);
      }
    }).catch(function (e) {
      _copying = false;
      console.error('Erro ao copiar:', e);
    });
  }

  /* ── Drag & Drop (pointer events + rAF) ── */
  function setupDragAndDrop() {
    var grid = document.getElementById('dynamic-cards');
    if (!grid) return;

    if (grid._dragSetupDone) return;
    grid._dragSetupDone = true;

    var state = null;
    var rafId = null;

    function createPlaceholder() {
      var w = document.createElement('div');
      w.className = 'col-12 col-md-6 col-lg-3 mb-3';
      w.innerHTML = '<div class="drop-placeholder"></div>';
      return w;
    }

    // ── pointerdown: inicia ──────────────
    grid.addEventListener('pointerdown', function (e) {
      var card = (e.target.closest('.handle') || {}).closest
        ? e.target.closest('.handle').closest('.card')
        : null;
      if (!card) return;
      if (card.classList.contains('card-inactive') || card.classList.contains('card-info-type')) return;

      e.preventDefault();

      var rect = card.getBoundingClientRect();

      var outline = document.createElement('div');
      outline.className = 'drag-outline';
      outline.style.width  = rect.width  + 'px';
      outline.style.height = rect.height + 'px';
      outline.style.transform = 'translate(' + rect.left + 'px, ' + rect.top + 'px)';
      document.body.appendChild(outline);

      state = {
        card: card,
        outline: outline,
        placeholder: createPlaceholder(),
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
        px: e.clientX,
        py: e.clientY,
        lastTarget: null,
        lastPosition: null,
        tick: 0
      };

      card.classList.add('dragging');

      // Loop de animação
      rafId = requestAnimationFrame(dragTick);
    });

    // ── pointermove: só armazena posição ──
    document.addEventListener('pointermove', function (e) {
      if (!state) return;
      state.px = e.clientX;
      state.py = e.clientY;
    });

    // ── rAF tick: move contorno + hit-test ─
    function dragTick() {
      if (!state) { rafId = null; return; }

      var x = state.px - state.ox;
      var y = state.py - state.oy;

      // GPU: translate é compositor-only, sem reflow
      state.outline.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

      // Hit-test só a cada 4 frames (~16ms * 4 ≈ 64ms)
      state.tick++;
      if (state.tick % 4 === 0) {
        updateTarget(state.px, state.py);
      }

      rafId = requestAnimationFrame(dragTick);
    }

    function updateTarget(cx, cy) {
      var target = hitTest(cx, cy);

      // Só age se achou um card válido diferente do arrastado
      if (!target || target === state.card) return;

      var rect = target.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      var pos = cy < midY ? 'before' : 'after';

      // Só atualiza se o alvo ou a posição mudou
      if (state.lastTarget === target && state.lastPosition === pos) return;

      state.lastTarget = target;
      state.lastPosition = pos;

      var wrapper = target.closest('.col-12');
      if (!wrapper) return;
      removePlaceholder();
      if (pos === 'before') {
        wrapper.parentNode.insertBefore(state.placeholder, wrapper);
      } else {
        wrapper.parentNode.insertBefore(state.placeholder, wrapper.nextSibling);
      }
    }

    // ── pointerup: finaliza ──────────────
    document.addEventListener('pointerup', function () {
      if (!state) return;
      cleanupDrag();
    });

    // ── pointercancel ─────────────────────
    document.addEventListener('pointercancel', function () {
      if (!state) return;
      cleanupDrag();
    });

    function cleanupDrag() {
      cancelAnimationFrame(rafId);
      rafId = null;

      var s = state;
      state = null;

      // Remove contorno
      s.outline.style.transition = 'opacity 0.1s';
      s.outline.style.opacity = '0';
      setTimeout(function () {
        if (s.outline.parentNode) s.outline.parentNode.removeChild(s.outline);
      }, 110);

      // Remove placeholder
      if (s.placeholder && s.placeholder.parentNode) {
        s.placeholder.parentNode.removeChild(s.placeholder);
      }

      s.card.classList.remove('dragging');

      // Reordena se necessário
      if (!s.lastTarget) return;

      var draggedId = s.card.dataset.id;
      var targetId = s.lastTarget.dataset.id;
      if (draggedId === targetId) return;

      var cards = Array.from(grid.querySelectorAll('.card'));
      var ids = cards.map(function (c) { return c.dataset.id; });
      var from = ids.indexOf(draggedId);
      var to   = ids.indexOf(targetId);

      if (s.lastPosition === 'after') to++;
      if (from < to) to--;

      if (from !== to && from >= 0 && to >= 0) {
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        dash().order = ids;
        render();
        app.notifyChange();
      }
    }

    // ── helpers ──────────────────────────
    function hitTest(cx, cy) {
      var el = document.elementFromPoint(cx, cy);
      if (!el) return null;
      var c = el.closest('.card');
      if (!c || (state && state.card === c)) return null;
      return c;
    }

    function removePlaceholder() {
      if (state && state.placeholder && state.placeholder.parentNode) {
        state.placeholder.parentNode.removeChild(state.placeholder);
      }
    }
  }

  app.render = render;
  app.edit = edit;
  app.del = del;
  app.toggleInactive = toggleInactive;
  app.copy = copy;
  app.closeModal = closeModal;
  app.toggleLinkField = toggleLinkField;
  app.openCreate = openCreate;
  app.saveCard = saveCard;
  app.setupDragAndDrop = setupDragAndDrop;
}(window.MainApp));

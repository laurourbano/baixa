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

    grid.innerHTML = d.customs
      .filter(function (c) { return d.deleted.indexOf(c.id) === -1; })
      .map(function (c) { return Object.assign({}, c, d.edits[c.id]); })
      .sort(function (a, b) {
        var ia = d.order.indexOf(a.id);
        var ib = d.order.indexOf(b.id);
        if (ia === -1) ia = 999;
        if (ib === -1) ib = 999;
        return ia - ib;
      })
      .map(function (card) {
        var isLink = card.type === 'link' || card.type === 'pdf';
        var isInfo = card.type === 'info';
        var icon = card.type === 'pdf' ? 'fa-file-pdf' : 'fa-external-link-alt';
        var btnLabel = card.type === 'pdf' ? 'Abrir PDF' : 'Abrir Link';
        var color = card.color || 'light';
        var bootstrapColor = color === 'light' ? 'secondary' : color;
        var canCopy = !isLink && !isInfo;

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
          body = '<div class="content-display">' + contentHtml + '</div>' +
            '<div class="card-copy-hint"><i class="fas fa-mouse-pointer me-1"></i> Clique no card para copiar</div>' +
            '<div class="card-copy-success"><i class="fas fa-check-circle me-1"></i> Conteúdo Copiado!</div>' +
            '<button class="btn-copy-mini btn-outline-success" onclick="event.stopPropagation(); MainApp.copy(this, \'' + card.id + '\')" title="Copiar conteúdo">' +
            '<i class="fas fa-copy"></i></button>';
        }

        var clickHandler = canCopy ? ' onclick="MainApp.copy(this.querySelector(\'.content-display\'), \'' + card.id + '\')"' : '';

        return '<div class="col-12 col-md-6 col-lg-3 mb-3">' +
          '<div class="card h-100 border-' + color + (isInfo ? ' card-info-type' : '') + '" data-id="' + card.id + '" data-color="' + color + '" draggable="true"' + clickHandler + '>' +
          '<div class="card-head" onclick="event.stopPropagation()">' +
          '<span class="handle">⠿</span>' +
          '<span class="card-title-header">' + card.title + '</span>' +
          '<div class="actions">' +
          '<i class="fa fa-pen" onclick="MainApp.edit(\'' + card.id + '\')"></i>' +
          '<i class="fa fa-trash" onclick="MainApp.del(\'' + card.id + '\')"></i>' +
          '</div></div>' + metaLine + body + '</div></div>';
      }).join('');

    app._save();

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
    window.bsModal.show();
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
    window.bsModal.show();
  }

  function del(id) {
    return app.showConfirm('Excluir Card', 'Deseja excluir este card permanentemente?', 'danger').then(function (confirmed) {
      if (confirmed) {
        var d = dash();
        d.deleted.push(id);
        render();
        app.notifyChange();
        app.showToast('Card removido com sucesso.', 'info');
      }
    });
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

  /* ── Drag & Drop ───────────────────────── */
  function setupDragAndDrop() {
    var grid = document.getElementById('dynamic-cards');
    if (!grid) return;
    grid.ondragover = function (e) { e.preventDefault(); };
    grid.ondrop = function (e) {
      e.preventDefault();
      var draggedId = e.dataTransfer.getData('id');
      var target = e.target.closest('.card');
      if (target && target.dataset.id !== draggedId) {
        var cards = Array.from(grid.querySelectorAll('.card'));
        var currentIds = cards.map(function (f) { return f.dataset.id; });
        var fromIdx = currentIds.indexOf(draggedId);
        var toIdx = currentIds.indexOf(target.dataset.id);
        currentIds.splice(toIdx, 0, currentIds.splice(fromIdx, 1)[0]);
        dash().order = currentIds;
        render();
        app.notifyChange();
      }
    };
    grid.ondragstart = function (e) {
      var card = e.target.closest('.card');
      if (!card) return e.preventDefault();
      e.dataTransfer.setData('id', card.dataset.id);
      setTimeout(function () { card.classList.add('dragging'); }, 0);
    };
    grid.ondragend = function (e) {
      var card = e.target.closest('.card');
      if (card) card.classList.remove('dragging');
    };
  }

  app.render = render;
  app.edit = edit;
  app.del = del;
  app.copy = copy;
  app.closeModal = closeModal;
  app.toggleLinkField = toggleLinkField;
  app.openCreate = openCreate;
  app.saveCard = saveCard;
  app.setupDragAndDrop = setupDragAndDrop;
}(window.MainApp));

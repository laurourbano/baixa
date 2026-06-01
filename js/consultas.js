/**
 * consultas.js — Base de Conhecimento
 *
 * @module consultas
 * @description
 * Base de conhecimento completa com 9 seções e CRUD completo.
 *
 * Seções disponíveis:
 * - FAQ: perguntas frequentes em accordion com paginação (10 itens/página)
 * - Normas: legislação e normas de referência
 * - Protocolos: base e detalhados
 * - Piso: tabela de piso salarial
 * - Orientações: diretrizes gerais
 * - Listas: listas de referência
 * - Respostas Padrão: modelos de respostas
 * - Nomes Empresariais: lista de referência
 * - Cálculo de Horas: referências para cálculo
 *
 * Funcionalidades comuns a todas as seções:
 * - CRUD completo (adicionar, editar, excluir itens)
 * - Busca textual em tempo real
 * - Filtro por tipo/categoria (dropdown)
 * - Cópia individual por item
 * - Cópia em massa (todos os itens visíveis)
 * - Persistência: localStorage com fallback para JSON assets
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var loaded = {};
  var store = {};    // { faq:[], normas:[], protocolos:[], piso:{}, orientacoes:{}, listas:{} }
  var STORE_KEY = 'baixa_consultas_data';
  var FAQ_PAGE = 10, faqPage = 1, faqFiltered = [];

  /* ── Init ──────────────────────────────── */
  function initConsultas() {
    loadStore();
    var tabs = document.getElementById('consultasTabs');
    if (!tabs) return;

    tabs.addEventListener('shown.bs.tab', function (e) {
      var btn = e.target;
      var section = btn.getAttribute('data-section');
      if (!section || loaded[section]) return;
      loaded[section] = true;
      initSection(section);
    });

    // Carrega a primeira tab automaticamente
    var first = tabs.querySelector('.nav-link.active');
    if (first) {
      var sec = first.getAttribute('data-section');
      if (sec && !loaded[sec]) { loaded[sec] = true; initSection(sec); }
    }
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) store = JSON.parse(raw);
    } catch (e) { store = {}; }
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
  }

  /* ── Roteador ─────────────────────────── */
  function initSection(s) {
    switch (s) {
      case 'faq':          initFaq(); break;
      case 'normas':       initCrudSection('normas', 'Normas e Legislação', 'assets/consultas/normas.json', renderNormas, cfgNormas); break;
      case 'protocolos':   initCrudSection('protocolos', 'Protocolos', 'assets/consultas/protocolos-base.json', renderProtocolos, cfgProtocolos); break;
      case 'piso':         initPiso(); break;
      case 'orientacoes':  initOrientacoes(); break;
      case 'listas':       initListas(); break;
      case 'respostasPadrao': initRespostasPadrao(); break;
      case 'nomesEmpresariais': initNomesEmpresariais(); break;
      case 'calcHoras':    initCalcHoras(); break;
      case 'pisoRef':     initPisoRef(); break;
      case 'registros':   initRegistros(); break;
    }
  }

  /* ═══════════════════════════════════════════
     CRUD GENÉRICO (Normas, Protocolos, etc.)
     ═══════════════════════════════════════ */
  function initCrudSection(key, title, jsonUrl, renderFn, cfg) {
    var ph = document.querySelector('.c-placeholder[data-section="' + key + '"]');
    if (!ph) return;
    var panelId = 'c-data-' + key;

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<select id="' + panelId + '-dropdown" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:260px">' +
          '<option value="">Todos</option>' +
        '</select>' +
        '<input type="text" id="' + panelId + '-filter" class="form-control form-control-sm" placeholder="Buscar..." autocomplete="off" style="max-width:200px">' +
        '<button id="' + panelId + '-add" class="btn btn-sm btn-success flex-shrink-0"><i class="fas fa-plus"></i></button>' +
        '<button id="' + panelId + '-copyall" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
        '<span id="' + panelId + '-count" class="x-small text-muted align-self-center ms-auto"></span>' +
      '</div>' +
      '<div id="' + panelId + '-list" class="c-list" style="max-height:420px;overflow-y:auto"><p class="text-muted small p-2 text-center">Carregando...</p></div>';

    // Wire events
    var dropdown = document.getElementById(panelId + '-dropdown');
    var filter = document.getElementById(panelId + '-filter');
    var addBtn = document.getElementById(panelId + '-add');
    var copyBtn = document.getElementById(panelId + '-copyall');

    filter.addEventListener('input', function () { applyFilter(key, cfg); });
    dropdown.addEventListener('change', function () { applyFilter(key, cfg); });
    addBtn.addEventListener('click', function () { openEditor(key, null, cfg); });
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var data = store[key] || [];
        var ddVal = dropdown ? dropdown.value : '';
        var term = normalize(filter ? filter.value || '' : '');
        var filtered = data.filter(function (item) {
          if (ddVal && cfg.dropdownKey && cfg.dropdownKey(item) !== ddVal) return false;
          if (term && cfg.searchKeys) {
            var match = false;
            cfg.searchKeys.forEach(function (k) { if (normalize(item[k] || '').indexOf(term) > -1) match = true; });
            if (!match) return false;
          }
          return true;
        });
        if (!filtered.length) { app.showToast('Nenhum item para copiar.', 'warning', 2000); return; }
        var text = filtered.map(function (item) {
          if (cfg.copyFormat) return cfg.copyFormat(item);
          // Formato padrão: concatena valores de searchKeys
          return (cfg.searchKeys || Object.keys(item)).map(function (k) {
            return item[k] || '';
          }).filter(Boolean).join(' — ');
        }).join('\n');
        copyToClipboard(text);
        app.showToast(filtered.length + ' item(ns) copiado(s)!', 'success', 2000);
      });
    }

    // Carrega dados
    loadSectionData(key, jsonUrl, cfg.defaultItem, function (data) {
      populateDropdown(dropdown, data, cfg.dropdownKey);
      store[key] = data;
      saveStore();
      applyFilter(key, cfg);
    });
  }

  function loadSectionData(key, jsonUrl, defaultItem, callback, fallbackUrl) {
    // Prefere localStorage, fallback JSON
    if (store[key] && store[key].length) return callback(store[key]);

    function tryFetch(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        data = data.map(function (item, i) { item._id = item._id || (key + '_' + i); return item; });
        callback(data);
      });
    }

    tryFetch(jsonUrl).catch(function () {
      if (fallbackUrl) {
        tryFetch(fallbackUrl).catch(function () {
          callback(store[key] || []);
        });
      } else {
        callback(store[key] || []);
      }
    });
  }

  function populateDropdown(dd, data, keyFn) {
    if (!keyFn) { dd.style.display = 'none'; return; }
    dd.style.display = '';
    var vals = [];
    var seen = {};
    data.forEach(function (item) {
      var v = keyFn(item);
      if (v && !seen[v]) { seen[v] = true; vals.push(v); }
    });
    vals.sort();
    dd.innerHTML = '<option value="">Todos</option>' + vals.map(function (v) { return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; }).join('');
  }

  function applyFilter(key, cfg) {
    var panelId = 'c-data-' + key;
    var dropdown = document.getElementById(panelId + '-dropdown');
    var filter = document.getElementById(panelId + '-filter');
    var listEl = document.getElementById(panelId + '-list');
    if (!listEl) return;

    var data = store[key] || [];
    var ddVal = dropdown ? dropdown.value : '';
    var term = normalize(filter ? filter.value || '' : '');

    // Se não tem dropdown nem filter, mostra todos
    var filtered = data.filter(function (item) {
      if (ddVal && cfg.dropdownKey && cfg.dropdownKey(item) !== ddVal) return false;
      if (term && cfg.searchKeys) {
        var match = false;
        cfg.searchKeys.forEach(function (k) {
          if (normalize(item[k] || '').indexOf(term) > -1) match = true;
        });
        if (!match) return false;
      }
      return true;
    });

    if (!filtered.length) {
      listEl.innerHTML = '<p class="text-muted small p-2 text-center">Nenhum item encontrado.</p>';
    } else {
      listEl.innerHTML = cfg.renderList(filtered, key);
      wireCrudButtons(listEl, key, cfg);
    }

    var countEl = document.getElementById(panelId + '-count');
    if (countEl) countEl.textContent = filtered.length + ' de ' + data.length + ' itens';
  }

  function wireCrudButtons(container, key, cfg) {
    container.querySelectorAll('[data-c-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var data = store[key] || [];
        var id = this.getAttribute('data-c-copy');
        var item = data.find(function (x) { return x._id === id; });
        if (!item) return;
        var text = cfg.copyFormat ? cfg.copyFormat(item) : JSON.stringify(item);
        copyToClipboard(text);
        app.showToast('Copiado!', 'success', 1500);
      });
    });
    container.querySelectorAll('[data-c-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEditor(key, this.getAttribute('data-c-edit'), cfg); });
    });
    container.querySelectorAll('[data-c-del]').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteItem(key, this.getAttribute('data-c-del'), cfg); });
    });
  }

  function openEditor(key, id, cfg) {
    var data = store[key] || [];
    var item = id ? data.find(function (x) { return x._id === id; }) : null;

    var modal = new bootstrap.Modal(document.getElementById('faqEditorModal'));
    document.getElementById('faq-editor-title').textContent = id ? 'Editar ' + cfg.itemLabel : 'Novo ' + cfg.itemLabel;
    document.getElementById('faq-edit-id').value = id || '';

    // Esconde campos não usados e ajusta labels
    var tipoGroup = document.getElementById('faq-edit-tipo').closest('.col-md-4');
    var perguntaGroup = document.getElementById('faq-edit-pergunta').closest('.col-md-8');
    var respostaLabel = document.querySelector('label[for="faq-edit-resposta"]');
    var complementoLabel = document.querySelector('label[for="faq-edit-complemento"]');

    // Configura campos conforme cfg.fields
    if (cfg.fields) {
      // Campo tipo (dropdown)
      if (cfg.fields.tipo) {
        tipoGroup.style.display = '';
        var tipoEl = document.getElementById('faq-edit-tipo');
        var options = cfg.fields.tipo.options;
        // Se options é array vazio, popula com valores únicos dos dados
        if (!options || !options.length) {
          var seen = {};
          options = [];
          data.forEach(function (d) {
            var v = d[cfg.fields.tipo.key];
            if (v && !seen[v]) { seen[v] = true; options.push(v); }
          });
          options.sort();
        }
        tipoEl.innerHTML = options.map(function (o) {
          return '<option value="' + o + '">' + o + '</option>';
        }).join('');
        var tipoVal = item ? (item[cfg.fields.tipo.key] || '') : (options[0] || '');
        tipoEl.value = tipoVal;
      } else {
        tipoGroup.style.display = 'none';
      }

      // Campo pergunta/nome
      if (cfg.fields.pergunta) {
        perguntaGroup.style.display = '';
        document.querySelector('label[for="faq-edit-pergunta"]').textContent = cfg.fields.pergunta.label;
        document.getElementById('faq-edit-pergunta').value = item ? (item[cfg.fields.pergunta.key] || '') : '';
      } else {
        perguntaGroup.style.display = 'none';
      }

      // Campo resposta
      if (cfg.fields.resposta) {
        document.getElementById('faq-edit-resposta').closest('.mb-2').style.display = '';
        respostaLabel.textContent = cfg.fields.resposta.label;
        document.getElementById('faq-edit-resposta').value = item ? (item[cfg.fields.resposta.key] || '') : '';
      } else {
        document.getElementById('faq-edit-resposta').closest('.mb-2').style.display = 'none';
      }

      // Campo complemento
      if (cfg.fields.complemento) {
        document.getElementById('faq-edit-complemento').closest('.mb-3').style.display = '';
        complementoLabel.textContent = cfg.fields.complemento.label;
        document.getElementById('faq-edit-complemento').value = item ? (item[cfg.fields.complemento.key] || '') : '';
      } else {
        document.getElementById('faq-edit-complemento').closest('.mb-3').style.display = 'none';
      }
    }

    // Salva o key atual para o save button
    document.getElementById('faqEditorModal')._sectionKey = key;
    document.getElementById('faqEditorModal')._sectionCfg = cfg;

    // Override do save button
    var saveBtn = document.getElementById('faq-save-btn');
    var newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.addEventListener('click', function () { saveCrudItem(key, cfg); });

    modal.show();
  }

  function saveCrudItem(key, cfg) {
    var id = document.getElementById('faq-edit-id').value;
    var data = store[key] || [];

    var newItem = {};
    if (cfg.fields.tipo) {
      newItem[cfg.fields.tipo.key || 'tipo'] = document.getElementById('faq-edit-tipo').value;
    }
    if (cfg.fields.pergunta) {
      newItem[cfg.fields.pergunta.key] = document.getElementById('faq-edit-pergunta').value.trim();
    }
    if (cfg.fields.resposta) {
      newItem[cfg.fields.resposta.key] = document.getElementById('faq-edit-resposta').value.trim();
    }
    if (cfg.fields.complemento) {
      newItem[cfg.fields.complemento.key] = document.getElementById('faq-edit-complemento').value.trim();
    }

    if (id) {
      var idx = data.findIndex(function (x) { return x._id === id; });
      if (idx >= 0) {
        Object.keys(newItem).forEach(function (k) { data[idx][k] = newItem[k]; });
      }
    } else {
      newItem._id = key + '_' + Date.now();
      data.push(newItem);
    }

    store[key] = data;
    saveStore();
    applyFilter(key, cfg);
    bootstrap.Modal.getInstance(document.getElementById('faqEditorModal')).hide();
    app.showToast(id ? 'Item atualizado!' : 'Novo item adicionado!', 'success', 2000);
  }

  function deleteItem(key, id, cfg) {
    showConfirm('Excluir ' + cfg.itemLabel,
      'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
      'fa-trash-alt',
      function () {
        store[key] = (store[key] || []).filter(function (x) { return x._id !== id; });
        saveStore();
        applyFilter(key, cfg);
        app.showToast(cfg.itemLabel + ' excluído!', 'success', 2000);
      });
  }

  /* ── Configurações por seção ──────────── */
  var cfgNormas = {
    itemLabel: 'Norma',
    dropdownKey: function (item) { return item.orgao; },
    searchKeys: ['norma', 'assunto', 'orgao'],
    copyFormat: function (item) { return item.norma + ' (' + item.orgao + '): ' + item.assunto + (item.link ? ' — ' + item.link : ''); },
    fields: {
      tipo:       { key: 'orgao', options: ['ANVISA','CFF','CRF','STJ','CFQ','PLANALTO','CURITIBA','SESA'] },
      pergunta:   { key: 'norma', label: 'Nome da Norma' },
      resposta:   { key: 'assunto', label: 'Assunto' },
      complemento:{ key: 'link', label: 'Link' }
    },
    renderList: function (data, key) {
      return data.map(function (n) {
        return '<div class="c-item mb-2 p-2 rounded border border-secondary bg-dark bg-opacity-10">' +
          '<div class="d-flex justify-content-between align-items-start">' +
          '<div class="flex-grow-1"><div class="small fw-bold text-light">' + escapeHtml(n.norma) + getLinkHtml(n) + '</div>' +
          '<div class="x-small text-muted">' + escapeHtml(n.assunto) + '</div></div>' +
          '<div class="btn-group btn-group-sm ms-2 flex-shrink-0">' +
          '<span class="badge bg-secondary me-1">' + escapeHtml(n.orgao) + '</span>' +
          '<button class="btn btn-sm btn-outline-secondary py-0 px-1" data-c-copy="' + n._id + '" title="Copiar"><i class="fas fa-copy x-small"></i></button>' +
          '<button class="btn btn-sm btn-outline-warning py-0 px-1" data-c-edit="' + n._id + '" title="Editar"><i class="fas fa-edit x-small"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger py-0 px-1" data-c-del="' + n._id + '" title="Excluir"><i class="fas fa-trash x-small"></i></button>' +
          '</div></div></div>';
      }).join('');
    }
  };

  var cfgProtocolos = {
    itemLabel: 'Protocolo',
    dropdownKey: function (item) { return item.estabelecimento; },
    searchKeys: ['protocolo', 'estabelecimento', 'status'],
    copyFormat: function (item) { return item.protocolo + ' — ' + item.estabelecimento + (item.status ? ' [' + item.status + ']' : ''); },
    fields: {
      tipo:       { key: 'estabelecimento', options: [] }, // populado dinamicamente
      pergunta:   { key: 'protocolo', label: 'Nome do Protocolo' },
      resposta:   { key: 'status', label: 'Status' },
      complemento:{ key: 'estabelecimento', label: 'Tipo de Estabelecimento' }
    },
    renderList: function (data, key) {
      return data.map(function (p) {
        var badge = p.status ? '<span class="badge bg-' + getStatusColor(p.status) + ' x-small me-1">' + escapeHtml(p.status) + '</span>' : '';
        return '<div class="c-item mb-2 p-2 rounded border border-secondary bg-dark bg-opacity-10">' +
          '<div class="d-flex justify-content-between align-items-start">' +
          '<div class="flex-grow-1"><div class="small fw-bold text-light">' + escapeHtml(p.protocolo) + '</div>' +
          '<div class="x-small text-muted">' + escapeHtml(p.estabelecimento) + '</div></div>' +
          '<div class="btn-group btn-group-sm ms-2 flex-shrink-0">' + badge +
          '<button class="btn btn-sm btn-outline-secondary py-0 px-1" data-c-copy="' + p._id + '" title="Copiar"><i class="fas fa-copy x-small"></i></button>' +
          '<button class="btn btn-sm btn-outline-warning py-0 px-1" data-c-edit="' + p._id + '" title="Editar"><i class="fas fa-edit x-small"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger py-0 px-1" data-c-del="' + p._id + '" title="Excluir"><i class="fas fa-trash x-small"></i></button>' +
          '</div></div></div>';
      }).join('');
    }
  };

  function renderNormas(data, key) { return cfgNormas.renderList(data, key); }

  // Mapeamento de órgãos para URLs oficiais
  var ORGAO_LINKS = {
    'ANVISA':   'https://antigo.anvisa.gov.br/legislacao',
    'CFF':      'https://site.cff.org.br/',
    'CRF':      'https://www.crf-pr.org.br/',
    'STJ':      'https://www.stj.jus.br/',
    'CFQ':      'https://cfq.org.br/',
    'PLANALTO': 'https://www.planalto.gov.br/',
    'CURITIBA': 'https://www.curitiba.pr.gov.br/',
    'SESA':     'https://www.saude.pr.gov.br/',
    'LEI':      'https://www.planalto.gov.br/'
  };

  function getLinkHtml(n) {
    // Se o campo link é uma URL real (contém http), usa ela
    if (n.link && /^https?:\/\//i.test(n.link)) {
      return ' <a href="' + escapeHtml(n.link) + '" target="_blank" rel="noopener" class="x-small text-info" title="Abrir link"><i class="fas fa-external-link-alt"></i></a>';
    }
    // Se o link (ou órgão) tem um mapeamento de URL
    var org = n.link || n.orgao;
    if (org && ORGAO_LINKS[org]) {
      return ' <a href="' + ORGAO_LINKS[org] + '" target="_blank" rel="noopener" class="x-small text-info" title="Site ' + escapeHtml(org) + '"><i class="fas fa-external-link-alt"></i></a>';
    }
    // Sem link: mostra badge do órgão (já renderizado separadamente)
    return '';
  }
  function renderProtocolos(data, key) { return cfgProtocolos.renderList(data, key); }

  /* ═══════════════════════════════════════════
     FAQ (especial: paginação + tipo PF/PJ)
     ═══════════════════════════════════════ */
  function initFaq() {
    var ph = document.querySelector('.c-placeholder[data-section="faq"]');
    if (!ph) return;

    ph.innerHTML =
      '<div class="row g-2 mb-2">' +
        '<div class="col-md-3"><select id="faq-dropdown" class="form-select form-select-sm bg-dark text-light border-secondary">' +
          '<option value="">Todos os tipos</option><option value="PF">PF</option><option value="PJ">PJ</option><option value="PJ/PF">PJ/PF</option></select></div>' +
        '<div class="col-md-4"><input type="text" id="faq-filter" class="form-control form-control-sm" placeholder="Buscar pergunta ou palavra-chave..." autocomplete="off"></div>' +
        '<div class="col-md-3"><button id="faq-add" class="btn btn-sm btn-success w-100"><i class="fas fa-plus me-1"></i> Nova Resposta</button></div>' +
        '<div class="col-md-2"><button id="faq-copyall" class="btn btn-sm btn-outline-info w-100"><i class="fas fa-copy me-1"></i> Copiar</button></div>' +
      '</div>' +
      '<div id="faq-list" class="c-list" style="max-height:460px;overflow-y:auto"><p class="text-muted small p-2 text-center">Carregando...</p></div>' +
      '<div id="faq-pagination" class="d-none d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary">' +
        '<small id="faq-page-info" class="text-muted"></small>' +
        '<div class="btn-group btn-group-sm">' +
          '<button id="faq-prev" class="btn btn-outline-secondary"><i class="fas fa-chevron-left"></i></button>' +
          '<button id="faq-next" class="btn btn-outline-secondary"><i class="fas fa-chevron-right"></i></button>' +
        '</div></div>';

    document.getElementById('faq-dropdown').addEventListener('change', faqRefresh);
    document.getElementById('faq-filter').addEventListener('input', faqRefresh);
    document.getElementById('faq-add').addEventListener('click', function () { openFaqEditor(); });
    document.getElementById('faq-copyall').addEventListener('click', copyAllFaq);
    document.getElementById('faq-prev').addEventListener('click', function () { if (faqPage > 1) { faqPage--; faqRender(); faqRenderPagination(); } });
    document.getElementById('faq-next').addEventListener('click', function () {
      var t = Math.ceil(faqFiltered.length / FAQ_PAGE) || 1;
      if (faqPage < t) { faqPage++; faqRender(); faqRenderPagination(); }
    });

    loadSectionData('faq', 'assets/consultas/faq.json', { tipo: 'PF', pergunta: '', resposta: '', complemento: '' }, function (data) {
      store.faq = data;
      saveStore();
      faqRefresh();
    }, 'assets/consultas/respostas.json');
  }

  function faqRefresh() {
    faqPage = 1;
    var tipo = document.getElementById('faq-dropdown').value;
    var term = normalize(document.getElementById('faq-filter').value || '');
    faqFiltered = (store.faq || []).filter(function (r) {
      return (!tipo || r.tipo === tipo) && (!term || normalize(r.pergunta).indexOf(term) > -1 || normalize(r.resposta).indexOf(term) > -1);
    });
    faqRender();
    faqRenderPagination();
  }

  function faqRender() {
    var el = document.getElementById('faq-list');
    if (!el) return;
    if (!faqFiltered.length) { el.innerHTML = '<p class="text-muted small p-2 text-center">Nenhum resultado.</p>'; return; }
    var start = (faqPage - 1) * FAQ_PAGE, end = Math.min(start + FAQ_PAGE, faqFiltered.length);
    var page = faqFiltered.slice(start, end);

    el.innerHTML = '<div class="accordion faq-accordion" id="faqAccordion' + faqPage + '">' + page.map(function (r, i) {
      var uid = 'faq-' + faqPage + '-' + i;
      var comp = r.complemento ? '<div class="faq-complemento mt-2 p-2 border-start border-info border-2 bg-dark bg-opacity-25 small text-muted">' +
        escapeHtml(r.complemento).replace(/\r\n/g,'<br>').replace(/\n/g,'<br>') + '</div>' : '';
      return '<div class="accordion-item bg-transparent border-secondary mb-1">' +
        '<h2 class="accordion-header">' +
          '<button class="accordion-button collapsed bg-dark bg-opacity-50 text-light small fw-bold py-2" type="button" data-bs-toggle="collapse" data-bs-target="#' + uid + '">' +
            '<span class="badge bg-' + (r.tipo==='PF'?'primary':r.tipo==='PJ'?'success':'info') + ' me-2 flex-shrink-0">' + escapeHtml(r.tipo) + '</span>' +
            '<span class="flex-grow-1 text-start">' + escapeHtml(r.pergunta) + '</span>' +
          '</button>' +
        '</h2>' +
        '<div id="' + uid + '" class="accordion-collapse collapse" data-bs-parent="#faqAccordion' + faqPage + '">' +
          '<div class="accordion-body bg-dark bg-opacity-25 py-2 px-3 small text-light">' +
            '<div class="mb-2">' + autoLink(r.resposta).replace(/\r\n/g,'<br>').replace(/\n/g,'<br>') + '</div>' + comp +
            '<div class="d-flex gap-1 mt-2 pt-2 border-top border-secondary">' +
              '<button class="btn btn-sm btn-outline-warning py-0 px-2" data-c-edit="' + r._id + '"><i class="fas fa-edit x-small"></i> Editar</button>' +
              '<button class="btn btn-sm btn-outline-danger py-0 px-2" data-c-del="' + r._id + '"><i class="fas fa-trash x-small"></i> Excluir</button>' +
              '<button class="btn btn-sm btn-outline-secondary py-0 px-2" data-faq-copy="' + r._id + '"><i class="fas fa-copy x-small"></i> Copiar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';

    el.querySelectorAll('[data-c-edit]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openFaqEditor(this.getAttribute('data-c-edit')); }); });
    el.querySelectorAll('[data-c-del]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); deleteFaqItem(this.getAttribute('data-c-del')); }); });
    el.querySelectorAll('[data-faq-copy]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); copyFaqById(this.getAttribute('data-faq-copy')); }); });
    el.scrollTop = 0;
  }

  function faqRenderPagination() {
    var pag = document.getElementById('faq-pagination'), info = document.getElementById('faq-page-info');
    if (!pag) return;
    var t = Math.ceil(faqFiltered.length / FAQ_PAGE) || 1;
    if (faqFiltered.length <= FAQ_PAGE) { pag.classList.add('d-none'); return; }
    pag.classList.remove('d-none');
    info.textContent = 'Página ' + faqPage + ' de ' + t + ' (' + faqFiltered.length + ' itens)';
    document.getElementById('faq-prev').disabled = faqPage <= 1;
    document.getElementById('faq-next').disabled = faqPage >= t;
  }

  function openFaqEditor(id) {
    var data = store.faq || [];
    var item = id ? data.find(function (x) { return x._id === id; }) : null;
    var modal = new bootstrap.Modal(document.getElementById('faqEditorModal'));

    // Restaura campos para modo FAQ
    document.getElementById('faq-edit-tipo').closest('.col-md-4').style.display = '';
    document.getElementById('faq-edit-pergunta').closest('.col-md-8').style.display = '';
    document.getElementById('faq-edit-resposta').closest('.mb-2').style.display = '';
    document.getElementById('faq-edit-complemento').closest('.mb-3').style.display = '';

    document.getElementById('faq-editor-title').textContent = id ? 'Editar Resposta' : 'Nova Resposta';
    document.getElementById('faq-edit-id').value = id || '';
    document.getElementById('faq-edit-tipo').innerHTML = '<option value="PF">PF</option><option value="PJ">PJ</option><option value="PJ/PF">PJ/PF</option>';
    document.getElementById('faq-edit-tipo').value = item ? item.tipo : 'PF';
    document.querySelector('label[for="faq-edit-pergunta"]').textContent = 'Pergunta';
    document.getElementById('faq-edit-pergunta').value = item ? item.pergunta : '';
    document.querySelector('label[for="faq-edit-resposta"]').textContent = 'Resposta';
    document.getElementById('faq-edit-resposta').value = item ? item.resposta : '';
    document.querySelector('label[for="faq-edit-complemento"]').textContent = 'Complemento (opcional)';
    document.getElementById('faq-edit-complemento').value = item ? (item.complemento || '') : '';

    var saveBtn = document.getElementById('faq-save-btn');
    var newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.addEventListener('click', saveFaqItem);

    modal.show();
    setTimeout(function () { document.getElementById('faq-edit-pergunta').focus(); }, 400);
  }

  function saveFaqItem() {
    var id = document.getElementById('faq-edit-id').value;
    var item = {
      tipo: document.getElementById('faq-edit-tipo').value,
      pergunta: document.getElementById('faq-edit-pergunta').value.trim(),
      resposta: document.getElementById('faq-edit-resposta').value.trim(),
      complemento: document.getElementById('faq-edit-complemento').value.trim()
    };
    if (!item.pergunta) { app.showToast('Pergunta obrigatória.', 'warning', 2000); return; }
    if (!item.resposta) { app.showToast('Resposta obrigatória.', 'warning', 2000); return; }

    var data = store.faq || [];
    if (id) {
      var idx = data.findIndex(function (x) { return x._id === id; });
      if (idx >= 0) { data[idx].tipo = item.tipo; data[idx].pergunta = item.pergunta; data[idx].resposta = item.resposta; data[idx].complemento = item.complemento; }
    } else {
      item._id = 'faq_' + Date.now();
      data.push(item);
    }
    store.faq = data;
    saveStore();
    faqRefresh();
    bootstrap.Modal.getInstance(document.getElementById('faqEditorModal')).hide();
    app.showToast(id ? 'Resposta atualizada!' : 'Nova resposta adicionada!', 'success', 2000);
  }

  function deleteFaqItem(id) {
    showConfirm('Excluir Resposta', 'Tem certeza que deseja excluir esta resposta?', 'fa-trash-alt', function () {
      store.faq = (store.faq || []).filter(function (x) { return x._id !== id; });
      saveStore();
      faqRefresh();
      app.showToast('Resposta excluída!', 'success', 2000);
    });
  }

  function copyFaqById(id) {
    var item = (store.faq || []).find(function (x) { return x._id === id; });
    if (!item) return;
    copyToClipboard(item.resposta + (item.complemento ? '\n\n' + item.complemento : ''));
    app.showToast('Resposta copiada!', 'success', 1500);
  }

  function copyAllFaq() {
    if (!faqFiltered.length) { app.showToast('Nenhuma resposta.', 'warning', 2000); return; }
    var text = faqFiltered.map(function (r) { return '[' + r.tipo + '] ' + r.pergunta + '\n' + r.resposta + (r.complemento ? '\n\n' + r.complemento : ''); }).join('\n\n---\n\n');
    copyToClipboard(text);
    app.showToast(faqFiltered.length + ' resposta(s) copiada(s)!', 'success', 2000);
  }

  /* ═══════════════════════════════════════════
     PISO (calculadora + cidades Paraná + alerta acordo)
     ═══════════════════════════════════════ */

  function initPiso() {
    var ph = document.querySelector('.c-placeholder[data-section="piso"]');
    if (!ph) return;

    ph.innerHTML =
      '<div class="row g-2 mb-2">' +
        '<div class="col-md-4"><label class="x-small text-muted">Cidade</label>' +
          '<input type="text" id="piso-cidade-filter" class="form-control form-control-sm bg-dark text-light border-secondary" ' +
            'placeholder="Digite para filtrar..." autocomplete="off">' +
          '<select id="piso-cidade-select" class="form-select form-select-sm bg-dark text-light border-secondary mt-1" size="4"></select></div>' +
        '<div class="col-md-2"><label class="x-small text-muted">Região</label>' +
          '<input type="text" id="piso-regiao-display" class="form-control form-control-sm bg-dark text-light border-secondary" readonly></div>' +
        '<div class="col-md-2"><label class="x-small text-muted">Categoria</label>' +
          '<select id="piso-categoria" class="form-select form-select-sm bg-dark text-light border-secondary">' +
            '<option value="varejista">Varejista</option><option value="hospitalar">Hospitalar</option>' +
            '<option value="distribuidora">Distribuidora</option><option value="laboratorios">Laboratórios</option>' +
            '<option value="industrias">Indústrias</option></select></div>' +
        '<div class="col-md-2"><label class="x-small text-muted">Piso Base R$</label>' +
          '<div class="input-group input-group-sm">' +
            '<input id="piso-base" type="text" class="form-control bg-dark text-light border-secondary" readonly>' +
            '<button id="piso-edit-val" class="btn btn-outline-warning" title="Editar valor"><i class="fas fa-edit"></i></button>' +
          '</div></div>' +
        '<div class="col-md-2"><label class="x-small text-muted">Hrs Semana</label>' +
          '<input id="piso-horas" type="number" value="44" min="1" max="44" class="form-control form-control-sm bg-dark text-light border-secondary"></div>' +
      '</div>' +
      '<div class="d-flex flex-wrap gap-2 mb-2 align-items-center">' +
        '<button id="piso-calc" class="btn btn-sm btn-danger"><i class="fas fa-calculator me-1"></i> Calcular</button>' +
        '<button id="piso-save-val" class="btn btn-sm btn-outline-success"><i class="fas fa-save me-1"></i> Salvar valor</button>' +
        '<button id="piso-add-cidade" class="btn btn-sm btn-outline-primary"><i class="fas fa-plus me-1"></i> Add Cidade</button>' +
        '<button id="piso-del-cidade" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash me-1"></i> Remover</button>' +
        '<span id="piso-acordo-badge" class="badge bg-success ms-2 d-none">ACT Vigente</span>' +
        '<span id="piso-acordo-alerta" class="badge bg-warning text-dark ms-2 d-none">Sem ACT - piso geral</span>' +
        '<span id="piso-cct-ano" class="badge ms-2 d-none"></span>' +
      '</div>' +
      '<div id="piso-result" class="small d-flex flex-wrap gap-2 p-2 bg-dark bg-opacity-25 rounded border border-secondary mb-2">' +
        '<span>Piso Proporcional: <b id="piso-prop" class="text-success">—</b></span>' +
        '<span class="ms-3">Valor/Hora: <b id="piso-hora" class="text-info">—</b></span>' +
        '<span class="ms-3">Ref. 30h: <b id="piso-30h" class="text-warning">—</b></span>' +
        '<button id="piso-copy-result" class="btn btn-sm btn-outline-info ms-2 flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
      '</div>' +
      '<div id="piso-tabela" class="c-list" style="max-height:250px;overflow-y:auto"></div>';

    // Carrega cidades e piso em paralelo
    var cidadesLoaded = false, pisoLoaded = false;
    var cidadesData = [];

    // Tenta JSON dedicado, fallback para store.piso.regioes
    fetch('assets/piso/cidades-parana.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cidadesData = data.cidades || [];
        store._cidadesPR = data;
        saveStore();
        cidadesLoaded = true;
        if (pisoLoaded) initPisoReady();
      })
      .catch(function () {
        cidadesLoaded = true;
        if (pisoLoaded) initPisoReady();
      });

    loadSectionDataPiso(function () {
      pisoLoaded = true;
      if (cidadesLoaded) initPisoReady();
    });

    function initPisoReady() {
      var selectEl = document.getElementById('piso-cidade-select');
      var filterEl = document.getElementById('piso-cidade-filter');

      // Se não tem cidades do JSON, extrai do store.piso
      if (!cidadesData.length && store.piso && store.piso.regioes) {
        Object.keys(store.piso.regioes).forEach(function (regiao) {
          var cids = store.piso.regioes[regiao].cidades || {};
          Object.keys(cids).forEach(function (cid) {
            var label = cid.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
            cidadesData.push({ cidade: cid, regiao: regiao, label: label });
          });
        });
      }

      // Popula select com todas as cidades
      if (selectEl) {
        selectEl.innerHTML = cidadesData.map(function (c) {
          return '<option value="' + c.label + '" data-regiao="' + c.regiao + '">' + c.label + '</option>';
        }).join('');
      }

      renderPisoTabelaTodas();

      document.getElementById('piso-calc').addEventListener('click', calcularPiso);
      document.getElementById('piso-save-val').addEventListener('click', savePisoValue);
      document.getElementById('piso-edit-val').addEventListener('click', function () {
        var input = document.getElementById('piso-base');
        input.removeAttribute('readonly');
        input.type = 'number';
        input.step = '0.01';
        input.focus();
        input.select();
        function finish() {
          input.setAttribute('readonly', 'readonly');
          input.type = 'text';
          var val = parseFloat(input.value) || 0;
          input.value = 'R$ ' + val.toFixed(2);
          calcularPiso();
        }
        input.addEventListener('blur', finish, { once: true });
        input.addEventListener('keypress', function (e) { if (e.key === 'Enter') { input.blur(); } });
      });
      document.getElementById('piso-add-cidade').addEventListener('click', addPisoCidade);
      document.getElementById('piso-del-cidade').addEventListener('click', delPisoCidade);
      document.getElementById('piso-categoria').addEventListener('change', function () {
        if (selectEl.value) onCidadeSelectChange();
      });

      // Filtro de cidades: ao digitar, filtra o select
      filterEl.addEventListener('input', function () {
        var term = normalize(filterEl.value);
        var options = selectEl.querySelectorAll('option');
        options.forEach(function (opt) {
          opt.style.display = !term || normalize(opt.value).indexOf(term) > -1 ? '' : 'none';
        });
      });

      // Ao selecionar cidade, carrega dados
      selectEl.addEventListener('change', onCidadeSelectChange);

      // Se já tem valor, dispara
      if (selectEl.value) onCidadeSelectChange();

      // Botão copiar resultado
      document.getElementById('piso-copy-result').addEventListener('click', function () {
        var prop = document.getElementById('piso-prop').textContent;
        var hora = document.getElementById('piso-hora').textContent;
        var ref30 = document.getElementById('piso-30h').textContent;
        var cidade = document.getElementById('piso-cidade-select').value || '';
        var cat = document.getElementById('piso-categoria').value;
        var catLabel = document.getElementById('piso-categoria').selectedOptions[0].textContent;
        var pisoBase = document.getElementById('piso-base').value;
        var text = 'Cidade: ' + cidade + '\nCategoria: ' + catLabel + '\nPiso Base: ' + pisoBase +
          '\nPiso Proporcional: ' + prop + '\nValor/Hora: ' + hora + '\nRef. 30h: ' + ref30;
        copyToClipboard(text);
        app.showToast('Resultado copiado!', 'success', 1500);
      });
    }
  }

  function onCidadeSelectChange() {
    var selectEl = document.getElementById('piso-cidade-select');
    var nome = selectEl.value;
    if (!nome) return;

    var cidadeKey = nome.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z0-9_]/g, '');

    // Varre store.piso.regioes para encontrar a cidade e sua região
    var regiaoNome = '', catValues = null;
    if (store.piso && store.piso.regioes) {
      Object.keys(store.piso.regioes).forEach(function (r) {
        var cids = store.piso.regioes[r].cidades || {};
        if (cids[cidadeKey]) {
          regiaoNome = r;
          catValues = cids[cidadeKey];
        }
      });
    }

    // Fallback: primeira cidade da primeira região
    if (!regiaoNome && store.piso && store.piso.regioes) {
      var regioes = Object.keys(store.piso.regioes);
      if (regioes.length) {
        regiaoNome = regioes[0];
        var primeiraReg = store.piso.regioes[regiaoNome];
        if (primeiraReg && primeiraReg.cidades) {
          catValues = Object.values(primeiraReg.cidades)[0];
        }
      }
    }

    document.getElementById('piso-regiao-display').value = regiaoNome || '—';

    if (regiaoNome && store.piso && store.piso.regioes) {
      var regData = store.piso.regioes[regiaoNome];
      if (!regData) { regData = { _actVigente: false, cidades: {} }; store.piso.regioes[regiaoNome] = regData; }

      var cat = document.getElementById('piso-categoria').value;
      document.getElementById('piso-acordo-badge').classList.toggle('d-none', !regData._actVigente);
      document.getElementById('piso-acordo-alerta').classList.toggle('d-none', regData._actVigente);

      // Exibe ano da CCT vigente com destaque se diferente do ano atual
      var cctAno = regData._ultimaCCT || '';
      var cctBadge = document.getElementById('piso-cct-ano');
      if (cctAno) {
        var anoAtual = new Date().getFullYear();
        var cctFim = parseInt(cctAno.split('-').pop()) || anoAtual;
        var desatualizada = cctFim < anoAtual;
        cctBadge.className = 'badge ms-2 ' + (desatualizada ? 'bg-danger' : 'bg-info');
        cctBadge.innerHTML = '<i class="fas fa-' + (desatualizada ? 'exclamation-triangle' : 'check-circle') + ' me-1"></i>CCT ' + cctAno;
        if (desatualizada) cctBadge.title = 'CCT desatualizada! Último acordo: ' + cctAno + '. Verifique nova convenção no SINDIFAR-PR.';
        cctBadge.classList.remove('d-none');
      } else {
        cctBadge.classList.add('d-none');
      }

      var catValue = catValues ? catValues[cat] : null;
      if (!catValue && regData.cidades) {
        var primeira = Object.values(regData.cidades)[0];
        if (primeira) catValue = primeira[cat];
      }
      if (!catValue && store.piso.regioes["Curitiba e RMC"] && store.piso.regioes["Curitiba e RMC"].cidades["curitiba"]) {
        catValue = store.piso.regioes["Curitiba e RMC"].cidades["curitiba"][cat];
      }

      document.getElementById('piso-base').value = 'R$ ' + (catValue || 0).toFixed(2);
      renderPisoTabela(regiaoNome, cidadeKey);
    } else {
      document.getElementById('piso-base').value = 'R$ 0,00';
    }

    calcularPiso();
  }

  function onPisoCategoriaChange() {
    var selectEl = document.getElementById('piso-cidade-select');
    if (selectEl.value) onCidadeSelectChange();
  }

  function defaultPisoData() {
    return {
      regioes: {
        "Curitiba e RMC": {
          _actVigente: true,
          cidades: {
            "curitiba": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "sao_jose_dos_pinhais": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "colombo": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "araucaria": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "pinhais": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "campo_largo": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "almete_tamandare": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "piraquara": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "fazenda_rio_grande": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "lapa": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "campina_grande_do_sul": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "quatro_barras": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "paranagua": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "guaratuba": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 },
            "matinhos": { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 }
          }
        },
        "Londrina e Norte Central": {
          _actVigente: true,
          cidades: {
            "londrina": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "apucarana": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "arapongas": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "cambe": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "rolandia": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "ibipora": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "cornelio_procopio": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "bandeirantes": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "jacarezinho": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 },
            "santo_antonio_da_platina": { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 }
          }
        },
        "Maringá e Noroeste": {
          _actVigente: true,
          cidades: {
            "maringa": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "umuarama": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "paranavai": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "cianorte": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "campo_mourao": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "sarandi": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "loanda": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 },
            "nova_esperanca": { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 }
          }
        },
        "Ponta Grossa e Campos Gerais": {
          _actVigente: true,
          cidades: {
            "ponta_grossa": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 },
            "castro": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 },
            "telemaco_borba": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 },
            "jaguariaiva": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 },
            "palmeira": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 },
            "tibagi": { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 }
          }
        },
        "Cascavel e Oeste": {
          _actVigente: true,
          cidades: {
            "cascavel": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "foz_do_iguacu": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "toledo": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "marechal_candido_rondon": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "medianeira": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "palotina": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "guaira": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 },
            "santa_helena": { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 }
          }
        },
        "Francisco Beltrão e Sudoeste": {
          _actVigente: true,
          cidades: {
            "francisco_beltrao": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 },
            "pato_branco": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 },
            "dois_vizinhos": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 },
            "palmas": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 },
            "coronel_vivida": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 },
            "chopinzinho": { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 }
          }
        },
        "Guarapuava e Centro-Sul": {
          _actVigente: true,
          cidades: {
            "guarapuava": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 },
            "pitanga": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 },
            "laranjeiras_do_sul": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 },
            "prudentopolis": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 },
            "irati": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 },
            "uniao_da_vitoria": { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 }
          }
        }
      }
    };
  }

  function loadSectionDataPiso(cb) {
    // Verifica se cache tem dados realmente diferentes por região
    var cached = store.piso;
    if (cached && cached.regioes) {
      var regNames = Object.keys(cached.regioes);
      if (regNames.length > 1) {
        var firstVal = null, allSame = true;
        regNames.forEach(function (r) {
          var cids = cached.regioes[r].cidades;
          var v = cids && Object.values(cids)[0] ? Object.values(cids)[0].varejista : null;
          if (v) {
            if (firstVal === null) firstVal = v;
            else if (Math.abs(v - firstVal) > 1) allSame = false;
          }
        });
        if (!allSame) return cb(); // Dados já estão diferenciados
      }
    }
    // Cache inválido ou dados antigos: recarrega
    delete store.piso;

    fetch('assets/piso/piso.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.regioes) {
          store.piso = defaultPisoData();
        } else {
          store.piso = data;
        }
        saveStore();
        cb();
      })
      .catch(function () {
        store.piso = defaultPisoData();
        saveStore();
        cb();
      });
  }

  function renderPisoTabelaTodas() {
    if (!store.piso || !store.piso.regioes) return;
    var el = document.getElementById('piso-tabela');
    if (!el) return;

    var cats = ['varejista', 'hospitalar', 'distribuidora', 'laboratorios', 'industrias'];
    var catLabels = { varejista: 'Varejista', hospitalar: 'Hospitalar', distribuidora: 'Distribuidora', laboratorios: 'Laboratórios', industrias: 'Indústrias' };

    var html = '<table class="table table-sm table-dark table-borderless mb-0 x-small">';
    html += '<thead><tr><th>Região</th><th>ACT</th>';
    cats.forEach(function (c) { html += '<th class="text-end">' + catLabels[c] + '</th>'; });
    html += '</tr></thead><tbody>';

    Object.keys(store.piso.regioes).sort().forEach(function (regiao) {
      var rd = store.piso.regioes[regiao];
      var primeira = rd.cidades ? Object.values(rd.cidades)[0] : null;
      if (!primeira) return;
      var actBadge = rd._actVigente ? '<span class="badge bg-success x-small">Sim</span>' : '<span class="badge bg-warning text-dark x-small">Não</span>';
      var cctInfo = '';
      if (rd._ultimaCCT) {
        var anoAtual = new Date().getFullYear();
        var cctFim = parseInt(rd._ultimaCCT.split('-').pop()) || anoAtual;
        var desatualizada = cctFim < anoAtual;
        cctInfo = ' <span class="badge ' + (desatualizada ? 'bg-danger' : 'bg-info') + ' x-small" title="' + (desatualizada ? 'CCT desatualizada!' : 'CCT vigente') + '">' + rd._ultimaCCT + '</span>';
      }
      html += '<tr><td>' + escapeHtml(regiao) + '</td><td>' + actBadge + cctInfo + '</td>';
      cats.forEach(function (cat) {
        html += '<td class="text-end text-success">' + (primeira[cat] || 0).toFixed(2) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function renderPisoTabela(regiao, cidadeKey) {
    var el = document.getElementById('piso-tabela');
    if (!el) return;
    var regData = store.piso.regioes[regiao];
    if (!regData || !regData.cidades) { el.innerHTML = ''; return; }

    var cidades = Object.keys(regData.cidades).sort();
    var cats = ['varejista', 'hospitalar', 'distribuidora', 'laboratorios', 'industrias'];
    var catLabels = { varejista: 'Varejista', hospitalar: 'Hospitalar', distribuidora: 'Distribuidora', laboratorios: 'Laboratórios', industrias: 'Indústrias' };

    var actBadge = regData._actVigente ? '<span class="badge bg-success x-small">ACT Vigente</span>' : '<span class="badge bg-warning text-dark x-small">Geral</span>';
    var cctBadge = '';
    if (regData._ultimaCCT) {
      var anoAtual = new Date().getFullYear();
      var cctFim = parseInt(regData._ultimaCCT.split('-').pop()) || anoAtual;
      var desatualizada = cctFim < anoAtual;
      cctBadge = ' <span class="badge ' + (desatualizada ? 'bg-danger' : 'bg-info') + ' x-small">CCT ' + regData._ultimaCCT + '</span>';
    }
    var html = '<div class="d-flex justify-content-between align-items-center mb-1"><small class="fw-bold text-light">' + escapeHtml(regiao) + '</small><div>' + actBadge + cctBadge + '</div></div>';
    html += '<table class="table table-sm table-dark table-borderless mb-0 x-small">';
    html += '<thead><tr><th>Cidade</th>';
    cats.forEach(function (c) { html += '<th class="text-end">' + catLabels[c] + '</th>'; });
    html += '</tr></thead><tbody>';

    cidades.forEach(function (cid) {
      var cd = regData.cidades[cid];
      var label = cid.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
      var highlight = cid === cidadeKey ? ' class="table-active"' : '';
      html += '<tr' + highlight + '><td>' + label + '</td>';
      cats.forEach(function (cat) {
        html += '<td class="text-end text-success">' + (cd[cat] || 0).toFixed(2) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function savePisoValue() {
    var regiao = document.getElementById('piso-regiao-display').value;
    var selectEl = document.getElementById('piso-cidade-select');
    var nomeCidade = selectEl ? selectEl.value : '';
    var cat = document.getElementById('piso-categoria').value;
    var val = parseFloat(document.getElementById('piso-base').value.replace(/[R$\s]/g, '').replace(',', '.')) || 0;
    if (!regiao || !nomeCidade) { app.showToast('Selecione uma cidade primeiro.', 'warning', 2000); return; }

    var cidadeKey = nomeCidade.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z0-9_]/g, '');
    if (!store.piso.regioes[regiao]) store.piso.regioes[regiao] = { cidades: {}, _actVigente: false };
    if (!store.piso.regioes[regiao].cidades[cidadeKey]) store.piso.regioes[regiao].cidades[cidadeKey] = {};
    store.piso.regioes[regiao].cidades[cidadeKey][cat] = val;
    saveStore();
    renderPisoTabela(regiao, cidadeKey);
    app.showToast('Valor salvo!', 'success', 2000);
  }

  function addPisoCidade() {
    var regiao = document.getElementById('piso-regiao-display').value;
    if (!regiao) { app.showToast('Digite o nome de uma cidade existente para usar sua região.', 'warning', 2500); return; }
    showPrompt('Nova Cidade', 'Nome da nova cidade (ex: Sao Jose dos Pinhais):', '', function (nome) {
      if (!nome || !nome.trim()) return;
      var cidadeKey = nome.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z0-9_]/g, '');
      if (!store.piso.regioes[regiao]) store.piso.regioes[regiao] = { cidades: {}, _actVigente: false };
      if (store.piso.regioes[regiao].cidades[cidadeKey]) { app.showToast('Cidade já existe nesta região!', 'warning', 2000); return; }
      var primeira = Object.values(store.piso.regioes[regiao].cidades)[0] || { varejista: 4729.62, hospitalar: 4567, distribuidora: 4764, laboratorios: 3763.08, industrias: 4211.45 };
      store.piso.regioes[regiao].cidades[cidadeKey] = Object.assign({}, primeira);
      saveStore();
      document.getElementById('piso-cidade-filter').value = nome.trim();
      document.getElementById('piso-cidade-select').value = nome.trim();
      onCidadeSelectChange();
      app.showToast('Cidade adicionada!', 'success', 2000);
    });
  }

  function delPisoCidade() {
    var regiao = document.getElementById('piso-regiao-display').value;
    var selectEl = document.getElementById('piso-cidade-select');
    var nomeCidade = selectEl ? selectEl.value : '';
    if (!regiao || !nomeCidade) { app.showToast('Selecione uma cidade primeiro.', 'warning', 2000); return; }
    var cidadeKey = nomeCidade.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z0-9_]/g, '');
    if (!store.piso.regioes[regiao] || !store.piso.regioes[regiao].cidades[cidadeKey]) {
      app.showToast('Cidade não encontrada na região.', 'warning', 2000); return;
    }
    var cidades = Object.keys(store.piso.regioes[regiao].cidades);
    if (cidades.length <= 1) { app.showToast('Não é possível remover a única cidade da região.', 'warning', 3000); return; }
    showConfirm('Remover Cidade',
      'Tem certeza que deseja remover ' + nomeCidade + ' da região ' + regiao + '?',
      'fa-trash-alt',
      function () {
        delete store.piso.regioes[regiao].cidades[cidadeKey];
        saveStore();
        document.getElementById('piso-cidade-filter').value = '';
        document.getElementById('piso-regiao-display').value = '';
        renderPisoTabelaTodas();
        app.showToast('Cidade removida!', 'success', 2000);
      });
  }

  function calcularPiso() {
    var raw = document.getElementById('piso-base').value.replace(/[R$\s]/g, '').replace(',', '.');
    var pisoBase = parseFloat(raw) || 0;
    var horas = parseFloat(document.getElementById('piso-horas').value) || 44;
    horas = Math.min(44, Math.max(1, horas));
    document.getElementById('piso-horas').value = horas;
    var prop = pisoBase * (horas / 44);
    var hora = pisoBase / 44;
    var ref30 = pisoBase * (30 / 44);
    document.getElementById('piso-prop').textContent = 'R$ ' + prop.toFixed(2);
    document.getElementById('piso-hora').textContent = 'R$ ' + hora.toFixed(2);
    document.getElementById('piso-30h').textContent = 'R$ ' + ref30.toFixed(2);
  }

  /* ═══════════════════════════════════════════
     ORIENTAÇÕES
     ═══════════════════════════════════════ */

  function initOrientacoes() {
    var ph = document.querySelector('.c-placeholder[data-section="orientacoes"]');
    if (!ph) return;

    // Força fetch se cache for inválido (objeto vazio ou sem chaves esperadas)
    if (store.orientacoes && typeof store.orientacoes === 'object' && !Array.isArray(store.orientacoes)) {
      var keys = Object.keys(store.orientacoes);
      if (keys.length === 0 || !store.orientacoes.documentos || !store.orientacoes.situacoes || !store.orientacoes.checklist) {
        store.orientacoes = null; // invalida cache
      }
    }

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<select id="orient-dropdown" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:220px">' +
          '<option value="documentos">Documentos</option><option value="situacoes">Situações Específicas</option>' +
          '<option value="checklist">Checklist (SAGICON/GED)</option></select>' +
        '<input type="text" id="orient-filter" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Buscar..." autocomplete="off" style="max-width:200px">' +
        '<button id="orient-add" class="btn btn-sm btn-success flex-shrink-0"><i class="fas fa-plus"></i></button>' +
        '<button id="orient-copyall" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
        '<span id="orient-count" class="x-small text-muted align-self-center ms-auto"></span>' +
      '</div>' +
      '<div id="orient-list" class="c-list" style="max-height:420px;overflow-y:auto"><p class="text-muted small p-2 text-center">Carregando...</p></div>';

    document.getElementById('orient-dropdown').addEventListener('change', renderOrientacoes);
    document.getElementById('orient-filter').addEventListener('input', renderOrientacoes);
    document.getElementById('orient-add').addEventListener('click', addOrientacaoItem);
    document.getElementById('orient-copyall').addEventListener('click', function () {
      var key = document.getElementById('orient-dropdown').value;
      var data = (store.orientacoes || {})[key] || [];
      var term = normalize(document.getElementById('orient-filter').value || '');
      var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
      if (!filtered.length) { app.showToast('Nenhum item para copiar.', 'warning', 2000); return; }
      copyToClipboard(filtered.join('\n'));
      app.showToast(filtered.length + ' item(ns) copiado(s)!', 'success', 2000);
    });

    loadSectionDataGeneric('orientacoes', 'assets/consultas/orientacoes.json', function (data) {
      store.orientacoes = data;
      saveStore();
      renderOrientacoes();
    });
  }

  function addOrientacaoItem() {
    var key = document.getElementById('orient-dropdown').value;
    showPrompt('Novo Item', 'Digite o novo item para ' + key + ':', '', function (text) {
      if (!text || !text.trim()) return;
      if (!store.orientacoes) store.orientacoes = { documentos: [], situacoes: [], checklist: [] };
      if (!store.orientacoes[key]) store.orientacoes[key] = [];
      store.orientacoes[key].push(text.trim());
      saveStore();
      renderOrientacoes();
      app.showToast('Item adicionado!', 'success', 2000);
    });
  }

  function renderOrientacoes() {
    var key = document.getElementById('orient-dropdown').value;
    var data = (store.orientacoes || {})[key] || [];
    var el = document.getElementById('orient-list');
    var countEl = document.getElementById('orient-count');
    var term = normalize((document.getElementById('orient-filter') || {}).value || '');
    if (!el) return;

    var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
    if (countEl) countEl.textContent = filtered.length + ' de ' + data.length + ' itens';

    if (!filtered.length) { el.innerHTML = '<p class="text-muted small p-2 text-center">Nenhum item.</p>'; return; }

    el.innerHTML = filtered.map(function (item, i) {
      var origIdx = data.indexOf(item);
      return '<div class="c-item mb-1 p-2 rounded border border-secondary bg-dark bg-opacity-10">' +
        '<div class="d-flex justify-content-between align-items-center orient-item-header" style="cursor:pointer" data-orient-expand="' + origIdx + '">' +
          '<small class="text-light flex-grow-1"><i class="fas fa-chevron-right x-small me-1 text-muted orient-chevron"></i>' + escapeHtml(item) + '</small>' +
          '<div class="btn-group btn-group-sm ms-2 flex-shrink-0">' +
            '<button class="btn btn-sm btn-outline-secondary py-0 px-1" data-orient-copy="' + origIdx + '" title="Copiar"><i class="fas fa-copy x-small"></i></button>' +
            '<button class="btn btn-sm btn-outline-warning py-0 px-1" data-orient-edit="' + key + '" data-idx="' + origIdx + '"><i class="fas fa-edit x-small"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger py-0 px-1" data-orient-del="' + key + '" data-idx="' + origIdx + '"><i class="fas fa-trash x-small"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="orient-detail d-none mt-2 p-2 bg-dark bg-opacity-50 rounded border border-info small text-light" style="white-space:pre-wrap">' + escapeHtml(item) + '</div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('[data-orient-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-orient-copy'));
        var txt = data[idx];
        if (txt) { copyToClipboard(txt); app.showToast('Item copiado!', 'success', 1500); }
      });
    });
    el.querySelectorAll('[data-orient-edit]').forEach(function (b) {
      b.addEventListener('click', function () { editOrientacaoItem(this.getAttribute('data-orient-edit'), parseInt(this.getAttribute('data-idx'))); });
    });
    el.querySelectorAll('[data-orient-del]').forEach(function (b) {
      b.addEventListener('click', function () { deleteOrientacaoItem(this.getAttribute('data-orient-del'), parseInt(this.getAttribute('data-idx'))); });
    });
    // Toggle expandir/recolher detalhes do item
    el.querySelectorAll('[data-orient-expand]').forEach(function (header) {
      header.addEventListener('click', function (e) {
        // Não expande se clicou nos botões de ação
        if (e.target.closest('button')) return;
        var item = this.closest('.c-item');
        var detail = item.querySelector('.orient-detail');
        var chevron = this.querySelector('.orient-chevron');
        var isHidden = detail.classList.contains('d-none');
        if (isHidden) {
          detail.classList.remove('d-none');
          chevron.classList.remove('fa-chevron-right');
          chevron.classList.add('fa-chevron-down');
        } else {
          detail.classList.add('d-none');
          chevron.classList.remove('fa-chevron-down');
          chevron.classList.add('fa-chevron-right');
        }
      });
    });
  }

  // Schema esperado para cada chave — invalida cache se formato não bater
  var CACHE_SCHEMA = {
    orientacoes: ['documentos', 'situacoes', 'checklist'],
    listas: ['documentos', 'tiposEstabelecimento', 'respostasPadrao', 'prazosAssistencia'],
    faq: null // array de objetos
  };

  function isValidCache(key, data) {
    if (!data) return false;
    var schema = CACHE_SCHEMA[key];
    if (schema === undefined) return true; // sem schema definido → confia no cache
    if (schema === null) return Array.isArray(data) && data.length > 0; // espera array
    // espera objeto com as chaves do schema
    if (Array.isArray(data)) return false; // array onde deveria ser objeto → inválido
    return schema.every(function (k) { return data[k] && Array.isArray(data[k]); });
  }

  function loadSectionDataGeneric(key, url, cb, fallbackUrl) {
    var cached = store[key];
    if (isValidCache(key, cached)) return cb(cached);

    function tryU(u) {
      fetch(u).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (data) {
        cb(data);
      }).catch(function () {
        if (u === url && fallbackUrl) tryU(fallbackUrl);
        else cb(getDefaultData(key));
      });
    }
    tryU(url);
  }

  function getDefaultData(key) {
    var defaults = {
      orientacoes: {
        documentos: [
          'REQUERIMENTO DO ESTABELECIMENTO',
          'Razão social',
          'Nome fantasia',
          'Dados de contato (endereço/telefone/e-mail)',
          'Verificar se selecionou - alteração de horário de funcionamento',
          'Gerado pelo atual Diretor Técnico',
          'Emitido nos últimos 30 dias anterior ao protocolo',
          'Ramo de atividade igual ou alterado, se alterado, pedir alteração contratual com CNAE da atividade declarada',
          'Códigos de validação legíveis',
          'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
          'CONTRATO POR CREDENCIAMENTO COM EMPRESAS TERCEIRA E ÓRGÃOS PÚBLICOS',
          'CTPS DIGITAL',
          'CTPS FÍSICA',
          'E-SOCIAL',
          'PROCESSO SELETIVO SIMPLIFICADO',
          'SERVIDOR PÚBLICO',
          'TERMO DE COMPROMISSO DO PROFISSIONAL'
        ],
        situacoes: [
          'SITUAÇÕES ESPECÍFICAS',
          'POSTO DE COLETA/LABORATÓRIO DE ANÁLISES CLÍNICAS',
          'Verificar se o profissional que está ingressando possui habilitação como Farmacêutico-Bioquímico opção Análises Clínicas e Toxicológicas ou é Farmacêutico Generalista',
          'Não é necessário declarar horário',
          'Caso o profissional possua outra atividade que necessite declarar assistência e que conflite com o horário do estabelecimento, deverá declarar o seu horário de assistência',
          'Se é posto de coleta independente (matriz) deverá ter contrato com laboratório',
          'Posto de coleta matriz, deve ter status 38 - POSTO DE COLETA PRESTADOR DE SERVIÇOS e na observação o nome do laboratório',
          'CLÍNICA DE ESTÉTICA',
          'CONTRATO COM PRAZO DETERMINADO',
          'HOSPITALAR',
          'INDÚSTRIA',
          'INGRESSO POR EMPRESA TERCEIRIZADA',
          'MANIPULAÇÃO - SE HOUVER HOMEOPATIA',
          'MODALIDADE DAP',
          'MODALIDADE SUBSTITUTO',
          'PROFISSIONAIS QUE POSSUEM OUTRA RT OU ATIVIDADE',
          'REABILITAÇÃO DE REGISTRO PJ',
          'REGISTRO DE ESTABELECIMENTO'
        ],
        checklist: [
          'LANÇAMENTOS NO SAGICON e GED',
          'ANEXAR O ARQUIVO DO PROCEDIMENTO NO GED',
          'PADRÕES PARA SALVAR ARQUIVOS NO GED',
          'PROTOCOLO INTERNO DE AD REFERENDUM',
          'TRAMITAÇÃO DO PROTOCOLO PARA CONFERÊNCIA',
          'LANÇAMENTO DE status - PROTOCOLO FINALIZADO',
          'LANÇAMENTO DE status - PROTOCOLO IRREGULAR',
          'LANÇAMENTO DA SITUAÇÃO RESPONSÁVEL TÉCNICO CONFORME O VÍNCULO',
          'CRITÉRIOS DO AD REFERENDUM'
        ]
      },
      listas: {
        documentos: [
          'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
          'CONTRATO DE PRESTAÇÃO DE SERVIÇOS COM EMPRESA TERCEIRA PRIVADA',
          'CONTRATO POR CREDENCIAMENTO COM EMPRESAS TERCEIRA E ÓRGÃOS PÚBLICOS',
          'CTPS DIGITAL',
          'CTPS FÍSICA',
          'E-SOCIAL',
          'PROCESSO SELETIVO SIMPLIFICADO',
          'REQUERIMENTO DO ESTABELECIMENTO',
          'REQUERIMENTO DO ESTABELECIMENTO (Farmácia Hospitalar)',
          'REQUERIMENTO DO ESTABELECIMENTO (Indústria)',
          'REQUERIMENTO DO ESTABELECIMENTO (Lab. Industrial/Controle qualidade/Esterilização/Pesquisa)',
          'REQUERIMENTO DO ESTABELECIMENTO (Manipulação Alopática e Homeopática)',
          'REQUERIMENTO DO ESTABELECIMENTO (Manipulação Alopática)',
          'REQUERIMENTO DO ESTABELECIMENTO (Manipulação Homeopática)',
          'REQUERIMENTO DO ESTABELECIMENTO (Posto de Coleta/Lab. Análises Clínicas)',
          'SERVIDOR PÚBLICO',
          'TERMO DE COMPROMISSO DO PROFISSIONAL'
        ],
        tiposEstabelecimento: [
          'CLÍNICA DE ESTÉTICA',
          'DESINSETIZADORAS',
          'DISTRIBUIDORA - OUTRAS',
          'DISTRIBUIDORA DE CORRELATOS E PROD. SAÚDE',
          'DISTRIBUIDORA DE COSMÉTICOS E PERFUMARIA',
          'DISTRIBUIDORA MEDICAMENTOS, INSUMOS E DROGAS',
          'DISTRIBUIDORA OU C.A.F. - ORGÃO PÚBLICO',
          'FARMÁCIA - ORGÃO PÚBLICO - MUNICIPAIS',
          'FARMÁCIA - ORGÃO PÚBLICO - REGIONAL DE SAÚDE',
          'FARMÁCIA COM MANIPULAÇÃO - PROP. FARMACEUTICO',
          'FARMÁCIA COM MANIPULAÇÃO - PROP. LEIGO',
          'FARMÁCIA EQUIVALENTE HOSPITALAR - PRIVADA',
          'FARMÁCIA EQUIVALENTE HOSPITALAR ORGÃO PÚBLICO',
          'FARMÁCIA HOSPITALAR - ORGÃO PÚBLICO',
          'FARMÁCIA HOSPITALAR - PRIVADA',
          'FARMÁCIA HOMEOPÁTICA - PROP. FARMACÊUTICO',
          'FARMÁCIA HOMEOPÁTICA - PROP. LEIGO',
          'FARMÁCIA SEM MANIPULAÇÃO - PROP. LEIGO',
          'FARMÁCIA SEM MANIPULAÇÃO PROP. FARMACÊUTICO',
          'FARMÁCIA SEM MANIPULAÇÃO PROP.OFICIAL FARM.',
          'INDÚSTRIAS - OUTRAS',
          'INDÚSTRIAS DE CORRELATOS E PROD. SAÚDE',
          'INDÚSTRIAS DE COSMÉTICOS E PERFUMARIA',
          'INDÚSTRIAS DE MEDICAMENTOS, INSUMOS E DROGAS',
          'LABORATÓRIO - OUTROS',
          'LABORATÓRIO ANÁLISE CLÍNICAS - ORGÃO PÚBLICO',
          'LABORATÓRIO ANÁLISE CLÍNICAS - PROP. LEIGO',
          'LABORATÓRIO ANÁLISE CLÍNICAS PROP.FARMACÊUTICO',
          'LABORATÓRIO DE CONTROLE QUALIDADE',
          'OUTROS ESTABELECIMENTOS',
          'POSTO DE COLETA',
          'POSTO DE MEDICAMENTO',
          'PRESTADORA DE SERVIÇOS',
          'SERVIÇOS EM SAÚDE E ESTÉTICA',
          'TRANSPORTADORA'
        ],
        respostasPadrao: [
          'ARQUIVAMENTO EMPRESA INCORRETA',
          'ARQUIVAMENTO PROTOCOLO DUPLICADO',
          'ARQUIVAMENTO RESPOSTA DE CORREÇÃO',
          'ASSINATURA COLADA',
          'ASSINATURAS DIGITAIS QUE NÃO VALIDAM',
          'ASSINATURAS DIGITAIS QUE NÃO VALIDAM - CONTRATOS PÚBLICOS',
          'CANCELAMENTO DE REGISTRO PJ ANOTADO',
          'CARGA HORÁRIA ACIMA DE 10 HORAS AO DIA',
          'DAP – ESTABELECIMENTO IRREGULAR',
          'DAP COBRINDO MAIS QUE 6 PROFISSIONAIS',
          'DECLAROU OUTRAS ATIVIDADES',
          'DOCUMENTOS PARA CANCELAR REGISTRO PJ',
          'FORMULÁRIOS - FORMULÁRIOS ANTIGOS',
          'FORMULÁRIOS - REQUERIMENTO DO ESTABELECIMENTO',
          'FORMULÁRIOS - TERMO DE COMPROMISSO',
          'HABILITAÇÕES - ESTÉTICA',
          'HABILITAÇÕES - HOMEOPATIA',
          'HABILITAÇÕES - HOSPITALAR',
          'HABILITAÇÕES - ONCOLOGIA',
          'INDEFERIMENTO',
          'PROTOCOLO DE IRREGULAR – 209',
          'PROTOCOLOS - QUER INGRESSAR COMO SUBSTITUTO, MAS TEM OUTRA RT',
          'PROTOCOLOS - CONFLITO DE HORÁRIOS (OUTRA FILIAL)',
          'PROTOCOLOS - CONFLITO DE HORÁRIOS (OUTRO ESTABELECIMENTO)',
          'PROTOCOLOS - DECLARAÇÃO DE ATIVIDADES DE ESTÉTICA',
          'PROTOCOLOS - ESTABELECIMENTO JÁ POSSUI DIRETOR TÉCNICO',
          'PROTOCOLOS - POSSUI RT COMO SUBSTITUTO',
          'REGISTRO IRREGULAR',
          'RESPOSTAS ESCALAS DEFERIDAS',
          'RESPOSTAS ESCALAS INDEFERIDAS',
          'SALÁRIO ABAIXO DO PISO',
          'SEM INTERVALO DECLARADO',
          'SOLICITAÇÃO DE CORREÇÃO',
          'SOLICITAÇÃO DE ESCALA VIA E-MAIL',
          'TRANSFERÊNCIAS - FILIAIS',
          'TRANSFERÊNCIAS - GRUPO ECONÔMICO',
          'VÍNCULO ABERTO NA CTPS',
          'VÍNCULO DE TRABALHO - ALVARÁ',
          'VÍNCULO DE TRABALHO - CONTRATO',
          'VÍNCULO DE TRABALHO - CONTRATOS PÚBLICOS',
          'VÍNCULO DE TRABALHO - CTPS',
          'VÍNCULO DE TRABALHO - DECLARAÇÃO DE LOTAÇÃO',
          'VÍNCULO DE TRABALHO - E-Social',
          'VÍNCULO DE TRABALHO - MEI'
        ],
        prazosAssistencia: [
          'ARMAZENADORA DE MEDICAMENTOS E PRODUTOS PARA SAÚDE',
          'BANCO DE LEITE HUMANO',
          'CENTRAL DE ABASTECIMENTO FARMACÊUTICO',
          'CLÍNICA DE SERVIÇOS DE VACINAÇÃO',
          'CLÍNICA ESTÉTICA',
          'CONSULTÓRIO FARMACÊUTICO',
          'CONTROLE DE VETORES E PRAGAS URBANAS',
          'DISTRIBUIDOR/IMPORTADOR DE MEDICAMENTOS, COSMÉTICOS, PRODUTOS DE HIGIENE PESSOAL',
          'DISTRIBUIDOR/IMPORTADOR/EXPORTADOR DE COSMÉTICO',
          'DISTRIBUIDOR/IMPORTADOR/EXPORTADOR DE PRODUTOS PARA SAÚDE',
          'DISTRIBUIDOR/IMPORTADOR/EXPORTADOR DE MEDICAMENTOS',
          'EMPRESA ARMAZENADORA DE CORRELATOS',
          'EMPRESA ARMAZENADORA DE MEDICAMENTOS',
          'ERVANARIA',
          'FARMÁCIA COM MANIPULAÇÃO',
          'FARMÁCIA COM MANIPULAÇÃO ALOPÁTICA E HOMEOPÁTICA',
          'FARMÁCIA DE ASSISTÊNCIA DOMICILIAR',
          'FARMÁCIA EQUIVALENTE A HOSPITALAR'
        ]
      },
      respostasPadrao: { 
        'SOLICITAÇÃO DE CORREÇÃO': 'Documentação incorreta ou incompleta.\nEnviar/anexar no prazo de 01 dia útil acessando a tela inicial do CRF/PR em Casa, no atalho dos menus mais utilizados, em Protocolos, no ícone de "Protocolos Aguardando Resposta":\nAlertamos que documentos enviados errados ou não enviados dentro do prazo estará sujeito ao indeferimento com necessidade de reinício do procedimento.' 
      },
      nomesEmpresariais: [
        'LABORATÓRIO ANÁLISE CLÍNICAS - ORGÃO PÚBLICO',
        '(Quando realizar o REGISTRO no SAGICON, o padrão abaixo trata-se do NOME FANTASIA)',
        'CLÍNICA DE ESTÉTICA + NOME FANTASIA',
        'PADRÃO A SER SEGUIDO: CLÍNICA DE ESTÉTICA GABRIELA BORGES',
        'A IDENTIFICAÇÃO DO ESTABELECIMENTO NÃO DEVE SER ABREVIADA. EX. INCORRETO: CLIN. EST., CLINICA EST.',
        'A RAZÃO SOCIAL DEVE SEGUIR O MESMO PADRÃO DO CARTÃO CNPJ'
      ]
    };
    return defaults[key] || {};
  }

  function editOrientacaoItem(key, idx) {
    var data = (store.orientacoes || {})[key] || [];
    if (idx < 0 || idx >= data.length) return;
    showPrompt('Editar Item', 'Editar item:', data[idx], function (text) {
      if (text === null) return;
      data[idx] = text.trim();
      saveStore();
      renderOrientacoes();
      app.showToast('Item atualizado!', 'success', 2000);
    });
  }

  function deleteOrientacaoItem(key, idx) {
    showConfirm('Excluir Item', 'Tem certeza que deseja excluir este item?', 'fa-trash-alt', function () {
      var data = (store.orientacoes || {})[key] || [];
      data.splice(idx, 1);
      saveStore();
      renderOrientacoes();
      app.showToast('Item excluído!', 'success', 2000);
    });
  }

  /* ═══════════════════════════════════════════
     LISTAS AUXILIARES
     ═══════════════════════════════════════ */

  function initListas() {
    var ph = document.querySelector('.c-placeholder[data-section="listas"]');
    if (!ph) return;

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<select id="listas-dropdown" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:250px">' +
          '<option value="documentos">Documentos</option><option value="tiposEstabelecimento">Tipos de Estabelecimento</option>' +
          '<option value="respostasPadrao">Respostas Padrão</option><option value="prazosAssistencia">Prazos e Assistência</option></select>' +
        '<input type="text" id="listas-filter" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Buscar..." autocomplete="off" style="max-width:200px">' +
        '<button id="listas-add" class="btn btn-sm btn-success flex-shrink-0"><i class="fas fa-plus"></i></button>' +
        '<button id="listas-copyall" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
        '<span id="listas-count" class="x-small text-muted align-self-center ms-auto"></span>' +
      '</div>' +
      '<div id="listas-list" class="c-list" style="max-height:420px;overflow-y:auto"><p class="text-muted small p-2 text-center">Carregando...</p></div>';

    document.getElementById('listas-dropdown').addEventListener('change', renderListas);
    document.getElementById('listas-filter').addEventListener('input', renderListas);
    document.getElementById('listas-add').addEventListener('click', addListasItem);
    document.getElementById('listas-copyall').addEventListener('click', function () {
      var key = document.getElementById('listas-dropdown').value;
      var data = (store.listas || {})[key] || [];
      var term = normalize(document.getElementById('listas-filter').value || '');
      var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
      if (!filtered.length) { app.showToast('Nenhum item para copiar.', 'warning', 2000); return; }
      copyToClipboard(filtered.join('\n'));
      app.showToast(filtered.length + ' item(ns) copiado(s)!', 'success', 2000);
    });

    loadSectionDataGeneric('listas', 'assets/consultas/listas.json', function (data) {
      store.listas = data;
      saveStore();
      renderListas();
    });
  }

  function addListasItem() {
    var key = document.getElementById('listas-dropdown').value;
    showPrompt('Novo Item', 'Digite o novo item:', '', function (text) {
      if (!text || !text.trim()) return;
      if (!store.listas) store.listas = { documentos: [], tiposEstabelecimento: [], respostasPadrao: [], prazosAssistencia: [] };
      if (!store.listas[key]) store.listas[key] = [];
      store.listas[key].push(text.trim());
      saveStore();
      renderListas();
      app.showToast('Item adicionado!', 'success', 2000);
    });
  }

  function renderListas() {
    var key = document.getElementById('listas-dropdown').value;
    var data = (store.listas || {})[key] || [];
    var el = document.getElementById('listas-list');
    var countEl = document.getElementById('listas-count');
    var term = normalize((document.getElementById('listas-filter') || {}).value || '');
    if (!el) return;

    var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
    if (countEl) countEl.textContent = filtered.length + ' de ' + data.length + ' itens';

    if (!filtered.length) { el.innerHTML = '<p class="text-muted small p-2 text-center">Nenhum item.</p>'; return; }

    el.innerHTML = filtered.map(function (item, i) {
      var origIdx = data.indexOf(item);
      return '<div class="c-item mb-1 p-2 rounded border border-secondary bg-dark bg-opacity-10">' +
        '<div class="d-flex justify-content-between align-items-center listas-item-header" style="cursor:pointer" data-listas-expand="' + origIdx + '">' +
          '<small class="text-light flex-grow-1"><i class="fas fa-chevron-right x-small me-1 text-muted listas-chevron"></i>' + escapeHtml(item) + '</small>' +
          '<div class="btn-group btn-group-sm ms-2 flex-shrink-0">' +
            '<button class="btn btn-sm btn-outline-secondary py-0 px-1" data-listas-copy="' + origIdx + '" title="Copiar"><i class="fas fa-copy x-small"></i></button>' +
            '<button class="btn btn-sm btn-outline-warning py-0 px-1" data-listas-edit="' + key + '" data-idx="' + origIdx + '"><i class="fas fa-edit x-small"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger py-0 px-1" data-listas-del="' + key + '" data-idx="' + origIdx + '"><i class="fas fa-trash x-small"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="listas-detail d-none mt-2 p-2 bg-dark bg-opacity-50 rounded border border-info small text-light" style="white-space:pre-wrap">' + escapeHtml(item) + '</div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('[data-listas-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-listas-copy'));
        var txt = data[idx];
        if (txt) { copyToClipboard(txt); app.showToast('Item copiado!', 'success', 1500); }
      });
    });
    el.querySelectorAll('[data-listas-edit]').forEach(function (b) {
      b.addEventListener('click', function () { editListasItem(this.getAttribute('data-listas-edit'), parseInt(this.getAttribute('data-idx'))); });
    });
    el.querySelectorAll('[data-listas-del]').forEach(function (b) {
      b.addEventListener('click', function () { deleteListasItem(this.getAttribute('data-listas-del'), parseInt(this.getAttribute('data-idx'))); });
    });
    // Toggle expandir/recolher detalhes do item
    el.querySelectorAll('[data-listas-expand]').forEach(function (header) {
      header.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        var item = this.closest('.c-item');
        var detail = item.querySelector('.listas-detail');
        var chevron = this.querySelector('.listas-chevron');
        var isHidden = detail.classList.contains('d-none');
        if (isHidden) {
          detail.classList.remove('d-none');
          chevron.classList.remove('fa-chevron-right');
          chevron.classList.add('fa-chevron-down');
        } else {
          detail.classList.add('d-none');
          chevron.classList.remove('fa-chevron-down');
          chevron.classList.add('fa-chevron-right');
        }
      });
    });
  }

  function editListasItem(key, idx) {
    var data = (store.listas || {})[key] || [];
    if (idx < 0 || idx >= data.length) return;
    showPrompt('Editar Item', 'Editar item:', data[idx], function (text) {
      if (text === null) return;
      data[idx] = text.trim();
      saveStore();
      renderListas();
      app.showToast('Item atualizado!', 'success', 2000);
    });
  }

  function deleteListasItem(key, idx) {
    showConfirm('Excluir Item', 'Tem certeza que deseja excluir este item?', 'fa-trash-alt', function () {
      var data = (store.listas || {})[key] || [];
      data.splice(idx, 1);
      saveStore();
      renderListas();
      app.showToast('Item excluído!', 'success', 2000);
    });
  }

  /* ═══════════════════════════════════════════
     RESPOSTAS PADRÃO
     ═══════════════════════════════════════ */

  function initRespostasPadrao() {
    var ph = document.querySelector('.c-placeholder[data-section="respostasPadrao"]');
    if (!ph) return;

    // Invalida cache se for array em vez de objeto, ou objeto vazio
    if (store.respostasPadrao) {
      if (Array.isArray(store.respostasPadrao) || (typeof store.respostasPadrao === 'object' && Object.keys(store.respostasPadrao).length === 0)) {
        store.respostasPadrao = null;
      }
    }

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<select id="rp-dropdown" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:250px"></select>' +
        '<input type="text" id="rp-filter" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Filtrar..." autocomplete="off" style="max-width:180px">' +
        '<button id="rp-add" class="btn btn-sm btn-success flex-shrink-0"><i class="fas fa-plus"></i></button>' +
        '<button id="rp-edit" class="btn btn-sm btn-outline-warning flex-shrink-0"><i class="fas fa-edit me-1"></i> Editar</button>' +
        '<button id="rp-copy" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
      '</div>' +
      '<div id="rp-preview" class="p-2 bg-dark bg-opacity-25 rounded border border-secondary mb-2 small text-light text-start" style="min-height:60px;white-space:pre-wrap">Selecione uma resposta padrão para visualizar.</div>';

    loadSectionDataGeneric('respostasPadrao', 'assets/consultas/respostas-padrao.json', function (data) {
      // Migra formato antigo {titulo, instrucao, texto} para dicionário {titulo: texto}
      if (data && data.titulo && data.texto && !data[data.titulo]) {
        var novo = {};
        novo[data.titulo] = data.texto;
        data = novo;
      }
      store.respostasPadrao = data;
      saveStore();
      renderRespostasPadrao();

      // Importa respostas como cards no dashboard Ingresso PJ se vazio
      importarRespostasComoCards(data);
    });

    document.getElementById('rp-filter').addEventListener('input', renderRespostasPadrao);
    document.getElementById('rp-dropdown').addEventListener('change', function () {
      var key = this.value;
      var items = store.respostasPadrao || {};
      document.getElementById('rp-preview').innerHTML = autoLink(items[key] || '').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
    });
    document.getElementById('rp-add').addEventListener('click', function () {
      showPrompt('Nova Resposta', 'Nome da resposta padrão:', '', function (nome) {
        if (!nome || !nome.trim()) return;
        showPrompt('Nova Resposta', 'Texto da resposta:', '', function (texto) {
          if (texto === null) return;
          if (!store.respostasPadrao) store.respostasPadrao = {};
          store.respostasPadrao[nome.trim()] = texto || '';
          saveStore();
          renderRespostasPadrao();
          document.getElementById('rp-dropdown').value = nome.trim();
          document.getElementById('rp-preview').innerHTML = autoLink(texto || '').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          app.showToast('Resposta adicionada!', 'success', 2000);
        });
      });
    });
    document.getElementById('rp-edit').addEventListener('click', function () {
      var key = document.getElementById('rp-dropdown').value;
      if (!key) { app.showToast('Selecione uma resposta primeiro.', 'warning', 2000); return; }
      showPrompt('Editar Resposta', 'Editar texto da resposta "' + key + '":', (store.respostasPadrao || {})[key] || '', function (texto) {
        if (texto === null) return;
        store.respostasPadrao[key] = texto || '';
        saveStore();
        document.getElementById('rp-preview').innerHTML = autoLink(texto || '').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        app.showToast('Resposta atualizada!', 'success', 2000);
      });
    });
    document.getElementById('rp-copy').addEventListener('click', function () {
      var key = document.getElementById('rp-dropdown').value;
      var text = (store.respostasPadrao || {})[key] || '';
      if (!text) { app.showToast('Selecione uma resposta primeiro.', 'warning', 2000); return; }
      copyToClipboard(text);
      app.showToast('Copiada!', 'success', 1500);
    });
  }

  function renderRespostasPadrao() {
    var dd = document.getElementById('rp-dropdown');
    if (!dd) return;
    var items = store.respostasPadrao || {};
    var term = normalize((document.getElementById('rp-filter') || {}).value || '');
    var keys = Object.keys(items).filter(function (k) { return !term || normalize(k).indexOf(term) > -1; }).sort();
    if (!keys.length) {
      dd.innerHTML = '<option value="">' + (term ? 'Nenhum resultado' : 'Nenhuma resposta cadastrada') + '</option>';
      document.getElementById('rp-preview').innerHTML = '<span class="text-muted">Nenhuma resposta encontrada.</span>';
      return;
    }
    dd.innerHTML = '<option value="">Selecione...</option>' + keys.map(function (k) {
      return '<option value="' + escapeHtml(k) + '">' + escapeHtml(k) + '</option>';
    }).join('');

    // Botão excluir inline
    var existing = document.getElementById('rp-del');
    if (existing) existing.remove();
    var delBtn = document.createElement('button');
    delBtn.id = 'rp-del';
    delBtn.className = 'btn btn-sm btn-outline-danger flex-shrink-0';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.addEventListener('click', function () {
      var key = document.getElementById('rp-dropdown').value;
      if (!key) return;
      showConfirm('Excluir', 'Excluir resposta "' + key + '"?', 'fa-trash-alt', function () {
        delete store.respostasPadrao[key];
        saveStore();
        renderRespostasPadrao();
        document.getElementById('rp-preview').innerHTML = '<span class="text-muted">Selecione uma resposta padrão para visualizar.</span>';
        app.showToast('Resposta excluída!', 'success', 2000);
      });
    });
    document.getElementById('rp-copy').after(delBtn);
  }

  /* ═══════════════════════════════════════════
     NOMES EMPRESARIAIS
     ═══════════════════════════════════════ */

  function initNomesEmpresariais() {
    var ph = document.querySelector('.c-placeholder[data-section="nomesEmpresariais"]');
    if (!ph) return;

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<input type="text" id="ne-filter" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Buscar..." autocomplete="off" style="max-width:250px">' +
        '<button id="ne-add" class="btn btn-sm btn-success flex-shrink-0"><i class="fas fa-plus me-1"></i> Adicionar</button>' +
        '<button id="ne-copyall" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
        '<span id="ne-count" class="x-small text-muted align-self-center ms-auto"></span>' +
      '</div>' +
      '<div id="ne-list" class="c-list" style="max-height:420px;overflow-y:auto"><p class="text-muted small p-2 text-center">Carregando...</p></div>';

    loadSectionDataGeneric('nomesEmpresariais', 'assets/consultas/nomes-empresariais.json', function (data) {
      store.nomesEmpresariais = data;
      saveStore();
      renderNomesEmpresariais();
    });

    document.getElementById('ne-filter').addEventListener('input', renderNomesEmpresariais);
    document.getElementById('ne-add').addEventListener('click', function () {
      showPrompt('Novo Padrão', 'Novo padrão de nome empresarial:', '', function (texto) {
        if (!texto || !texto.trim()) return;
        if (!store.nomesEmpresariais) store.nomesEmpresariais = [];
        store.nomesEmpresariais.push(texto.trim());
        saveStore();
        renderNomesEmpresariais();
        app.showToast('Adicionado!', 'success', 2000);
      });
    });
    document.getElementById('ne-copyall').addEventListener('click', function () {
      var data = store.nomesEmpresariais || [];
      var term = normalize(document.getElementById('ne-filter').value || '');
      var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
      if (!filtered.length) { app.showToast('Nenhum item para copiar.', 'warning', 2000); return; }
      copyToClipboard(filtered.join('\n'));
      app.showToast(filtered.length + ' item(ns) copiado(s)!', 'success', 2000);
    });
  }

  function renderNomesEmpresariais() {
    var el = document.getElementById('ne-list');
    var countEl = document.getElementById('ne-count');
    if (!el) return;
    var data = store.nomesEmpresariais || [];
    var term = normalize((document.getElementById('ne-filter') || {}).value || '');
    var filtered = data.filter(function (item) { return !term || normalize(item).indexOf(term) > -1; });
    if (countEl) countEl.textContent = filtered.length + ' de ' + data.length + ' itens';

    if (!filtered.length) { el.innerHTML = '<p class="text-muted small p-2 text-center">Nenhum item.</p>'; return; }

    el.innerHTML = filtered.map(function (item, i) {
      var origIdx = data.indexOf(item);
      return '<div class="c-item mb-1 p-2 rounded border border-secondary bg-dark bg-opacity-10 d-flex justify-content-between align-items-center">' +
        '<small class="text-light flex-grow-1">' + escapeHtml(item) + '</small>' +
        '<div class="btn-group btn-group-sm ms-2">' +
        '<button class="btn btn-sm btn-outline-secondary py-0 px-1" data-ne-copy="' + origIdx + '" title="Copiar"><i class="fas fa-copy x-small"></i></button>' +
        '<button class="btn btn-sm btn-outline-warning py-0 px-1" data-ne-edit="' + origIdx + '"><i class="fas fa-edit x-small"></i></button>' +
        '<button class="btn btn-sm btn-outline-danger py-0 px-1" data-ne-del="' + origIdx + '"><i class="fas fa-trash x-small"></i></button>' +
        '</div></div>';
    }).join('');

    el.querySelectorAll('[data-ne-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-ne-copy'));
        var txt = data[idx];
        if (txt) { copyToClipboard(txt); app.showToast('Item copiado!', 'success', 1500); }
      });
    });
    el.querySelectorAll('[data-ne-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-ne-edit'));
        showPrompt('Editar Nome', 'Editar padrão de nome empresarial:', store.nomesEmpresariais[idx], function (texto) {
          if (texto === null) return;
          store.nomesEmpresariais[idx] = texto.trim();
          saveStore();
          renderNomesEmpresariais();
          app.showToast('Atualizado!', 'success', 2000);
        });
      });
    });
    el.querySelectorAll('[data-ne-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-ne-del'));
        showConfirm('Excluir', 'Excluir este padrão?', 'fa-trash-alt', function () {
          store.nomesEmpresariais.splice(idx, 1);
          saveStore();
          renderNomesEmpresariais();
          app.showToast('Excluído!', 'success', 2000);
        });
      });
    });
  }

  /* ═══════════════════════════════════════════
     CALCULADORA DE HORAS
     ═══════════════════════════════════════ */

  function initCalcHoras() {
    var ph = document.querySelector('.c-placeholder[data-section="calcHoras"]');
    if (!ph) return;

    // Carrega instruções do JSON (calc-horas.json)
    var instrucoesHtml = '<p class="x-small text-muted mb-2">Preencha os horários de entrada e saída. Use "Adicionar turno" para múltiplos horários.</p>';
    fetch('assets/consultas/calc-horas.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.instrucoes && data.instrucoes.length) {
          instrucoesHtml = '<div class="x-small text-muted mb-2 p-2 bg-dark bg-opacity-25 rounded border border-secondary">' +
            '<i class="fas fa-info-circle me-1 text-info"></i><b>Instruções:</b><br>' +
            data.instrucoes.map(function (inst) { return escapeHtml(inst); }).join('<br>') + '</div>';
        }
        var infoEl = document.getElementById('calc-horas-info');
        if (infoEl) infoEl.innerHTML = instrucoesHtml;
      })
      .catch(function () {});

    ph.innerHTML =
      '<div id="calc-horas-info">' + instrucoesHtml + '</div>' +
      '<div class="d-flex gap-2 mb-2">' +
        '<button id="calc-horas-copy" class="btn btn-sm btn-outline-info"><i class="fas fa-copy me-1"></i> Copiar resultados</button>' +
      '</div>' +
      '<div class="table-responsive mb-2">' +
        '<table class="table table-sm table-dark table-borderless x-small" id="calc-horas-tabela">' +
          '<thead><tr><th>Dia</th><th>Entrada / Saída</th><th>Total</th></tr></thead>' +
          '<tbody id="calc-horas-body"></tbody>' +
          '<tfoot><tr class="fw-bold"><td>TOTAL SEMANA</td><td></td><td id="calc-horas-total" class="text-success">0h</td></tr></tfoot>' +
        '</table>' +
      '</div>';

    var dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    var tbody = document.getElementById('calc-horas-body');

    dias.forEach(function (dia) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-dia', dia);
      tr.innerHTML =
        '<td class="fw-bold align-middle">' + dia + '</td>' +
        '<td>' +
          '<div class="calc-turnos-container" data-dia="' + dia + '">' +
            '<div class="calc-turno-row d-flex gap-1 align-items-center mb-1">' +
              '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary calc-entrada" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
              '<span class="x-small text-muted">às</span>' +
              '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary calc-saida" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-outline-secondary py-0 px-2 x-small calc-add-turno" data-dia="' + dia + '"><i class="fas fa-plus me-1"></i>Adicionar turno</button>' +
        '</td>' +
        '<td class="calc-dia-total text-info align-middle text-end" id="calc-total-' + dia + '">0h</td>';
      tbody.appendChild(tr);
    });

    // Event delegation
    tbody.addEventListener('input', function (e) {
      if (e.target.classList.contains('calc-entrada') || e.target.classList.contains('calc-saida')) {
        calcularHorasTotal();
      }
    });

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.calc-add-turno');
      if (!btn) return;
      var dia = btn.getAttribute('data-dia');
      var container = document.querySelector('.calc-turnos-container[data-dia="' + dia + '"]');
      if (!container) return;
      var count = container.querySelectorAll('.calc-turno-row').length;
      var row = document.createElement('div');
      row.className = 'calc-turno-row d-flex gap-1 align-items-center mb-1';
      row.innerHTML =
        '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary calc-entrada" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60">' +
        '<span class="x-small text-muted">às</span>' +
        '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary calc-saida" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60">' +
        '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small calc-rem-turno" title="Remover"><i class="fas fa-times"></i></button>';
      container.appendChild(row);
    });

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.calc-rem-turno');
      if (!btn) return;
      btn.closest('.calc-turno-row').remove();
      calcularHorasTotal();
    });

    // Botão copiar resultados
    document.getElementById('calc-horas-copy').addEventListener('click', function () {
      var lines = [];
      dias.forEach(function (dia) {
        var entradas = document.querySelectorAll('.calc-entrada[data-dia="' + dia + '"]');
        var saidas = document.querySelectorAll('.calc-saida[data-dia="' + dia + '"]');
        var turnos = [];
        for (var i = 0; i < entradas.length; i++) {
          if (entradas[i].value && saidas[i].value) {
            turnos.push(entradas[i].value + '-' + saidas[i].value);
          }
        }
        var totalEl = document.getElementById('calc-total-' + dia);
        lines.push(dia + ': ' + (turnos.join(', ') || '-') + ' Total=' + (totalEl ? totalEl.textContent : '-'));
      });
      var totalSem = document.getElementById('calc-horas-total');
      lines.push('TOTAL SEMANA: ' + (totalSem ? totalSem.textContent : '-'));
      copyToClipboard(lines.join('\n'));
      app.showToast('Resultados copiados!', 'success', 2000);
    });
  }

  function calcularHorasTotal() {
    var dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    var totalSemana = 0;

    dias.forEach(function (dia) {
      var entradas = document.querySelectorAll('.calc-entrada[data-dia="' + dia + '"]');
      var saidas = document.querySelectorAll('.calc-saida[data-dia="' + dia + '"]');
      var totalEl = document.getElementById('calc-total-' + dia);
      var totalDia = 0;

      for (var i = 0; i < entradas.length; i++) {
        var entrada = entradas[i].value;
        var saida = saidas[i].value;
        if (entrada && saida) {
          var h1 = parseHora(entrada);
          var h2 = parseHora(saida);
          if (!isNaN(h1) && !isNaN(h2)) {
            var diff = h2 - h1;
            if (diff < 0) diff += 24;
            totalDia += diff;
          }
        }
      }
      totalSemana += totalDia;
      if (totalEl) totalEl.textContent = totalDia.toFixed(2) + 'h';
    });

    var totalEl = document.getElementById('calc-horas-total');
    if (totalEl) totalEl.textContent = totalSemana.toFixed(2) + 'h';
  }

  function parseHoraRange(str) {
    if (!str || !str.trim()) return 0;
    var parts = str.split('-');
    if (parts.length !== 2) return 0;
    var h1 = parseHora(parts[0].trim());
    var h2 = parseHora(parts[1].trim());
    if (isNaN(h1) || isNaN(h2)) return 0;
    var diff = h2 - h1;
    if (diff < 0) diff += 24; // atravessa meia-noite
    return diff;
  }

  function parseHora(hhmm) {
    var parts = hhmm.split(':');
    var h = parseInt(parts[0]) || 0;
    var m = parseInt(parts[1]) || 0;
    return h + m / 60;
  }

  /* ═══════════════════════════════════════════
     PISO REFERÊNCIA (ACT)
     Calculadora de piso por referência de ACT
     ═══════════════════════════════════════ */

  function initPisoRef() {
    var ph = document.querySelector('.c-placeholder[data-section="pisoRef"]');
    if (!ph) return;

    loadPisoRefData(function (data) {
      var d = data || {};
      ph.innerHTML =
        '<div class="row g-2 mb-3">' +
          '<div class="col-md-3"><label class="x-small text-muted">Piso Referência (R$)</label>' +
            '<input id="piso-ref-valor" type="number" step="0.01" class="form-control form-control-sm bg-dark text-light border-secondary" value="' + (d.valorReferencia || '4483') + '"></div>' +
          '<div class="col-md-3"><label class="x-small text-muted">Horas Referência</label>' +
            '<input id="piso-ref-horas" type="number" step="0.5" class="form-control form-control-sm bg-dark text-light border-secondary" value="' + (d.horasReferencia || '30') + '"></div>' +
          '<div class="col-md-3"><label class="x-small text-muted">Horas Semana (padrão 44)</label>' +
            '<input id="piso-ref-hrs-semana" type="number" class="form-control form-control-sm bg-dark text-light border-secondary" value="44" min="1" max="44"></div>' +
          '<div class="col-md-3 d-flex align-items-end">' +
            '<button id="piso-ref-calc" class="btn btn-sm btn-danger w-100"><i class="fas fa-calculator me-1"></i> Calcular</button></div>' +
        '</div>' +
        '<div class="row g-2 mb-2">' +
          '<div class="col-md-6"><label class="x-small text-muted">Valor em Carteira (R$) — para calcular horas</label>' +
            '<input id="piso-ref-carteira" type="number" step="0.01" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Ex: 3056.59"></div>' +
        '</div>' +
        '<div class="d-flex flex-wrap gap-3 p-2 bg-dark bg-opacity-25 rounded border border-secondary mb-2">' +
          '<span>Resultado (Piso × Horas ÷ 44): <b id="piso-ref-resultado" class="text-success">—</b></span>' +
          '<span class="ms-3">Valor/Hora (Piso ÷ 220): <b id="piso-ref-valor-hora" class="text-info">—</b></span>' +
          '<span class="ms-3">Horas equivalentes: <b id="piso-ref-horas-equiv" class="text-warning">—</b></span>' +
          '<button id="piso-ref-copy-result" class="btn btn-sm btn-outline-info ms-2 flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar</button>' +
        '</div>' +
        '<div class="x-small text-muted">' +
          '<p><i class="fas fa-info-circle me-1"></i> Use esta calculadora para converter pisos de ACT (Acordo Coletivo de Trabalho) entre jornadas diferentes.</p>' +
          '<p>Fórmulas: <code>Resultado = Piso × Horas ÷ 44</code> | <code>Valor/Hora = Piso ÷ 220</code> | <code>Horas Equiv = Carteira × 44 ÷ Piso</code></p>' +
        '</div>' +
        '<button id="piso-ref-save" class="btn btn-sm btn-outline-success mt-2"><i class="fas fa-save me-1"></i> Salvar valores</button>';

      function calc() {
        var piso = parseFloat(document.getElementById('piso-ref-valor').value) || 0;
        var horas = parseFloat(document.getElementById('piso-ref-horas').value) || 0;
        var hrsSemana = parseFloat(document.getElementById('piso-ref-hrs-semana').value) || 44;
        var carteira = parseFloat(document.getElementById('piso-ref-carteira').value) || 0;

        var resultado = piso * horas / hrsSemana;
        var valorHora = piso / 220;
        var horasEquiv = carteira > 0 ? (carteira * hrsSemana / piso) : 0;

        document.getElementById('piso-ref-resultado').textContent = 'R$ ' + resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        document.getElementById('piso-ref-valor-hora').textContent = 'R$ ' + valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        document.getElementById('piso-ref-horas-equiv').textContent = horasEquiv > 0 ? horasEquiv.toFixed(1) + 'h' : '—';
      }

      document.getElementById('piso-ref-calc').addEventListener('click', calc);
      document.getElementById('piso-ref-valor').addEventListener('input', calc);
      document.getElementById('piso-ref-horas').addEventListener('input', calc);
      document.getElementById('piso-ref-hrs-semana').addEventListener('input', calc);
      document.getElementById('piso-ref-carteira').addEventListener('input', calc);

      document.getElementById('piso-ref-save').addEventListener('click', function () {
        var val = parseFloat(document.getElementById('piso-ref-valor').value) || 0;
        var hrs = parseFloat(document.getElementById('piso-ref-horas').value) || 0;
        store.pisoRef = { valorReferencia: val, horasReferencia: hrs };
        saveStore();
        app.showToast('Valores salvos!', 'success');
      });

      document.getElementById('piso-ref-copy-result').addEventListener('click', function () {
        var resultado = document.getElementById('piso-ref-resultado').textContent;
        var valorHora = document.getElementById('piso-ref-valor-hora').textContent;
        var horasEquiv = document.getElementById('piso-ref-horas-equiv').textContent;
        var piso = document.getElementById('piso-ref-valor').value;
        var horas = document.getElementById('piso-ref-horas').value;
        var text = 'Piso Referência: R$ ' + piso + '\nHoras Ref.: ' + horas + 'h\n' +
          'Resultado: ' + resultado + '\nValor/Hora: ' + valorHora + '\nHoras Equivalentes: ' + horasEquiv;
        copyToClipboard(text);
        app.showToast('Resultado copiado!', 'success', 1500);
      });

      calc();
    });
  }

  function loadPisoRefData(cb) {
    if (store.pisoRef) return cb(store.pisoRef);
    fetch('assets/piso/piso-ref.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { store.pisoRef = data; saveStore(); cb(data); })
      .catch(function () { cb(store.pisoRef || {}); });
  }

  /* ═══════════════════════════════════════════
     REGISTROS (Protocolos Detalhados — 526+ registros)
     Tabela pesquisável e filtrável
     ═══════════════════════════════════════ */

  function initRegistros() {
    var ph = document.querySelector('.c-placeholder[data-section="registros"]');
    if (!ph) return;

    ph.innerHTML =
      '<div class="d-flex gap-2 mb-2 flex-wrap">' +
        '<input type="text" id="reg-filter" class="form-control form-control-sm bg-dark text-light border-secondary" placeholder="Buscar em todos os campos..." autocomplete="off" style="max-width:300px">' +
        '<select id="reg-situacao" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:200px">' +
          '<option value="">Todas situações</option>' +
          '<option value="Finalizado">Finalizado</option>' +
          '<option value="Pendencia documental">Pendência documental</option>' +
          '<option value="Indeferido Sem Documento">Indeferido Sem Documento</option>' +
          '<option value="Arquivado">Arquivado</option>' +
          '<option value="Indeferido Sem Resposta">Indeferido Sem Resposta</option>' +
          '<option value="Aguarda">Aguarda</option>' +
        '</select>' +
        '<select id="reg-ocorrencia" class="form-select form-select-sm bg-dark text-light border-secondary" style="max-width:280px">' +
          '<option value="">Todas ocorrências</option>' +
        '</select>' +
        '<span id="reg-count" class="x-small text-muted align-self-center ms-auto"></span>' +
        '<button id="reg-copy-all" class="btn btn-sm btn-outline-info flex-shrink-0"><i class="fas fa-copy me-1"></i> Copiar visíveis</button>' +
        '<button id="reg-export" class="btn btn-sm btn-outline-success flex-shrink-0"><i class="fas fa-file-excel me-1"></i> Excel</button>' +
      '</div>' +
      '<div class="table-responsive" style="max-height:500px;overflow-y:auto">' +
        '<table class="table table-sm table-dark table-hover x-small mb-0" id="reg-tabela">' +
          '<thead class="sticky-top bg-dark">' +
            '<tr>' +
              '<th style="min-width:90px">Situação</th>' +
              '<th style="min-width:80px">Nº Prot.</th>' +
              '<th style="min-width:85px">Data</th>' +
              '<th style="min-width:160px">Tipo Estab.</th>' +
              '<th style="min-width:70px">Insc.</th>' +
              '<th style="min-width:180px">Nome Estab.</th>' +
              '<th style="min-width:140px">Ocorrência</th>' +
              '<th style="min-width:200px">Obs</th>' +
              '<th style="min-width:40px"></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="reg-body"><tr><td colspan="9" class="text-center text-muted">Carregando...</td></tr></tbody>' +
        '</table>' +
      '</div>';

    loadRegistrosData(function (data) {
      store.registros = data;
      saveStore();

      // Popula dropdown de ocorrências
      var ocorrencias = {};
      data.forEach(function (r) {
        var o = (r.ocorrencia || '').trim();
        if (o) ocorrencias[o] = (ocorrencias[o] || 0) + 1;
      });
      var ocorrSelect = document.getElementById('reg-ocorrencia');
      Object.keys(ocorrencias).sort().forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o + ' (' + ocorrencias[o] + ')';
        ocorrSelect.appendChild(opt);
      });

      aplicarFiltroRegistros();

      document.getElementById('reg-filter').addEventListener('input', aplicarFiltroRegistros);
      document.getElementById('reg-situacao').addEventListener('change', aplicarFiltroRegistros);
      document.getElementById('reg-ocorrencia').addEventListener('change', aplicarFiltroRegistros);

      document.getElementById('reg-copy-all').addEventListener('click', function () {
        var rows = document.querySelectorAll('#reg-body tr:not(.d-none)');
        var text = Array.from(rows).map(function (row) {
          var cells = row.querySelectorAll('td');
          return [cells[0]?.textContent, cells[1]?.textContent, cells[2]?.textContent,
                  cells[3]?.textContent, cells[4]?.textContent, cells[5]?.textContent,
                  cells[6]?.textContent, cells[7]?.textContent].join(' | ');
        }).join('\n');
        if (!text.trim()) { app.showToast('Nenhum registro para copiar.', 'warning', 2000); return; }
        copyToClipboard(text);
        app.showToast(rows.length + ' registro(s) copiado(s)!', 'success');
      });

      document.getElementById('reg-export').addEventListener('click', function () {
        var rows = document.querySelectorAll('#reg-body tr:not(.d-none)');
        if (!rows.length) { app.showToast('Nenhum registro para exportar.', 'warning', 2000); return; }
        var data = Array.from(rows).map(function (row) {
          var cells = row.querySelectorAll('td');
          return {
            Situacao: cells[0]?.textContent || '',
            NumProtocolo: cells[1]?.textContent || '',
            Data: cells[2]?.textContent || '',
            TipoEstabelecimento: cells[3]?.textContent || '',
            Inscricao: cells[4]?.textContent || '',
            NomeEstabelecimento: cells[5]?.textContent || '',
            Ocorrencia: cells[6]?.textContent || '',
            Obs: cells[7]?.textContent || ''
          };
        });
        // Exporta como CSV (simples, sem dependência extra)
        var csv = 'Situacao;NumProtocolo;Data;TipoEstabelecimento;Inscricao;NomeEstabelecimento;Ocorrencia;Obs\n' +
          data.map(function (r) {
            return [r.Situacao, r.NumProtocolo, r.Data, r.TipoEstabelecimento,
                    r.Inscricao, r.NomeEstabelecimento, r.Ocorrencia, r.Obs]
              .map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
          }).join('\n');
        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'protocolos-detalhados.csv';
        a.click();
        app.showToast('Exportado com sucesso!', 'success');
      });
    });
  }

  function loadRegistrosData(cb) {
    if (store.registros && store.registros.length) return cb(store.registros);
    fetch('assets/consultas/protocolos-detalhados.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { store.registros = data; saveStore(); cb(data); })
      .catch(function () { cb(store.registros || []); });
  }

  function aplicarFiltroRegistros() {
    var data = store.registros || [];
    var filter = normalize(document.getElementById('reg-filter')?.value || '');
    var situacao = document.getElementById('reg-situacao')?.value || '';
    var ocorrencia = document.getElementById('reg-ocorrencia')?.value || '';
    var tbody = document.getElementById('reg-body');
    var countEl = document.getElementById('reg-count');
    if (!tbody) return;

    var visible = 0;
    tbody.innerHTML = data.map(function (r, i) {
      var situacaoOk = !situacao || (r.situacao || '') === situacao;
      var ocorrenciaOk = !ocorrencia || (r.ocorrencia || '') === ocorrencia;
      var text = normalize((r.situacao || '') + ' ' + (r.numProtocolo || '') + ' ' +
        (r.tipoEstabelecimento || '') + ' ' + (r.inscricao || '') + ' ' +
        (r.nomeEstabelecimento || '') + ' ' + (r.ocorrencia || '') + ' ' + (r.obs || ''));
      var filterOk = !filter || text.indexOf(filter) > -1;
      var hidden = !situacaoOk || !ocorrenciaOk || !filterOk;

      if (!hidden) visible++;

      var statusColor = getStatusColor(r.situacao || '');
      var dataFormatada = r.data || '';

      return '<tr class="' + (hidden ? 'd-none' : '') + '" data-idx="' + i + '">' +
        '<td><span class="badge bg-' + statusColor + ' x-small">' + escapeHtml(r.situacao || '') + '</span></td>' +
        '<td>' + escapeHtml(r.numProtocolo || '—') + '</td>' +
        '<td class="text-nowrap">' + escapeHtml(dataFormatada) + '</td>' +
        '<td>' + escapeHtml(r.tipoEstabelecimento || '') + '</td>' +
        '<td>' + escapeHtml(r.inscricao || '—') + '</td>' +
        '<td><span title="' + escapeHtml(r.nomeEstabelecimento || '') + '">' + escapeHtml((r.nomeEstabelecimento || '').substring(0, 50) + ((r.nomeEstabelecimento || '').length > 50 ? '...' : '')) + '</span></td>' +
        '<td>' + escapeHtml(r.ocorrencia || '') + '</td>' +
        '<td class="text-muted" title="' + escapeHtml(r.obs || '') + '">' + escapeHtml((r.obs || '').substring(0, 60) + ((r.obs || '').length > 60 ? '...' : '')) + '</td>' +
        '<td><button class="btn btn-sm btn-outline-secondary btn-copy-row" data-idx="' + i + '" title="Copiar"><i class="fas fa-copy"></i></button></td>' +
        '</tr>';
    }).join('');

    if (countEl) countEl.textContent = visible + ' de ' + data.length + ' registros';

    // Event listeners para botões de cópia individuais
    tbody.querySelectorAll('.btn-copy-row').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'));
        var r = data[idx];
        if (!r) return;
        var text = [r.situacao, r.numProtocolo, r.data, r.tipoEstabelecimento,
                     r.inscricao, r.nomeEstabelecimento, r.ocorrencia, r.obs]
          .filter(Boolean).join(' | ');
        copyToClipboard(text);
        app.showToast('Registro copiado!', 'success', 1500);
      });
    });
  }

  /* ═══════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════ */

  function autoLink(text) {
    if (!text) return '';
    // Detecta URLs e as torna clicáveis
    var urlRegex = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])/gi;
    return escapeHtml(text).replace(urlRegex, function (url) {
      return '<a href="' + url + '" target="_blank" rel="noopener" class="text-info">' + url + '</a>';
    });
  }

  function showConfirm(title, msg, icon, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = msg;
    document.getElementById('confirm-icon').innerHTML = '<i class="fas ' + icon + ' fa-3x text-warning"></i>';
    var yes = document.getElementById('confirm-btn-yes'), n = yes.cloneNode(true);
    yes.parentNode.replaceChild(n, yes);
    n.onclick = function () { bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide(); cb(); };
    new bootstrap.Modal(document.getElementById('confirmModal')).show();
  }

  function showPrompt(title, message, defaultValue, cb) {
    document.getElementById('prompt-title').textContent = title;
    document.getElementById('prompt-message').textContent = message || '';
    var input = document.getElementById('prompt-input');
    input.value = defaultValue || '';
    var ok = document.getElementById('prompt-btn-ok'), n = ok.cloneNode(true);
    ok.parentNode.replaceChild(n, ok);
    n.onclick = function () {
      bootstrap.Modal.getInstance(document.getElementById('promptModal')).hide();
      cb(input.value);
    };
    input.addEventListener('keypress', function handler(e) {
      if (e.key === 'Enter') { n.click(); input.removeEventListener('keypress', handler); }
    });
    new bootstrap.Modal(document.getElementById('promptModal')).show();
    setTimeout(function () { input.focus(); }, 400);
  }

  function showAlert(title, message, icon, cb) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    var iconEl = document.getElementById('alert-icon');
    iconEl.innerHTML = icon ? '<i class="fas ' + icon + ' fa-2x text-info"></i>' : '';
    var modal = new bootstrap.Modal(document.getElementById('alertModal'));
    if (cb) {
      document.getElementById('alertModal').addEventListener('hidden.bs.modal', function handler() {
        document.getElementById('alertModal').removeEventListener('hidden.bs.modal', handler);
        cb();
      });
    }
    modal.show();
  }

  function normalize(s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function escapeHtml(t) { var m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return String(t).replace(/[&<>"']/g, function (c) { return m[c]; }); }
  function getStatusColor(s) { s = normalize(s); if (s.indexOf('indeferido')>-1) return 'danger'; if (s.indexOf('finalizado')>-1) return 'success'; if (s.indexOf('arquivado')>-1) return 'secondary'; if (s.indexOf('pendência')>-1||s.indexOf('pendencia')>-1) return 'warning'; if (s.indexOf('aguarda')>-1) return 'info'; if (s.indexOf('atenção')>-1||s.indexOf('atencao')>-1) return 'warning'; if (s.indexOf('correção')>-1||s.indexOf('correcao')>-1) return 'warning'; return 'secondary'; }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).catch(function () {}); return; }
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }

  function importarRespostasComoCards(respostas) {
    if (!respostas || !Object.keys(respostas).length) return;
    var dash = (app.__state && app.__state.dashboards || []).find(function (d) { return d.id === 'dash-ingresso-pj'; });
    if (!dash) return;
    // Só importa se o dashboard estiver vazio
    if (dash.customs && dash.customs.length > 0) return;
    if (!dash.customs) dash.customs = [];
    if (!dash.order) dash.order = [];
    var keys = Object.keys(respostas).sort();
    var imported = 0;
    keys.forEach(function (k) {
      var id = 'rp-' + k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      // Evita duplicatas
      if (dash.customs.some(function (c) { return c.id === id; })) return;
      dash.customs.push({
        id: id,
        title: k,
        content: respostas[k],
        color: 'info',
        type: 'copy',
        showDate: true
      });
      dash.order.push(id);
      imported++;
    });
    if (imported > 0) {
      app._save();
      app.notifyChange();
      app.showToast(imported + ' respostas importadas para Ingresso PJ!', 'success', 3000);
    }
  }

  /* ── Exports ──────────────────────────── */
  app.initConsultas = initConsultas;
  app.openFaqEditor = openFaqEditor;
  app.saveFaqItem = saveFaqItem;
  app.deleteFaqItem = deleteFaqItem;
  app.copyAllFaq = copyAllFaq;
  app.calcularPiso = calcularPiso;
}(window.MainApp));

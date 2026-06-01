/**
 * calculator.js — Calculadoras de honorários e horas de assistência
 *
 * @module calculator
 * @description
 * Duas calculadoras integradas na view-ferramentas:
 *
 * 1. Calculadora de Piso Salarial (5 categorias):
 *    - Valor/Hora = Piso ÷ 220
 *    - Piso Proporcional = Piso × Horas Trabalhadas ÷ Horas Semana
 *    - Referências para 30h e 20h
 *    - Dados carregados de assets/piso.json
 *
 * 2. Tabela de Horas de Assistência Semanal:
 *    - 7 dias (DOM-SAB) com dois turnos cada
 *    - Cálculo automático de horas por turno, intervalo e total
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  // ── Dados de piso por categoria (carregados assincronamente) ──
  var pisoData = null;
  var todasCidades = [];
  var calcularPisoFerr = null; // exposta para ser chamada pela tabela de horas
  var pisoCategorias = {
    varejista:    { nome: 'Varejista',    valor: 4729.62 },
    hospitalar:   { nome: 'Hospitalar',   valor: 4567.00 },
    distribuidora:{ nome: 'Distribuidora',valor: 4764.00 },
    laboratorios: { nome: 'Laboratórios', valor: 3763.08 },
    industrias:   { nome: 'Indústrias',   valor: 4211.45 }
  };

  /* ── Inicialização principal ──────────── */
  function initCalculator() {
    initPisoCalc();
    initHorasAssistencia();
    loadPisoData();
  }

  /* ═══════════════════════════════════════════
     CALCULADORA DE PISO (view-ferramentas)
     ═══════════════════════════════════════ */

  function initPisoCalc() {
    var radiosContainer = document.getElementById('ferr-categorias-radios');
    var copyBtn = document.getElementById('ferr-copy');

    if (!radiosContainer) return;
    var JORNADA_PADRAO = 44; // jornada legal CLT

    function getSelectedCat() {
      var checked = radiosContainer.querySelector('input[name="ferr-cat"]:checked');
      return checked ? checked.value : 'varejista';
    }

    function getPisoBase() {
      var cat = getSelectedCat();
      return pisoCategorias[cat] ? pisoCategorias[cat].valor : 0;
    }

    function getTotalHoras() {
      var totalEl = document.getElementById('ferr-calc-horas-total');
      if (totalEl) {
        var txt = totalEl.textContent.replace('h', '').trim();
        return parseFloat(txt) || 0;
      }
      return 0;
    }

    // Atualiza destaque visual dos radios
    function updateRadioUI() {
      radiosContainer.querySelectorAll('.ferr-radio-label').forEach(function (lbl) {
        lbl.classList.toggle('active', lbl.querySelector('input').checked);
      });
    }

    radiosContainer.addEventListener('change', function (e) {
      if (e.target.name === 'ferr-cat') {
        updateRadioUI();
        calcularPisoFerr();
      }
    });

    calcularPisoFerr = function () {
      var piso = getPisoBase();
      var hrsSemana = JORNADA_PADRAO;
      var hrsTrab = getTotalHoras();

      var valorHora = piso / 220;
      var salarioTotal = hrsTrab > 0 ? (piso * hrsTrab / hrsSemana) : 0;

      var pisoBaseDisplay = document.getElementById('ferr-piso-base-display');
      var valorHoraEl = document.getElementById('ferr-valor-hora');
      var totalHorasDisplay = document.getElementById('ferr-total-horas-display');
      var jornadaDisplay = document.getElementById('ferr-horas-semana-display');
      var pisoPropEl = document.getElementById('ferr-piso-prop');

      if (pisoBaseDisplay) pisoBaseDisplay.textContent = 'R$ ' + piso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (valorHoraEl) valorHoraEl.textContent = 'R$ ' + valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (totalHorasDisplay) totalHorasDisplay.textContent = formatHoras(hrsTrab);
      if (jornadaDisplay) jornadaDisplay.textContent = hrsSemana + 'h';
      if (pisoPropEl) pisoPropEl.textContent = 'R$ ' + salarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function copiarResultado() {
      var piso = getPisoBase();
      var hrsSemana = JORNADA_PADRAO;
      var hrsTrab = getTotalHoras();
      var catNome = pisoCategorias[getSelectedCat()] ? pisoCategorias[getSelectedCat()].nome : getSelectedCat();

      var valorHora = piso / 220;
      var salarioTotal = hrsTrab > 0 ? (piso * hrsTrab / hrsSemana) : 0;

      var text =
        'Categoria: ' + catNome + '\n' +
        'Piso Base: R$ ' + piso.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' +
        'Valor/Hora: R$ ' + valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' +
        'Total de Horas: ' + hrsTrab.toFixed(2) + 'h\n' +
        'Salário Total: R$ ' + salarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          app.showToast('Resultados copiados!', 'success', 2000);
        }).catch(function () {});
      }
    }

    copyBtn.addEventListener('click', copiarResultado);

    // Busca de cidade para filtrar piso por região
    var cidadeInput = document.getElementById('ferr-cidade');
    var cidadeSelect = document.getElementById('ferr-cidade-select');

    cidadeInput.addEventListener('input', function () {
      var term = (cidadeInput.value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!term || term.length < 2) { cidadeSelect.classList.add('d-none'); return; }
      var matches = todasCidades.filter(function (c) {
        return c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(term) > -1;
      }).slice(0, 8);
      if (!matches.length) { cidadeSelect.classList.add('d-none'); return; }
      cidadeSelect.innerHTML = matches.map(function (c) {
        return '<option value="' + c.key + '" data-valores=\'' + JSON.stringify(c.valores) + '\'>' + c.label + ' (' + c.regiao + ')</option>';
      }).join('');
      cidadeSelect.classList.remove('d-none');
    });

    cidadeSelect.addEventListener('change', function () {
      var opt = cidadeSelect.selectedOptions[0];
      if (!opt) return;
      cidadeInput.value = opt.textContent.split(' (')[0];
      cidadeSelect.classList.add('d-none');
      // Atualiza piso base com valor da cidade selecionada
      try {
        var valores = JSON.parse(opt.getAttribute('data-valores'));
        if (valores) {
          Object.keys(valores).forEach(function (cat) {
            if (pisoCategorias[cat]) {
              pisoCategorias[cat].valor = valores[cat];
              // Atualiza valor exibido no radio label
              var span = radiosContainer.querySelector('input[value="' + cat + '"]');
              if (span) {
                var valorSpan = span.closest('.ferr-radio-label').querySelector('b span');
                if (valorSpan) valorSpan.textContent = valores[cat].toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              }
            }
          });
          calcularPisoFerr();
        }
      } catch (e) {}
    });

    cidadeInput.addEventListener('blur', function () {
      setTimeout(function () { cidadeSelect.classList.add('d-none'); }, 200);
    });

    // Cálculo inicial
    calcularPisoFerr();
  }

  /* ═══════════════════════════════════════════
     TABELA DE HORAS DE ASSISTÊNCIA SEMANAL
     ═══════════════════════════════════════ */

  function initHorasAssistencia() {
    var tbody = document.getElementById('ferr-calc-horas-body');
    if (!tbody) return;

    var dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

    dias.forEach(function (dia) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-dia', dia);
      tr.innerHTML =
        '<td class="fw-bold align-middle">' +
          '<button class="btn btn-sm btn-outline-info py-0 px-2 x-small ferr-edit-dia me-1" data-dia="' + dia + '" title="Editar horários"><i class="fas fa-pen"></i></button>' +
          dia +
        '</td>' +
        '<td>' +
          '<div class="ferr-turnos-container d-none" data-dia="' + dia + '">' +
            '<div class="ferr-turno-row d-flex gap-1 align-items-center mb-1">' +
              '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-entrada" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
              '<span class="x-small text-muted">às</span>' +
              '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-saida" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
              '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small ferr-rem-turno" title="Remover"><i class="fas fa-times"></i></button>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="ferr-dia-total text-info align-middle text-end" id="ferr-total-' + dia + '">0h</td>';
      tbody.appendChild(tr);
    });

    function calcular() {
      var totalSemana = 0;
      dias.forEach(function (dia) {
        var entradas = document.querySelectorAll('.ferr-entrada[data-dia="' + dia + '"]');
        var saidas = document.querySelectorAll('.ferr-saida[data-dia="' + dia + '"]');
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
        var totalEl = document.getElementById('ferr-total-' + dia);
        if (totalEl) totalEl.textContent = formatHoras(totalDia);
      });

      var totalSemEl = document.getElementById('ferr-calc-horas-total');
      if (totalSemEl) totalSemEl.textContent = formatHoras(totalSemana);

      // Dispara recálculo do piso
      if (typeof calcularPisoFerr === 'function') calcularPisoFerr();
    }

    // Toggle edição por dia (expandir campos para sobrescrever)
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.ferr-edit-dia');
      if (!btn) return;
      var dia = btn.getAttribute('data-dia');
      var container = document.querySelector('.ferr-turnos-container[data-dia="' + dia + '"]');
      if (!container) return;
      var isHidden = container.classList.contains('d-none');
      if (isHidden) {
        container.classList.remove('d-none');
        btn.classList.add('active');
      } else {
        container.classList.add('d-none');
        btn.classList.remove('active');
      }
    });

    // Event delegation para inputs
    tbody.addEventListener('input', function (e) {
      if (e.target.classList.contains('ferr-entrada') || e.target.classList.contains('ferr-saida')) {
        calcular();
      }
    });

    // Remover turno — se ficar vazio, recria linha vazia
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.ferr-rem-turno');
      if (!btn) return;
      var row = btn.closest('.ferr-turno-row');
      var container = row.parentElement;
      row.remove();
      // Se não sobrou nenhuma linha, recria uma vazia
      if (!container.querySelector('.ferr-turno-row')) {
        var dia = container.getAttribute('data-dia');
        var newRow = document.createElement('div');
        newRow.className = 'ferr-turno-row d-flex gap-1 align-items-center mb-1';
        newRow.innerHTML =
          '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-entrada" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
          '<span class="x-small text-muted">às</span>' +
          '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-saida" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
          '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small ferr-rem-turno" title="Remover"><i class="fas fa-times"></i></button>';
        container.appendChild(newRow);
      }
      calcular();
    });

    // Botão Aplicar: preenche 1ª linha se vazia, senão adiciona nova
    document.getElementById('ferr-lote-aplicar').addEventListener('click', function () {
      var entrada = document.getElementById('ferr-lote-entrada').value;
      var saida = document.getElementById('ferr-lote-saida').value;
      if (!entrada || !saida) return;
      document.querySelectorAll('.ferr-dia-check:checked').forEach(function (cb) {
        var dia = cb.value;
        var container = document.querySelector('.ferr-turnos-container[data-dia="' + dia + '"]');
        if (!container) return;
        container.classList.remove('d-none');
        var editBtn = document.querySelector('.ferr-edit-dia[data-dia="' + dia + '"]');
        if (editBtn) editBtn.classList.add('active');

        // Se a primeira linha estiver vazia, preenche; senão adiciona nova
        var firstRow = container.querySelector('.ferr-turno-row');
        var firstEntrada = firstRow ? firstRow.querySelector('.ferr-entrada') : null;
        if (firstEntrada && !firstEntrada.value) {
          firstRow.querySelector('.ferr-entrada').value = entrada;
          firstRow.querySelector('.ferr-saida').value = saida;
        } else {
          var count = container.querySelectorAll('.ferr-turno-row').length;
          var row = document.createElement('div');
          row.className = 'ferr-turno-row d-flex gap-1 align-items-center mb-1';
          row.innerHTML =
            '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-entrada" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60" value="' + entrada + '">' +
            '<span class="x-small text-muted">às</span>' +
            '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-saida" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60" value="' + saida + '">' +
            '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small ferr-rem-turno" title="Remover"><i class="fas fa-times"></i></button>';
          container.appendChild(row);
        }
      });
      calcular();
    });

    // Botão Limpar: zera todos os turnos (mantém 1ª linha)
    document.getElementById('ferr-lote-limpar').addEventListener('click', function () {
      document.querySelectorAll('.ferr-dia-check:checked').forEach(function (cb) {
        var dia = cb.value;
        var container = document.querySelector('.ferr-turnos-container[data-dia="' + dia + '"]');
        if (!container) return;
        container.querySelectorAll('.ferr-entrada, .ferr-saida').forEach(function (inp) { inp.value = ''; });
        var rows = container.querySelectorAll('.ferr-turno-row');
        for (var i = 1; i < rows.length; i++) rows[i].remove();
        // Se não sobrou nenhuma linha, recria vazia
        if (!container.querySelector('.ferr-turno-row')) {
          var newRow = document.createElement('div');
          newRow.className = 'ferr-turno-row d-flex gap-1 align-items-center mb-1';
          newRow.innerHTML =
            '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-entrada" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
            '<span class="x-small text-muted">às</span>' +
            '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-saida" data-dia="' + dia + '" data-turno="0" style="max-width:100px" step="60">' +
            '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small ferr-rem-turno" title="Remover"><i class="fas fa-times"></i></button>';
          container.appendChild(newRow);
        }
      });
      calcular();
    });

    // Botão +Todos: adiciona turno em TODOS os dias (não só expandidos)
    document.getElementById('ferr-horas-lote').insertAdjacentHTML('beforeend',
      '<button id="ferr-add-todos" class="btn btn-sm btn-outline-info py-0 px-2 x-small" title="Adicionar turno a todos os dias"><i class="fas fa-layer-group me-1"></i>+Todos</button>');
    document.getElementById('ferr-add-todos').addEventListener('click', function () {
      dias.forEach(function (dia) {
        var container = document.querySelector('.ferr-turnos-container[data-dia="' + dia + '"]');
        if (!container) return;
        container.classList.remove('d-none');
        var editBtn = document.querySelector('.ferr-edit-dia[data-dia="' + dia + '"]');
        if (editBtn) editBtn.classList.add('active');
        var count = container.querySelectorAll('.ferr-turno-row').length;
        var row = document.createElement('div');
        row.className = 'ferr-turno-row d-flex gap-1 align-items-center mb-1';
        row.innerHTML =
          '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-entrada" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60">' +
          '<span class="x-small text-muted">às</span>' +
          '<input type="time" class="form-control form-control-sm bg-dark text-light border-secondary ferr-saida" data-dia="' + dia + '" data-turno="' + count + '" style="max-width:100px" step="60">' +
          '<button class="btn btn-sm btn-outline-danger py-0 px-1 x-small ferr-rem-turno" title="Remover"><i class="fas fa-times"></i></button>';
        container.appendChild(row);
      });
    });
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

  function formatHoras(decimal) {
    var h = Math.floor(decimal);
    var m = Math.round((decimal - h) * 60);
    if (m === 60) { h++; m = 0; }
    return h + 'h' + (m > 0 ? m.toString().padStart(2, '0') + 'min' : '');
  }

  /* ═══════════════════════════════════════════
     CARREGAR DADOS DE PISO (JSON)
     ═══════════════════════════════════════ */

  function loadPisoData() {
    fetch('assets/piso.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        pisoData = data;
        // Popula lista de cidades para autocomplete
        todasCidades = [];
        if (data.regioes) {
          Object.keys(data.regioes).forEach(function (regiao) {
            var cids = data.regioes[regiao].cidades || {};
            Object.keys(cids).forEach(function (cid) {
              var label = cid.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
              todasCidades.push({ key: cid, label: label, regiao: regiao, valores: cids[cid] });
            });
          });
        }
        // Atualiza valores padrão com dados do JSON
        if (data.curitiba) {
          Object.keys(data.curitiba).forEach(function (cat) {
            if (pisoCategorias[cat]) {
              pisoCategorias[cat].valor = data.curitiba[cat];
            }
          });
        } else if (data.default) {
          Object.keys(data.default).forEach(function (cat) {
            if (pisoCategorias[cat]) {
              pisoCategorias[cat].valor = data.default[cat];
            }
          });
        }
        // Atualiza valores exibidos nos radio labels
        var radiosContainer = document.getElementById('ferr-categorias-radios');
        if (radiosContainer) {
          Object.keys(pisoCategorias).forEach(function (cat) {
            var input = radiosContainer.querySelector('input[value="' + cat + '"]');
            if (input) {
              var valorSpan = input.closest('.ferr-radio-label').querySelector('b span');
              if (valorSpan) valorSpan.textContent = pisoCategorias[cat].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
          });
        }
      })
      .catch(function () {
        // Usa valores padrão hardcoded
      });
  }

  app.initCalculator = initCalculator;
}(window.MainApp));

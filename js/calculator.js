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
    var catEl = document.getElementById('ferr-categoria');
    var baseEl = document.getElementById('ferr-piso-base');
    var hrsSemanaEl = document.getElementById('ferr-horas-semana');
    var hrsTrabEl = document.getElementById('ferr-horas-trab');
    var calcBtn = document.getElementById('ferr-calc');
    var copyBtn = document.getElementById('ferr-copy');

    if (!catEl) return; // Não está na view-ferramentas

    // Atualiza piso base ao mudar categoria
    function updatePisoBase() {
      var cat = catEl.value;
      var val = pisoCategorias[cat] ? pisoCategorias[cat].valor : 0;
      baseEl.value = val;
      calcularPisoFerr();
    }

    function calcularPisoFerr() {
      var piso = parseFloat(baseEl.value) || 0;
      var hrsSemana = parseFloat(hrsSemanaEl.value) || 44;
      var hrsTrab = parseFloat(hrsTrabEl.value) || 0;

      var valorHora = piso / 220;
      var pisoProp = hrsTrab > 0 ? (piso * hrsTrab / hrsSemana) : 0;
      var ref30h = piso * 30 / hrsSemana;
      var ref20h = piso * 20 / hrsSemana;

      var valorHoraEl = document.getElementById('ferr-valor-hora');
      var pisoPropEl = document.getElementById('ferr-piso-prop');
      var ref30hEl = document.getElementById('ferr-ref-30h');
      var ref20hEl = document.getElementById('ferr-ref-20h');

      if (valorHoraEl) valorHoraEl.textContent = 'R$ ' + valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (pisoPropEl) pisoPropEl.textContent = 'R$ ' + pisoProp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (ref30hEl) ref30hEl.textContent = 'R$ ' + ref30h.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (ref20hEl) ref20hEl.textContent = 'R$ ' + ref20h.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function copiarResultado() {
      var piso = parseFloat(baseEl.value) || 0;
      var hrsSemana = parseFloat(hrsSemanaEl.value) || 44;
      var hrsTrab = parseFloat(hrsTrabEl.value) || 0;
      var catNome = pisoCategorias[catEl.value] ? pisoCategorias[catEl.value].nome : catEl.value;

      var valorHora = piso / 220;
      var pisoProp = hrsTrab > 0 ? (piso * hrsTrab / hrsSemana) : 0;
      var ref30h = piso * 30 / hrsSemana;
      var ref20h = piso * 20 / hrsSemana;

      var text =
        'Categoria: ' + catNome + '\n' +
        'Piso Base (44h): R$ ' + piso.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' +
        'Valor/Hora: R$ ' + valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' +
        (hrsTrab > 0 ? 'Piso Proporcional (' + hrsTrab + 'h): R$ ' + pisoProp.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' : '') +
        'Ref. 30h: R$ ' + ref30h.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n' +
        'Ref. 20h: R$ ' + ref20h.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          app.showToast('Resultados copiados!', 'success', 2000);
        }).catch(function () {});
      }
    }

    catEl.addEventListener('change', updatePisoBase);
    calcBtn.addEventListener('click', calcularPisoFerr);
    copyBtn.addEventListener('click', copiarResultado);
    hrsSemanaEl.addEventListener('input', calcularPisoFerr);
    hrsTrabEl.addEventListener('input', calcularPisoFerr);
    baseEl.addEventListener('input', calcularPisoFerr);

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
        var cat = catEl.value;
        if (valores && valores[cat]) {
          pisoCategorias[cat].valor = valores[cat];
          baseEl.value = valores[cat];
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
    if (!tbody) return; // Não está na view-ferramentas

    var dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

    dias.forEach(function (dia) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="fw-bold">' + dia + '</td>' +
        '<td><input type="text" class="form-control form-control-sm bg-dark text-light border-secondary ferr-hora-input" data-dia="' + dia + '" data-turno="1" placeholder="08:00-12:00"></td>' +
        '<td><input type="text" class="form-control form-control-sm bg-dark text-light border-secondary ferr-hora-input" data-dia="' + dia + '" data-turno="2" placeholder="13:00-18:00"></td>' +
        '<td><input type="number" class="form-control form-control-sm bg-dark text-light border-secondary ferr-int-input" data-dia="' + dia + '" value="0" min="0" max="120" style="max-width:70px"></td>' +
        '<td class="ferr-dia-total text-info" id="ferr-total-' + dia + '">0h</td>';
      tbody.appendChild(tr);
    });

    function calcular() {
      var totalSemana = 0;
      dias.forEach(function (dia) {
        var t1 = document.querySelector('.ferr-hora-input[data-dia="' + dia + '"][data-turno="1"]');
        var t2 = document.querySelector('.ferr-hora-input[data-dia="' + dia + '"][data-turno="2"]');
        var intervalo = document.querySelector('.ferr-int-input[data-dia="' + dia + '"]');
        var totalEl = document.getElementById('ferr-total-' + dia);

        var horas1 = parseHoraRange(t1 ? t1.value : '');
        var horas2 = parseHoraRange(t2 ? t2.value : '');
        var intMin = parseFloat(intervalo ? intervalo.value : 0) || 0;
        var total = horas1 + horas2 - (intMin / 60);
        if (total < 0) total = 0;
        totalSemana += total;
        if (totalEl) totalEl.textContent = total.toFixed(2) + 'h';
      });

      var totalSemEl = document.getElementById('ferr-calc-horas-total');
      if (totalSemEl) totalSemEl.textContent = totalSemana.toFixed(2) + 'h';
    }

    document.querySelectorAll('.ferr-hora-input, .ferr-int-input').forEach(function (input) {
      input.addEventListener('input', calcular);
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
        // Atualiza valores padrão com dados do JSON (Curitiba)
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
        // Atualiza UI se já estiver visível
        var catEl = document.getElementById('ferr-categoria');
        var baseEl = document.getElementById('ferr-piso-base');
        if (catEl && baseEl) {
          var cat = catEl.value;
          var val = pisoCategorias[cat] ? pisoCategorias[cat].valor : 0;
          baseEl.value = val;
        }
      })
      .catch(function () {
        // Usa valores padrão hardcoded
      });
  }

  app.initCalculator = initCalculator;
}(window.MainApp));

/**
 * fiscal.js — Busca de fiscais por cidade
 *
 * @module fiscal
 * @description
 * Carrega uma planilha ODS/XLSX com dados de fiscais e permite busca por cidade.
 *
 * Funcionalidades:
 * - Carregamento de planilha via SheetJS (xlsx)
 * - Busca textual em tempo real conforme o usuário digita
 * - Auto-seleção quando apenas 1 resultado é encontrado
 * - Exibição de nome, telefone e município do fiscal
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var fiscalData = [];

  function initFiscalSearch() {
    var select = document.getElementById('fiscal-select');
    var filter = document.getElementById('fiscal-filter');
    var res = document.getElementById('fiscal-res');

    function normalize(str) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    select.onchange = function () {
      var d = fiscalData.find(function (x) { return x.cidade === select.value; });
      res.innerHTML = d
        ? '<div class="d-flex flex-column gap-1">' +
          '<div class="d-flex justify-content-between"><span>Código: <b class="text-info">' + d.code + '</b></span><span>Região: <b class="text-warning">' + d.region + '</b></span></div></div>'
        : 'Aguardando seleção...';
    };

    return fetch('assets/dados.ods').then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var _warn = console.warn;
      var _error = console.error;
      console.warn = console.error = function () {};
      try {
        var wb = XLSX.read(buf, { type: 'array', cellNF: false });
        console.warn = _warn;
        console.error = _error;
        var json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
        fiscalData = json.slice(1).filter(function (l) { return l[0]; }).map(function (l) {
          return { cidade: l[0], fiscal: l[1], region: l[2], code: l[3] };
        });

        function updateOptions(data) {
          select.innerHTML = '<option value="">Selecione a cidade (' + data.length + ')</option>' +
            data.map(function (d) { return '<option value="' + d.cidade + '">' + d.cidade + '</option>'; }).join('');
        }

        updateOptions(fiscalData);
        select.disabled = false;

        filter.oninput = function () {
          var term = normalize(filter.value);
          var filtered = fiscalData.filter(function (d) { return normalize(d.cidade).indexOf(term) > -1; });
          updateOptions(filtered);
          if (filtered.length === 1 && term.length > 2) {
            select.value = filtered[0].cidade;
            select.dispatchEvent(new Event('change'));
          }
        };
      } catch (err) {
        console.warn = _warn;
        console.error = _error;
        throw err;
      }
    }).catch(function () {
      if (res) res.textContent = 'Planilha não encontrada.';
    });
  }

  app.initFiscalSearch = initFiscalSearch;
}(window.MainApp));

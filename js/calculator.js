/**
 * calculator.js — Calculadora de honorários (Piso × Horas / 44)
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  function initCalculator() {
    function calc() {
      var p = parseFloat(document.getElementById('piso').value) || 0;
      var h = parseFloat(document.getElementById('horas').value) || 0;
      var total = (p * h) / 44;
      var hora = p / 220;
      document.getElementById('res-total').textContent = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      document.getElementById('res-hora').textContent = hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    document.getElementById('piso').oninput = calc;
    document.getElementById('horas').oninput = calc;
  }

  app.initCalculator = initCalculator;
}(window.MainApp));

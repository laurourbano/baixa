/**
 * calculator.js — Calculadora de honorários
 *
 * @module calculator
 * @description
 * Calculadora simples para honorários baseados em piso salarial.
 *
 * Fórmulas:
 * - Total: (Piso × Horas) ÷ 44
 * - Valor-Hora: Piso ÷ 220
 *
 * Resultados formatados em pt-BR com 2 casas decimais.
 * Cálculo em tempo real via evento oninput.
 *
 * @namespace MainApp
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

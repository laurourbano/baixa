/**
 * main.js — Bootstrap do WorkDash
 *
 * Ponto de entrada do frontend. Responsável por:
 * - Detectar ambiente (Node.js para testes vs. browser)
 * - Carregar todos os módulos na ordem correta de dependência
 * - Inicializar UI (tema, sidebar, views)
 *
 * @module main
 */

if (typeof window !== 'undefined') {
  window.MainApp = window.MainApp || {};
}

if (typeof module !== 'undefined' && module.exports) {
  // Node.js (Vitest): carrega todos os módulos em ordem
  require('./store.js');
  require('./ui-helpers.js');
  require('./api.js');
  require('./auth.js');
  require('./cards.js');
  require('./weather.js');
  require('./fiscal.js');
  require('./calculator.js');
  require('./consultas.js');
  require('./dashboards.js');
  require('./gh-backup.js');
  require('./servicos.js');
  require('./app.js');
  module.exports = window.MainApp;
}

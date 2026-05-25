/**
 * main.js — Bootstrap. Em Node.js (testes), carrega todos os módulos.
 * Em browser, os módulos são carregados via <script> tags antes deste arquivo.
 */

// Inicializa namespace global (necessário para ambiente Node.js)
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
  require('./app.js');
  module.exports = window.MainApp;
}

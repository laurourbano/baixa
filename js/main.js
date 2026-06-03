/**
 * main.js — Bootstrap do WorkDash
 *
 * Ponto de entrada do frontend. Responsável por:
 * - Detectar ambiente (Node.js para testes vs. browser)
 * - Carregar todos os módulos na ordem correta de dependência
 * - Inicializar UI (tema, sidebar, views)
 * - Carregar dados do backend com retry e fallback
 * - Configurar autosave e drag-and-drop global
 *
 * @module main
 * @requires config.js
 * @requires store.js
 * @requires api.js
 * @requires auth.js
 * @requires cards.js
 * @requires dashboards.js
 * @requires ui.js
 * @requires ui-helpers.js
 * @requires consultas.js
 * @requires calculator.js
 * @requires fiscal.js
 * @requires weather.js
 * @requires gh-backup.js
 * @requires servicos.js
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
  require('./consultas.js');
  require('./dashboards.js');
  require('./gh-backup.js');
  require('./app.js');
  module.exports = window.MainApp;
}

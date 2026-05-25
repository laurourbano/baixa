/**
 * config.js — Configuração de ambiente (URL do backend)
 */
(function () {
  'use strict';
  var host = window.location.hostname;
  var isLocal = !host || host === 'localhost' || host === '127.0.0.1';
  window.BAIXA_API_URL = isLocal
    ? 'http://localhost:3000'
    : 'https://baixa-backend.onrender.com';
}());

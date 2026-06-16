/**
 * config.js — Configuração global do WorkDash
 *
 * API_URL: endpoint da Netlify Function.
 * Em produção (Netlify): /api → /.netlify/functions/api
 * Em desenvolvimento (localhost): fallback para localStorage
 */
(function () {
  'use strict';
  window.BAIXA_API_URL = '/api';
}());

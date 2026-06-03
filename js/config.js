/**
 * config.js — Configuração global do WorkDash
 *
 * Define a URL base do backend para comunicação com a API.
 * Em produção, aponta para o serviço Render.
 * Em desenvolvimento local, pode ser sobrescrita para http://localhost:3002.
 *
 * @constant {string} BAIXA_API_URL - URL base do backend (sem barra final)
 */
(function () {
  'use strict';
  window.BAIXA_API_URL = 'https://baixa-backend.onrender.com';
}());

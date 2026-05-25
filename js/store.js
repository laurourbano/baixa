/**
 * store.js — Gerenciamento de estado centralizado
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  const STORAGE_KEY = 'baixa_rt_data';

  const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    order: [],
    customs: [],
    edits: {},
    deleted: []
  };

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    state.order = [];
    state.customs = [];
    state.edits = {};
    state.deleted = [];
    save();
  }

  Object.defineProperty(app, '__state', { get: function () { return state; } });
  app.__resetState = resetState;
  app._save = save;
}(window.MainApp));
